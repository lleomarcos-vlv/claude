@echo off
setlocal
cd /d "%~dp0"
title geoAG - Abrir aplicativo

echo ==================================================
echo   geoAG - Abrindo o aplicativo...
echo ==================================================
echo.

rem Recopia o app.jar a partir do jar compilado (copia BINARIA /b).
rem Isso conserta automaticamente um app.jar corrompido por versoes antigas
rem do instalador (copy com curinga usa modo texto e corrompe binarios).
if exist "backend\target\kairos-erp-*.jar" (
  for %%f in ("backend\target\kairos-erp-*.jar") do copy /y /b "%%~f" "backend\app.jar" >nul
)

if not exist "backend\app.jar" (
  echo [!] O projeto ainda nao foi instalado.
  echo     Rode primeiro o "install.bat".
  pause
  exit /b 1
)
if not exist "frontend\node_modules" (
  echo [!] Dependencias do frontend ausentes.
  echo     Rode primeiro o "install.bat".
  pause
  exit /b 1
)

where java >nul 2>nul
if errorlevel 1 (
  echo [!] Java nao encontrado no PATH.
  echo     Rode o "install.bat" ou instale o Java 21: https://adoptium.net/
  pause
  exit /b 1
)

echo [..] Iniciando o backend (porta 8080)...
start "geoAG - Backend" /D "%~dp0backend" cmd /k java -jar app.jar --kairos.demo.seed=true

echo [..] Aguardando o backend subir (ate 3 minutos)...
set /a TENTATIVAS=0
:espera
set /a TENTATIVAS+=1
if %TENTATIVAS% GTR 90 (
  echo.
  echo [ERRO] O backend nao respondeu em 3 minutos.
  echo        A janela "geoAG - Backend" FICA ABERTA com a mensagem
  echo        de erro. Me mande o texto dela para eu corrigir.
  pause
  exit /b 1
)
timeout /t 2 /nobreak >nul
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing http://localhost:8080/api/v1/health -TimeoutSec 2) | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
if errorlevel 1 goto espera
echo [OK] Backend no ar.

echo [..] Iniciando o frontend (porta 5173)...
start "geoAG - Frontend" /D "%~dp0frontend" cmd /k npm run dev

echo [..] Aguardando o frontend subir...
timeout /t 6 /nobreak >nul

echo [..] Abrindo o navegador...
start "" http://localhost:5173

echo.
echo ==================================================
echo   APLICATIVO ABERTO!  http://localhost:5173
echo.
echo   Logins de demonstracao (senha kairos-demo-123):
echo     Desenvolvedor  : dev@conlor.com
echo     Gerencia (ADM) : admin@conlor.com
echo     Tecnico        : tecnico@conlor.com
echo     Cliente        : cliente@conlor.com
echo.
echo   Para FECHAR o aplicativo, feche as duas janelas
echo   "geoAG - Backend" e "geoAG - Frontend".
echo ==================================================
pause
