using System;
using System.Windows;
using System.Windows.Media;
using ConlorPCCleaner.Models;

namespace ConlorPCCleaner.Themes
{
    /// <summary>
    /// Applies the light or dark colour palette by overriding the brush resources that the
    /// styles in Theme.xaml reference through DynamicResource. Switching themes at runtime
    /// updates the whole UI instantly.
    /// </summary>
    public static class ThemeManager
    {
        public static void Apply(AppTheme theme)
        {
            var res = Application.Current?.Resources;
            if (res == null) return;

            if (theme == AppTheme.Light)
            {
                Set(res, "WindowBackgroundBrush", "#F4F6FB");
                Set(res, "SurfaceBrush", "#FFFFFF");
                Set(res, "SurfaceAltBrush", "#EDF0F7");
                Set(res, "BorderBrush", "#D7DCEA");
                Set(res, "TextBrush", "#1B2138");
                Set(res, "MutedTextBrush", "#5C6685");
                Set(res, "AccentBrush", "#2F6FEB");
                Set(res, "AccentPressedBrush", "#245BC4");
                Set(res, "Accent2Brush", "#12A67B");
                Set(res, "DangerBrush", "#E23B4E");
                Set(res, "SuccessBrush", "#12A67B");
                Set(res, "WarningBrush", "#D98A00");
            }
            else
            {
                Set(res, "WindowBackgroundBrush", "#0F1220");
                Set(res, "SurfaceBrush", "#181C2E");
                Set(res, "SurfaceAltBrush", "#1F2438");
                Set(res, "BorderBrush", "#2A3050");
                Set(res, "TextBrush", "#E7EBF5");
                Set(res, "MutedTextBrush", "#9AA3BD");
                Set(res, "AccentBrush", "#4F8CFF");
                Set(res, "AccentPressedBrush", "#3E73D6");
                Set(res, "Accent2Brush", "#38D39F");
                Set(res, "DangerBrush", "#FF5C6C");
                Set(res, "SuccessBrush", "#38D39F");
                Set(res, "WarningBrush", "#FFC24B");
            }
        }

        private static void Set(ResourceDictionary res, string key, string hex)
        {
            var color = (Color)ColorConverter.ConvertFromString(hex);
            var brush = new SolidColorBrush(color);
            brush.Freeze();
            res[key] = brush;
        }
    }
}
