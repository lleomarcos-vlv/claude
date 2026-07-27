using System;
using System.Collections.Generic;
using System.IO;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Services
{
    /// <summary>
    /// Enumerates mounted drives and classifies them as internal or external. External-drive
    /// detection uses .NET's DriveType plus a check for the drive that hosts Windows (always
    /// internal). This is deliberately dependency-free and works on every Windows edition.
    /// </summary>
    public sealed class DriveService
    {
        private readonly string _systemDriveRoot;

        public DriveService()
        {
            _systemDriveRoot = Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\";
        }

        /// <summary>Returns all ready, fixed/removable drives with capacity information.</summary>
        public List<DriveModel> GetDrives()
        {
            var result = new List<DriveModel>();

            foreach (var drive in DriveInfo.GetDrives())
            {
                try
                {
                    if (!drive.IsReady) continue;
                    if (drive.DriveType is DriveType.CDRom or DriveType.Ram or DriveType.Unknown)
                        continue;

                    var model = new DriveModel
                    {
                        Root = drive.RootDirectory.FullName,
                        Label = SafeLabel(drive),
                        FileSystem = SafeFormat(drive),
                        TotalBytes = drive.TotalSize,
                        FreeBytes = drive.TotalFreeSpace,
                        IsReady = true,
                        Kind = Classify(drive)
                    };

                    result.Add(model);
                }
                catch (Exception ex)
                {
                    Logger.Instance.Warning($"Ignorando unidade não acessível: {ex.Message}");
                }
            }

            return result;
        }

        /// <summary>Returns only the drive that hosts Windows (the primary internal disk).</summary>
        public DriveModel? GetSystemDrive()
        {
            foreach (var d in GetDrives())
            {
                if (string.Equals(d.Root, _systemDriveRoot, StringComparison.OrdinalIgnoreCase))
                    return d;
            }
            return null;
        }

        /// <summary>Returns the drives classified as external/removable.</summary>
        public List<DriveModel> GetExternalDrives()
        {
            var list = new List<DriveModel>();
            foreach (var d in GetDrives())
                if (d.IsExternal) list.Add(d);
            return list;
        }

        private DriveKind Classify(DriveInfo drive)
        {
            // The drive hosting Windows is always internal, regardless of reported type.
            if (string.Equals(drive.RootDirectory.FullName, _systemDriveRoot, StringComparison.OrdinalIgnoreCase))
                return DriveKind.Internal;

            return drive.DriveType switch
            {
                DriveType.Removable => DriveKind.Removable, // USB flash / external SSD often reports Removable
                DriveType.Network => DriveKind.Network,
                DriveType.Fixed => DriveKind.External,      // a second fixed drive that isn't the system drive
                _ => DriveKind.Unknown
            };
        }

        private static string SafeLabel(DriveInfo drive)
        {
            try { return drive.VolumeLabel ?? string.Empty; }
            catch { return string.Empty; }
        }

        private static string SafeFormat(DriveInfo drive)
        {
            try { return drive.DriveFormat ?? string.Empty; }
            catch { return string.Empty; }
        }
    }
}
