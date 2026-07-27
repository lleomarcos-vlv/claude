using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;

namespace ConlorPCCleaner.Helpers
{
    /// <summary>
    /// Robust, exception-tolerant file-system enumeration helpers. Windows temp and cache
    /// folders are full of locked, in-use and access-denied entries; these helpers skip such
    /// entries gracefully instead of throwing, so a scan or clean never aborts half-way.
    /// </summary>
    public static class FileSystemHelper
    {
        /// <summary>
        /// Enumerates every file under <paramref name="root"/> recursively, silently skipping
        /// folders that cannot be accessed. Honours cancellation.
        /// </summary>
        public static IEnumerable<FileInfo> EnumerateFilesSafe(string root, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(root) || !Directory.Exists(root))
                yield break;

            var pending = new Stack<string>();
            pending.Push(root);

            while (pending.Count > 0)
            {
                ct.ThrowIfCancellationRequested();
                string current = pending.Pop();

                string[] subDirs = Array.Empty<string>();
                try { subDirs = Directory.GetDirectories(current); }
                catch { /* access denied / gone */ }

                foreach (var d in subDirs)
                {
                    // Skip reparse points (junctions / symlinks) to avoid loops and escaping the tree.
                    try
                    {
                        var attr = File.GetAttributes(d);
                        if ((attr & FileAttributes.ReparsePoint) == FileAttributes.ReparsePoint)
                            continue;
                    }
                    catch { continue; }
                    pending.Push(d);
                }

                string[] files = Array.Empty<string>();
                try { files = Directory.GetFiles(current); }
                catch { /* access denied / gone */ }

                foreach (var f in files)
                {
                    FileInfo? info = null;
                    try { info = new FileInfo(f); }
                    catch { }
                    if (info != null) yield return info;
                }
            }
        }

        /// <summary>Computes the total size (bytes) of every accessible file under a folder.</summary>
        public static long GetDirectorySize(string root, CancellationToken ct = default)
        {
            long total = 0;
            foreach (var f in EnumerateFilesSafe(root, ct))
            {
                try { total += f.Length; } catch { }
            }
            return total;
        }

        /// <summary>
        /// Deletes a single file, clearing read-only attributes first. Returns the number of
        /// bytes freed (0 if the file was locked / could not be removed). Never throws.
        /// </summary>
        public static long TryDeleteFile(string path)
        {
            try
            {
                var fi = new FileInfo(path);
                if (!fi.Exists) return 0;
                long size = fi.Length;
                if (fi.IsReadOnly) fi.IsReadOnly = false;
                fi.Delete();
                return size;
            }
            catch
            {
                return 0; // locked / in use / access denied — leave it alone
            }
        }

        /// <summary>Attempts to delete an (ideally empty) directory. Never throws.</summary>
        public static void TryDeleteDirectory(string path, bool recursive = false)
        {
            try
            {
                if (Directory.Exists(path))
                    Directory.Delete(path, recursive);
            }
            catch
            {
                // ignored — locked or protected
            }
        }

        /// <summary>Ensures a directory exists, returning the path for convenience.</summary>
        public static string EnsureDirectory(string path)
        {
            Directory.CreateDirectory(path);
            return path;
        }
    }
}
