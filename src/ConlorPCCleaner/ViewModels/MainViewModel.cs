using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using ConlorPCCleaner.Helpers;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Services;
using ConlorPCCleaner.Themes;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.ViewModels
{
    /// <summary>
    /// The dashboard view model. Orchestrates analysis, cleaning, transfer, backup/restore and
    /// reporting, and exposes everything the main window binds to. All long operations run off
    /// the UI thread and stream progress + logs back to the UI.
    /// </summary>
    public sealed class MainViewModel : ObservableObject
    {
        private readonly SettingsService _settingsService;
        private readonly IDialogService _dialog;
        private readonly DriveService _driveService = new();
        private readonly SmartHealthService _smartService = new();
        private readonly BackupService _backupService = new();
        private readonly ReportService _reportService = new();
        private readonly SchedulerService _scheduler = new();

        private AppSettings _settings;
        private SafetyGuard _guard;
        private CancellationTokenSource? _cts;

        public MainViewModel(SettingsService settingsService, IDialogService dialog)
        {
            _settingsService = settingsService;
            _dialog = dialog;
            _settings = settingsService.Current;
            _guard = new SafetyGuard(_settings.ProtectedPaths);

            _isDarkTheme = _settings.Theme == AppTheme.Dark;
            _simulationMode = _settings.SimulationMode;
            IsAdministrator = AdminHelper.IsAdministrator();

            // Route every log message into the on-screen console (thread-safe).
            Logger.Instance.MessageLogged += OnLogMessage;

            AnalyzeCommand = new AsyncRelayCommand(AnalyzeAsync, () => !IsBusy);
            SmartCleanCommand = new AsyncRelayCommand(SmartCleanAsync, () => !IsBusy);
            TransferCommand = new AsyncRelayCommand(TransferAsync, () => !IsBusy);
            FullCleanCommand = new AsyncRelayCommand(FullCleanAsync, () => !IsBusy);
            RestoreCommand = new AsyncRelayCommand(RestoreAsync, () => !IsBusy);
            RefreshDrivesCommand = new AsyncRelayCommand(() => RefreshDrivesAsync(), () => !IsBusy);
            SettingsCommand = new RelayCommand(_ => OpenSettings(), _ => !IsBusy);
            CancelCommand = new RelayCommand(_ => Cancel(), _ => IsBusy);
            ToggleThemeCommand = new RelayCommand(_ => ToggleTheme());
            ElevateCommand = new RelayCommand(_ => Elevate(), _ => !IsAdministrator);
            OpenLastReportCommand = new RelayCommand(_ => OpenLastReport(), _ => !string.IsNullOrEmpty(LastReportHtml));
            OpenReportsFolderCommand = new RelayCommand(_ => _dialog.OpenInExplorer(AppPaths.ReportsRoot));

            _ = RefreshDrivesAsync();
        }

        // ===================== Bound collections =====================
        public ObservableCollection<DriveModel> ExternalDrives { get; } = new();
        public ObservableCollection<ScanCategory> Categories { get; } = new();
        public ObservableCollection<LargeFileItem> LargeFiles { get; } = new();
        public ObservableCollection<DuplicateGroup> Duplicates { get; } = new();
        public ObservableCollection<DeveloperCacheInfo> DeveloperCaches { get; } = new();
        public ObservableCollection<DiskHealth> DiskHealth { get; } = new();
        public ObservableCollection<LogEntry> Logs { get; } = new();

        // ===================== Commands =====================
        public AsyncRelayCommand AnalyzeCommand { get; }
        public AsyncRelayCommand SmartCleanCommand { get; }
        public AsyncRelayCommand TransferCommand { get; }
        public AsyncRelayCommand FullCleanCommand { get; }
        public AsyncRelayCommand RestoreCommand { get; }
        public AsyncRelayCommand RefreshDrivesCommand { get; }
        public RelayCommand SettingsCommand { get; }
        public RelayCommand CancelCommand { get; }
        public RelayCommand ToggleThemeCommand { get; }
        public RelayCommand ElevateCommand { get; }
        public RelayCommand OpenLastReportCommand { get; }
        public RelayCommand OpenReportsFolderCommand { get; }

        // ===================== State =====================
        private DriveModel? _systemDrive;
        public DriveModel? SystemDrive
        {
            get => _systemDrive;
            private set => SetProperty(ref _systemDrive, value);
        }

        private DriveModel? _selectedExternalDrive;
        public DriveModel? SelectedExternalDrive
        {
            get => _selectedExternalDrive;
            set => SetProperty(ref _selectedExternalDrive, value);
        }

        private bool _isBusy;
        public bool IsBusy
        {
            get => _isBusy;
            private set
            {
                if (SetProperty(ref _isBusy, value))
                {
                    OnPropertyChanged(nameof(IsIdle));
                    System.Windows.Input.CommandManager.InvalidateRequerySuggested();
                }
            }
        }
        public bool IsIdle => !_isBusy;

        private double _progress;
        public double Progress { get => _progress; private set => SetProperty(ref _progress, value); }

        private string _statusText = "Pronto. Clique em \"Analisar PC\" para começar.";
        public string StatusText { get => _statusText; private set => SetProperty(ref _statusText, value); }

        public bool IsAdministrator { get; }
        public bool ShowAdminBanner => !IsAdministrator;

        private bool _simulationMode;
        public bool SimulationMode
        {
            get => _simulationMode;
            set
            {
                if (SetProperty(ref _simulationMode, value))
                {
                    _settings.SimulationMode = value;
                    _settingsService.Save(_settings);
                    StatusText = value
                        ? "Modo Simulação ATIVADO — nada será apagado ou movido."
                        : "Modo Simulação desativado.";
                }
            }
        }

        private bool _isDarkTheme;
        public bool IsDarkTheme
        {
            get => _isDarkTheme;
            set
            {
                if (SetProperty(ref _isDarkTheme, value))
                {
                    var theme = value ? AppTheme.Dark : AppTheme.Light;
                    ThemeManager.Apply(theme);
                    _settings.Theme = theme;
                    _settingsService.Save(_settings);
                }
            }
        }

        // ---- Summary figures ----
        private long _reclaimableBytes;
        public long ReclaimableBytes { get => _reclaimableBytes; private set { if (SetProperty(ref _reclaimableBytes, value)) OnPropertyChanged(nameof(ReclaimableText)); } }
        public string ReclaimableText => ByteFormatter.Format(_reclaimableBytes);

        private long _selectedReclaimableBytes;
        public long SelectedReclaimableBytes { get => _selectedReclaimableBytes; private set { if (SetProperty(ref _selectedReclaimableBytes, value)) OnPropertyChanged(nameof(SelectedReclaimableText)); } }
        public string SelectedReclaimableText => ByteFormatter.Format(_selectedReclaimableBytes);

        private long _movableBytes;
        public long MovableBytes { get => _movableBytes; private set { if (SetProperty(ref _movableBytes, value)) OnPropertyChanged(nameof(MovableText)); } }
        public string MovableText => ByteFormatter.Format(_movableBytes);

        private long _duplicateBytes;
        public long DuplicateBytes { get => _duplicateBytes; private set { if (SetProperty(ref _duplicateBytes, value)) OnPropertyChanged(nameof(DuplicateText)); } }
        public string DuplicateText => ByteFormatter.Format(_duplicateBytes);

        private string? _lastReportHtml;
        public string? LastReportHtml { get => _lastReportHtml; private set => SetProperty(ref _lastReportHtml, value); }

        public ScanResult? LastScan { get; private set; }

        private List<InstalledProgram> _reviewablePrograms = new();

        // ===================== Operations =====================

        private async Task AnalyzeAsync()
        {
            await RunOperationAsync("Análise", async (log, progress, ct) =>
            {
                await RefreshDrivesAsync();
                ClearResults();

                var analyzer = new SystemAnalyzer(_guard, _settings);
                var scan = await analyzer.AnalyzeAsync(log, progress, ct).ConfigureAwait(true);
                LastScan = scan;

                foreach (var c in scan.Categories.Where(c => c.TotalBytes > 0 || c.IsCleanable))
                {
                    c.PropertyChanged += OnCategorySelectionChanged;
                    Categories.Add(c);
                }
                foreach (var f in scan.LargeFiles.Take(500)) LargeFiles.Add(f);
                foreach (var d in scan.Duplicates.Take(200)) Duplicates.Add(d);
                foreach (var dc in scan.DeveloperCaches) DeveloperCaches.Add(dc);

                ReclaimableBytes = scan.TotalReclaimableBytes;
                MovableBytes = scan.TotalMovableBytes;
                DuplicateBytes = scan.TotalDuplicateBytes;
                RecomputeSelectedReclaimable();

                // Disk health (SMART) in the background — non-fatal if unavailable.
                try
                {
                    var health = await _smartService.GetDiskHealthAsync(ct).ConfigureAwait(true);
                    DiskHealth.Clear();
                    foreach (var h in health) DiskHealth.Add(h);
                }
                catch (Exception ex) { Logger.Instance.Debug($"SMART indisponível: {ex.Message}"); }

                // Rarely-used large programs (informative only — never uninstalls anything).
                try
                {
                    var programs = await Task.Run(() => new InstalledProgramsService().GetInstalledPrograms(), ct)
                                             .ConfigureAwait(true);
                    _reviewablePrograms = programs.Where(p => p.SuggestReview).ToList();
                    if (_reviewablePrograms.Count > 0)
                        Logger.Instance.Info($"{_reviewablePrograms.Count} programa(s) grande(s) e antigo(s) podem ser revisados para desinstalação.");
                }
                catch (Exception ex) { Logger.Instance.Debug($"Lista de programas indisponível: {ex.Message}"); }

                StatusText = $"Análise concluída: {ByteFormatter.Format(scan.TotalReclaimableBytes)} recuperáveis, " +
                             $"{ByteFormatter.Format(scan.TotalMovableBytes)} podem ir para o HD externo.";
            });
        }

        private async Task SmartCleanAsync()
        {
            if (LastScan == null)
            {
                Logger.Instance.Info("Nenhuma análise ainda — executando análise antes da limpeza.");
                await AnalyzeAsync();
                if (LastScan == null) return;
            }

            var ids = Categories.Where(c => c.IsCleanable && c.Selected).Select(c => c.Id).ToList();
            if (ids.Count == 0)
            {
                _dialog.Info("Nenhuma categoria selecionada para limpeza.");
                return;
            }

            await RunOperationAsync("Limpeza Inteligente", async (log, progress, ct) =>
            {
                var cleaner = new SystemCleaner(_guard);
                var result = await cleaner.CleanAsync(ids, runMaintenance: false, SimulationMode, log, progress, ct)
                                          .ConfigureAwait(true);
                await RefreshDrivesAsync();
                FinishCleaning("Limpeza Inteligente", result);
            });
        }

        private async Task FullCleanAsync()
        {
            string extra = IsAdministrator
                ? "Serão executados cleanmgr, DISM e SFC — isso pode levar vários minutos."
                : "Algumas etapas exigem administrador e serão ignoradas. Reinicie como administrador para a limpeza completa.";

            if (!SimulationMode &&
                !_dialog.Confirm($"Executar a Limpeza Completa?\n\n{extra}\n\nSomente arquivos temporários e de cache serão removidos. Seus arquivos pessoais NÃO serão tocados.",
                    "Limpeza Completa"))
                return;

            if (LastScan == null) await AnalyzeAsync();

            var ids = (LastScan?.Categories ?? new List<ScanCategory>())
                .Where(c => c.IsCleanable).Select(c => c.Id).ToList();
            if (ids.Count == 0)
                ids = KnownLocations.BuildTargets().Select(t => t.Id).ToList();

            await RunOperationAsync("Limpeza Completa", async (log, progress, ct) =>
            {
                if (_settings.CreateRestorePoint && IsAdministrator && !SimulationMode)
                    await _backupService.CreateRestorePointAsync("Conlor PC Cleaner - Limpeza Completa", ct);

                var cleaner = new SystemCleaner(_guard);
                var result = await cleaner.CleanAsync(ids, runMaintenance: true, SimulationMode, log, progress, ct)
                                          .ConfigureAwait(true);
                await RefreshDrivesAsync();
                FinishCleaning("Limpeza Completa", result);
            });
        }

        private async Task TransferAsync()
        {
            if (SelectedExternalDrive == null)
            {
                _dialog.Warn("Conecte e selecione um HD externo antes de transferir arquivos.");
                return;
            }

            if (LastScan == null)
            {
                await AnalyzeAsync();
                if (LastScan == null) return;
            }

            var selected = LargeFiles.Where(f => f.Selected).ToList();
            if (selected.Count == 0)
            {
                _dialog.Info("Nenhum arquivo grande selecionado para transferência.");
                return;
            }

            long totalBytes = selected.Sum(f => f.SizeBytes);
            if (SelectedExternalDrive.FreeBytes < totalBytes)
            {
                _dialog.Warn($"Espaço insuficiente no HD externo.\n\nNecessário: {ByteFormatter.Format(totalBytes)}\n" +
                             $"Disponível: {ByteFormatter.Format(SelectedExternalDrive.FreeBytes)}");
                return;
            }

            if (!SimulationMode &&
                !_dialog.Confirm($"Mover {selected.Count} arquivo(s) ({ByteFormatter.Format(totalBytes)}) para " +
                                 $"{SelectedExternalDrive.Letter}\\{TransferFolders.Root}?\n\n" +
                                 "Os arquivos serão MOVIDOS (não copiados) e você poderá desfazer depois com \"Restaurar Backup\".",
                    "Transferir para HD externo"))
                return;

            await RunOperationAsync("Transferência", async (log, progress, ct) =>
            {
                if (_settings.CreateRestorePoint && IsAdministrator && !SimulationMode)
                    await _backupService.CreateRestorePointAsync("Conlor PC Cleaner - Transferência", ct);

                var transfer = new FileTransferService(_guard, _backupService, _settings);
                var candidates = selected.Select(f => new TransferCandidate
                {
                    SourcePath = f.Path,
                    SizeBytes = f.SizeBytes,
                    TargetSubFolder = f.SuggestedCategory,
                    Reason = f.Reason,
                    LastAccessUtc = f.LastAccessUtc,
                    Selected = true
                });

                var result = await transfer.TransferAsync(candidates, SelectedExternalDrive.Root,
                    SimulationMode, log, progress, ct).ConfigureAwait(true);

                await RefreshDrivesAsync();
                FinishTransfer(result, selected);
            });
        }

        private async Task RestoreAsync()
        {
            var latest = _backupService.GetLatestManifest();
            if (latest == null)
            {
                _dialog.Info("Nenhuma transferência anterior encontrada para restaurar.");
                return;
            }

            var (_, manifest) = latest.Value;
            if (!_dialog.Confirm($"Restaurar {manifest.Entries.Count} arquivo(s) " +
                                 $"({ByteFormatter.Format(manifest.TotalBytes)}) de volta ao computador?\n\n" +
                                 $"Origem: {manifest.BackupRoot}\nData: {manifest.CreatedUtc.ToLocalTime():dd/MM/yyyy HH:mm}",
                    "Restaurar Backup"))
                return;

            await RunOperationAsync("Restauração", async (log, progress, ct) =>
            {
                int restored = await _backupService.UndoTransferAsync(manifest, log, progress, ct).ConfigureAwait(true);
                await RefreshDrivesAsync();
                StatusText = $"Restauração concluída: {restored} arquivo(s) devolvido(s).";
                _dialog.Info($"{restored} arquivo(s) foram restaurados para o computador.");
            });
        }

        // ===================== Helpers =====================

        private async Task RunOperationAsync(string name, Func<IProgress<string>, IProgress<double>, CancellationToken, Task> body)
        {
            if (IsBusy) return;
            IsBusy = true;
            Progress = 0;
            _cts = new CancellationTokenSource();
            var log = new Progress<string>(m => { Logger.Instance.Info(m); StatusText = Trim(m); });
            var progress = new Progress<double>(p => Progress = p);

            var sw = System.Diagnostics.Stopwatch.StartNew();
            try
            {
                Logger.Instance.Info($"===== {name} iniciada =====");
                await body(log, progress, _cts.Token);
                Progress = 100;
                Logger.Instance.Success($"===== {name} concluída em {sw.Elapsed.TotalSeconds:0.0}s =====");
            }
            catch (OperationCanceledException)
            {
                Logger.Instance.Warning($"{name} cancelada pelo usuário.");
                StatusText = $"{name} cancelada.";
            }
            catch (Exception ex)
            {
                Logger.Instance.Error($"Erro durante {name}.", ex);
                _dialog.Warn($"Ocorreu um erro durante {name}: {ex.Message}");
            }
            finally
            {
                _cts?.Dispose();
                _cts = null;
                IsBusy = false;
            }
        }

        private void FinishCleaning(string title, CleanupResult result)
        {
            ReclaimableBytes = Math.Max(0, ReclaimableBytes - result.TotalBytesFreed);
            RecomputeSelectedReclaimable();

            var data = new ReportData
            {
                OperationTitle = title,
                Simulated = result.Simulated,
                Elapsed = result.Duration,
                BytesFreed = result.TotalBytesFreed,
                FilesCleaned = result.TotalFilesRemoved,
                CleanupTasks = result.Tasks,
                Drives = BuildDriveSnapshot(),
                Suggestions = BuildSuggestions()
            };
            var report = _reportService.GenerateAll(data);
            LastReportHtml = report.Html;

            string verb = result.Simulated ? "seriam liberados" : "liberados";
            StatusText = $"{title} concluída: {ByteFormatter.Format(result.TotalBytesFreed)} {verb}.";
            _dialog.Info($"{title} concluída!\n\nEspaço {verb}: {ByteFormatter.Format(result.TotalBytesFreed)}\n" +
                         $"Arquivos: {result.TotalFilesRemoved}\n\nRelatório salvo em:\n{report.Html}");
        }

        private void FinishTransfer(TransferResult result, List<LargeFileItem> moved)
        {
            var data = new ReportData
            {
                OperationTitle = "Transferência para HD externo",
                Simulated = result.Simulated,
                Elapsed = result.Duration,
                BytesMoved = result.BytesMoved,
                FilesMoved = result.FilesMoved,
                ExternalDriveUsed = SelectedExternalDrive?.DisplayName ?? string.Empty,
                Drives = BuildDriveSnapshot(),
                MovedFiles = moved.Take(500).Select(f => $"{f.Name}  ({ByteFormatter.Format(f.SizeBytes)}) → {f.SuggestedCategory}").ToList(),
                Suggestions = BuildSuggestions()
            };
            var report = _reportService.GenerateAll(data);
            LastReportHtml = report.Html;

            // Remove successfully moved files from the on-screen list (real runs only).
            if (!result.Simulated)
            {
                foreach (var f in moved.ToList())
                    LargeFiles.Remove(f);
                MovableBytes = LargeFiles.Sum(f => f.SizeBytes);
            }

            string verb = result.Simulated ? "seriam movidos" : "movidos";
            StatusText = $"Transferência concluída: {result.FilesMoved} arquivo(s) {verb} ({ByteFormatter.Format(result.BytesMoved)}).";
            _dialog.Info($"Transferência concluída!\n\n{result.FilesMoved} arquivo(s) {verb} " +
                         $"({ByteFormatter.Format(result.BytesMoved)}).\nFalhas: {result.FilesFailed}\n\n" +
                         $"Relatório salvo em:\n{report.Html}");
        }

        private List<string> BuildSuggestions()
        {
            var s = new List<string>();
            if (LastScan == null) return s;

            if (LastScan.TotalMovableBytes > 5L * 1024 * 1024 * 1024)
                s.Add("Você tem mais de 5 GB de arquivos pessoais grandes — considere movê-los para um HD externo.");
            if (LastScan.Duplicates.Count > 0)
                s.Add($"Foram encontrados {LastScan.Duplicates.Count} grupos de arquivos duplicados ({ByteFormatter.Format(LastScan.TotalDuplicateBytes)} recuperáveis). Revise antes de remover.");
            if (SystemDrive != null && SystemDrive.FreePercent < 15)
                s.Add("O disco do sistema está com menos de 15% de espaço livre. Faça uma Limpeza Completa e mova arquivos grandes.");
            var bigDevCache = LastScan.DeveloperCaches.FirstOrDefault();
            if (bigDevCache != null && bigDevCache.SizeBytes > 2L * 1024 * 1024 * 1024)
                s.Add($"O cache de {bigDevCache.Name} ocupa {ByteFormatter.Format(bigDevCache.SizeBytes)} — limpe-o pela própria ferramenta ({bigDevCache.Name}) se não precisar.");
            if (_reviewablePrograms.Count > 0)
            {
                var names = string.Join(", ", _reviewablePrograms.Take(3).Select(p => p.Name));
                s.Add($"Programas grandes e sem uso aparente podem ser desinstalados manualmente: {names}" +
                      (_reviewablePrograms.Count > 3 ? $" (+{_reviewablePrograms.Count - 3})" : "") + ".");
            }
            if (!IsAdministrator)
                s.Add("Execute como administrador para desbloquear a limpeza do Windows Update, Prefetch, DISM e SFC.");
            if (s.Count == 0)
                s.Add("Seu computador está bem organizado. Continue executando a análise periodicamente.");
            return s;
        }

        private List<DriveModel> BuildDriveSnapshot()
        {
            var list = new List<DriveModel>();
            if (SystemDrive != null) list.Add(SystemDrive);
            list.AddRange(ExternalDrives);
            return list;
        }

        private async Task RefreshDrivesAsync()
        {
            try
            {
                var (system, externals) = await Task.Run(() =>
                {
                    var sys = _driveService.GetSystemDrive();
                    var ext = _driveService.GetExternalDrives();
                    return (sys, ext);
                }).ConfigureAwait(true);

                SystemDrive = system;

                ExternalDrives.Clear();
                foreach (var d in externals) ExternalDrives.Add(d);

                // Preserve / choose a sensible external-drive selection.
                if (SelectedExternalDrive == null ||
                    !ExternalDrives.Any(d => d.Root.Equals(SelectedExternalDrive.Root, StringComparison.OrdinalIgnoreCase)))
                {
                    SelectedExternalDrive = ExternalDrives.FirstOrDefault(d =>
                        d.Root.Equals(_settings.PreferredExternalDrive, StringComparison.OrdinalIgnoreCase))
                        ?? ExternalDrives.FirstOrDefault();
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.Error("Falha ao atualizar unidades.", ex);
            }
        }

        private void ClearResults()
        {
            foreach (var c in Categories) c.PropertyChanged -= OnCategorySelectionChanged;
            Categories.Clear();
            LargeFiles.Clear();
            Duplicates.Clear();
            DeveloperCaches.Clear();
        }

        private void OnCategorySelectionChanged(object? sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(ScanCategory.Selected))
                RecomputeSelectedReclaimable();
        }

        private void RecomputeSelectedReclaimable() =>
            SelectedReclaimableBytes = Categories.Where(c => c.IsCleanable && c.Selected).Sum(c => c.TotalBytes);

        private void OpenSettings()
        {
            var vm = new SettingsViewModel(_settingsService, _scheduler, _dialog);
            _dialog.OpenSettings(vm);

            // Re-read settings that may have changed.
            _settings = _settingsService.Current;
            _guard = new SafetyGuard(_settings.ProtectedPaths);
            SimulationMode = _settings.SimulationMode;
            IsDarkTheme = _settings.Theme == AppTheme.Dark;
            _ = RefreshDrivesAsync();
        }

        private void ToggleTheme() => IsDarkTheme = !IsDarkTheme;

        private void Cancel()
        {
            _cts?.Cancel();
            StatusText = "Cancelando...";
        }

        private void Elevate()
        {
            if (AdminHelper.RelaunchAsAdmin())
                Application.Current.Shutdown();
        }

        private void OpenLastReport()
        {
            if (!string.IsNullOrEmpty(LastReportHtml))
                _dialog.OpenInExplorer(LastReportHtml);
        }

        private void OnLogMessage(object? sender, LogEntry entry)
        {
            var dispatcher = Application.Current?.Dispatcher;
            if (dispatcher == null) return;

            if (dispatcher.CheckAccess())
                AppendLog(entry);
            else
                dispatcher.BeginInvoke(new Action(() => AppendLog(entry)));
        }

        private void AppendLog(LogEntry entry)
        {
            Logs.Add(entry);
            while (Logs.Count > 600) Logs.RemoveAt(0);
        }

        private static string Trim(string s) => s.Length > 120 ? s.Substring(0, 117) + "..." : s;
    }
}
