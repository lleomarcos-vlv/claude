using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using ConlorPCCleaner.Models;

namespace ConlorPCCleaner.Helpers
{
    /// <summary>
    /// Classifies personal files by extension so the transfer engine knows which destination
    /// sub-folder on the external drive they belong in, and whether they are the kind of large
    /// personal content that is worth moving at all.
    /// </summary>
    public static class FileClassifier
    {
        private static readonly HashSet<string> Videos = Set(".mp4", ".mkv", ".avi", ".mov", ".wmv",
            ".flv", ".webm", ".m4v", ".mpg", ".mpeg", ".ts", ".3gp");

        private static readonly HashSet<string> Photos = Set(".jpg", ".jpeg", ".png", ".gif", ".bmp",
            ".tiff", ".tif", ".heic", ".webp", ".raw", ".cr2", ".cr3", ".nef", ".arw", ".dng", ".psd");

        private static readonly HashSet<string> Isos = Set(".iso", ".img", ".vhd", ".vhdx", ".vmdk");

        private static readonly HashSet<string> Archives = Set(".zip", ".rar", ".7z", ".tar", ".gz",
            ".bz2", ".xz", ".cab", ".tgz");

        private static readonly HashSet<string> Installers = Set(".exe", ".msi", ".msix", ".appx", ".appxbundle");

        private static readonly HashSet<string> Documents = Set(".pdf", ".doc", ".docx", ".xls", ".xlsx",
            ".ppt", ".pptx", ".txt", ".rtf", ".odt", ".ods", ".odp", ".csv", ".epub");

        private static readonly HashSet<string> Projects = Set(".sln", ".csproj", ".vcxproj", ".pyproj",
            ".psd", ".ai", ".prproj", ".aep", ".blend", ".fbx", ".obj", ".unity", ".uproject");

        private static readonly HashSet<string> Backups = Set(".bak", ".bkp", ".backup", ".old", ".gho",
            ".wim", ".tib");

        /// <summary>Returns the destination sub-folder for a file, based on its extension.</summary>
        public static string GetTargetFolder(string path)
        {
            string ext = Path.GetExtension(path).ToLowerInvariant();

            if (Videos.Contains(ext)) return TransferFolders.Videos;
            if (Photos.Contains(ext)) return TransferFolders.Photos;
            if (Isos.Contains(ext)) return TransferFolders.Isos;
            if (Archives.Contains(ext)) return TransferFolders.Archives;
            if (Backups.Contains(ext)) return TransferFolders.Backups;
            if (Installers.Contains(ext)) return TransferFolders.Installers;
            if (Projects.Contains(ext)) return TransferFolders.Projects;
            if (Documents.Contains(ext)) return TransferFolders.Documents;

            return TransferFolders.Others;
        }

        /// <summary>
        /// Returns true when the extension represents large personal content that is a sensible
        /// candidate for moving to an external drive (video, photo, iso, archive, installer, …).
        /// The optional <paramref name="extraExtensions"/> come from user settings.
        /// </summary>
        public static bool IsMovablePersonalType(string path, IEnumerable<string>? extraExtensions = null)
        {
            string ext = Path.GetExtension(path).ToLowerInvariant();
            if (string.IsNullOrEmpty(ext)) return false;

            if (Videos.Contains(ext) || Photos.Contains(ext) || Isos.Contains(ext) ||
                Archives.Contains(ext) || Installers.Contains(ext) || Documents.Contains(ext) ||
                Projects.Contains(ext) || Backups.Contains(ext))
                return true;

            if (extraExtensions != null)
            {
                foreach (var e in extraExtensions)
                {
                    string norm = e.StartsWith('.') ? e : "." + e;
                    if (string.Equals(norm, ext, StringComparison.OrdinalIgnoreCase)) return true;
                }
            }

            return false;
        }

        /// <summary>Human-readable category name for reports.</summary>
        public static string GetCategoryName(string path) => GetTargetFolder(path);

        private static HashSet<string> Set(params string[] items) =>
            new(items, StringComparer.OrdinalIgnoreCase);
    }
}
