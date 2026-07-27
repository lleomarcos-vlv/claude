using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using ConlorPCCleaner.Helpers;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Services
{
    /// <summary>
    /// Registers / removes a Windows Scheduled Task that runs Conlor PC Cleaner automatically,
    /// via the built-in <c>schtasks.exe</c>. The scheduled run launches the app with the
    /// <c>--auto-clean</c> switch, which performs a safe Smart Clean without any UI.
    /// </summary>
    public sealed class SchedulerService
    {
        public const string TaskName = "ConlorPCCleaner_AutoClean";
        public const string AutoCleanArgument = "--auto-clean";

        /// <summary>Creates/updates the scheduled task from the current settings.</summary>
        public async Task<bool> ApplyAsync(AppSettings settings, CancellationToken ct = default)
        {
            if (!settings.ScheduleEnabled)
                return await RemoveAsync(ct).ConfigureAwait(false);

            string exe = Process.GetCurrentProcess().MainModule?.FileName ?? string.Empty;
            if (string.IsNullOrEmpty(exe))
            {
                Logger.Instance.Warning("Não foi possível determinar o caminho do executável para agendamento.");
                return false;
            }

            string schedule = settings.ScheduleFrequency.ToUpperInvariant() switch
            {
                "DAILY" or "DIÁRIO" or "DIARIO" => "/SC DAILY",
                "MONTHLY" or "MENSAL" => "/SC MONTHLY",
                _ => "/SC WEEKLY /D SUN"
            };

            string time = NormalizeTime(settings.ScheduleTime);

            string args = $"/Create /TN \"{TaskName}\" " +
                          $"/TR \"\\\"{exe}\\\" {AutoCleanArgument}\" " +
                          $"{schedule} /ST {time} /F /RL LIMITED";

            var pr = await ProcessRunner.RunAsync("schtasks.exe", args, TimeSpan.FromSeconds(30), ct)
                                        .ConfigureAwait(false);
            if (pr.Success)
                Logger.Instance.Success($"Agendamento criado ({settings.ScheduleFrequency} às {time}).");
            else
                Logger.Instance.Warning($"Falha ao criar agendamento: {pr.StandardError.Trim()}");

            return pr.Success;
        }

        /// <summary>Removes the scheduled task if present.</summary>
        public async Task<bool> RemoveAsync(CancellationToken ct = default)
        {
            var pr = await ProcessRunner.RunAsync("schtasks.exe",
                $"/Delete /TN \"{TaskName}\" /F", TimeSpan.FromSeconds(30), ct).ConfigureAwait(false);
            // Exit code 1 simply means the task did not exist — treat as success.
            return pr.ExitCode == 0 || pr.ExitCode == 1;
        }

        /// <summary>Returns true when the scheduled task currently exists.</summary>
        public async Task<bool> ExistsAsync(CancellationToken ct = default)
        {
            var pr = await ProcessRunner.RunAsync("schtasks.exe",
                $"/Query /TN \"{TaskName}\"", TimeSpan.FromSeconds(20), ct).ConfigureAwait(false);
            return pr.Success;
        }

        private static string NormalizeTime(string time)
        {
            if (TimeSpan.TryParse(time, out var ts))
                return $"{ts.Hours:D2}:{ts.Minutes:D2}";
            return "20:00";
        }
    }
}
