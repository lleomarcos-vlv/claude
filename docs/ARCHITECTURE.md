# Arquitetura — Conlor PC Cleaner

## 1. Visão geral

O Conlor PC Cleaner é uma aplicação **WPF (.NET 8)** organizada segundo o padrão **MVVM**
(Model–View–ViewModel), com uma camada de **Serviços** que concentra toda a lógica de negócio.
A regra de ouro do projeto é a **segurança de dados**, garantida por um componente central,
o `SafetyGuard`, consultado por todo motor que apaga ou move arquivos.

```
┌──────────────────────────────────────────────────────────────────────┐
│                              VIEWS (WPF)                              │
│   MainWindow.xaml · SettingsWindow.xaml · DialogService              │
│   (somente apresentação e binding — nenhuma regra de negócio)        │
└───────────────▲───────────────────────────────────┬──────────────────┘
                │ DataBinding / Commands             │ IDialogService
┌───────────────┴───────────────────────────────────▼──────────────────┐
│                            VIEWMODELS                                 │
│   MainViewModel · SettingsViewModel · RelayCommand/AsyncRelayCommand  │
│   (orquestra serviços, expõe estado observável, progresso e logs)     │
└───────────────▲───────────────────────────────────┬──────────────────┘
                │                                    │
┌───────────────┴────────────────────────────────────▼─────────────────┐
│                             SERVICES                                  │
│  Analyzer · Cleaner · Transfer · Backup · Reports · Settings · System │
└───────────────▲───────────────────────────────────┬──────────────────┘
                │                                    │
┌───────────────┴─────────────┐      ┌───────────────▼──────────────────┐
│      HELPERS / UTILITIES     │      │             MODELS               │
│  SafetyGuard · AdminHelper   │      │  DriveModel · ScanResult · …     │
│  ProcessRunner · ByteFormatter│     │  AppSettings · TransferManifest  │
│  FileSystemHelper · Native…  │      │                                  │
│  Logger · AppPaths           │      │                                  │
└──────────────────────────────┘      └──────────────────────────────────┘
```

---

## 2. Camadas e responsabilidades

### Views (`Views/`, `Themes/`, `Converters/`)
- `MainWindow` / `SettingsWindow`: apenas layout e binding.
- `DialogService`: implementa `IDialogService` (confirmações, seleção de pasta/arquivo,
  abertura no Explorer, janela de configurações). Isola o WPF do restante.
- `Themes/Theme.xaml` + `ThemeManager`: estilos e paletas clara/escura trocadas em tempo real.

### ViewModels (`ViewModels/`)
- `MainViewModel`: coração da interface. Cria os serviços, dispara operações assíncronas,
  transmite **progresso** (`IProgress<double>`) e **logs** (`IProgress<string>`), atualiza
  coleções observáveis e monta os relatórios.
- `SettingsViewModel`: edita uma cópia das configurações e as persiste ao salvar.
- `ObservableObject`, `RelayCommand`, `AsyncRelayCommand`: infraestrutura MVVM feita à mão
  (sem bibliotecas externas). `AsyncRelayCommand` evita reentrância durante operações longas.

### Services (`Services/`)
| Serviço | Papel |
|---------|-------|
| `SystemAnalyzer` | Mede categorias, encontra arquivos grandes, duplicados e caches de apps. **Só lê.** |
| `SystemCleaner` | Apaga arquivos de temporários/cache; executa cleanmgr/DISM/SFC/flush DNS. |
| `FileTransferService` | Move arquivos pessoais grandes para `Backup_PC`; grava manifesto. |
| `BackupService` | Cria ponto de restauração; salva/lê manifestos; **desfaz** transferências. |
| `ReportService` + `MiniPdfWriter` | Gera relatórios HTML/TXT/PDF (PDF sem dependência externa). |
| `SettingsService` | Serializa `AppSettings` em JSON; exporta/importa. |
| `DriveService` | Enumera e classifica discos (interno x externo). |
| `SmartHealthService` | Saúde SMART via `Get-PhysicalDisk`. |
| `DuplicateFinder` | Duplicados por tamanho → SHA-256. |
| `InstalledProgramsService` | Lista programas (registro) — apenas informa. |
| `DeveloperCacheScanner` | Mede caches de Docker/IDEs/jogos — apenas informa. |
| `SchedulerService` | Cria/remove tarefa agendada via `schtasks`. |
| `KnownLocations` | Catálogo central de pastas de temporários/cache. |

### Helpers / Utilities (`Helpers/`, `Utilities/`)
- **`SafetyGuard`** — a peça mais importante. Define o que é *system-critical* e o que é
  *pessoal protegido*, além de honrar as exclusões do usuário. Métodos `IsSafeToDelete` e
  `IsSafeToMove` são o portão final de qualquer operação destrutiva.
- `AdminHelper` — detecção de admin e auto-elevação via `runas`.
- `ProcessRunner` — execução de processos externos com timeout/cancelamento.
- `FileSystemHelper` — enumeração tolerante a erros e exclusão segura.
- `FileClassifier` — mapeia extensões → pasta de destino / "movível".
- `NativeMethods` — P/Invoke da Lixeira (SHQuery/SHEmptyRecycleBin).
- `ByteFormatter` — formatação de tamanhos.
- `Logger` — log thread-safe em arquivo + evento para a UI.
- `AppPaths` — caminhos de dados do app.

### Models (`Models/`)
Objetos de dados puros: `DriveModel`, `ScanResult`/`ScanCategory`/`LargeFileItem`/`DuplicateGroup`,
`CleanupResult`, `TransferManifest`/`TransferResult`, `AppSettings`, `DiskHealth`,
`InstalledProgram`, `DeveloperCacheInfo`, `ReportData`.

---

## 3. Fluxo de uma operação (ex.: Limpeza)

1. O usuário clica em **Limpeza Inteligente** → `MainViewModel.SmartCleanCommand`.
2. O ViewModel cria `IProgress<string>` (logs) e `IProgress<double>` (progresso) e um
   `CancellationTokenSource`.
3. Chama `SystemCleaner.CleanAsync(ids, runMaintenance, simulate, log, progress, ct)` em
   uma thread de fundo (`Task.Run`).
4. Para cada `CleanTarget`, o cleaner enumera os arquivos e, **antes de apagar cada um**,
   consulta `SafetyGuard.IsSafeToDelete`. Em Modo Simulação, apenas soma tamanhos.
5. Progresso e logs sobem para a UI via `IProgress`.
6. Ao terminar, o ViewModel monta `ReportData` e chama `ReportService.GenerateAll`.

---

## 4. Concorrência e responsividade

- Toda operação pesada roda fora da thread de UI (`Task.Run`), mantendo a interface fluida.
- `IProgress<T>` marshala automaticamente as atualizações para a thread de UI.
- `AsyncRelayCommand` desabilita os botões enquanto uma operação está em andamento.
- O `Logger` marshala para o `Dispatcher` quando chamado de threads de fundo.

---

## 5. Decisões de projeto

- **Zero dependências NuGet**: garante que o projeto restaure e compile em Release sem internet.
  Por isso o PDF é gerado por um escritor mínimo próprio (`MiniPdfWriter`).
- **Whitelist, não blacklist**: a limpeza só olha pastas conhecidas de cache/temp — é
  impossível, por construção, apagar algo fora dessa lista.
- **Mover, não apagar**: arquivos pessoais grandes são movidos e o movimento é registrado em
  manifesto para permitir desfazer.
- **Elevação sob demanda**: melhor experiência e menor superfície de risco do que exigir admin
  na inicialização.

---

## 6. Extensibilidade

- **Novo cache para limpar** → adicione um `CleanTarget` em `KnownLocations.BuildTargets()`.
- **Novo tipo de arquivo movível** → edite `FileClassifier`.
- **Nova pasta de destino** → edite `TransferFolders`.
- **Nova métrica de app/jogo** → adicione um `Probe` em `DeveloperCacheScanner`.
