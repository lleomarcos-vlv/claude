using System;
using System.Diagnostics;
using System.IO;
using System.Windows;
using Microsoft.Win32;
using ConlorPCCleaner.Utilities;
using ConlorPCCleaner.ViewModels;

namespace ConlorPCCleaner.Views
{
    /// <summary>WPF implementation of <see cref="IDialogService"/> using standard dialogs.</summary>
    public sealed class DialogService : IDialogService
    {
        private readonly Window _owner;

        public DialogService(Window owner)
        {
            _owner = owner;
        }

        public bool Confirm(string message, string title = "Confirmação")
        {
            var result = MessageBox.Show(_owner, message, title,
                MessageBoxButton.YesNo, MessageBoxImage.Question);
            return result == MessageBoxResult.Yes;
        }

        public void Info(string message, string title = "Conlor PC Cleaner") =>
            MessageBox.Show(_owner, message, title, MessageBoxButton.OK, MessageBoxImage.Information);

        public void Warn(string message, string title = "Atenção") =>
            MessageBox.Show(_owner, message, title, MessageBoxButton.OK, MessageBoxImage.Warning);

        public void OpenInExplorer(string path)
        {
            try
            {
                if (File.Exists(path))
                {
                    // Open the file with its default application (e.g. the HTML report in a browser).
                    Process.Start(new ProcessStartInfo(path) { UseShellExecute = true });
                }
                else if (Directory.Exists(path))
                {
                    Process.Start(new ProcessStartInfo(path) { UseShellExecute = true });
                }
                else
                {
                    Warn($"Caminho não encontrado:\n{path}");
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.Error("Não foi possível abrir o caminho.", ex);
                Warn($"Não foi possível abrir:\n{path}\n\n{ex.Message}");
            }
        }

        public void OpenSettings(SettingsViewModel viewModel)
        {
            var window = new SettingsWindow(viewModel) { Owner = _owner };
            window.ShowDialog();
        }

        public string? SaveFile(string filter, string defaultFileName)
        {
            var dlg = new SaveFileDialog { Filter = filter, FileName = defaultFileName };
            return dlg.ShowDialog(_owner) == true ? dlg.FileName : null;
        }

        public string? OpenFile(string filter)
        {
            var dlg = new OpenFileDialog { Filter = filter, CheckFileExists = true };
            return dlg.ShowDialog(_owner) == true ? dlg.FileName : null;
        }

        public string? PickFolder(string description = "Selecione uma pasta")
        {
            // Microsoft.Win32.OpenFolderDialog is available in .NET 8's WPF.
            var dlg = new OpenFolderDialog { Title = description };
            return dlg.ShowDialog(_owner) == true ? dlg.FolderName : null;
        }
    }
}
