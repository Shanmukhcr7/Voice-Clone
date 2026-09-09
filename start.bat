@echo off
echo Starting YouVoice Local Environment...

echo [1/2] Starting FastAPI Backend on port 8000...
start "YouVoice API Backend" cmd /k "venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting React Frontend on port 5173...
start "YouVoice Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo Application is starting up!
echo Opening http://localhost:5173/admin in your browser...
echo ========================================================
timeout /t 3 /nobreak > nul
start http://localhost:5173/admin
