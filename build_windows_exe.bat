@echo off
title Build LitBuddy.exe for Windows
echo =======================================================================
echo   Building LitBuddy Windows Standalone Executable (.exe)...
echo =======================================================================

cd /d "%~dp0"

echo [1/3] Building frontend production bundle (Vite + React)...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b %ERRORLEVEL%
)

cd ..
echo [2/3] Checking PyInstaller in virtual environment...
if exist "backend\.venv\Scripts\pyinstaller.exe" (
    set PYINSTALLER=backend\.venv\Scripts\pyinstaller.exe
) else if exist ".venv\Scripts\pyinstaller.exe" (
    set PYINSTALLER=.venv\Scripts\pyinstaller.exe
) else if exist "backend\.venv\Scripts\pip.exe" (
    echo Installing pyinstaller in backend\.venv...
    backend\.venv\Scripts\pip install pyinstaller
    set PYINSTALLER=backend\.venv\Scripts\pyinstaller.exe
) else (
    echo Installing pyinstaller with pip...
    pip install pyinstaller
    set PYINSTALLER=pyinstaller
)

echo [3/3] Compiling LitBuddy.exe with PyInstaller...
"%PYINSTALLER%" --clean -y litbuddy.spec

if %ERRORLEVEL% EQU 0 (
    echo =======================================================================
    echo   BUILD SUCCESSFUL!
    echo   Standalone executable created at: dist\LitBuddy.exe
    echo =======================================================================
) else (
    echo [ERROR] PyInstaller build failed!
)

pause
