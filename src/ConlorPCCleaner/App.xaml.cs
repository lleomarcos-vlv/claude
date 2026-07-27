using System;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using ConlorPCCleaner.Helpers;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Services;
using ConlorPCCleaner.Themes;
using ConlorPCCleaner.Utilities;
using ConlorPCCleaner.Views;

namespace ConlorPCCleaner
{
    /// <summary>Application entry point. Handles both the interactive UI and the headless
    /// scheduled "--auto-clean" run.</summary>
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            DispatcherUnhandledException += OnUnhandledException;

            var settingsService = new SettingsService();
            AppSettings settings = settingsService.Load();

            // Headless mode used by the Windows Scheduled Task.
            if (e.Args.Contains(SchedulerService.AutoCleanArgument, StringComparer.OrdinalIgnoreCase))
            {
                try
                {
                    RunHeadlessAutoCleanAsync(settings).GetAwaiter().GetResult();
                }
                catch (Exception ex)
                {
                    Logger.Instance.Error("Falha na limpeza automática agendada.", ex);
                }
                Shutdown();
                return;
            }

            // Interactive mode.
            ThemeManager.Apply(settings.Theme);
            var window = new MainWindow(settingsService);
            MainWindow = window;
            window.Show();
        }

        /// <summary>
        /// Runs a safe Smart Clean without any UI. Only the quick, non-destructive cache
        /// categories are cleaned, and the user's simulation preference is honoured.
        /// </summary>
        private static async Task RunHeadlessAutoCleanAsync(AppSettings settings)
        {
            Logger.Instance.Info("=== Limpeza automática agendada iniciada ===");
            var guard = new SafetyGuard(settings.ProtectedPaths);
            var cleaner = new SystemCleaner(guard);

            var smartIds = KnownLocations.BuildTargets()
                .Where(t => t.InSmartClean)
                .Select(t => t.Id);

            var log = new Progress<string>(m => Logger.Instance.Info(m));
            var result = await cleaner.CleanAsync(smartIds, runMaintenance: false,
                simulate: settings.SimulationMode, log: log).ConfigureAwait(false);

            // Persist a report so the user can see what the scheduled run did.
            var report = new ReportService();
            report.GenerateAll(new ReportData
            {
                OperationTitle = "Limpeza automática agendada",
                Simulated = result.Simulated,
                Elapsed = result.Duration,
                BytesFreed = result.TotalBytesFreed,
                FilesCleaned = result.TotalFilesRemoved,
                CleanupTasks = result.Tasks
            });

            Logger.Instance.Success($"=== Limpeza automática concluída: {ByteFormatter.Format(result.TotalBytesFreed)} liberados ===");
        }

        private void OnUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
        {
            Logger.Instance.Error("Exceção não tratada na interface.", e.Exception);
            MessageBox.Show(
                "Ocorreu um erro inesperado, mas seus arquivos estão seguros.\n\n" + e.Exception.Message,
                "Conlor PC Cleaner", MessageBoxButton.OK, MessageBoxImage.Warning);
            e.Handled = true;
        }
    }
}
