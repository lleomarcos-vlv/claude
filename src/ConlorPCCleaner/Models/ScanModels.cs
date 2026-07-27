using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;

namespace ConlorPCCleaner.Models
{
    /// <summary>The kind of thing a scan category represents (drives category grouping in UI).</summary>
    public enum ScanCategoryType
    {
        TempFiles,
        WindowsCache,
        BrowserCache,
        Thumbnails,
        Logs,
        WindowsUpdate,
        CrashDumps,
        RecycleBin,
        FontCache,
        DirectXCache,
        StoreCache,
        OneDriveCache,
        TeamsCache,
        Downloads,
        LargeFiles,
        Duplicates,
        DeveloperCache
    }

    /// <summary>A single file (or logical item) discovered by the analyzer.</summary>
    public sealed class ScanItem
    {
        public string Path { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public DateTime LastAccessUtc { get; set; }
        public DateTime LastWriteUtc { get; set; }
        public bool IsDirectory { get; set; }

        public string Name => System.IO.Path.GetFileName(Path);
        public string Extension => System.IO.Path.GetExtension(Path);
    }

    /// <summary>
    /// A grouping of scan items of the same nature (e.g. all browser cache). Implements
    /// change notification so the UI can react when the user selects/deselects a category.
    /// </summary>
    public sealed class ScanCategory : INotifyPropertyChanged
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public ScanCategoryType Type { get; set; }

        /// <summary>True when this category is safe to auto-clean (temp/cache), false when it is informational only.</summary>
        public bool IsCleanable { get; set; }

        /// <summary>True when cleaning this category requires administrator rights.</summary>
        public bool RequiresAdmin { get; set; }

        /// <summary>An icon glyph (Segoe MDL2 / emoji) shown next to the category.</summary>
        public string Glyph { get; set; } = "📁";

        public List<ScanItem> Items { get; set; } = new();

        public long TotalBytes { get; set; }
        public int Count { get; set; }

        private bool _selected = true;

        /// <summary>Whether the user has selected this category to be cleaned.</summary>
        public bool Selected
        {
            get => _selected;
            set
            {
                if (_selected == value) return;
                _selected = value;
                OnPropertyChanged();
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;
        private void OnPropertyChanged([CallerMemberName] string? name = null) =>
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
    }

    /// <summary>A large personal file that is a candidate for transfer to an external drive.</summary>
    public sealed class LargeFileItem : INotifyPropertyChanged
    {
        public string Path { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public DateTime LastAccessUtc { get; set; }
        public DateTime LastWriteUtc { get; set; }
        public string SuggestedCategory { get; set; } = string.Empty;

        /// <summary>Why the analyzer flagged this file, e.g. "Nunca utilizado", "Arquivo enorme".</summary>
        public string Reason { get; set; } = string.Empty;

        private bool _selected = true;

        /// <summary>Whether the user has selected this file to be moved (two-way bound in the UI).</summary>
        public bool Selected
        {
            get => _selected;
            set
            {
                if (_selected == value) return;
                _selected = value;
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(Selected)));
            }
        }

        public string Name => System.IO.Path.GetFileName(Path);
        public string Extension => System.IO.Path.GetExtension(Path);

        /// <summary>Days since the file was last accessed (based on filesystem last-access time).</summary>
        public int DaysSinceAccess => (int)Math.Max(0, (DateTime.UtcNow - LastAccessUtc).TotalDays);

        public event PropertyChangedEventHandler? PropertyChanged;
    }

    /// <summary>A set of files with identical content (same SHA-256 hash).</summary>
    public sealed class DuplicateGroup
    {
        public string Hash { get; set; } = string.Empty;
        public long SizeBytesEach { get; set; }
        public List<string> Paths { get; set; } = new();

        /// <summary>Bytes that could be reclaimed by keeping only one copy.</summary>
        public long ReclaimableBytes => Paths.Count > 1 ? SizeBytesEach * (Paths.Count - 1) : 0;
    }

    /// <summary>The complete result of an "Analyze PC" pass.</summary>
    public sealed class ScanResult
    {
        public DateTime StartedUtc { get; set; }
        public DateTime FinishedUtc { get; set; }
        public TimeSpan Duration => FinishedUtc - StartedUtc;

        public List<ScanCategory> Categories { get; set; } = new();
        public List<LargeFileItem> LargeFiles { get; set; } = new();
        public List<DuplicateGroup> Duplicates { get; set; } = new();
        public List<DeveloperCacheInfo> DeveloperCaches { get; set; } = new();

        /// <summary>Total bytes that could be freed by cleaning all cleanable categories.</summary>
        public long TotalReclaimableBytes { get; set; }

        /// <summary>Total bytes of large personal files suggested for transfer.</summary>
        public long TotalMovableBytes { get; set; }

        public long TotalDuplicateBytes { get; set; }
    }
}
