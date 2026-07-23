@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================================
echo    OSC Scraper - Mapa das OSCs (IPEA)
echo    Instalacao automatica
echo ============================================================
echo.

REM --- Verifica se o Python esta instalado ---------------------
set "PY="
where python >nul 2>nul && set "PY=python"
if not defined PY (
    where py >nul 2>nul && set "PY=py -3"
)
if not defined PY (
    echo [ERRO] Python nao foi encontrado no sistema.
    echo.
    echo   1. Baixe o Python 3.10 ou superior em:
    echo      https://www.python.org/downloads/
    echo   2. Durante a instalacao, MARQUE a opcao
    echo      "Add Python to PATH".
    echo   3. Rode este instalar.bat novamente.
    echo.
    pause
    exit /b 1
)
echo [OK] Python encontrado.

echo.
echo [1/4] Criando o ambiente virtual (.venv)...
%PY% -m venv .venv
if errorlevel 1 (
    echo [ERRO] Falha ao criar o ambiente virtual.
    pause
    exit /b 1
)

set "VENV_PY=.venv\Scripts\python.exe"

echo.
echo [2/4] Atualizando o pip...
"%VENV_PY%" -m pip install --upgrade pip

echo.
echo [3/4] Instalando as dependencias (requirements.txt)...
"%VENV_PY%" -m pip install -r requirements.txt
if errorlevel 1 (
    echo [ERRO] Falha ao instalar as dependencias.
    pause
    exit /b 1
)

echo.
echo [4/4] Instalando o navegador do Playwright (Chromium)...
"%VENV_PY%" -m playwright install chromium

echo.
echo ============================================================
echo    INSTALACAO CONCLUIDA COM SUCESSO!
echo.
echo    Para iniciar a ferramenta, execute:  iniciar.bat
echo ============================================================
echo.
pause
endlocal
