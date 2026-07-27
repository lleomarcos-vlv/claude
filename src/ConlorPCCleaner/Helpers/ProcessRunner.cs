using System;
using System.Diagnostics;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Helpers
{
    /// <summary>Result of running an external command-line process.</summary>
    public sealed class ProcessResult
    {
        public int ExitCode { get; init; }
        public string StandardOutput { get; init; } = string.Empty;
        public string StandardError { get; init; } = string.Empty;
        public bool TimedOut { get; init; }
        public bool Started { get; init; } = true;
        public bool Success => Started && !TimedOut && ExitCode == 0;
    }

    /// <summary>
    /// Runs external Windows utilities (cmd, powershell, dism, sfc, cleanmgr, ipconfig, …)
    /// with output capture, cancellation and timeout support. All native Windows tooling
    /// that the cleaner relies on is invoked through this single, well-behaved helper.
    /// </summary>
    public static class ProcessRunner
    {
        /// <summary>
        /// Runs an executable and captures its output.
        /// </summary>
        /// <param name="fileName">Executable, e.g. "cmd.exe" or "powershell.exe".</param>
        /// <param name="arguments">Command-line arguments.</param>
        /// <param name="timeout">Maximum time to wait. Use TimeSpan.Zero / null for no timeout.</param>
        /// <param name="elevated">When true, launches via ShellExecute + runas (no output capture).</param>
        public static async Task<ProcessResult> RunAsync(
            string fileName,
            string arguments,
            TimeSpan? timeout = null,
            CancellationToken cancellationToken = default,
            bool elevated = false)
        {
            var psi = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden
            };

            if (elevated)
            {
                // Elevated processes cannot redirect standard streams.
                psi.UseShellExecute = true;
                psi.Verb = "runas";
            }
            else
            {
                psi.UseShellExecute = false;
                psi.RedirectStandardOutput = true;
                psi.RedirectStandardError = true;
                psi.StandardOutputEncoding = Encoding.UTF8;
                psi.StandardErrorEncoding = Encoding.UTF8;
            }

            var stdout = new StringBuilder();
            var stderr = new StringBuilder();

            using var process = new Process { StartInfo = psi, EnableRaisingEvents = true };

            try
            {
                if (!elevated)
                {
                    process.OutputDataReceived += (_, e) => { if (e.Data != null) stdout.AppendLine(e.Data); };
                    process.ErrorDataReceived += (_, e) => { if (e.Data != null) stderr.AppendLine(e.Data); };
                }

                if (!process.Start())
                    return new ProcessResult { Started = false, ExitCode = -1 };

                if (!elevated)
                {
                    process.BeginOutputReadLine();
                    process.BeginErrorReadLine();
                }

                using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                if (timeout.HasValue && timeout.Value > TimeSpan.Zero)
                    linked.CancelAfter(timeout.Value);

                try
                {
                    await process.WaitForExitAsync(linked.Token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    TryKill(process);
                    bool timedOut = !cancellationToken.IsCancellationRequested;
                    return new ProcessResult
                    {
                        ExitCode = -1,
                        StandardOutput = stdout.ToString(),
                        StandardError = stderr.ToString(),
                        TimedOut = timedOut
                    };
                }

                return new ProcessResult
                {
                    ExitCode = process.ExitCode,
                    StandardOutput = stdout.ToString(),
                    StandardError = stderr.ToString()
                };
            }
            catch (Exception ex)
            {
                Logger.Instance.Error($"Falha ao executar '{fileName} {arguments}'.", ex);
                return new ProcessResult { Started = false, ExitCode = -1, StandardError = ex.Message };
            }
        }

        /// <summary>Convenience helper to run a PowerShell command and capture its output.</summary>
        public static Task<ProcessResult> RunPowerShellAsync(
            string command,
            TimeSpan? timeout = null,
            CancellationToken cancellationToken = default)
        {
            // -NoProfile keeps startup fast and deterministic; -NonInteractive avoids prompts.
            string args = $"-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command \"{command.Replace("\"", "\\\"")}\"";
            return RunAsync("powershell.exe", args, timeout, cancellationToken);
        }

        private static void TryKill(Process process)
        {
            try
            {
                if (!process.HasExited)
                    process.Kill(entireProcessTree: true);
            }
            catch
            {
                // ignored
            }
        }
    }
}
