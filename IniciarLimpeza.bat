@echo off
setlocal enableextensions
title Conlor PC Cleaner
cd /d "%~dp0"

rem ============================================================
rem  Conlor PC Cleaner - Launcher
rem  - Se o aplicativo ja estiver compilado, ele abre direto.
rem  - Caso contrario, compila em Release usando o .NET 8 SDK.
rem  - Se o .NET 8 nao estiver instalado, mostra instrucoes.
rem ============================================================

set "EXE=src\ConlorPCCleaner\bin\Release\net8.0-windows\ConlorPCCleaner.exe"

echo ==================================================
echo    CONLOR PC CLEANER
echo    Limpeza inteligente e segura do Windows
echo ==================================================
echo.

if exist "%EXE%" (
    echo Abrindo o aplicativo...
    start "" "%EXE%"
    goto :fim
)

echo O aplicativo ainda nao foi compilado.
echo Procurando o .NET 8 SDK...
where dotnet >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERRO] O .NET 8 SDK nao foi encontrado neste computador.
    echo.
    echo   Opcao 1: Instale o .NET 8 SDK e rode este arquivo novamente:
    echo            https://dotnet.microsoft.com/download/dotnet/8.0
    echo.
    echo   Opcao 2: Abra "ConlorPCCleaner.sln" no Visual Studio 2022
    echo            e compile em modo Release ^(Ctrl+Shift+B^).
    echo.
    pause
    goto :fim
)

echo .NET encontrado. Compilando em modo Release...
echo (a primeira compilacao pode levar alguns minutos)
echo.
dotnet build "ConlorPCCleaner.sln" -c Release --nologo
if errorlevel 1 (
    echo.
    echo [ERRO] A compilacao falhou. Abra a solucao no Visual Studio
    echo        para ver os detalhes do erro.
    echo.
    pause
    goto :fim
)

if exist "%EXE%" (
    echo.
    echo Compilado com sucesso! Abrindo o aplicativo...
    start "" "%EXE%"
) else (
    echo.
    echo [ERRO] O executavel nao foi encontrado apos a compilacao.
    pause
)

:fim
endlocal
