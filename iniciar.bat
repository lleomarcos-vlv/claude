@echo off
setlocal enableextensions
chcp 65001 >nul
title Estacao de Trabalho
cd /d "%~dp0"

REM -------- Verifica o Node.js --------
where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Execute primeiro o "instalar.bat".
  echo        Download: https://nodejs.org/pt-br/download
  pause
  exit /b 1
)

REM -------- Verifica se as dependencias foram instaladas --------
if not exist "node_modules" (
  echo [AVISO] As dependencias ainda nao foram instaladas.
  echo         Executando a instalacao automaticamente...
  echo.
  call "%~dp0instalar.bat"
)

if not exist "node_modules" (
  echo [ERRO] Nao foi possivel preparar o ambiente. Execute "instalar.bat".
  pause
  exit /b 1
)

echo ============================================================
echo    Iniciando a Estacao de Trabalho...
echo ============================================================
echo.
echo   Uma janela do aplicativo sera aberta em instantes.
echo   Mantenha esta janela aberta enquanto usa o sistema.
echo.

REM -------- Inicia o app (Electron). Fallback: modo navegador --------
call npm start
if errorlevel 1 (
  echo.
  echo [AVISO] Nao foi possivel abrir a janela do aplicativo.
  echo         Iniciando em modo navegador...
  echo         Acesse:  http://127.0.0.1:4599
  echo.
  call npm run web
)

exit /b 0
