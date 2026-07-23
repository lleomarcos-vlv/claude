@echo off
setlocal enableextensions
chcp 65001 >nul
title Estacao de Trabalho - Instalador
cd /d "%~dp0"

echo ============================================================
echo    ESTACAO DE TRABALHO - INSTALADOR
echo    Prospeccao Comercial Inteligente
echo ============================================================
echo.

REM -------- 1) Verifica o Node.js --------
where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] O Node.js nao foi encontrado neste computador.
  echo.
  echo   A aplicacao precisa do Node.js versao 18 ou superior.
  echo   Baixe a versao LTS em:  https://nodejs.org/pt-br/download
  echo.
  echo   Depois de instalar o Node.js, feche esta janela e
  echo   execute o "instalar.bat" novamente.
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODEVER=%%v
echo [OK] Node.js encontrado: %NODEVER%
echo.

REM -------- 2) Instala as dependencias --------
echo [1/2] Instalando dependencias (pode levar alguns minutos)...
echo.
call npm install
if errorlevel 1 (
  echo.
  echo [ERRO] Falha ao instalar as dependencias.
  echo        Verifique sua conexao com a internet e tente novamente.
  echo.
  pause
  exit /b 1
)
echo.

REM -------- 3) Configura banco de dados e pastas --------
echo [2/2] Configurando banco de dados, pastas e nichos...
echo.
call node scripts/postinstall.js
echo.

echo ============================================================
echo    INSTALACAO CONCLUIDA COM SUCESSO!
echo ============================================================
echo.
echo   Para abrir o sistema, execute o arquivo:  iniciar.bat
echo.
echo   Login padrao:  admin
echo   Senha padrao:  admin123
echo   (altere a senha apos o primeiro acesso)
echo.
pause
exit /b 0
