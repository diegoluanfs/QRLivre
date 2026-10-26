@echo off
setlocal
cd /d "%~dp0"
if not exist "node_modules" (
  call npm install
  if errorlevel 1 goto :erro
)
if exist "android\" (
  echo Sincronizando o projeto Android...
  call npm run android:sync
) else (
  echo Criando projeto Android nativo pela primeira vez...
  call npm run android:init
)
if errorlevel 1 goto :erro
call npm run android:open
if errorlevel 1 goto :erro
exit /b 0
:erro
echo.
echo Erro ao preparar o Android. Verifique Android Studio, SDK, Node.js e o log acima.
pause
exit /b 1
