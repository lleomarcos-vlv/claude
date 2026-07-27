using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using ConlorPCCleaner.Helpers;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Services
{
    /// <summary>
    /// Handles data-safety features: creating a Windows System Restore point before risky
    /// operations, persisting transfer manifests, and undoing a previous transfer by moving
    /// files back to their original locations.
    /// </summary>
    public sealed class BackupService
    {
        private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

        /// <summary>
        /// Attempts to create a System Restore point. Returns true on success. This requires
        /// administrator rights and System Protection to be enabled; failures are logged, not thrown.
        /// </summary>
        public async Task<bool> CreateRestorePointAsync(string description, CancellationToken ct = default)
        {
            if (!AdminHelper.IsAdministrator())
            {
                Logger.Instance.Warning("Ponto de restauração ignorado: requer administrador.");
                return false;
            }

            Logger.Instance.Info("Criando ponto de restauração do sistema...");

            // Remove the default 24h rate limit so a fresh point can be created, then checkpoint.
            string command =
                "try { " +
                "New-ItemProperty -Path 'HKLM:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore' " +
                "-Name 'SystemRestorePointCreationFrequency' -Value 0 -PropertyType DWord -Force | Out-Null; " +
                "Enable-ComputerRestore -Drive $env:SystemDrive -ErrorAction SilentlyContinue; " +
                $"Checkpoint-Computer -Description '{Sanitize(description)}' -RestorePointType 'MODIFY_SETTINGS'; " +
                "Write-Output 'OK' " +
                "} catch { Write-Output ('ERR:' + $_.Exception.Message) }";

            var pr = await ProcessRunner.RunPowerShellAsync(command, TimeSpan.FromMinutes(3), ct)
                                        .ConfigureAwait(false);

            bool ok = pr.Success && pr.StandardOutput.Contains("OK", StringComparison.OrdinalIgnoreCase)
                      && !pr.StandardOutput.Contains("ERR:", StringComparison.OrdinalIgnoreCase);

            if (ok)
                Logger.Instance.Success("Ponto de restauração criado.");
            else
                Logger.Instance.Warning("Não foi possível criar o ponto de restauração (proteção do sistema pode estar desativada).");

            return ok;
        }

        /// <summary>Persists a transfer manifest as JSON and returns its path.</summary>
        public string SaveManifest(TransferManifest manifest)
        {
            string fileName = $"transfer-{manifest.CreatedUtc:yyyyMMdd-HHmmss}-{manifest.Id[..8]}.json";
            string path = Path.Combine(AppPaths.ManifestsRoot, fileName);
            File.WriteAllText(path, JsonSerializer.Serialize(manifest, JsonOptions));
            Logger.Instance.Info($"Manifesto de transferência salvo: {fileName}");
            return path;
        }

        /// <summary>Loads all saved transfer manifests, newest first.</summary>
        public List<(string Path, TransferManifest Manifest)> LoadManifests()
        {
            var list = new List<(string, TransferManifest)>();
            try
            {
                foreach (var file in Directory.EnumerateFiles(AppPaths.ManifestsRoot, "transfer-*.json"))
                {
                    try
                    {
                        var manifest = JsonSerializer.Deserialize<TransferManifest>(File.ReadAllText(file));
                        if (manifest != null) list.Add((file, manifest));
                    }
                    catch (Exception ex)
                    {
                        Logger.Instance.Debug($"Manifesto inválido '{file}': {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.Error("Falha ao listar manifestos.", ex);
            }

            return list.OrderByDescending(x => x.Item2.CreatedUtc).ToList();
        }

        /// <summary>Returns the most recent transfer manifest, or null if none exist.</summary>
        public (string Path, TransferManifest Manifest)? GetLatestManifest() =>
            LoadManifests().Cast<(string, TransferManifest)?>().FirstOrDefault();

        /// <summary>
        /// Undoes a transfer by moving every file back from the external drive to its original
        /// location. Files whose original location is now occupied are skipped and reported.
        /// </summary>
        public async Task<int> UndoTransferAsync(
            TransferManifest manifest,
            IProgress<string>? log = null,
            IProgress<double>? progress = null,
            CancellationToken ct = default)
        {
            return await Task.Run(() =>
            {
                int restored = 0;
                int total = Math.Max(1, manifest.Entries.Count);
                int i = 0;

                foreach (var entry in manifest.Entries)
                {
                    ct.ThrowIfCancellationRequested();
                    i++;
                    progress?.Report(100.0 * i / total);

                    try
                    {
                        if (!File.Exists(entry.DestinationPath))
                        {
                            log?.Report($"⚠️  Origem no HD não encontrada: {Path.GetFileName(entry.DestinationPath)}");
                            continue;
                        }

                        if (File.Exists(entry.SourcePath))
                        {
                            log?.Report($"⏭️  Já existe no destino original, mantido no HD: {Path.GetFileName(entry.SourcePath)}");
                            continue;
                        }

                        string? dir = Path.GetDirectoryName(entry.SourcePath);
                        if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

                        File.Move(entry.DestinationPath, entry.SourcePath);
                        restored++;
                        log?.Report($"↩️  Restaurado: {Path.GetFileName(entry.SourcePath)}");
                    }
                    catch (Exception ex)
                    {
                        log?.Report($"❌ Falha ao restaurar {Path.GetFileName(entry.SourcePath)}: {ex.Message}");
                    }
                }

                log?.Report($"Restauração concluída: {restored}/{manifest.Entries.Count} arquivos devolvidos.");
                return restored;
            }, ct).ConfigureAwait(false);
        }

        private static string Sanitize(string s) => s.Replace("'", " ").Replace("\"", " ");
    }
}
