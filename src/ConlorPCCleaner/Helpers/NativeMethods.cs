using System;
using System.Runtime.InteropServices;

namespace ConlorPCCleaner.Helpers
{
    /// <summary>
    /// P/Invoke declarations for the small number of Win32 shell APIs used by the tool
    /// (querying and emptying the Recycle Bin).
    /// </summary>
    internal static class NativeMethods
    {
        [StructLayout(LayoutKind.Sequential, Pack = 0)]
        internal struct SHQUERYRBINFO
        {
            public int cbSize;
            public long i64Size;
            public long i64NumItems;
        }

        // Flags for SHEmptyRecycleBin
        internal const int SHERB_NOCONFIRMATION = 0x00000001;
        internal const int SHERB_NOPROGRESSUI = 0x00000002;
        internal const int SHERB_NOSOUND = 0x00000004;

        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
        internal static extern int SHQueryRecycleBin(string? pszRootPath, ref SHQUERYRBINFO pSHQueryRBInfo);

        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
        internal static extern int SHEmptyRecycleBin(IntPtr hwnd, string? pszRootPath, uint dwFlags);

        /// <summary>Returns the total size (bytes) of the Recycle Bin across all drives, or 0.</summary>
        public static long GetRecycleBinSize()
        {
            try
            {
                var info = new SHQUERYRBINFO();
                info.cbSize = Marshal.SizeOf(typeof(SHQUERYRBINFO));
                int hr = SHQueryRecycleBin(null, ref info);
                return hr == 0 ? info.i64Size : 0;
            }
            catch
            {
                return 0;
            }
        }

        /// <summary>Returns the number of items in the Recycle Bin across all drives, or 0.</summary>
        public static long GetRecycleBinItemCount()
        {
            try
            {
                var info = new SHQUERYRBINFO();
                info.cbSize = Marshal.SizeOf(typeof(SHQUERYRBINFO));
                int hr = SHQueryRecycleBin(null, ref info);
                return hr == 0 ? info.i64NumItems : 0;
            }
            catch
            {
                return 0;
            }
        }

        /// <summary>Empties the Recycle Bin with no confirmation UI. Returns true on success.</summary>
        public static bool EmptyRecycleBin()
        {
            try
            {
                uint flags = SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI | SHERB_NOSOUND;
                int hr = SHEmptyRecycleBin(IntPtr.Zero, null, flags);
                return hr == 0;
            }
            catch
            {
                return false;
            }
        }
    }
}
