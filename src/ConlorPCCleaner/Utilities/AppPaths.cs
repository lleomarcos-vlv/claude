using System;
using System.IO;

namespace ConlorPCCleaner.Utilities
{
    /// <summary>
    /// Central location for all folders the application writes to. Everything lives
    /// under %LOCALAPPDATA%\ConlorPCCleaner so the tool never scatters files around the
    /// system and can be fully removed by deleting a single folder.
    /// </summary>
    public static class AppPaths
    {
        /// <summary>Root data folder: %LOCALAPPDATA%\ConlorPCCleaner.</summary>
        public static string DataRoot { get; }

        /// <summary>Folder for generated reports (HTML / PDF / TXT).</summary>
        public static string ReportsRoot { get; }

        /// <summary>Folder for log files.</summary>
        public static string LogsRoot { get; }

        /// <summary>Folder for transfer manifests (used to undo file moves).</summary>
        public static string ManifestsRoot { get; }

        /// <summary>Path of the settings file.</summary>
        public static string SettingsFile { get; }

        static AppPaths()
        {
            DataRoot = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ConlorPCCleaner");

            ReportsRoot = Path.Combine(DataRoot, "Reports");
            LogsRoot = Path.Combine(DataRoot, "Logs");
            ManifestsRoot = Path.Combine(DataRoot, "Manifests");
            SettingsFile = Path.Combine(DataRoot, "settings.json");

            Directory.CreateDirectory(DataRoot);
            Directory.CreateDirectory(ReportsRoot);
            Directory.CreateDirectory(LogsRoot);
            Directory.CreateDirectory(ManifestsRoot);
        }
    }
}
