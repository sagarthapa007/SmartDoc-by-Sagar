@echo off
title 🚀 SmartDoc Enterprise - Dev Environment
echo.
echo ========================================
echo     SMARTDOC ENTERPRISE LAUNCHER
echo ========================================
echo.

REM --- Set working directories ---
set FRONTEND_DIR=D:\Users\sagar\Downloads-Asus\smartdoc-enterprise-phase2-ready\frontend
set BACKEND_DIR=D:\Users\sagar\Downloads-Asus\smartdoc-enterprise-phase2-ready\backend
set VENV_DIR=%BACKEND_DIR%\venv

REM --- Check Python ---
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.10+ and ensure "Add Python to PATH" is selected.
    pause
    exit /b
)
echo ✅ Python found.

REM --- Create virtual environment if missing ---
if not exist "%VENV_DIR%" (
    echo 🌀 Creating Python virtual environment...
    cd /d "%BACKEND_DIR%"
    python -m venv venv
)

REM --- Activate virtual environment ---
echo 🔁 Activating virtual environment...
call "%VENV_DIR%\Scripts\activate.bat"

REM --- Install dependencies if needed ---
echo 📦 Ensuring FastAPI + Uvicorn are installed...
pip install fastapi uvicorn pandas numpy --quiet

REM --- Start backend server ---
echo 🚀 Starting FastAPI backend on port 8000...
start "SmartDoc Backend" cmd /k "cd /d %BACKEND_DIR% && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

REM --- Wait a few seconds ---
timeout /t 5 >nul

REM --- Start frontend (root Vite app) ---
echo 🚀 Starting Vite frontend on port 5174...
start "SmartDoc Frontend" cmd /k "cd /d D:\Users\sagar\Downloads-Asus\smartdoc-enterprise-phase2-ready && npm run dev"


echo ========================================
echo ✅ SmartDoc Enterprise Running!
echo 🔗 Frontend: http://localhost:5174/
echo 🔗 Backend : http://127.0.0.1:8000/
echo ========================================
echo.
pause
