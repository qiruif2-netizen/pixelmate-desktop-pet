@echo off
cd /d "%~dp0"

if not exist "node_modules" call npm install
if errorlevel 1 goto failed

echo [PixelMate] Starting manager preview at http://127.0.0.1:1420/
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:1420/'"
call npm run dev -- --host 127.0.0.1
exit /b 0

:failed
echo [PixelMate] Dependency installation failed.
pause
exit /b 1

