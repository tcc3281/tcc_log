@echo off
echo 🚀 Starting Local Development...

:: Start database
echo 🐘 Starting PostgreSQL database...
docker-compose up db -d

:: Wait a bit
timeout /t 5 /nobreak >nul

:: Install dependencies
echo 📦 Installing dependencies...
python -m pip install -r requirements.txt

:: Show info
echo.
echo ✅ Ready! Database is running on localhost:5432
echo 🔥 Starting backend...
echo.

:: Start backend
python run_backend.py

pause 