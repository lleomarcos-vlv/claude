using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using ConlorPCCleaner.Helpers;
using ConlorPCCleaner.Models;

namespace ConlorPCCleaner.Services
{
    /// <summary>
    /// Measures disk space consumed by developer tools, virtualization and games (Docker,
    /// WSL, Visual Studio, VS Code, Android Studio, Steam, Epic, …). This is purely
    /// informational — nothing here is ever cleaned automatically, because these locations can
    /// contain data the user cares about.
    /// </summary>
    public sealed class DeveloperCacheScanner
    {
        private static string Local => Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        private static string Roaming => Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        private static string Profile => Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

        private sealed record Probe(string Name, string Category, string Path);

        public List<DeveloperCacheInfo> Scan(CancellationToken ct = default)
        {
            var probes = new List<Probe>
            {
                // Containers / virtualization
                new("Docker Desktop", "Contêiner", Path.Combine(Local, "Docker")),
                new("Docker (dados)", "Contêiner", Path.Combine(Roaming, "Docker")),

                // IDEs
                new("Visual Studio", "IDE", Path.Combine(Local, "Microsoft", "VisualStudio")),
                new("VS Code", "IDE", Path.Combine(Roaming, "Code", "Cache")),
                new("VS Code (CachedData)", "IDE", Path.Combine(Roaming, "Code", "CachedData")),
                new("Android Studio", "IDE", Path.Combine(Local, "Google", "AndroidStudio")),
                new("Gradle", "IDE", Path.Combine(Profile, ".gradle", "caches")),
                new("NuGet", "IDE", Path.Combine(Profile, ".nuget", "packages")),
                new("npm", "IDE", Path.Combine(Roaming, "npm-cache")),
                new("JetBrains", "IDE", Path.Combine(Local, "JetBrains")),

                // Games
                new("Steam", "Jogos", Path.Combine(GetProgramFilesX86(), "Steam", "steamapps")),
                new("Epic Games", "Jogos", Path.Combine(GetProgramFiles(), "Epic Games")),
                new("Riot Games", "Jogos", Path.Combine(Local, "Riot Games")),
            };

            var result = new List<DeveloperCacheInfo>();

            foreach (var probe in probes)
            {
                ct.ThrowIfCancellationRequested();
                bool exists = Directory.Exists(probe.Path);
                long size = exists ? FileSystemHelper.GetDirectorySize(probe.Path, ct) : 0;

                // Only surface entries that actually exist and consume meaningful space.
                if (exists && size > 0)
                {
                    result.Add(new DeveloperCacheInfo
                    {
                        Name = probe.Name,
                        Category = probe.Category,
                        Path = probe.Path,
                        SizeBytes = size,
                        Exists = true
                    });
                }
            }

            result.Sort((a, b) => b.SizeBytes.CompareTo(a.SizeBytes));
            return result;
        }

        private static string GetProgramFiles() =>
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);

        private static string GetProgramFilesX86() =>
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
    }
}
