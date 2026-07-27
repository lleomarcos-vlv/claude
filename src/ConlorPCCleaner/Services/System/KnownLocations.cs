using System;
using System.Collections.Generic;
using System.IO;
using ConlorPCCleaner.Models;

namespace ConlorPCCleaner.Services
{
    /// <summary>A concrete directory (plus glob) that a clean target sweeps.</summary>
    public sealed class CleanLocation
    {
        public string Directory { get; }
        public string Pattern { get; }
        public bool Recursive { get; }

        public CleanLocation(string directory, string pattern = "*", bool recursive = true)
        {
            Directory = directory;
            Pattern = pattern;
            Recursive = recursive;
        }
    }

    /// <summary>
    /// A named cleaning target: a group of well-known temp/cache locations that are safe to
    /// wipe. Only files inside these explicit directories are ever removed — the cleaner never
    /// walks arbitrary trees. Some targets require administrator rights.
    /// </summary>
    public sealed class CleanTarget
    {
        public string Id { get; init; } = string.Empty;
        public string Title { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
        public ScanCategoryType Type { get; init; }
        public string Glyph { get; init; } = "🧹";
        public bool RequiresAdmin { get; init; }

        /// <summary>Set for the special Recycle Bin target which is handled via the shell API.</summary>
        public bool IsRecycleBin { get; init; }

        /// <summary>When true this target is included in the quick "Smart Clean".</summary>
        public bool InSmartClean { get; init; }

        public List<CleanLocation> Locations { get; init; } = new();
    }

    /// <summary>
    /// Central catalogue of every temp/cache location the tool knows how to measure and clean.
    /// This is the "map" of what is safe to remove. Adding support for another app's cache is
    /// as simple as adding a new <see cref="CleanTarget"/> here.
    /// </summary>
    public static class KnownLocations
    {
        private static string Local => Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        private static string Roaming => Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        private static string WinDir => Environment.GetFolderPath(Environment.SpecialFolder.Windows);
        private static string UserTemp => Path.GetTempPath();

        /// <summary>Builds the full list of cleanable targets for the current machine/user.</summary>
        public static List<CleanTarget> BuildTargets()
        {
            var targets = new List<CleanTarget>();

            // ---- Temporary files -------------------------------------------------
            targets.Add(new CleanTarget
            {
                Id = "temp",
                Title = "Arquivos temporários",
                Description = "%TEMP%, pasta Temp do usuário e do Windows.",
                Type = ScanCategoryType.TempFiles,
                Glyph = "📄",
                InSmartClean = true,
                Locations = Dedup(new[]
                {
                    UserTemp,
                    Path.Combine(Local, "Temp"),
                    Path.Combine(WinDir, "Temp")
                })
            });

            // ---- Windows prefetch (admin) ---------------------------------------
            targets.Add(new CleanTarget
            {
                Id = "prefetch",
                Title = "Prefetch do Windows",
                Description = "Dados de pré-carregamento em Windows\\Prefetch.",
                Type = ScanCategoryType.WindowsCache,
                Glyph = "⚡",
                RequiresAdmin = true,
                Locations = Dedup(new[] { Path.Combine(WinDir, "Prefetch") })
            });

            // ---- Windows Update cache (admin) -----------------------------------
            targets.Add(new CleanTarget
            {
                Id = "windows-update",
                Title = "Cache do Windows Update",
                Description = "Downloads antigos em SoftwareDistribution\\Download.",
                Type = ScanCategoryType.WindowsUpdate,
                Glyph = "🔄",
                RequiresAdmin = true,
                Locations = Dedup(new[] { Path.Combine(WinDir, "SoftwareDistribution", "Download") })
            });

            // ---- Windows logs (admin) -------------------------------------------
            targets.Add(new CleanTarget
            {
                Id = "windows-logs",
                Title = "Logs antigos do Windows",
                Description = "Arquivos de log em Windows\\Logs e CBS.",
                Type = ScanCategoryType.Logs,
                Glyph = "📚",
                RequiresAdmin = true,
                Locations = Dedup(new[]
                {
                    Path.Combine(WinDir, "Logs", "CBS"),
                    Path.Combine(WinDir, "Logs", "DISM"),
                    Path.Combine(WinDir, "Logs", "waasmedic"),
                })
            });

            // ---- Crash / memory dumps -------------------------------------------
            targets.Add(new CleanTarget
            {
                Id = "crash-dumps",
                Title = "Relatórios de erro e dumps",
                Description = "Crash dumps, minidumps e relatórios do WER.",
                Type = ScanCategoryType.CrashDumps,
                Glyph = "💥",
                Locations = Dedup(new[]
                {
                    Path.Combine(Local, "CrashDumps"),
                    Path.Combine(Local, "Microsoft", "Windows", "WER"),
                    Path.Combine(WinDir, "Minidump")
                })
            });

            // ---- Thumbnails & icon cache ----------------------------------------
            targets.Add(new CleanTarget
            {
                Id = "thumbnails",
                Title = "Miniaturas e cache de ícones",
                Description = "thumbcache_*.db e iconcache_*.db do Explorer.",
                Type = ScanCategoryType.Thumbnails,
                Glyph = "🖼️",
                InSmartClean = true,
                Locations = new List<CleanLocation>
                {
                    new(Path.Combine(Local, "Microsoft", "Windows", "Explorer"), "thumbcache_*.db", recursive: false),
                    new(Path.Combine(Local, "Microsoft", "Windows", "Explorer"), "iconcache_*.db", recursive: false),
                    new(Path.Combine(Local, "IconCache.db"), "*", recursive: false),
                }
            });

            // ---- Font cache ------------------------------------------------------
            targets.Add(new CleanTarget
            {
                Id = "font-cache",
                Title = "Cache de fontes",
                Description = "Cache do serviço de fontes do Windows.",
                Type = ScanCategoryType.FontCache,
                Glyph = "🔤",
                Locations = Dedup(new[]
                {
                    Path.Combine(Local, "FontCache"),
                    Path.Combine(WinDir, "ServiceProfiles", "LocalService", "AppData", "Local", "FontCache")
                })
            });

            // ---- DirectX / shader cache -----------------------------------------
            targets.Add(new CleanTarget
            {
                Id = "directx-cache",
                Title = "Cache do DirectX / shaders",
                Description = "D3DSCache e caches de shader de GPU.",
                Type = ScanCategoryType.DirectXCache,
                Glyph = "🎮",
                Locations = Dedup(new[]
                {
                    Path.Combine(Local, "D3DSCache"),
                    Path.Combine(Local, "NVIDIA", "DXCache"),
                    Path.Combine(Local, "NVIDIA", "GLCache"),
                    Path.Combine(Local, "AMD", "DxCache")
                })
            });

            // ---- Microsoft Store cache ------------------------------------------
            AddPackageCache(targets, "store-cache", "Cache da Microsoft Store",
                "Cache local do aplicativo Microsoft Store.", ScanCategoryType.StoreCache, "🛍️",
                "Microsoft.WindowsStore_");

            // ---- OneDrive cache/logs --------------------------------------------
            targets.Add(new CleanTarget
            {
                Id = "onedrive-cache",
                Title = "Cache do OneDrive",
                Description = "Logs e cache de setup do OneDrive.",
                Type = ScanCategoryType.OneDriveCache,
                Glyph = "☁️",
                Locations = Dedup(new[]
                {
                    Path.Combine(Local, "Microsoft", "OneDrive", "logs"),
                    Path.Combine(Local, "Microsoft", "OneDrive", "setup", "logs")
                })
            });

            // ---- Microsoft Teams cache ------------------------------------------
            var teamsLocations = new List<CleanLocation>();
            foreach (var sub in new[] { "Cache", "GPUCache", "blob_storage", "Code Cache", "tmp", "Service Worker\\CacheStorage" })
                teamsLocations.Add(new CleanLocation(Path.Combine(Roaming, "Microsoft", "Teams", sub)));
            targets.Add(new CleanTarget
            {
                Id = "teams-cache",
                Title = "Cache do Microsoft Teams",
                Description = "Cache do cliente clássico do Teams.",
                Type = ScanCategoryType.TeamsCache,
                Glyph = "👥",
                Locations = teamsLocations
            });

            // ---- Browser caches --------------------------------------------------
            targets.Add(BuildChromiumTarget("chrome-cache", "Cache do Google Chrome", "🌐",
                Path.Combine(Local, "Google", "Chrome", "User Data")));
            targets.Add(BuildChromiumTarget("edge-cache", "Cache do Microsoft Edge", "🌊",
                Path.Combine(Local, "Microsoft", "Edge", "User Data")));
            targets.Add(BuildChromiumTarget("brave-cache", "Cache do Brave", "🦁",
                Path.Combine(Local, "BraveSoftware", "Brave-Browser", "User Data")));
            targets.Add(BuildChromiumTarget("opera-cache", "Cache do Opera", "🅾️",
                Path.Combine(Local, "Opera Software", "Opera Stable")));
            targets.Add(BuildFirefoxTarget());

            // ---- Recycle Bin -----------------------------------------------------
            targets.Add(new CleanTarget
            {
                Id = "recycle-bin",
                Title = "Lixeira",
                Description = "Esvazia a Lixeira de todas as unidades.",
                Type = ScanCategoryType.RecycleBin,
                Glyph = "🗑️",
                InSmartClean = true,
                IsRecycleBin = true
            });

            return targets;
        }

        // ---------------------------------------------------------------------

        private static CleanTarget BuildChromiumTarget(string id, string title, string glyph, string userDataRoot)
        {
            var locations = new List<CleanLocation>();
            bool smart = id is "chrome-cache" or "edge-cache";

            if (Directory.Exists(userDataRoot))
            {
                // Add cache subfolders for every profile (Default, Profile 1, Profile 2, …).
                var profiles = new List<string> { userDataRoot };
                try
                {
                    profiles.Add(Path.Combine(userDataRoot, "Default"));
                    foreach (var dir in Directory.GetDirectories(userDataRoot, "Profile *"))
                        profiles.Add(dir);
                    // Opera stores cache directly under the "Opera Stable" root.
                }
                catch { /* ignore */ }

                foreach (var profile in profiles)
                {
                    foreach (var sub in new[] { "Cache", "Code Cache", "GPUCache", "Service Worker\\CacheStorage" })
                        locations.Add(new CleanLocation(Path.Combine(profile, sub)));
                }
            }

            return new CleanTarget
            {
                Id = id,
                Title = title,
                Description = "Arquivos de cache do navegador (histórico e logins são preservados).",
                Type = ScanCategoryType.BrowserCache,
                Glyph = glyph,
                InSmartClean = smart,
                Locations = locations
            };
        }

        private static CleanTarget BuildFirefoxTarget()
        {
            var locations = new List<CleanLocation>();
            string profilesRoot = Path.Combine(Local, "Mozilla", "Firefox", "Profiles");
            if (Directory.Exists(profilesRoot))
            {
                try
                {
                    foreach (var profile in Directory.GetDirectories(profilesRoot))
                    {
                        locations.Add(new CleanLocation(Path.Combine(profile, "cache2")));
                        locations.Add(new CleanLocation(Path.Combine(profile, "startupCache")));
                    }
                }
                catch { /* ignore */ }
            }

            return new CleanTarget
            {
                Id = "firefox-cache",
                Title = "Cache do Firefox",
                Description = "Cache de navegação do Mozilla Firefox.",
                Type = ScanCategoryType.BrowserCache,
                Glyph = "🦊",
                Locations = locations
            };
        }

        private static void AddPackageCache(List<CleanTarget> targets, string id, string title,
            string description, ScanCategoryType type, string glyph, string packagePrefix)
        {
            var locations = new List<CleanLocation>();
            string packagesRoot = Path.Combine(Local, "Packages");
            if (Directory.Exists(packagesRoot))
            {
                try
                {
                    foreach (var pkg in Directory.GetDirectories(packagesRoot, packagePrefix + "*"))
                    {
                        string localCache = Path.Combine(pkg, "LocalCache");
                        string tempState = Path.Combine(pkg, "TempState");
                        if (Directory.Exists(localCache)) locations.Add(new CleanLocation(localCache));
                        if (Directory.Exists(tempState)) locations.Add(new CleanLocation(tempState));
                    }
                }
                catch { /* ignore */ }
            }

            targets.Add(new CleanTarget
            {
                Id = id,
                Title = title,
                Description = description,
                Type = type,
                Glyph = glyph,
                Locations = locations
            });
        }

        private static List<CleanLocation> Dedup(IEnumerable<string> dirs)
        {
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var list = new List<CleanLocation>();
            foreach (var d in dirs)
            {
                if (string.IsNullOrWhiteSpace(d)) continue;
                if (seen.Add(d)) list.Add(new CleanLocation(d));
            }
            return list;
        }
    }
}
