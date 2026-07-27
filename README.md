# 🧹 Conlor PC Cleaner

**Ferramenta moderna, inteligente e SEGURA de limpeza e organização para Windows.**
Limpa arquivos temporários e caches, organiza e move arquivos pessoais grandes para um HD
externo, e libera espaço em disco — **sem nunca apagar automaticamente seus arquivos pessoais**.

> A segurança dos seus dados vem em primeiro lugar. Em caso de dúvida, a ferramenta **pergunta**
> ou **sugere mover** para o HD externo, preservando a integridade do sistema operacional.

---

## ✨ Destaques

| Recurso | Descrição |
|--------|-----------|
| 🔍 **Analisar PC** | Mede temporários, caches, miniaturas, logs, dumps, Windows Update, arquivos grandes, duplicados e caches de apps/jogos. |
| ✨ **Limpeza Inteligente** | Remove com segurança apenas temporários e caches selecionados (rápido, sem admin). |
| 🧨 **Limpeza Completa** | Tudo da inteligente + `cleanmgr`, `DISM`, `SFC`, flush de DNS e caches que exigem administrador. |
| 📦 **Transferir para HD Externo** | Move (não copia) arquivos pessoais grandes para uma estrutura organizada `Backup_PC`. |
| ↩️ **Restaurar Backup** | Desfaz uma transferência anterior, devolvendo os arquivos ao PC. |
| 🧪 **Modo Simulação** | Mostra exatamente o que seria limpo/movido **sem alterar nada**. |
| 🩺 **Saúde do disco (SMART)** | Exibe estado do SSD/HD via cmdlets do Windows. |
| 🔁 **Duplicados (SHA-256)** | Identifica arquivos idênticos — remoção só com confirmação. |
| ⏰ **Agendamento** | Limpeza inteligente automática (diária/semanal/mensal). |
| 📄 **Relatórios** | Gera relatório em **HTML**, **PDF** e **TXT** a cada operação. |
| 🌗 **Tema claro/escuro** | Interface moderna com alternância de tema. |

---

## 🛡️ Regras de segurança (inegociáveis)

- **Nunca** apaga arquivos de `Windows`, `Program Files`, `Program Files (x86)`, `ProgramData`,
  `AppData`, `Boot`, `EFI`, `Recovery`, drivers, DLLs ou executáveis de sistema.
- **Nunca** apaga automaticamente Área de Trabalho, Documentos, Imagens, Vídeos, Downloads ou
  Projetos. Esses arquivos só podem ser **movidos** (com confirmação) e a ação é **reversível**.
- A limpeza atua **somente** sobre uma lista explícita de pastas de temporários/cache conhecidas.
- Toda transferência gera um **manifesto** que permite **desfazer** os movimentos.
- Antes de operações grandes, tenta criar um **ponto de restauração** do sistema (quando suportado).

Detalhes em [`src/ConlorPCCleaner/Helpers/SafetyGuard.cs`](src/ConlorPCCleaner/Helpers/SafetyGuard.cs).

---

## 🧰 Tecnologia

- **.NET 8** · **C# 12** · **WPF** (interface desktop nativa)
- Arquitetura **MVVM** (Model–View–ViewModel)
- **Zero dependências NuGet externas** → restaura e compila em Release imediatamente
- Utilitários nativos do Windows: `cleanmgr`, `DISM`, `SFC`, `ipconfig`, `schtasks`, PowerShell
  (`Get-PhysicalDisk`, `Checkpoint-Computer`)

---

## 🚀 Como executar

### Opção A — Duplo clique (mais fácil)
1. Extraia o ZIP.
2. Dê **duplo clique em `IniciarLimpeza.bat`**.
   - Se já estiver compilado, o app abre.
   - Se tiver o **.NET 8 SDK**, ele compila em Release e abre automaticamente.

### Opção B — Visual Studio 2022
1. Abra **`ConlorPCCleaner.sln`**.
2. Selecione a configuração **Release**.
3. **Ctrl+Shift+B** para compilar, **F5** para executar.

### Opção C — Linha de comando
```bat
dotnet build ConlorPCCleaner.sln -c Release
dotnet run --project src\ConlorPCCleaner\ConlorPCCleaner.csproj -c Release
```

> Requisitos: **Windows 10 (1809+) ou Windows 11** e, para compilar, o **.NET 8 SDK**.
> Alguns recursos (DISM, SFC, Prefetch, Windows Update) pedem elevação — a própria interface
> oferece o botão **"Reiniciar como Admin"** quando necessário.

---

## 📁 Estrutura do projeto

```
ConlorPCCleaner/
├── ConlorPCCleaner.sln
├── IniciarLimpeza.bat            # Launcher (duplo clique)
├── Compilar.bat                  # Compila/publica em Release
├── README.md
├── docs/
│   ├── INSTALL.md                # Manual de instalação
│   ├── USER_MANUAL.md            # Manual do usuário
│   ├── ARCHITECTURE.md           # Arquitetura do software
│   └── FLOWCHART.md              # Fluxogramas (Mermaid)
└── src/ConlorPCCleaner/
    ├── App.xaml / App.xaml.cs    # Ponto de entrada + modo agendado (--auto-clean)
    ├── app.manifest              # DPI + elevação sob demanda
    ├── Models/                   # Modelos de dados
    ├── ViewModels/               # MVVM (Main, Settings, comandos)
    ├── Views/                    # Janelas WPF + DialogService
    ├── Themes/                   # Tema claro/escuro + estilos
    ├── Converters/               # Conversores de binding
    ├── Helpers/                  # SafetyGuard, elevação, processos, bytes, hash…
    ├── Utilities/                # Logger, caminhos do app
    └── Services/
        ├── Analyzer/             # Análise do PC
        ├── Cleaner/              # Motor de limpeza
        ├── Transfer/             # Transferência para HD externo
        ├── Backup/               # Ponto de restauração + desfazer
        ├── Reports/              # HTML / PDF / TXT
        ├── Settings/             # Persistência de configurações
        └── System/               # Discos, SMART, duplicados, agendamento, apps
```

Veja a arquitetura completa em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 📄 Onde ficam os arquivos gerados

Tudo em `%LOCALAPPDATA%\ConlorPCCleaner\`:
- `Logs\` — histórico com data e hora
- `Reports\` — relatórios HTML/PDF/TXT
- `Manifests\` — manifestos de transferência (para desfazer)
- `settings.json` — suas configurações

---

## 📚 Documentação

- **[Manual de Instalação](docs/INSTALL.md)**
- **[Manual do Usuário](docs/USER_MANUAL.md)**
- **[Arquitetura](docs/ARCHITECTURE.md)**
- **[Fluxograma](docs/FLOWCHART.md)**

---

## ⚖️ Aviso

Ferramenta desenvolvida com foco em **segurança de dados**. Nenhum arquivo pessoal é apagado
automaticamente. Ainda assim, mantenha backups regulares dos seus dados importantes.
