@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js nao encontrado. Instale Node.js 22 LTS e execute novamente.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 goto :erro
)
echo Abrindo servidor de desenvolvimento...
call npm run dev
if errorlevel 1 goto :erro
exit /b 0
:erro
echo.
echo Nao foi possivel executar o projeto. Confira a mensagem de erro acima.
pause
exit /b 1
