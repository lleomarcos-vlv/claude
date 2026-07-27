using System;
using System.Collections.Generic;

namespace ConlorPCCleaner.Models
{
    /// <summary>Outcome of cleaning a single task/category.</summary>
    public sealed class CleanupTaskResult
    {
        public string TaskName { get; set; } = string.Empty;
        public long BytesFreed { get; set; }
        public int FilesRemoved { get; set; }
        public bool Succeeded { get; set; } = true;
        public bool Skipped { get; set; }
        public string? Note { get; set; }
    }

    /// <summary>Aggregate outcome of a cleaning run.</summary>
    public sealed class CleanupResult
    {
        public DateTime StartedUtc { get; set; }
        public DateTime FinishedUtc { get; set; }
        public TimeSpan Duration => FinishedUtc - StartedUtc;

        public bool Simulated { get; set; }
        public List<CleanupTaskResult> Tasks { get; set; } = new();

        public long TotalBytesFreed
        {
            get
            {
                long sum = 0;
                foreach (var t in Tasks) sum += t.BytesFreed;
                return sum;
            }
        }

        public int TotalFilesRemoved
        {
            get
            {
                int sum = 0;
                foreach (var t in Tasks) sum += t.FilesRemoved;
                return sum;
            }
        }
    }
}
