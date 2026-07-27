using System;
using System.Threading.Tasks;
using System.Windows.Input;

namespace ConlorPCCleaner.ViewModels
{
    /// <summary>A synchronous ICommand backed by delegates.</summary>
    public sealed class RelayCommand : ICommand
    {
        private readonly Action<object?> _execute;
        private readonly Predicate<object?>? _canExecute;

        public RelayCommand(Action<object?> execute, Predicate<object?>? canExecute = null)
        {
            _execute = execute ?? throw new ArgumentNullException(nameof(execute));
            _canExecute = canExecute;
        }

        public RelayCommand(Action execute, Func<bool>? canExecute = null)
        {
            if (execute == null) throw new ArgumentNullException(nameof(execute));
            _execute = _ => execute();
            _canExecute = canExecute == null ? null : _ => canExecute();
        }

        public bool CanExecute(object? parameter) => _canExecute?.Invoke(parameter) ?? true;

        public void Execute(object? parameter) => _execute(parameter);

        public event EventHandler? CanExecuteChanged
        {
            add => CommandManager.RequerySuggested += value;
            remove => CommandManager.RequerySuggested -= value;
        }

        public void RaiseCanExecuteChanged() => CommandManager.InvalidateRequerySuggested();
    }

    /// <summary>
    /// An asynchronous ICommand that prevents re-entrancy while its task is running and
    /// keeps the UI's CanExecute state in sync.
    /// </summary>
    public sealed class AsyncRelayCommand : ICommand
    {
        private readonly Func<object?, Task> _executeAsync;
        private readonly Predicate<object?>? _canExecute;
        private bool _isExecuting;

        public AsyncRelayCommand(Func<Task> executeAsync, Func<bool>? canExecute = null)
        {
            if (executeAsync == null) throw new ArgumentNullException(nameof(executeAsync));
            _executeAsync = _ => executeAsync();
            _canExecute = canExecute == null ? null : _ => canExecute();
        }

        public AsyncRelayCommand(Func<object?, Task> executeAsync, Predicate<object?>? canExecute = null)
        {
            _executeAsync = executeAsync ?? throw new ArgumentNullException(nameof(executeAsync));
            _canExecute = canExecute;
        }

        public bool IsExecuting
        {
            get => _isExecuting;
            private set
            {
                _isExecuting = value;
                CommandManager.InvalidateRequerySuggested();
            }
        }

        public bool CanExecute(object? parameter) =>
            !_isExecuting && (_canExecute?.Invoke(parameter) ?? true);

        public async void Execute(object? parameter)
        {
            if (!CanExecute(parameter)) return;
            IsExecuting = true;
            try
            {
                await _executeAsync(parameter).ConfigureAwait(true);
            }
            finally
            {
                IsExecuting = false;
            }
        }

        public event EventHandler? CanExecuteChanged
        {
            add => CommandManager.RequerySuggested += value;
            remove => CommandManager.RequerySuggested -= value;
        }
    }
}
