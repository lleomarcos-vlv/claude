using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Threading;
using ConlorPCCleaner.Helpers;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Services
{
    /// <summary>
    /// Finds duplicate files by content. To stay fast on large drives it first groups files by
    /// size (files with unique sizes cannot be duplicates), then computes SHA-256 only for the
    /// remaining candidates. Duplicates are only ever *reported* — removal always requires the
    /// user's explicit confirmation elsewhere.
    /// </summary>
    public sealed class DuplicateFinder
    {
        private const long MinDuplicateSize = 1 * 1024 * 1024; // ignore anything under 1 MB

        /// <summary>
        /// Scans the given root folders and returns groups of identical files.
        /// </summary>
        public List<DuplicateGroup> Find(
            IEnumerable<string> roots,
            IProgress<string>? progress = null,
            CancellationToken ct = default)
        {
            var bySize = new Dictionary<long, List<string>>();

            foreach (var root in roots)
            {
                if (string.IsNullOrWhiteSpace(root) || !Directory.Exists(root)) continue;
                foreach (var file in FileSystemHelper.EnumerateFilesSafe(root, ct))
                {
                    ct.ThrowIfCancellationRequested();
                    if (file.Length < MinDuplicateSize) continue;
                    if (!bySize.TryGetValue(file.Length, out var list))
                    {
                        list = new List<string>();
                        bySize[file.Length] = list;
                    }
                    list.Add(file.FullName);
                }
            }

            var groups = new List<DuplicateGroup>();

            foreach (var kvp in bySize)
            {
                ct.ThrowIfCancellationRequested();
                if (kvp.Value.Count < 2) continue; // unique size => cannot be a duplicate

                progress?.Report($"Verificando {kvp.Value.Count} arquivos de {ByteFormatter.Format(kvp.Key)}...");

                var byHash = new Dictionary<string, List<string>>();
                foreach (var path in kvp.Value)
                {
                    ct.ThrowIfCancellationRequested();
                    string? hash = ComputeHash(path);
                    if (hash == null) continue;
                    if (!byHash.TryGetValue(hash, out var list))
                    {
                        list = new List<string>();
                        byHash[hash] = list;
                    }
                    list.Add(path);
                }

                foreach (var hg in byHash)
                {
                    if (hg.Value.Count < 2) continue;
                    groups.Add(new DuplicateGroup
                    {
                        Hash = hg.Key,
                        SizeBytesEach = kvp.Key,
                        Paths = hg.Value
                    });
                }
            }

            groups.Sort((a, b) => b.ReclaimableBytes.CompareTo(a.ReclaimableBytes));
            return groups;
        }

        private static string? ComputeHash(string path)
        {
            try
            {
                using var stream = File.OpenRead(path);
                using var sha = SHA256.Create();
                byte[] hash = sha.ComputeHash(stream);
                return Convert.ToHexString(hash);
            }
            catch (Exception ex)
            {
                Logger.Instance.Debug($"Não foi possível ler '{path}' para hash: {ex.Message}");
                return null;
            }
        }
    }
}
