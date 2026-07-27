using System;
using System.Collections.Generic;
using System.Globalization;
using Microsoft.Win32;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Services
{
    /// <summary>
    /// Reads the list of installed programs from the standard registry uninstall keys and
    /// flags large, apparently old installs for the user to review. This tool NEVER uninstalls
    /// anything — it only informs, exactly as required by the safety rules.
    /// </summary>
    public sealed class InstalledProgramsService
    {
        private static readonly string[] UninstallKeys =
        {
            @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
        };

        private const long LargeProgramBytes = 1L * 1024 * 1024 * 1024; // 1 GB
        private static readonly TimeSpan OldInstallAge = TimeSpan.FromDays(180);

        public List<InstalledProgram> GetInstalledPrograms()
        {
            var programs = new Dictionary<string, InstalledProgram>(StringComparer.OrdinalIgnoreCase);

            ReadFromHive(Registry.LocalMachine, UninstallKeys, programs);
            ReadFromHive(Registry.CurrentUser, UninstallKeys, programs);

            var list = new List<InstalledProgram>(programs.Values);
            list.Sort((a, b) => b.EstimatedSizeBytes.CompareTo(a.EstimatedSizeBytes));
            return list;
        }

        private static void ReadFromHive(RegistryKey hive, string[] subKeys,
            Dictionary<string, InstalledProgram> programs)
        {
            foreach (var subKeyPath in subKeys)
            {
                try
                {
                    using var key = hive.OpenSubKey(subKeyPath);
                    if (key == null) continue;

                    foreach (var name in key.GetSubKeyNames())
                    {
                        try
                        {
                            using var app = key.OpenSubKey(name);
                            if (app == null) continue;

                            string? displayName = app.GetValue("DisplayName") as string;
                            if (string.IsNullOrWhiteSpace(displayName)) continue;

                            // Skip system components and updates.
                            if (app.GetValue("SystemComponent") is int sc && sc == 1) continue;
                            if (app.GetValue("ParentKeyName") != null) continue;

                            long sizeBytes = 0;
                            if (app.GetValue("EstimatedSize") is int kb && kb > 0)
                                sizeBytes = (long)kb * 1024;

                            DateTime? installDate = ParseInstallDate(app.GetValue("InstallDate") as string);

                            var program = new InstalledProgram
                            {
                                Name = displayName!,
                                Publisher = app.GetValue("Publisher") as string,
                                Version = app.GetValue("DisplayVersion") as string,
                                EstimatedSizeBytes = sizeBytes,
                                InstallDate = installDate,
                                InstallLocation = app.GetValue("InstallLocation") as string
                            };

                            program.SuggestReview =
                                sizeBytes >= LargeProgramBytes &&
                                installDate.HasValue &&
                                (DateTime.Now - installDate.Value) > OldInstallAge;

                            programs[displayName!] = program;
                        }
                        catch
                        {
                            // ignore individual malformed entries
                        }
                    }
                }
                catch (Exception ex)
                {
                    Logger.Instance.Debug($"Não foi possível ler chave de registro '{subKeyPath}': {ex.Message}");
                }
            }
        }

        private static DateTime? ParseInstallDate(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            if (DateTime.TryParseExact(raw, "yyyyMMdd", CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var dt))
                return dt;
            return null;
        }
    }
}
