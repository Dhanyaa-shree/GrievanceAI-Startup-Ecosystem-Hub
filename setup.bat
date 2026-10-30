@echo off
chcp 65001 >nul
title GrievanceAI Setup
color 0A

echo ============================================================
echo            GRIEVANCEAI - COMPLETE SETUP
echo ============================================================
echo.

echo [1/4] Setting up MySQL database...
C:\xampp\mysql\bin\mysql -u root --port=3307 < database\schema.sql
if errorlevel 1 (
    echo [WARNING] MySQL import failed. Please check MySQL is running on port 3307.
    pause
    exit /b 1
)
echo [SUCCESS] Database setup complete!
echo.

echo [2/4] Installing Python dependencies...
cd backend
py -m pip install -r requirements.txt
echo.

echo [3/4] Installing Node dependencies...
cd ..\frontend
npm install
echo.

echo [4/4] Setup Complete!
echo.
echo ============================================================
echo            SETUP COMPLETED SUCCESSFULLY!
echo ============================================================
echo.
echo Next Steps:
echo -----------
echo 1. Start Backend: cd backend ^& py app.py
echo 2. Start Frontend: cd frontend ^& npm run dev
echo 3. Open: http://localhost:3000
echo.
echo Test Credentials:
echo -----------------
echo Founder Mobile: 9876543210
echo Admin Email: thubadmin@gmail.com
echo Admin Password: anything
echo.
pause