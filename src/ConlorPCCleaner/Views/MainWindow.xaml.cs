using System.Collections.Specialized;
using System.Windows;
using ConlorPCCleaner.Services;
using ConlorPCCleaner.ViewModels;

namespace ConlorPCCleaner.Views
{
    /// <summary>Main dashboard window. Wires the view model, dialog service and log auto-scroll.</summary>
    public partial class MainWindow : Window
    {
        private readonly MainViewModel _viewModel;

        public MainWindow(SettingsService settingsService)
        {
            InitializeComponent();

            var dialog = new DialogService(this);
            _viewModel = new MainViewModel(settingsService, dialog);
            DataContext = _viewModel;

            // Auto-scroll the log console to the newest entry.
            _viewModel.Logs.CollectionChanged += OnLogsChanged;
        }

        private void OnLogsChanged(object? sender, NotifyCollectionChangedEventArgs e)
        {
            if (LogList.Items.Count > 0)
                LogList.ScrollIntoView(LogList.Items[LogList.Items.Count - 1]);
        }

        private void SelectAllCategories_Click(object sender, RoutedEventArgs e)
        {
            foreach (var c in _viewModel.Categories)
                if (c.IsCleanable) c.Selected = true;
        }

        private void DeselectAllCategories_Click(object sender, RoutedEventArgs e)
        {
            foreach (var c in _viewModel.Categories)
                c.Selected = false;
        }

        private void SelectAllFiles_Click(object sender, RoutedEventArgs e)
        {
            foreach (var f in _viewModel.LargeFiles)
                f.Selected = true;
        }

        private void DeselectAllFiles_Click(object sender, RoutedEventArgs e)
        {
            foreach (var f in _viewModel.LargeFiles)
                f.Selected = false;
        }
    }
}
