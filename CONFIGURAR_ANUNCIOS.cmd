@echo off
setlocal
cd /d "%~dp0"
if not exist ".env.local" (
  copy ".env.example" ".env.local" >nul
  echo Configuracao inicial criada em .env.local
)
echo.
echo Configure os IDs do AdSense e do AdMob neste arquivo.
echo Use os banners de teste durante o desenvolvimento Android.
echo.
notepad ".env.local"
