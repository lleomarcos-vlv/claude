@echo off
setlocal enableextensions
title Conlor PC Cleaner - Compilar
cd /d "%~dp0"

rem ============================================================
rem  Compila o Conlor PC Cleaner em modo Release e, opcionalmente,
rem  gera uma versao "publicada" (pasta com o .exe pronto para uso).
rem ============================================================

echo ==================================================
echo    Compilando Conlor PC Cleaner (Release)
echo ==================================================
echo.

where dotnet >nul 2>nul
if errorlevel 1 (
    echo [ERRO] O .NET 8 SDK nao foi encontrado.
    echo Instale em: https://dotnet.microsoft.com/download/dotnet/8.0
    pause
    goto :fim
)

echo [1/2] Compilando...
dotnet build "ConlorPCCleaner.sln" -c Release --nologo
if errorlevel 1 (
    echo [ERRO] Falha na compilacao.
    pause
    goto :fim
)

echo.
echo [2/2] Publicando versao autocontida em .\publish ...
dotnet publish "src\ConlorPCCleaner\ConlorPCCleaner.csproj" -c Release -r win-x64 --self-contained false -o "publish" --nologo
if errorlevel 1 (
    echo [AVISO] A publicacao falhou, mas a compilacao Release foi concluida.
) else (
    echo.
    echo Pronto! O aplicativo publicado esta na pasta:  .\publish\ConlorPCCleaner.exe
)

echo.
pause
:fim
endlocal
