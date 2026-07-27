# Manual de Instalação — Conlor PC Cleaner

## 1. Requisitos

| Item | Requisito |
|------|-----------|
| Sistema operacional | Windows 10 versão 1809+ ou Windows 11 (x64/ARM64) |
| Para **executar** já compilado | Nenhum (o `.exe` roda direto) |
| Para **compilar** | **.NET 8 SDK** ou **Visual Studio 2022** (17.8+) com a carga de trabalho *.NET Desktop Development* |
| Espaço em disco | ~200 MB para o SDK/compilação |
| Privilégios | Usuário comum. Recursos avançados pedem elevação sob demanda. |

Baixe o .NET 8 SDK em: https://dotnet.microsoft.com/download/dotnet/8.0

---

## 2. Instalação rápida (usuário final)

1. **Extraia** o arquivo ZIP em uma pasta de sua preferência (ex.: `C:\ConlorPCCleaner`).
2. Dê **duplo clique em `IniciarLimpeza.bat`**.
   - Se o app já estiver compilado, ele abre imediatamente.
   - Se você tiver o .NET 8 SDK, o script compila em **Release** e abre o app.
   - Se faltar o SDK, o script mostra o link para instalá-lo.

> Dica: crie um atalho de `IniciarLimpeza.bat` na Área de Trabalho para abrir com um clique.

---

## 3. Compilação no Visual Studio 2022

1. Abra o arquivo **`ConlorPCCleaner.sln`**.
2. Na barra superior, selecione a configuração **Release** e a plataforma **Any CPU**.
3. Menu **Compilar → Compilar Solução** (ou `Ctrl+Shift+B`).
4. Menu **Depurar → Iniciar Sem Depuração** (ou `Ctrl+F5`) para executar.

O executável final fica em:
```
src\ConlorPCCleaner\bin\Release\net8.0-windows\ConlorPCCleaner.exe
```

---

## 4. Compilação por linha de comando

```bat
:: Compilar em Release
dotnet build ConlorPCCleaner.sln -c Release

:: Executar
dotnet run --project src\ConlorPCCleaner\ConlorPCCleaner.csproj -c Release
```

### Gerar uma versão publicada (pasta pronta para distribuir)
Use o script incluso:
```bat
Compilar.bat
```
Ele gera a pasta `publish\` com `ConlorPCCleaner.exe`. Também é possível manualmente:
```bat
dotnet publish src\ConlorPCCleaner\ConlorPCCleaner.csproj -c Release -r win-x64 --self-contained false -o publish
```

Para um executável **totalmente independente** (não exige .NET instalado no PC de destino):
```bat
dotnet publish src\ConlorPCCleaner\ConlorPCCleaner.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o publish-standalone
```

---

## 5. Elevação (privilégios de administrador)

O aplicativo inicia como usuário comum (sem prompt de UAC). Quando uma operação precisa de
administrador (DISM, SFC, limpeza do Windows Update, Prefetch, ponto de restauração), a interface
mostra o botão **"Reiniciar como Admin"**, que reabre o app elevado via UAC. Nada é feito com
privilégios elevados sem o seu consentimento.

---

## 6. Desinstalação

O app não escreve no registro de instalação nem espalha arquivos. Para remover:
1. Apague a pasta onde você extraiu o projeto.
2. (Opcional) Apague os dados do usuário em `%LOCALAPPDATA%\ConlorPCCleaner`.
3. (Opcional) Se você ativou o agendamento, remova a tarefa:
   ```bat
   schtasks /Delete /TN "ConlorPCCleaner_AutoClean" /F
   ```

---

## 7. Solução de problemas

| Sintoma | Solução |
|---------|---------|
| `dotnet` não é reconhecido | Instale o .NET 8 SDK e reabra o terminal. |
| Erro "WindowsDesktop SDK" ao compilar | Compile no Windows (WPF não compila no Linux/macOS). |
| SMART não aparece | Requer PowerShell com o módulo Storage (padrão no Windows 10/11). |
| DISM/SFC "ignorado" | Clique em "Reiniciar como Admin". |
| Nenhum HD externo listado | Conecte o dispositivo e clique no botão 🔄 do painel "HD externo". |
