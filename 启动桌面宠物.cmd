@echo off
cd /d "%~dp0"

tasklist /FI "IMAGENAME eq pixelmate.exe" 2>nul | find /I "pixelmate.exe" >nul
if not errorlevel 1 goto already_running

if exist "C:\BuildTools\VC\Auxiliary\Build\vcvars64.bat" call "C:\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
if exist "%ProgramFiles%\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" call "%ProgramFiles%\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

where cargo >nul 2>nul
if errorlevel 1 goto missing_rust

if not exist "node_modules" call npm install
if errorlevel 1 goto failed

call npm run tauri dev
if errorlevel 1 goto failed
goto end

:missing_rust
echo [PixelMate] Rust and Windows C++ Build Tools are not installed.
echo Follow docs\Windows-setup.md, then run this file again.
pause
exit /b 1

:already_running
echo [PixelMate] The desktop pet is already running.
echo Use the orange cat icon in the Windows system tray to open it.
pause
exit /b 0

:failed
echo [PixelMate] Startup failed. Review the error messages above.
pause
exit /b 1

:end
pause
