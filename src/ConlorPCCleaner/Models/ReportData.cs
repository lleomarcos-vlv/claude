using System;
using System.Collections.Generic;

namespace ConlorPCCleaner.Models
{
    /// <summary>
    /// A consolidated snapshot of everything an operation accomplished, used to render the
    /// final HTML / PDF / TXT reports.
    /// </summary>
    public sealed class ReportData
    {
        public DateTime GeneratedUtc { get; set; } = DateTime.UtcNow;
        public string OperationTitle { get; set; } = "Relatório Conlor PC Cleaner";
        public string MachineName { get; set; } = Environment.MachineName;
        public string UserName { get; set; } = Environment.UserName;
        public bool Simulated { get; set; }

        public TimeSpan Elapsed { get; set; }

        public long BytesFreed { get; set; }
        public int FilesCleaned { get; set; }

        public long BytesMoved { get; set; }
        public int FilesMoved { get; set; }
        public string ExternalDriveUsed { get; set; } = string.Empty;

        /// <summary>Drive snapshots (before/after where available).</summary>
        public List<DriveModel> Drives { get; set; } = new();

        /// <summary>Per-task cleaning breakdown.</summary>
        public List<CleanupTaskResult> CleanupTasks { get; set; } = new();

        /// <summary>Detail lines for moved files.</summary>
        public List<string> MovedFiles { get; set; } = new();

        /// <summary>Suggested next steps / possible improvements.</summary>
        public List<string> Suggestions { get; set; } = new();
    }
}
