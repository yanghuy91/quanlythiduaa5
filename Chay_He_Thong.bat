@echo off
title Quan Ly Ne Nep & Thi Dua Lop 10A5 - THPT So 2 Duc Pho
cd /d "%~dp0"

echo ======================================================================
echo    HE THONG QUAN LY NE NEP & THI DUA LOP 10A5 - CHINH THUC
echo    Truong THPT So 2 Duc Pho
echo ======================================================================
echo.

:: Giai phong cong 3000 neu co tien trinh cu dang chiem
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [1/2] Dang mo trinh duyet: http://localhost:3000 ...
start http://localhost:3000

echo [2/2] May chu he thong dang chay tren cong 3000 chuan.
echo (De dung may chu, thay/co chi can dong cua so nay)
echo.
node ./node_modules/vite/bin/vite.js --port=3000 --host=0.0.0.0
pause
