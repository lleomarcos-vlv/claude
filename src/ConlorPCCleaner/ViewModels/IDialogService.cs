namespace ConlorPCCleaner.ViewModels
{
    /// <summary>
    /// Abstraction over user-facing dialogs so the view models stay testable and free of direct
    /// UI dependencies. Implemented by the WPF layer (Views/DialogService.cs).
    /// </summary>
    public interface IDialogService
    {
        /// <summary>Shows a yes/no confirmation. Returns true when the user confirms.</summary>
        bool Confirm(string message, string title = "Confirmação");

        /// <summary>Shows an informational message.</summary>
        void Info(string message, string title = "Conlor PC Cleaner");

        /// <summary>Shows a warning message.</summary>
        void Warn(string message, string title = "Atenção");

        /// <summary>Opens a path (file or folder) in Windows Explorer.</summary>
        void OpenInExplorer(string path);

        /// <summary>Opens the settings window modally for the given view model.</summary>
        void OpenSettings(SettingsViewModel viewModel);

        /// <summary>Prompts the user to choose a file path for export. Returns null if cancelled.</summary>
        string? SaveFile(string filter, string defaultFileName);

        /// <summary>Prompts the user to choose a file to import. Returns null if cancelled.</summary>
        string? OpenFile(string filter);

        /// <summary>Prompts the user to pick a folder. Returns null if cancelled.</summary>
        string? PickFolder(string description = "Selecione uma pasta");
    }
}
