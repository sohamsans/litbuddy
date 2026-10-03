@echo off
title LitBuddy - Autonomous Academic Literature Review & Vault
echo =======================================================================
echo   Starting LitBuddy (Autonomous Literature Engine & Document Vault)...
echo =======================================================================

:: Change to backend directory
cd /d "%~dp0backend"

:: Check virtual environment
if exist "..\.venv\Scripts\python.exe" (
    echo Using project virtual environment...
    "..\.venv\Scripts\python.exe" litbuddy_app.py
) else if exist ".venv\Scripts\python.exe" (
    echo Using local virtual environment...
    ".venv\Scripts\python.exe" litbuddy_app.py
) else (
    echo Python virtual environment not found in default paths, invoking system python...
    python litbuddy_app.py
)

pause
