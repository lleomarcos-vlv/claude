using System;
using System.Collections.Generic;

namespace ConlorPCCleaner.Models
{
    /// <summary>Logical destination sub-folders created under Backup_PC on the external drive.</summary>
    public static class TransferFolders
    {
        public const string Root = "Backup_PC";
        public const string Documents = "Documentos";
        public const string Videos = "Vídeos";
        public const string Photos = "Fotos";
        public const string Projects = "Projetos";
        public const string Downloads = "Downloads";
        public const string Isos = "ISOs";
        public const string Archives = "Compactados";
        public const string Backups = "Backup";
        public const string Installers = "Instaladores";
        public const string Others = "Outros";

        public static IEnumerable<string> All => new[]
        {
            Documents, Videos, Photos, Projects, Downloads, Isos, Archives, Backups, Installers, Others
        };
    }

    /// <summary>A file proposed for (or selected for) moving to the external drive.</summary>
    public sealed class TransferCandidate
    {
        public string SourcePath { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public string TargetSubFolder { get; set; } = TransferFolders.Others;
        public string Reason { get; set; } = string.Empty;
        public DateTime LastAccessUtc { get; set; }
        public bool Selected { get; set; } = true;

        public string Name => System.IO.Path.GetFileName(SourcePath);
    }

    /// <summary>One completed move, recorded so it can be undone.</summary>
    public sealed class TransferEntry
    {
        public string SourcePath { get; set; } = string.Empty;
        public string DestinationPath { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public DateTime MovedAtUtc { get; set; }
    }

    /// <summary>
    /// A persisted record of a transfer session. Saved as JSON so a move can be fully undone
    /// (files copied back to their original location) at any later time.
    /// </summary>
    public sealed class TransferManifest
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
        public string ExternalDriveRoot { get; set; } = string.Empty;
        public string BackupRoot { get; set; } = string.Empty;
        public bool Simulated { get; set; }
        public List<TransferEntry> Entries { get; set; } = new();

        public long TotalBytes
        {
            get
            {
                long sum = 0;
                foreach (var e in Entries) sum += e.SizeBytes;
                return sum;
            }
        }
    }

    /// <summary>Aggregate outcome of a transfer run.</summary>
    public sealed class TransferResult
    {
        public DateTime StartedUtc { get; set; }
        public DateTime FinishedUtc { get; set; }
        public TimeSpan Duration => FinishedUtc - StartedUtc;

        public bool Simulated { get; set; }
        public int FilesMoved { get; set; }
        public int FilesFailed { get; set; }
        public long BytesMoved { get; set; }
        public string? ManifestPath { get; set; }
        public string BackupRoot { get; set; } = string.Empty;
    }
}
