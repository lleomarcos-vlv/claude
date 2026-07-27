using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Threading;
using System.Threading.Tasks;
using ConlorPCCleaner.Helpers;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Services
{
    /// <summary>
    /// Moves large personal files to an external drive, organising them into a tidy
    /// <c>Backup_PC</c> folder structure. Every move is validated against the SafetyGuard,
    /// recorded in a manifest (so it can be undone), and can run in simulation mode. Files are
    /// MOVED, never deleted — the user's data always continues to exist somewhere.
    /// </summary>
    public sealed class FileTransferService
    {
        private readonly SafetyGuard _guard;
        private readonly BackupService _backup;
        private readonly AppSettings _settings;

        public FileTransferService(SafetyGuard guard, BackupService backup, AppSettings settings)
        {
            _guard = guard;
            _backup = backup;
            _settings = settings;
        }

        /// <summary>Converts the analyzer's large-file findings into transfer candidates.</summary>
        public List<TransferCandidate> BuildCandidates(ScanResult scan)
        {
            var candidates = new List<TransferCandidate>();
            foreach (var f in scan.LargeFiles)
            {
                candidates.Add(new TransferCandidate
                {
                    SourcePath = f.Path,
                    SizeBytes = f.SizeBytes,
                    TargetSubFolder = string.IsNullOrEmpty(f.SuggestedCategory)
                        ? FileClassifier.GetTargetFolder(f.Path)
                        : f.SuggestedCategory,
                    Reason = f.Reason,
                    LastAccessUtc = f.LastAccessUtc,
                    Selected = true
                });
            }
            return candidates;
        }

        /// <summary>Creates the standard Backup_PC folder tree on the external drive.</summary>
        public string EnsureBackupStructure(string externalRoot)
        {
            string backupRoot = Path.Combine(externalRoot, TransferFolders.Root);
            Directory.CreateDirectory(backupRoot);
            foreach (var sub in TransferFolders.All)
                Directory.CreateDirectory(Path.Combine(backupRoot, sub));
            return backupRoot;
        }

        /// <summary>Moves the selected candidates to the external drive.</summary>
        public async Task<TransferResult> TransferAsync(
            IEnumerable<TransferCandidate> candidates,
            string externalRoot,
            bool simulate,
            IProgress<string>? log = null,
            IProgress<double>? progress = null,
            CancellationToken ct = default)
        {
            var result = new TransferResult { StartedUtc = DateTime.UtcNow, Simulated = simulate };

            if (string.IsNullOrWhiteSpace(externalRoot) || !Directory.Exists(externalRoot))
            {
                log?.Report("❌ Nenhum HD externo válido selecionado.");
                result.FinishedUtc = DateTime.UtcNow;
                return result;
            }

            var selected = new List<TransferCandidate>();
            foreach (var c in candidates)
                if (c.Selected) selected.Add(c);

            if (simulate)
                log?.Report("MODO SIMULAÇÃO ativo — nada será realmente movido.");

            string backupRoot = simulate
                ? Path.Combine(externalRoot, TransferFolders.Root)
                : EnsureBackupStructure(externalRoot);
            result.BackupRoot = backupRoot;

            var manifest = new TransferManifest
            {
                ExternalDriveRoot = externalRoot,
                BackupRoot = backupRoot,
                Simulated = simulate
            };

            await Task.Run(() =>
            {
                int total = Math.Max(1, selected.Count);
                int index = 0;

                foreach (var candidate in selected)
                {
                    ct.ThrowIfCancellationRequested();
                    index++;
                    progress?.Report(100.0 * index / total);

                    MoveOne(candidate, backupRoot, simulate, manifest, result, log);
                }
            }, ct).ConfigureAwait(false);

            // Persist the manifest for a real transfer so it can always be undone.
            if (!simulate && manifest.Entries.Count > 0)
                result.ManifestPath = _backup.SaveManifest(manifest);

            result.FinishedUtc = DateTime.UtcNow;
            log?.Report($"Transferência concluída: {result.FilesMoved} arquivos ({ByteFormatter.Format(result.BytesMoved)}). " +
                        $"Falhas: {result.FilesFailed}.");
            return result;
        }

        private void MoveOne(TransferCandidate candidate, string backupRoot, bool simulate,
            TransferManifest manifest, TransferResult result, IProgress<string>? log)
        {
            string source = candidate.SourcePath;

            // Final safety checks before any move.
            if (!File.Exists(source))
            {
                log?.Report($"⚠️  Não encontrado (ignorado): {candidate.Name}");
                return;
            }
            if (!_guard.IsSafeToMove(source))
            {
                log?.Report($"🛡️  Bloqueado por segurança (não movido): {candidate.Name}");
                result.FilesFailed++;
                return;
            }

            string targetDir = Path.Combine(backupRoot, candidate.TargetSubFolder);
            string destination = GetUniqueDestination(targetDir, Path.GetFileName(source));

            bool willCompress = _settings.CompressBeforeTransfer &&
                                candidate.SizeBytes >= (long)_settings.CompressThresholdMb * 1024 * 1024;

            if (simulate)
            {
                string action = willCompress ? "comprimiria e moveria" : "moveria";
                log?.Report($"   → (simulação) {action} {candidate.Name} → {candidate.TargetSubFolder}\\");
                result.FilesMoved++;
                result.BytesMoved += candidate.SizeBytes;
                return;
            }

            try
            {
                Directory.CreateDirectory(targetDir);

                if (willCompress)
                {
                    string zipPath = destination + ".zip";
                    zipPath = MakeUnique(zipPath);
                    using (var zip = ZipFile.Open(zipPath, ZipArchiveMode.Create))
                    {
                        zip.CreateEntryFromFile(source, Path.GetFileName(source), CompressionLevel.Optimal);
                    }
                    FileSystemHelper.TryDeleteFile(source);
                    destination = zipPath;
                }
                else
                {
                    File.Move(source, destination);
                }

                manifest.Entries.Add(new TransferEntry
                {
                    SourcePath = source,
                    DestinationPath = destination,
                    SizeBytes = candidate.SizeBytes,
                    MovedAtUtc = DateTime.UtcNow
                });

                result.FilesMoved++;
                result.BytesMoved += candidate.SizeBytes;
                log?.Report($"   → Movido: {candidate.Name} → {candidate.TargetSubFolder}\\");
            }
            catch (Exception ex)
            {
                result.FilesFailed++;
                log?.Report($"❌ Falha ao mover {candidate.Name}: {ex.Message}");
                Logger.Instance.Error($"Falha ao mover '{source}'.", ex);
            }
        }

        /// <summary>Returns a destination path that does not collide with an existing file.</summary>
        private static string GetUniqueDestination(string directory, string fileName)
        {
            return MakeUnique(Path.Combine(directory, fileName));
        }

        private static string MakeUnique(string fullPath)
        {
            if (!File.Exists(fullPath)) return fullPath;

            string dir = Path.GetDirectoryName(fullPath) ?? string.Empty;
            string name = Path.GetFileNameWithoutExtension(fullPath);
            string ext = Path.GetExtension(fullPath);

            for (int i = 1; i < 10000; i++)
            {
                string candidate = Path.Combine(dir, $"{name} ({i}){ext}");
                if (!File.Exists(candidate)) return candidate;
            }
            // Extremely unlikely fallback.
            return Path.Combine(dir, $"{name}_{Guid.NewGuid():N}{ext}");
        }
    }
}
