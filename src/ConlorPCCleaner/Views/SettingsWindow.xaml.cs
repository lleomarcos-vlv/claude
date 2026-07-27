using System;
using System.Windows;
using ConlorPCCleaner.ViewModels;

namespace ConlorPCCleaner.Views
{
    /// <summary>Modal settings window bound to a <see cref="SettingsViewModel"/>.</summary>
    public partial class SettingsWindow : Window
    {
        public SettingsWindow(SettingsViewModel viewModel)
        {
            InitializeComponent();
            DataContext = viewModel;
            viewModel.CloseRequested += OnCloseRequested;
        }

        private void OnCloseRequested(object? sender, EventArgs e)
        {
            if (DataContext is SettingsViewModel vm)
                vm.CloseRequested -= OnCloseRequested;
            Close();
        }
    }
}
