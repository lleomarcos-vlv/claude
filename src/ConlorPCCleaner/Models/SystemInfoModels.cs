using System;
using System.Collections.Generic;

namespace ConlorPCCleaner.Models
{
    /// <summary>SMART / health snapshot for a physical disk.</summary>
    public sealed class DiskHealth
    {
        public string DeviceId { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string MediaType { get; set; } = string.Empty; // SSD / HDD
        public string HealthStatus { get; set; } = "Unknown"; // Healthy / Warning / Unhealthy
        public long SizeBytes { get; set; }
        public int? TemperatureCelsius { get; set; }
        public int? WearPercentage { get; set; }
        public long? PowerOnHours { get; set; }

        public bool IsHealthy => string.Equals(HealthStatus, "Healthy", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>An installed program (from the registry uninstall keys).</summary>
    public sealed class InstalledProgram
    {
        public string Name { get; set; } = string.Empty;
        public string? Publisher { get; set; }
        public string? Version { get; set; }
        public long EstimatedSizeBytes { get; set; }
        public DateTime? InstallDate { get; set; }
        public string? InstallLocation { get; set; }

        /// <summary>Heuristic flag: large and apparently unused for a long time.</summary>
        public bool SuggestReview { get; set; }
    }

    /// <summary>Disk space consumed by a developer / gaming / virtualization cache (informational only).</summary>
    public sealed class DeveloperCacheInfo
    {
        public string Name { get; set; } = string.Empty;   // e.g. "Docker", "VS Code", "Steam"
        public string Category { get; set; } = string.Empty; // e.g. "Container", "IDE", "Game"
        public string Path { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public bool Exists { get; set; }
    }
}
