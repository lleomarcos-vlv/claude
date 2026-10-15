@echo off
setlocal
title JP Aluminios - Sistema Comercial
set "PASTA=%~dp0"
set "URL=file:///%PASTA:\=/%index.html"
rem Usa Chrome ou Edge. Os dados ficam sempre no mesmo navegador/usuario: abra sempre pelo mesmo atalho.
set "NAV="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "NAV=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined NAV if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "NAV=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined NAV if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "NAV=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined NAV if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "NAV=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined NAV if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "NAV=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if defined NAV (
  start "" "%NAV%" "%URL%"
) else (
  echo Chrome ou Edge nao encontrado. Abra o arquivo index.html manualmente em um deles.
  pause
)
endlocal
