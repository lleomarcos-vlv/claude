using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace ConlorPCCleaner.ViewModels
{
    /// <summary>
    /// Minimal INotifyPropertyChanged base class for view models. Hand-rolled so the project
    /// stays free of external MVVM dependencies.
    /// </summary>
    public abstract class ObservableObject : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null) =>
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));

        /// <summary>Sets a backing field and raises PropertyChanged when the value actually changes.</summary>
        protected bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
        {
            if (EqualityComparer<T>.Default.Equals(field, value))
                return false;

            field = value;
            OnPropertyChanged(propertyName);
            return true;
        }
    }
}
