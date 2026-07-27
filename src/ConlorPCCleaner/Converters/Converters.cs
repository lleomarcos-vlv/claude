using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;
using ConlorPCCleaner.Helpers;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Converters
{
    /// <summary>Formats a byte count (long) as a human-readable string, e.g. "1.2 GB".</summary>
    public sealed class BytesToStringConverter : IValueConverter
    {
        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            return value switch
            {
                long l => ByteFormatter.Format(l),
                int i => ByteFormatter.Format(i),
                double d => ByteFormatter.Format((long)d),
                _ => "0 B"
            };
        }

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
            => throw new NotSupportedException();
    }

    /// <summary>Maps a <see cref="LogLevel"/> to a colour for the real-time log console.</summary>
    public sealed class LogLevelToBrushConverter : IValueConverter
    {
        private static readonly SolidColorBrush Debug = Freeze("#7C86A6");
        private static readonly SolidColorBrush Info = Freeze("#D6DCEC");
        private static readonly SolidColorBrush Success = Freeze("#4ADE9B");
        private static readonly SolidColorBrush Warning = Freeze("#FFC24B");
        private static readonly SolidColorBrush Error = Freeze("#FF6B7A");

        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            return value switch
            {
                LogLevel.Debug => Debug,
                LogLevel.Success => Success,
                LogLevel.Warning => Warning,
                LogLevel.Error => Error,
                _ => Info
            };
        }

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
            => throw new NotSupportedException();

        private static SolidColorBrush Freeze(string hex)
        {
            var b = new SolidColorBrush((Color)ColorConverter.ConvertFromString(hex));
            b.Freeze();
            return b;
        }
    }

    /// <summary>Converts a boolean to Visibility, inverted (true → Collapsed).</summary>
    public sealed class InverseBooleanToVisibilityConverter : IValueConverter
    {
        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
            => (value is bool b && b) ? Visibility.Collapsed : Visibility.Visible;

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
            => value is Visibility v && v == Visibility.Collapsed;
    }

    /// <summary>Inverts a boolean value.</summary>
    public sealed class InverseBooleanConverter : IValueConverter
    {
        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
            => value is bool b ? !b : value;

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
            => value is bool b ? !b : value;
    }
}
