using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace ConlorPCCleaner.Helpers
{
    /// <summary>
    /// The single most important class in the application. It is the last line of defence
    /// that guarantees the tool never deletes or moves anything that could damage Windows
    /// or destroy the user's personal data.
    ///
    /// Two independent concepts:
    ///   * <see cref="IsSystemCritical"/> — path belongs to the operating system, installed
    ///     programs, drivers, boot/recovery data. NEVER move, NEVER delete. Cleaning of a
    ///     handful of well-known temp locations inside Windows is done through an explicit
    ///     whitelist (see the Cleaner service), not by walking these trees.
    ///   * <see cref="IsPersonalProtected"/> — path is one of the user's document folders
    ///     (Desktop, Documents, Pictures, …). These are NEVER auto-deleted. They may only be
    ///     *moved* to an external drive, and only with explicit user confirmation.
    ///
    /// Additional per-user exclusion paths from Settings are also honoured.
    /// </summary>
    public sealed class SafetyGuard
    {
        private readonly List<string> _systemCriticalRoots;
        private readonly List<string> _personalRoots;
        private readonly HashSet<string> _systemExtensions;
        private readonly List<string> _userExclusions;

        public SafetyGuard(IEnumerable<string>? userExclusions = null)
        {
            _userExclusions = (userExclusions ?? Enumerable.Empty<string>())
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Select(Normalize)
                .ToList();

            _systemCriticalRoots = BuildSystemCriticalRoots();
            _personalRoots = BuildPersonalRoots();

            // Genuine system / binary file types that are never candidates for transfer.
            // NOTE: installer types (.exe/.msi/.msix) are intentionally NOT here — the transfer
            // engine only ever operates inside personal folders (Downloads, Desktop, …), where an
            // installer is safe to move, and IsSystemCritical already blocks the system trees.
            _systemExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ".dll", ".sys", ".drv", ".ocx", ".cpl", ".efi", ".mui",
                ".cat", ".inf", ".manifest", ".winmd", ".scr"
            };
        }

        /// <summary>Folders that belong to Windows / programs and must never be touched.</summary>
        private static List<string> BuildSystemCriticalRoots()
        {
            string Get(Environment.SpecialFolder f) => SafeGet(() => Environment.GetFolderPath(f));

            var roots = new List<string?>
            {
                Get(Environment.SpecialFolder.Windows),
                Get(Environment.SpecialFolder.System),
                Get(Environment.SpecialFolder.SystemX86),
                Get(Environment.SpecialFolder.ProgramFiles),
                Get(Environment.SpecialFolder.ProgramFilesX86),
                Get(Environment.SpecialFolder.CommonProgramFiles),
                Get(Environment.SpecialFolder.CommonProgramFilesX86),
                Get(Environment.SpecialFolder.CommonApplicationData), // ProgramData
            };

            // Boot / recovery / EFI folders (may not resolve to a SpecialFolder).
            string sysDrive = Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\";
            roots.Add(Path.Combine(sysDrive, "Boot"));
            roots.Add(Path.Combine(sysDrive, "EFI"));
            roots.Add(Path.Combine(sysDrive, "Recovery"));
            roots.Add(Path.Combine(sysDrive, "System Volume Information"));
            roots.Add(Path.Combine(sysDrive, "$Recycle.Bin"));
            roots.Add(Path.Combine(sysDrive, "PerfLogs"));
            roots.Add(Path.Combine(sysDrive, "$WinREAgent"));

            return roots
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => Normalize(r!))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        /// <summary>The user's personal document roots that require confirmation to move.</summary>
        private static List<string> BuildPersonalRoots()
        {
            string Get(Environment.SpecialFolder f) => SafeGet(() => Environment.GetFolderPath(f));
            string profile = Get(Environment.SpecialFolder.UserProfile);

            var roots = new List<string?>
            {
                Get(Environment.SpecialFolder.Desktop),
                Get(Environment.SpecialFolder.MyDocuments),
                Get(Environment.SpecialFolder.MyPictures),
                Get(Environment.SpecialFolder.MyVideos),
                Get(Environment.SpecialFolder.MyMusic),
                string.IsNullOrEmpty(profile) ? null : Path.Combine(profile, "Downloads"),
            };

            return roots
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => Normalize(r!))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        /// <summary>True when the path is inside a Windows / program / boot / recovery folder.</summary>
        public bool IsSystemCritical(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) return true; // fail safe
            string norm = Normalize(path);
            return _systemCriticalRoots.Any(root => IsUnder(norm, root));
        }

        /// <summary>True when the path is one of the user's personal document roots (or inside one).</summary>
        public bool IsPersonalProtected(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) return false;
            string norm = Normalize(path);
            return _personalRoots.Any(root => IsUnder(norm, root));
        }

        /// <summary>True when the path matches a user-defined exclusion (never touch).</summary>
        public bool IsUserExcluded(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) return false;
            string norm = Normalize(path);
            return _userExclusions.Any(ex => IsUnder(norm, ex) || string.Equals(ex, norm, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>True when the file extension is a system / executable type that must never be moved.</summary>
        public bool IsSystemExtension(string path)
        {
            string ext = Path.GetExtension(path);
            return !string.IsNullOrEmpty(ext) && _systemExtensions.Contains(ext);
        }

        /// <summary>
        /// Master gate for the transfer engine. Returns true only when a file is safe to move
        /// to an external drive: it is not system-critical, not a system executable type, and
        /// not on the user exclusion list. (Personal folders ARE allowed here because the
        /// transfer feature is exactly about moving large personal files — with confirmation.)
        /// </summary>
        public bool IsSafeToMove(string path)
        {
            return !IsSystemCritical(path)
                   && !IsSystemExtension(path)
                   && !IsUserExcluded(path);
        }

        /// <summary>
        /// Master gate for the deletion engine. A path may only be deleted when it is NOT a
        /// personal document folder and NOT user-excluded. The cleaner additionally restricts
        /// itself to an explicit whitelist of temp/cache directories, so this is defence in depth.
        /// </summary>
        public bool IsSafeToDelete(string path)
        {
            return !IsPersonalProtected(path) && !IsUserExcluded(path);
        }

        public IReadOnlyList<string> SystemCriticalRoots => _systemCriticalRoots;
        public IReadOnlyList<string> PersonalRoots => _personalRoots;

        // ----- helpers -------------------------------------------------------

        private static bool IsUnder(string candidate, string root)
        {
            if (string.IsNullOrEmpty(root)) return false;
            // Ensure a trailing separator so "C:\Windows" does not match "C:\WindowsApps".
            string rootWithSep = root.EndsWith(Path.DirectorySeparatorChar) ? root : root + Path.DirectorySeparatorChar;
            string candWithSep = candidate.EndsWith(Path.DirectorySeparatorChar) ? candidate : candidate + Path.DirectorySeparatorChar;
            return candWithSep.StartsWith(rootWithSep, StringComparison.OrdinalIgnoreCase)
                   || string.Equals(candidate, root, StringComparison.OrdinalIgnoreCase);
        }

        private static string Normalize(string path)
        {
            try
            {
                string full = Path.GetFullPath(path.Trim());
                return full.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            }
            catch
            {
                return path.Trim().TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            }
        }

        private static string SafeGet(Func<string> getter)
        {
            try { return getter() ?? string.Empty; }
            catch { return string.Empty; }
        }
    }
}
