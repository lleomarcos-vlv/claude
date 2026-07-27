using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Services;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.ViewModels
{
    /// <summary>View model for the Settings window. Edits a working copy of the settings and
    /// only persists them (and applies the schedule) when the user saves.</summary>
    public sealed class SettingsViewModel : ObservableObject
    {
        private readonly SettingsService _settingsService;
        private readonly SchedulerService _scheduler;
        private readonly IDialogService _dialog;

        /// <summary>Raised when the window should close.</summary>
        public event EventHandler? CloseRequested;

        public SettingsViewModel(SettingsService settingsService, SchedulerService scheduler, IDialogService dialog)
        {
            _settingsService = settingsService;
            _scheduler = scheduler;
            _dialog = dialog;

            var s = settingsService.Current;
            _simulationMode = s.SimulationMode;
            _minimumMoveSizeMb = s.MinimumMoveSizeMb;
            _unusedThresholdDays = s.UnusedThresholdDays;
            _preferredExternalDrive = s.PreferredExternalDrive;
            _enableDuplicateDetection = s.EnableDuplicateDetection;
            _compressBeforeTransfer = s.CompressBeforeTransfer;
            _compressThresholdMb = s.CompressThresholdMb;
            _createRestorePoint = s.CreateRestorePoint;
            _scheduleEnabled = s.ScheduleEnabled;
            _scheduleFrequency = string.IsNullOrWhiteSpace(s.ScheduleFrequency) ? "Semanal" : s.ScheduleFrequency;
            _scheduleTime = s.ScheduleTime;

            ProtectedPaths = new ObservableCollection<string>(s.ProtectedPaths);
            MovableExtensions = new ObservableCollection<string>(s.MovableExtensions);

            AddProtectedPathCommand = new RelayCommand(_ => AddProtectedPath());
            RemoveProtectedPathCommand = new RelayCommand(p => { if (p is string s2) ProtectedPaths.Remove(s2); });
            AddExtensionCommand = new RelayCommand(_ => AddExtension());
            RemoveExtensionCommand = new RelayCommand(p => { if (p is string s2) MovableExtensions.Remove(s2); });
            SaveCommand = new AsyncRelayCommand(SaveAsync);
            CancelCommand = new RelayCommand(_ => CloseRequested?.Invoke(this, EventArgs.Empty));
            ExportCommand = new RelayCommand(_ => Export());
            ImportCommand = new RelayCommand(_ => Import());
            OpenLogsFolderCommand = new RelayCommand(_ => _dialog.OpenInExplorer(AppPaths.LogsRoot));
        }

        // ---- editable fields ----
        private bool _simulationMode;
        public bool SimulationMode { get => _simulationMode; set => SetProperty(ref _simulationMode, value); }

        private int _minimumMoveSizeMb;
        public int MinimumMoveSizeMb { get => _minimumMoveSizeMb; set => SetProperty(ref _minimumMoveSizeMb, value); }

        private int _unusedThresholdDays;
        public int UnusedThresholdDays { get => _unusedThresholdDays; set => SetProperty(ref _unusedThresholdDays, value); }

        private string _preferredExternalDrive;
        public string PreferredExternalDrive { get => _preferredExternalDrive; set => SetProperty(ref _preferredExternalDrive, value); }

        private bool _enableDuplicateDetection;
        public bool EnableDuplicateDetection { get => _enableDuplicateDetection; set => SetProperty(ref _enableDuplicateDetection, value); }

        private bool _compressBeforeTransfer;
        public bool CompressBeforeTransfer { get => _compressBeforeTransfer; set => SetProperty(ref _compressBeforeTransfer, value); }

        private int _compressThresholdMb;
        public int CompressThresholdMb { get => _compressThresholdMb; set => SetProperty(ref _compressThresholdMb, value); }

        private bool _createRestorePoint;
        public bool CreateRestorePoint { get => _createRestorePoint; set => SetProperty(ref _createRestorePoint, value); }

        private bool _scheduleEnabled;
        public bool ScheduleEnabled { get => _scheduleEnabled; set => SetProperty(ref _scheduleEnabled, value); }

        private string _scheduleFrequency;
        public string ScheduleFrequency { get => _scheduleFrequency; set => SetProperty(ref _scheduleFrequency, value); }

        private string _scheduleTime;
        public string ScheduleTime { get => _scheduleTime; set => SetProperty(ref _scheduleTime, value); }

        public ObservableCollection<string> Frequencies { get; } = new() { "Diário", "Semanal", "Mensal" };
        public ObservableCollection<string> ProtectedPaths { get; }
        public ObservableCollection<string> MovableExtensions { get; }

        private string _newExtension = string.Empty;
        public string NewExtension { get => _newExtension; set => SetProperty(ref _newExtension, value); }

        // ---- commands ----
        public RelayCommand AddProtectedPathCommand { get; }
        public RelayCommand RemoveProtectedPathCommand { get; }
        public RelayCommand AddExtensionCommand { get; }
        public RelayCommand RemoveExtensionCommand { get; }
        public AsyncRelayCommand SaveCommand { get; }
        public RelayCommand CancelCommand { get; }
        public RelayCommand ExportCommand { get; }
        public RelayCommand ImportCommand { get; }
        public RelayCommand OpenLogsFolderCommand { get; }

        // ---- behaviour ----
        private void AddProtectedPath()
        {
            string? folder = _dialog.PickFolder("Selecione uma pasta que nunca deve ser tocada");
            if (!string.IsNullOrWhiteSpace(folder) && !ProtectedPaths.Contains(folder))
                ProtectedPaths.Add(folder);
        }

        private void AddExtension()
        {
            string ext = NewExtension.Trim();
            if (string.IsNullOrEmpty(ext)) return;
            if (!ext.StartsWith('.')) ext = "." + ext;
            ext = ext.ToLowerInvariant();
            if (!MovableExtensions.Contains(ext)) MovableExtensions.Add(ext);
            NewExtension = string.Empty;
        }

        private AppSettings BuildSettings()
        {
            return new AppSettings
            {
                Theme = _settingsService.Current.Theme, // theme is toggled from the main window
                SimulationMode = SimulationMode,
                MinimumMoveSizeMb = Math.Max(1, MinimumMoveSizeMb),
                UnusedThresholdDays = Math.Max(1, UnusedThresholdDays),
                PreferredExternalDrive = PreferredExternalDrive ?? string.Empty,
                EnableDuplicateDetection = EnableDuplicateDetection,
                CompressBeforeTransfer = CompressBeforeTransfer,
                CompressThresholdMb = Math.Max(1, CompressThresholdMb),
                CreateRestorePoint = CreateRestorePoint,
                ScheduleEnabled = ScheduleEnabled,
                ScheduleFrequency = ScheduleFrequency,
                ScheduleTime = ScheduleTime,
                ProtectedPaths = ProtectedPaths.ToList(),
                MovableExtensions = MovableExtensions.ToList()
            };
        }

        private async Task SaveAsync()
        {
            var settings = BuildSettings();
            _settingsService.Save(settings);

            try { await _scheduler.ApplyAsync(settings); }
            catch (Exception ex) { Logger.Instance.Error("Falha ao aplicar agendamento.", ex); }

            _dialog.Info("Configurações salvas com sucesso.");
            CloseRequested?.Invoke(this, EventArgs.Empty);
        }

        private void Export()
        {
            string? path = _dialog.SaveFile("Configuração JSON (*.json)|*.json", "conlor-config.json");
            if (string.IsNullOrEmpty(path)) return;
            _settingsService.Save(BuildSettings());
            _settingsService.Export(path);
            _dialog.Info($"Configurações exportadas para:\n{path}");
        }

        private void Import()
        {
            string? path = _dialog.OpenFile("Configuração JSON (*.json)|*.json");
            if (string.IsNullOrEmpty(path)) return;
            try
            {
                var imported = _settingsService.Import(path);
                LoadFrom(imported);
                _dialog.Info("Configurações importadas com sucesso.");
            }
            catch (Exception ex)
            {
                _dialog.Warn($"Não foi possível importar: {ex.Message}");
            }
        }

        private void LoadFrom(AppSettings s)
        {
            SimulationMode = s.SimulationMode;
            MinimumMoveSizeMb = s.MinimumMoveSizeMb;
            UnusedThresholdDays = s.UnusedThresholdDays;
            PreferredExternalDrive = s.PreferredExternalDrive;
            EnableDuplicateDetection = s.EnableDuplicateDetection;
            CompressBeforeTransfer = s.CompressBeforeTransfer;
            CompressThresholdMb = s.CompressThresholdMb;
            CreateRestorePoint = s.CreateRestorePoint;
            ScheduleEnabled = s.ScheduleEnabled;
            ScheduleFrequency = s.ScheduleFrequency;
            ScheduleTime = s.ScheduleTime;

            ProtectedPaths.Clear();
            foreach (var p in s.ProtectedPaths) ProtectedPaths.Add(p);
            MovableExtensions.Clear();
            foreach (var e in s.MovableExtensions) MovableExtensions.Add(e);
        }
    }
}
