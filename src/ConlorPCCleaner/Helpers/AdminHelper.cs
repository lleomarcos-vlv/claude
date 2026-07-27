using System;
using System.Diagnostics;
using System.Security.Principal;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Helpers
{
    /// <summary>
    /// Detection of administrator rights and automatic self-elevation. The app starts
    /// as the invoking user; when an operation needs elevation we relaunch the same
    /// executable with the "runas" verb, which triggers the standard Windows UAC prompt.
    /// </summary>
    public static class AdminHelper
    {
        /// <summary>Returns true when the current process is running elevated (as Administrator).</summary>
        public static bool IsAdministrator()
        {
            try
            {
                using var identity = WindowsIdentity.GetCurrent();
                var principal = new WindowsPrincipal(identity);
                return principal.IsInRole(WindowsBuiltInRole.Administrator);
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Relaunches the current application elevated. Returns true if a new elevated
        /// instance was started (in which case the caller should shut the current one down).
        /// Returns false if the user cancelled the UAC prompt or elevation failed.
        /// </summary>
        public static bool RelaunchAsAdmin(string? arguments = null)
        {
            if (IsAdministrator())
                return false; // already elevated, nothing to do

            try
            {
                string? exePath = Process.GetCurrentProcess().MainModule?.FileName;
                if (string.IsNullOrEmpty(exePath))
                    return false;

                var startInfo = new ProcessStartInfo
                {
                    FileName = exePath,
                    UseShellExecute = true, // required for the "runas" verb
                    Verb = "runas",
                    Arguments = arguments ?? string.Empty
                };

                Process.Start(startInfo);
                return true;
            }
            catch (System.ComponentModel.Win32Exception)
            {
                // User declined the UAC elevation prompt.
                Logger.Instance.Warning("Elevação cancelada pelo usuário. Continuando sem privilégios de administrador.");
                return false;
            }
            catch (Exception ex)
            {
                Logger.Instance.Error("Falha ao tentar elevar privilégios.", ex);
                return false;
            }
        }
    }
}
