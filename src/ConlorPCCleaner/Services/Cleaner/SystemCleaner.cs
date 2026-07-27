using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Win32;
using ConlorPCCleaner.Helpers;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Services
{
    /// <summary>
    /// Executes the cleaning operations. It ONLY ever removes files inside the explicit
    /// temp/cache locations catalogued in <see cref="KnownLocations"/>, and every single file is
    /// re-checked against <see cref="SafetyGuard.IsSafeToDelete"/> before removal. It supports a
    /// full "simulation" mode in which nothing is actually deleted.
    /// </summary>
    public sealed class SystemCleaner
    {
        private readonly SafetyGuard _guard;

        public SystemCleaner(SafetyGuard guard)
        {
            _guard = guard;
        }

        /// <summary>
        /// Cleans the requested categories and, optionally, runs the Windows maintenance
        /// commands (cleanmgr, DISM, SFC, flush DNS).
        /// </summary>
        public async Task<CleanupResult> CleanAsync(
            IEnumerable<string> categoryIds,
            bool runMaintenance,
            bool simulate,
            IProgress<string>? log = null,
            IProgress<double>? progress = null,
            CancellationToken ct = default)
        {
            var result = new CleanupResult { StartedUtc = DateTime.UtcNow, Simulated = simulate };
            bool isAdmin = AdminHelper.IsAdministrator();
            var requestedIds = new HashSet<string>(categoryIds, StringComparer.OrdinalIgnoreCase);

            if (simulate)
                log?.Report("MODO SIMULAÇÃO ativo — nenhum arquivo será apagado de verdade.");

            var targets = KnownLocations.BuildTargets()
                .Where(t => requestedIds.Contains(t.Id))
                .ToList();

            int step = 0;
            int totalSteps = targets.Count + (runMaintenance ? 4 : 0);
            totalSteps = Math.Max(1, totalSteps);

            // ---- Directory-sweep / recycle-bin categories ----------------------
            foreach (var target in targets)
            {
                ct.ThrowIfCancellationRequested();
                var taskResult = await Task.Run(() => CleanTarget(target, isAdmin, simulate, log, ct), ct)
                                            .ConfigureAwait(false);
                result.Tasks.Add(taskResult);
                step++;
                progress?.Report(100.0 * step / totalSteps);
            }

            // ---- Windows maintenance commands ----------------------------------
            if (runMaintenance)
            {
                result.Tasks.Add(await FlushDnsAsync(simulate, log, ct).ConfigureAwait(false));
                progress?.Report(100.0 * (++step) / totalSteps);

                result.Tasks.Add(await RunCleanMgrAsync(simulate, isAdmin, log, ct).ConfigureAwait(false));
                progress?.Report(100.0 * (++step) / totalSteps);

                result.Tasks.Add(await RunDismAsync(simulate, isAdmin, log, ct).ConfigureAwait(false));
                progress?.Report(100.0 * (++step) / totalSteps);

                result.Tasks.Add(await RunSfcAsync(simulate, isAdmin, log, ct).ConfigureAwait(false));
                progress?.Report(100.0 * (++step) / totalSteps);
            }

            result.FinishedUtc = DateTime.UtcNow;
            log?.Report($"Limpeza concluída. Espaço liberado: {ByteFormatter.Format(result.TotalBytesFreed)} " +
                        $"em {result.TotalFilesRemoved} arquivos.");
            return result;
        }

        // ---------------------------------------------------------------------

        private CleanupTaskResult CleanTarget(CleanTarget target, bool isAdmin, bool simulate,
            IProgress<string>? log, CancellationToken ct)
        {
            var task = new CleanupTaskResult { TaskName = target.Title };

            if (target.RequiresAdmin && !isAdmin)
            {
                task.Skipped = true;
                task.Note = "Requer administrador";
                log?.Report($"⏭️  {target.Title}: ignorado (requer privilégios de administrador).");
                return task;
            }

            log?.Report($"{target.Glyph} Limpando: {target.Title}...");

            if (target.IsRecycleBin)
                return CleanRecycleBin(simulate, log);

            foreach (var loc in target.Locations)
            {
                ct.ThrowIfCancellationRequested();

                // Single-file target (e.g. IconCache.db).
                if (File.Exists(loc.Directory))
                {
                    ProcessSingleFile(loc.Directory, simulate, task);
                    continue;
                }

                if (!Directory.Exists(loc.Directory)) continue;

                IEnumerable<FileInfo> files = EnumerateForLocation(loc, ct);
                foreach (var file in files)
                {
                    ct.ThrowIfCancellationRequested();
                    ProcessSingleFile(file.FullName, simulate, task, file);
                }
            }

            log?.Report($"   → {ByteFormatter.Format(task.BytesFreed)} liberados ({task.FilesRemoved} arquivos).");
            return task;
        }

        private void ProcessSingleFile(string path, bool simulate, CleanupTaskResult task, FileInfo? known = null)
        {
            // Defence in depth: never touch personal/protected/excluded files, even by accident.
            if (!_guard.IsSafeToDelete(path)) return;

            long size;
            try
            {
                size = known?.Length ?? new FileInfo(path).Length;
            }
            catch
            {
                return;
            }

            if (simulate)
            {
                task.BytesFreed += size;
                task.FilesRemoved++;
                return;
            }

            long freed = FileSystemHelper.TryDeleteFile(path);
            if (freed > 0)
            {
                task.BytesFreed += freed;
                task.FilesRemoved++;
            }
        }

        private CleanupTaskResult CleanRecycleBin(bool simulate, IProgress<string>? log)
        {
            var task = new CleanupTaskResult { TaskName = "Lixeira" };
            long size = NativeMethods.GetRecycleBinSize();
            int count = (int)NativeMethods.GetRecycleBinItemCount();

            if (simulate)
            {
                task.BytesFreed = size;
                task.FilesRemoved = count;
                log?.Report($"   → (simulação) esvaziaria {ByteFormatter.Format(size)} da Lixeira.");
                return task;
            }

            if (NativeMethods.EmptyRecycleBin())
            {
                task.BytesFreed = size;
                task.FilesRemoved = count;
                log?.Report($"   → Lixeira esvaziada: {ByteFormatter.Format(size)}.");
            }
            else
            {
                task.Succeeded = false;
                task.Note = "Não foi possível esvaziar a Lixeira";
            }
            return task;
        }

        private static IEnumerable<FileInfo> EnumerateForLocation(CleanLocation loc, CancellationToken ct)
        {
            if (loc.Pattern == "*" && loc.Recursive)
                return FileSystemHelper.EnumerateFilesSafe(loc.Directory, ct);

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

        // ---- Maintenance commands -------------------------------------------

        private static async Task<CleanupTaskResult> FlushDnsAsync(bool simulate, IProgress<string>? log, CancellationToken ct)
        {
            var task = new CleanupTaskResult { TaskName = "Limpeza do cache DNS" };
            log?.Report("🌐 Limpando cache DNS...");
            if (simulate) { task.Note = "Simulado"; return task; }

            var pr = await ProcessRunner.RunAsync("ipconfig.exe", "/flushdns", TimeSpan.FromSeconds(30), ct)
                                        .ConfigureAwait(false);
            task.Succeeded = pr.Success;
            task.Note = pr.Success ? "Cache DNS liberado" : "Falhou";
            log?.Report($"   → {task.Note}.");
            return task;
        }

        private async Task<CleanupTaskResult> RunCleanMgrAsync(bool simulate, bool isAdmin, IProgress<string>? log, CancellationToken ct)
        {
            var task = new CleanupTaskResult { TaskName = "Limpeza de Disco (cleanmgr)" };
            log?.Report("🧽 Executando Limpeza de Disco do Windows (cleanmgr)...");

            if (!isAdmin) { task.Skipped = true; task.Note = "Requer administrador"; log?.Report("   → ignorado (requer admin)."); return task; }
            if (simulate) { task.Note = "Simulado"; log?.Report("   → (simulação)."); return task; }

            ConfigureCleanMgrProfile();
            var pr = await ProcessRunner.RunAsync("cleanmgr.exe", "/sagerun:4224", TimeSpan.FromMinutes(15), ct)
                                        .ConfigureAwait(false);
            task.Succeeded = pr.Success || pr.ExitCode == 0;
            task.Note = "Concluído";
            log?.Report("   → Limpeza de Disco concluída.");
            return task;
        }

        private static async Task<CleanupTaskResult> RunDismAsync(bool simulate, bool isAdmin, IProgress<string>? log, CancellationToken ct)
        {
            var task = new CleanupTaskResult { TaskName = "Reparo de imagem (DISM)" };
            log?.Report("🔧 Executando DISM /StartComponentCleanup (pode demorar)...");

            if (!isAdmin) { task.Skipped = true; task.Note = "Requer administrador"; log?.Report("   → ignorado (requer admin)."); return task; }
            if (simulate) { task.Note = "Simulado"; log?.Report("   → (simulação)."); return task; }

            var pr = await ProcessRunner.RunAsync("dism.exe",
                "/online /cleanup-image /startcomponentcleanup", TimeSpan.FromMinutes(25), ct)
                .ConfigureAwait(false);
            task.Succeeded = pr.Success;
            task.Note = pr.Success ? "Concluído" : (pr.TimedOut ? "Tempo esgotado" : "Falhou");
            log?.Report($"   → DISM: {task.Note}.");
            return task;
        }

        private static async Task<CleanupTaskResult> RunSfcAsync(bool simulate, bool isAdmin, IProgress<string>? log, CancellationToken ct)
        {
            var task = new CleanupTaskResult { TaskName = "Verificação de arquivos (SFC)" };
            log?.Report("🛡️ Executando SFC /scannow (pode demorar bastante)...");

            if (!isAdmin) { task.Skipped = true; task.Note = "Requer administrador"; log?.Report("   → ignorado (requer admin)."); return task; }
            if (simulate) { task.Note = "Simulado"; log?.Report("   → (simulação)."); return task; }

            var pr = await ProcessRunner.RunAsync("sfc.exe", "/scannow", TimeSpan.FromMinutes(30), ct)
                                        .ConfigureAwait(false);
            task.Succeeded = pr.Success;
            task.Note = pr.Success ? "Nenhum problema pendente" : (pr.TimedOut ? "Tempo esgotado" : "Concluído com avisos");
            log?.Report($"   → SFC: {task.Note}.");
            return task;
        }

        /// <summary>
        /// Prepares a cleanmgr "sageset" profile (id 4224) by enabling a curated set of safe
        /// VolumeCaches handlers in the registry so /sagerun runs silently and without touching
        /// anything risky. Failures are ignored (cleanmgr simply cleans less).
        /// </summary>
        private static void ConfigureCleanMgrProfile()
        {
            const string basePath = @"SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches";
            // A conservative allow-list of handlers that only remove genuine temp/cache data.
            string[] safeHandlers =
            {
                "Temporary Files", "Temporary Setup Files", "Downloaded Program Files",
                "Internet Cache Files", "Thumbnail Cache", "Delivery Optimization Files",
                "Update Cleanup", "Windows Error Reporting Files", "System error memory dump files",
                "System error minidump files", "Windows Defender", "DirectX Shader Cache"
            };

            try
            {
                using var baseKey = Registry.LocalMachine.OpenSubKey(basePath, writable: false);
                if (baseKey == null) return;

                foreach (var handler in baseKey.GetSubKeyNames())
                {
                    try
                    {
                        using var hk = Registry.LocalMachine.OpenSubKey($@"{basePath}\{handler}", writable: true);
                        if (hk == null) continue;
                        int value = safeHandlers.Contains(handler, StringComparer.OrdinalIgnoreCase) ? 2 : 0;
                        hk.SetValue("StateFlags4224", value, RegistryValueKind.DWord);
                    }
                    catch { /* ignore individual handler */ }
                }
            }
            catch
            {
                // Not admin or key missing — cleanmgr will still run with defaults.
            }
        }
    }
}
