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
set NPM_ERRO=%errorlevel%
echo.

REM A instalacao e considerada bem-sucedida quando a pasta "node_modules"
REM foi criada. Verificamos a pasta em vez de confiar apenas no codigo de
REM saida do npm, pois avisos ("deprecated"/"warn") NAO impedem o uso.
if not exist "node_modules" (
  echo ============================================================
  echo [ERRO] Nao foi possivel instalar as dependencias.
  echo ============================================================
  echo.
  echo   Isto NAO exige compilador nem "Visual Studio Build Tools":
  echo   o sistema usa um banco de dados 100%% em JavaScript.
  echo.
  echo   Causas mais comuns e como resolver:
  echo.
  echo     1^) Sem acesso a internet no momento do download.
  echo        - Conecte-se a internet e rode o "instalar.bat" de novo.
  echo.
  echo     2^) Antivirus, firewall ou proxy corporativo bloqueando o npm.
  echo        - Libere o acesso ou use outra rede e tente novamente.
  echo.
  echo     3^) Node.js muito antigo.
  echo        - Instale a versao LTS: https://nodejs.org/pt-br/download
  echo.
  echo   Detalhe tecnico: npm terminou com o codigo %NPM_ERRO%.
  echo   Um log completo fica em: %%AppData%%\npm-cache\_logs
  echo.
  pause
  exit /b 1
)

if not %NPM_ERRO%==0 (
  echo [AVISO] O npm exibiu avisos durante a instalacao, mas as dependencias
  echo         foram instaladas. Continuando...
  echo.
)

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
