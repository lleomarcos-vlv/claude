using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using System.Text.Json;
using ConlorPCCleaner.Helpers;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Services
{
    /// <summary>
    /// Reads SSD/HDD health (SMART) through the built-in Storage PowerShell cmdlets
    /// (Get-PhysicalDisk / Get-StorageReliabilityCounter). This avoids any external
    /// dependency while still surfacing HealthStatus, temperature and wear.
    /// </summary>
    public sealed class SmartHealthService
    {
        public async Task<List<DiskHealth>> GetDiskHealthAsync(CancellationToken ct = default)
        {
            var result = new List<DiskHealth>();

            // Query physical disks and their reliability counters, emitting a JSON array.
            const string command =
                "$disks = Get-PhysicalDisk; " +
                "$out = foreach ($d in $disks) { " +
                "  $rc = $d | Get-StorageReliabilityCounter -ErrorAction SilentlyContinue; " +
                "  [PSCustomObject]@{ " +
                "    DeviceId = $d.DeviceId; Model = $d.FriendlyName; MediaType = [string]$d.MediaType; " +
                "    Health = [string]$d.HealthStatus; Size = $d.Size; " +
                "    Temp = $rc.Temperature; Wear = $rc.Wear; PowerOnHours = $rc.PowerOnHours " +
                "  } " +
                "}; $out | ConvertTo-Json -Compress -Depth 3";

            var pr = await ProcessRunner.RunPowerShellAsync(command, TimeSpan.FromSeconds(45), ct)
                                        .ConfigureAwait(false);

            if (!pr.Success || string.IsNullOrWhiteSpace(pr.StandardOutput))
            {
                Logger.Instance.Warning("Não foi possível obter a saúde do disco (SMART).");
                return result;
            }

            try
            {
                string json = pr.StandardOutput.Trim();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (root.ValueKind == JsonValueKind.Array)
                {
                    foreach (var el in root.EnumerateArray())
                        result.Add(Parse(el));
                }
                else if (root.ValueKind == JsonValueKind.Object)
                {
                    result.Add(Parse(root));
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.Error("Falha ao interpretar dados SMART.", ex);
            }

            return result;
        }

        private static DiskHealth Parse(JsonElement el)
        {
            return new DiskHealth
            {
                DeviceId = GetString(el, "DeviceId"),
                Model = GetString(el, "Model"),
                MediaType = GetString(el, "MediaType"),
                HealthStatus = FallbackHealth(GetString(el, "Health")),
                SizeBytes = GetLong(el, "Size") ?? 0,
                TemperatureCelsius = (int?)GetLong(el, "Temp"),
                WearPercentage = (int?)GetLong(el, "Wear"),
                PowerOnHours = GetLong(el, "PowerOnHours")
            };
        }

        private static string FallbackHealth(string value) =>
            string.IsNullOrWhiteSpace(value) ? "Unknown" : value;

        private static string GetString(JsonElement el, string name)
        {
            if (el.TryGetProperty(name, out var p))
            {
                return p.ValueKind switch
                {
                    JsonValueKind.String => p.GetString() ?? string.Empty,
                    JsonValueKind.Number => p.ToString(),
                    _ => string.Empty
                };
            }
            return string.Empty;
        }

        private static long? GetLong(JsonElement el, string name)
        {
            if (el.TryGetProperty(name, out var p))
            {
                if (p.ValueKind == JsonValueKind.Number && p.TryGetInt64(out var v)) return v;
                if (p.ValueKind == JsonValueKind.String &&
                    long.TryParse(p.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var s))
                    return s;
            }
            return null;
        }
    }
}
