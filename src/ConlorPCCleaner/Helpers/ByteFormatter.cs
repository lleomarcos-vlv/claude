using System;
using System.Globalization;

namespace ConlorPCCleaner.Helpers
{
    /// <summary>Human-friendly formatting of byte counts (KB, MB, GB, TB).</summary>
    public static class ByteFormatter
    {
        private static readonly string[] Units = { "B", "KB", "MB", "GB", "TB", "PB" };

        /// <summary>Formats a byte count as e.g. "1.34 GB". Uses base-1024 units.</summary>
        public static string Format(long bytes)
        {
            if (bytes < 0) return "-" + Format(-bytes);
            if (bytes == 0) return "0 B";

            double size = bytes;
            int unit = 0;
            while (size >= 1024 && unit < Units.Length - 1)
            {
                size /= 1024;
                unit++;
            }

            // No decimals for plain bytes; two decimals for larger units.
            string number = unit == 0
                ? size.ToString("0", CultureInfo.InvariantCulture)
                : size.ToString("0.##", CultureInfo.InvariantCulture);

            return $"{number} {Units[unit]}";
        }

        /// <summary>Formats a byte count in gigabytes with one decimal, always in GB.</summary>
        public static string FormatGb(long bytes) =>
            (bytes / 1024d / 1024d / 1024d).ToString("0.0", CultureInfo.InvariantCulture) + " GB";
    }
}
