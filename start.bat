@echo off
echo Starting Voice Clone SaaS...

echo Starting FastAPI Backend...
start "Voice Clone API" cmd /k "venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting GPU/CPU AI Worker...
start "AI Generation Worker" cmd /k "venv\Scripts\python.exe worker\main.py"

echo.
echo ========================================================
echo Application is starting up!
echo The App and Dashboard are available at: http://localhost:8000
echo ========================================================
echo Wait for the AI Worker terminal to say "Model loaded successfully" before generating voices.
pause
