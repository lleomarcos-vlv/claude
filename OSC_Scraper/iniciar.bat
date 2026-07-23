@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo    OSC Scraper - Mapa das OSCs (IPEA)
echo    Iniciando o painel de controle
echo ============================================================
echo.

set "VENV_PY=.venv\Scripts\python.exe"

REM --- Garante que a instalacao ja foi feita -------------------
if not exist "%VENV_PY%" (
    echo [ERRO] Ambiente nao encontrado.
    echo        Execute primeiro:  instalar.bat
    echo.
    pause
    exit /b 1
)

echo O painel sera aberto no navegador em:
echo    http://127.0.0.1:8000
echo.
echo Para encerrar, feche esta janela ou pressione Ctrl+C.
echo.

REM --- Abre o navegador apos alguns segundos (em paralelo) -----
start "" cmd /c "timeout /t 4 >nul & start http://127.0.0.1:8000"

REM --- Inicia o servidor (bloqueia esta janela) ---------------
"%VENV_PY%" main.py

echo.
echo Servidor encerrado.
pause
endlocal
