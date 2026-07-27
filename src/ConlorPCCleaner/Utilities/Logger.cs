using System;
using System.Collections.Concurrent;
using System.IO;
using System.Text;

namespace ConlorPCCleaner.Utilities
{
    /// <summary>Severity of a log message, used for colouring in the UI.</summary>
    public enum LogLevel
    {
        Debug,
        Info,
        Success,
        Warning,
        Error
    }

    /// <summary>A single log line, exposed to the UI for real-time display.</summary>
    public sealed class LogEntry
    {
        public DateTime Timestamp { get; }
        public LogLevel Level { get; }
        public string Message { get; }

        public LogEntry(LogLevel level, string message)
        {
            Timestamp = DateTime.Now;
            Level = level;
            Message = message;
        }

        public string Formatted => $"[{Timestamp:HH:mm:ss}] {LevelTag,-8} {Message}";

        private string LevelTag => Level switch
        {
            LogLevel.Debug => "DEBUG",
            LogLevel.Info => "INFO",
            LogLevel.Success => "OK",
            LogLevel.Warning => "WARN",
            LogLevel.Error => "ERROR",
            _ => "INFO"
        };
    }

    /// <summary>
    /// Thread-safe application logger. Every message is written to a dated log file
    /// under &lt;AppData&gt;\ConlorPCCleaner\Logs and simultaneously raised as an event so the
    /// UI can show logs in real time. This is a lightweight singleton.
    /// </summary>
    public sealed class Logger
    {
        private static readonly Lazy<Logger> _instance = new(() => new Logger());
        public static Logger Instance => _instance.Value;

        private readonly object _fileLock = new();
        private readonly string _logDirectory;
        private readonly string _logFilePath;

        /// <summary>Raised on every log message (marshal to UI thread in the handler).</summary>
        public event EventHandler<LogEntry>? MessageLogged;

        public string LogDirectory => _logDirectory;
        public string CurrentLogFile => _logFilePath;

        private Logger()
        {
            _logDirectory = Path.Combine(AppPaths.DataRoot, "Logs");
            Directory.CreateDirectory(_logDirectory);
            _logFilePath = Path.Combine(_logDirectory, $"conlor-{DateTime.Now:yyyy-MM-dd}.log");
        }

        public void Debug(string message) => Write(LogLevel.Debug, message);
        public void Info(string message) => Write(LogLevel.Info, message);
        public void Success(string message) => Write(LogLevel.Success, message);
        public void Warning(string message) => Write(LogLevel.Warning, message);
        public void Error(string message) => Write(LogLevel.Error, message);

        public void Error(string message, Exception ex) =>
            Write(LogLevel.Error, $"{message} :: {ex.GetType().Name}: {ex.Message}");

        public void Write(LogLevel level, string message)
        {
            var entry = new LogEntry(level, message);
            try
            {
                lock (_fileLock)
                {
                    File.AppendAllText(_logFilePath, entry.Formatted + Environment.NewLine, Encoding.UTF8);
                }
            }
            catch
            {
                // Never let logging failures crash the app.
            }

            MessageLogged?.Invoke(this, entry);
        }
    }
}
