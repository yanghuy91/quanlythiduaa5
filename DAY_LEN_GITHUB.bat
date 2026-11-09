@echo off
title Day du an len GitHub - Lop 10A5
cd /d "%~dp0"

echo ======================================================================
echo    CONG CU TU DONG DAY MA NGUON LEN GITHUB - LOP 10A5
echo    Truong THPT So 2 Duc Pho
echo ======================================================================
echo.
set /p REPO_URL="Dan duong link GitHub Repository cua thay/co vao day roi bam Enter: "

if "%REPO_URL%"=="" (
    echo Ban chua nhap link GitHub!
    pause
    exit /b
)

set GIT_CMD="C:\Users\zbook15\AppData\Local\github-copilot-git-2.56.0-2\cmd\git.exe"

echo.
echo [1/3] Dang ket noi voi GitHub Repository...
%GIT_CMD% remote remove origin >nul 2>&1
%GIT_CMD% remote add origin %REPO_URL%

echo [2/3] Dang dong bo nhanh chinh (main)...
%GIT_CMD% branch -M main

echo [3/3] Dang day ma nguon len GitHub (Push)...
%GIT_CMD% push -u origin main

echo.
echo ======================================================================
echo    HOAN TAT! MA NGUON DA DUOC LUU TREN GITHUB AN TOAN!
echo ======================================================================
pause
