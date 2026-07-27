using System;
using System.IO;
using System.Text.Json;
using ConlorPCCleaner.Models;
using ConlorPCCleaner.Utilities;

namespace ConlorPCCleaner.Services
{
    /// <summary>
    /// Loads and persists <see cref="AppSettings"/> as JSON. Also supports exporting and
    /// importing settings so the user can back up or transfer their configuration.
    /// </summary>
    public sealed class SettingsService
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            WriteIndented = true,
            PropertyNameCaseInsensitive = true
        };

        private readonly string _path;

        public AppSettings Current { get; private set; } = AppSettings.CreateDefault();

        public SettingsService(string? path = null)
        {
            _path = path ?? AppPaths.SettingsFile;
        }

        /// <summary>Loads settings from disk, falling back to defaults on any error.</summary>
        public AppSettings Load()
        {
            try
            {
                if (File.Exists(_path))
                {
                    string json = File.ReadAllText(_path);
                    var loaded = JsonSerializer.Deserialize<AppSettings>(json, JsonOptions);
                    if (loaded != null)
                    {
                        Current = loaded;
                        Logger.Instance.Info("Configurações carregadas.");
                        return Current;
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.Error("Não foi possível carregar as configurações. Usando padrões.", ex);
            }

            Current = AppSettings.CreateDefault();
            Save(); // create the file with defaults
            return Current;
        }

        /// <summary>Persists the current settings to disk.</summary>
        public void Save() => SaveTo(_path, Current);

        public void Save(AppSettings settings)
        {
            Current = settings;
            SaveTo(_path, settings);
        }

        /// <summary>Exports the current settings to an arbitrary path chosen by the user.</summary>
        public void Export(string destinationPath) => SaveTo(destinationPath, Current);

        /// <summary>Imports settings from a file, making them the active configuration.</summary>
        public AppSettings Import(string sourcePath)
        {
            string json = File.ReadAllText(sourcePath);
            var loaded = JsonSerializer.Deserialize<AppSettings>(json, JsonOptions)
                         ?? throw new InvalidDataException("Arquivo de configuração inválido.");
            Current = loaded;
            Save();
            Logger.Instance.Success("Configurações importadas com sucesso.");
            return Current;
        }

        private static void SaveTo(string path, AppSettings settings)
        {
            try
            {
                string? dir = Path.GetDirectoryName(path);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
                string json = JsonSerializer.Serialize(settings, JsonOptions);
                File.WriteAllText(path, json);
            }
            catch (Exception ex)
            {
                Logger.Instance.Error("Falha ao salvar configurações.", ex);
            }
        }
    }
}
