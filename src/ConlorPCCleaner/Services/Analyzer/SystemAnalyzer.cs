using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ConlorPCCleaner.Helpers;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Services
{
    /// <summary>
    /// Performs the "Analyze PC" pass: measures every cleanable temp/cache category, finds large
    /// personal files that could be moved to an external drive, detects duplicates, and measures
    /// developer/game caches. It only ever READS the filesystem — it never deletes or moves.
    /// </summary>
    public sealed class SystemAnalyzer
    {
        private readonly SafetyGuard _guard;
        private readonly AppSettings _settings;
        private readonly DuplicateFinder _duplicateFinder = new();
        private readonly DeveloperCacheScanner _devScanner = new();

        public SystemAnalyzer(SafetyGuard guard, AppSettings settings)
        {
            _guard = guard;
            _settings = settings;
        }

        public async Task<ScanResult> AnalyzeAsync(
            IProgress<string>? log = null,
            IProgress<double>? progress = null,
            CancellationToken ct = default)
        {
            return await Task.Run(() => Analyze(log, progress, ct), ct).ConfigureAwait(false);
        }

        private ScanResult Analyze(IProgress<string>? log, IProgress<double>? progress, CancellationToken ct)
        {
            var result = new ScanResult { StartedUtc = DateTime.UtcNow };
            bool isAdmin = AdminHelper.IsAdministrator();

            // ---- Phase 1: temp / cache categories (0 → 35%) --------------------
            log?.Report("Analisando arquivos temporários e caches...");
            var targets = KnownLocations.BuildTargets();
            int i = 0;
            foreach (var target in targets)
            {
                ct.ThrowIfCancellationRequested();
                var category = MeasureTarget(target, isAdmin, ct);
                result.Categories.Add(category);
                if (category.TotalBytes > 0)
                    log?.Report($"  {target.Glyph} {target.Title}: {ByteFormatter.Format(category.TotalBytes)} ({category.Count} itens)");
                i++;
                progress?.Report(35.0 * i / targets.Count);
            }

            result.TotalReclaimableBytes = result.Categories
                .Where(c => c.IsCleanable)
                .Sum(c => c.TotalBytes);

            // ---- Phase 2: large personal files (35% → 70%) --------------------
            log?.Report("Procurando arquivos pessoais grandes que podem ir para o HD externo...");
            var personalRoots = GetPersonalRoots();
            long minBytes = (long)_settings.MinimumMoveSizeMb * 1024 * 1024;
            int rootIndex = 0;
            foreach (var root in personalRoots)
            {
                ct.ThrowIfCancellationRequested();
                CollectLargeFiles(root, minBytes, result.LargeFiles, ct);
                rootIndex++;
                progress?.Report(35 + 35.0 * rootIndex / Math.Max(1, personalRoots.Count));
            }
            result.LargeFiles = result.LargeFiles
                .OrderByDescending(f => f.SizeBytes)
                .ToList();
            result.TotalMovableBytes = result.LargeFiles.Sum(f => f.SizeBytes);
            log?.Report($"  Encontrados {result.LargeFiles.Count} arquivos grandes ({ByteFormatter.Format(result.TotalMovableBytes)}).");

            // ---- Phase 3: duplicates (70% → 90%) ------------------------------
            if (_settings.EnableDuplicateDetection)
            {
                log?.Report("Procurando arquivos duplicados (SHA-256)...");
                var dupProgress = new Progress<string>(m => log?.Report("  " + m));
                result.Duplicates = _duplicateFinder.Find(personalRoots, dupProgress, ct);
                result.TotalDuplicateBytes = result.Duplicates.Sum(d => d.ReclaimableBytes);
                log?.Report($"  {result.Duplicates.Count} grupos de duplicados, {ByteFormatter.Format(result.TotalDuplicateBytes)} recuperáveis.");
            }
            progress?.Report(90);

            // ---- Phase 4: developer / game caches (90% → 100%) ----------------
            log?.Report("Medindo caches de desenvolvimento, VMs e jogos (apenas informativo)...");
            result.DeveloperCaches = _devScanner.Scan(ct);
            foreach (var dc in result.DeveloperCaches)
                log?.Report($"  {dc.Name} ({dc.Category}): {ByteFormatter.Format(dc.SizeBytes)}");
            progress?.Report(100);

            result.FinishedUtc = DateTime.UtcNow;
            log?.Report($"Análise concluída em {result.Duration.TotalSeconds:0.0}s.");
            return result;
        }

        private ScanCategory MeasureTarget(CleanTarget target, bool isAdmin, CancellationToken ct)
        {
            var category = new ScanCategory
            {
                Id = target.Id,
                Title = target.Title,
                Description = target.Description,
                Type = target.Type,
                Glyph = target.Glyph,
                IsCleanable = true,
                RequiresAdmin = target.RequiresAdmin,
                Selected = !target.RequiresAdmin || isAdmin
            };

            if (target.IsRecycleBin)
            {
                category.TotalBytes = NativeMethods.GetRecycleBinSize();
                category.Count = (int)NativeMethods.GetRecycleBinItemCount();
                return category;
            }

            long total = 0;
            int count = 0;
            foreach (var loc in target.Locations)
            {
                ct.ThrowIfCancellationRequested();
                if (!Directory.Exists(loc.Directory) && !File.Exists(loc.Directory)) continue;

                // Single-file location (e.g. IconCache.db).
                if (File.Exists(loc.Directory))
                {
                    try { total += new FileInfo(loc.Directory).Length; count++; } catch { }
                    continue;
                }

                foreach (var file in EnumerateForLocation(loc, ct))
                {
                    try { total += file.Length; count++; } catch { }
                }
            }

            category.TotalBytes = total;
            category.Count = count;
            return category;
        }

        private static IEnumerable<FileInfo> EnumerateForLocation(CleanLocation loc, CancellationToken ct)
        {
            if (loc.Pattern == "*" && loc.Recursive)
                return FileSystemHelper.EnumerateFilesSafe(loc.Directory, ct);

            // Non-recursive or pattern-specific enumeration.
            IEnumerable<string> names;
            try
            {
                names = Directory.EnumerateFiles(loc.Directory, loc.Pattern,
                    loc.Recursive ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly);
            }
            catch
            {
                return Enumerable.Empty<FileInfo>();
            }

            var infos = new List<FileInfo>();
            foreach (var n in names)
            {
                try { infos.Add(new FileInfo(n)); } catch { }
            }
            return infos;
        }

        private void CollectLargeFiles(string root, long minBytes, List<LargeFileItem> sink, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(root) || !Directory.Exists(root)) return;

            foreach (var file in FileSystemHelper.EnumerateFilesSafe(root, ct))
            {
                ct.ThrowIfCancellationRequested();
                try
                {
                    if (file.Length < minBytes) continue;
                    if (!_guard.IsSafeToMove(file.FullName)) continue;
                    if (!FileClassifier.IsMovablePersonalType(file.FullName, _settings.MovableExtensions)) continue;

                    var item = new LargeFileItem
                    {
                        Path = file.FullName,
                        SizeBytes = file.Length,
                        LastAccessUtc = file.LastAccessTimeUtc,
                        LastWriteUtc = file.LastWriteTimeUtc,
                        SuggestedCategory = FileClassifier.GetTargetFolder(file.FullName)
                    };
                    item.Reason = DetermineReason(item);
                    sink.Add(item);
                }
                catch
                {
                    // ignore unreadable file
                }
            }
        }

        /// <summary>Applies the "intelligence" rules to explain why a file is suggested for moving.</summary>
        private string DetermineReason(LargeFileItem item)
        {
            const long OneGb = 1024L * 1024 * 1024;
            const long FiveGb = 5 * OneGb;

            if (item.SizeBytes >= FiveGb) return "Arquivo enorme (5 GB+)";

            string ext = item.Extension.ToLowerInvariant();
            if (ext is ".iso" or ".img" or ".vhd" or ".vhdx") return "Imagem de disco (ISO)";
            if (ext is ".exe" or ".msi" or ".msix" && item.DaysSinceAccess > _settings.UnusedThresholdDays)
                return "Instalador antigo";
            if (ext is ".bak" or ".bkp" or ".backup" or ".old" or ".wim") return "Backup antigo";

            if (item.DaysSinceAccess > _settings.UnusedThresholdDays)
                return $"Não utilizado há {item.DaysSinceAccess} dias";

            if (item.SizeBytes >= OneGb) return "Arquivo grande (1 GB+)";

            return "Arquivo pessoal grande";
        }

        /// <summary>The user's personal document folders that host movable content.</summary>
        public static List<string> GetPersonalRoots()
        {
            string Get(Environment.SpecialFolder f)
            {
                try { return Environment.GetFolderPath(f); } catch { return string.Empty; }
            }

            string profile = Get(Environment.SpecialFolder.UserProfile);
            var roots = new List<string?>
            {
                string.IsNullOrEmpty(profile) ? null : Path.Combine(profile, "Downloads"),
                Get(Environment.SpecialFolder.MyVideos),
                Get(Environment.SpecialFolder.MyPictures),
                Get(Environment.SpecialFolder.MyDocuments),
                Get(Environment.SpecialFolder.Desktop),
                Get(Environment.SpecialFolder.MyMusic),
            };

            return roots.Where(r => !string.IsNullOrWhiteSpace(r) && Directory.Exists(r!))
                        .Select(r => r!)
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();
        }
    }
}
