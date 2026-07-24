@echo off
setlocal
cd /d "%~dp0"
title geoAG - Instalar tudo

echo ==================================================
echo   geoAG - Instalar tudo
echo ==================================================
echo.
echo Este script instala o Java 21 e o Node (se faltarem),
echo compila o backend e baixa as dependencias do frontend.
echo Requer Windows 10/11 (winget). Precisa de internet.
echo.

set "NEED_RESTART=0"

where winget >nul 2>nul
set "HAS_WINGET=%errorlevel%"

echo [..] Verificando o Java...
where java >nul 2>nul
if %errorlevel%==0 (
  echo [OK] Java encontrado.
) else (
  echo [..] Java nao encontrado.
  if "%HAS_WINGET%"=="0" (
    echo      Instalando o Java 21 via winget...
    winget install -e --id EclipseAdoptium.Temurin.21.JDK --accept-source-agreements --accept-package-agreements
    set "NEED_RESTART=1"
  ) else (
    echo      [!] winget indisponivel. Instale o Java 21 manualmente: https://adoptium.net/
    pause
    exit /b 1
  )
)

echo [..] Verificando o Node...
where node >nul 2>nul
if %errorlevel%==0 (
  echo [OK] Node encontrado.
) else (
  echo [..] Node nao encontrado.
  if "%HAS_WINGET%"=="0" (
    echo      Instalando o Node LTS via winget...
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    set "NEED_RESTART=1"
  ) else (
    echo      [!] winget indisponivel. Instale o Node manualmente: https://nodejs.org/
    pause
    exit /b 1
  )
)

if "%NEED_RESTART%"=="1" (
  echo.
  echo ==================================================
  echo   Java e/ou Node foram instalados agora.
  echo   FECHE esta janela e rode "instalar-tudo.bat" DE NOVO
  echo   para concluir a compilacao.
  echo ==================================================
  pause
  exit /b 0
)

echo.
echo [..] Compilando o backend (pode demorar alguns minutos na 1a vez)...
pushd backend
call mvnw.cmd -B -ntp -DskipTests package
if errorlevel 1 (
  echo [ERRO] Falha ao compilar o backend. Confirme que o Java 21 esta instalado.
  popd
  pause
  exit /b 1
)
rem Copia BINARIA (/b) - copy com curinga usa modo texto e corrompe o jar
for %%f in ("target\kairos-erp-*.jar") do copy /y /b "%%~f" "app.jar" >nul
popd
echo [OK] Backend compilado.

echo.
echo [..] Instalando as dependencias do frontend...
pushd frontend
call npm install
if errorlevel 1 (
  echo [ERRO] Falha no npm install.
  popd
  pause
  exit /b 1
)
popd
echo [OK] Frontend pronto.

echo.
echo ==================================================
echo   TUDO INSTALADO!
echo   Agora rode "iniciar.bat" para usar.
echo ==================================================
pause
