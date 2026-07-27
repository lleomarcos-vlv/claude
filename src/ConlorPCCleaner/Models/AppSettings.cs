using System.Collections.Generic;

namespace ConlorPCCleaner.Models
{
    /// <summary>UI theme options.</summary>
    public enum AppTheme
    {
        Dark,
        Light
    }

    /// <summary>
    /// User-configurable settings, serialized to JSON at
    /// %LOCALAPPDATA%\ConlorPCCleaner\settings.json. All defaults are chosen to be safe.
    /// </summary>
    public sealed class AppSettings
    {
        /// <summary>Active visual theme.</summary>
        public AppTheme Theme { get; set; } = AppTheme.Dark;

        /// <summary>
        /// When true, no file is ever deleted or moved — the tool only reports what it WOULD do.
        /// This is the safest mode and is a headline feature of the product.
        /// </summary>
        public bool SimulationMode { get; set; } = false;

        /// <summary>Minimum file size (in MB) for a personal file to be suggested for transfer.</summary>
        public int MinimumMoveSizeMb { get; set; } = 100;

        /// <summary>A file not accessed for at least this many days is considered "unused".</summary>
        public int UnusedThresholdDays { get; set; } = 90;

        /// <summary>Preferred external drive root (e.g. "E:\"). Empty = ask / auto-detect.</summary>
        public string PreferredExternalDrive { get; set; } = string.Empty;

        /// <summary>Folders and files that must NEVER be touched, in addition to the built-in protections.</summary>
        public List<string> ProtectedPaths { get; set; } = new();

        /// <summary>Extra file extensions (with dot) considered movable personal content.</summary>
        public List<string> MovableExtensions { get; set; } = new();

        /// <summary>Whether the automatic scheduled cleanup task is enabled.</summary>
        public bool ScheduleEnabled { get; set; } = false;

        /// <summary>Scheduled frequency: "Daily", "Weekly", or "Monthly".</summary>
        public string ScheduleFrequency { get; set; } = "Weekly";

        /// <summary>Time of day (24h "HH:mm") for the scheduled task.</summary>
        public string ScheduleTime { get; set; } = "20:00";

        /// <summary>Whether to compute SHA-256 duplicate detection during analysis (slower).</summary>
        public bool EnableDuplicateDetection { get; set; } = true;

        /// <summary>Whether to compress very large files into a .zip before transferring.</summary>
        public bool CompressBeforeTransfer { get; set; } = false;

        /// <summary>Files larger than this many MB are compressed before transfer (when enabled).</summary>
        public int CompressThresholdMb { get; set; } = 500;

        /// <summary>Whether to attempt a System Restore point before major operations.</summary>
        public bool CreateRestorePoint { get; set; } = true;

        /// <summary>Returns a fresh instance populated with default values.</summary>
        public static AppSettings CreateDefault() => new();
    }
}
