@echo off
echo Starting Local Admin Dashboard...
cd ..

echo Starting FastAPI Backend...
start "Admin Backend API" cmd /k "venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting React Frontend (Admin Mode)...
cd frontend
set VITE_API_URL=http://localhost:8000
set VITE_ENABLE_ADMIN=true
start "Admin Frontend UI" cmd /k "npm run dev"

echo Waiting for servers to boot up...
timeout /t 5 /nobreak >nul

echo Opening Admin Dashboard in your browser...
start http://localhost:5173/admin

