using System;

namespace ConlorPCCleaner.Models
{
    /// <summary>Classification of a storage volume.</summary>
    public enum DriveKind
    {
        Internal,
        External,
        Removable,
        Network,
        Unknown
    }

    /// <summary>Represents a mounted drive with capacity/usage information for the dashboard.</summary>
    public sealed class DriveModel
    {
        /// <summary>Root path, e.g. "C:\".</summary>
        public string Root { get; set; } = string.Empty;

        /// <summary>Drive letter only, e.g. "C:".</summary>
        public string Letter => Root.Length >= 2 ? Root.Substring(0, 2) : Root;

        /// <summary>Volume label (may be empty).</summary>
        public string Label { get; set; } = string.Empty;

        /// <summary>File system, e.g. "NTFS", "exFAT".</summary>
        public string FileSystem { get; set; } = string.Empty;

        public DriveKind Kind { get; set; } = DriveKind.Unknown;

        public long TotalBytes { get; set; }
        public long FreeBytes { get; set; }
        public long UsedBytes => Math.Max(0, TotalBytes - FreeBytes);

        public double UsedPercent => TotalBytes > 0 ? (double)UsedBytes / TotalBytes * 100.0 : 0;
        public double FreePercent => TotalBytes > 0 ? (double)FreeBytes / TotalBytes * 100.0 : 0;

        public bool IsReady { get; set; }

        public bool IsExternal => Kind is DriveKind.External or DriveKind.Removable;

        /// <summary>Friendly display, e.g. "C: (Windows)".</summary>
        public string DisplayName =>
            string.IsNullOrWhiteSpace(Label) ? Letter : $"{Letter} ({Label})";

        public override string ToString() => DisplayName;
    }
}
