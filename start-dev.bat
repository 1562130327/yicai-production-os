@echo off
title Yicai Production OS

set PATH=D:\npm-global;%PATH%

echo ========================================
echo   Yicai Production OS - Starting...
echo ========================================
echo.

echo [1/2] Starting backend...
start "Yicai-Backend" cmd /k "set PATH=D:\npm-global;%%PATH%% && cd /d D:\溢彩 && pnpm dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting frontend...
start "Yicai-Frontend" cmd /k "set PATH=D:\npm-global;%%PATH%% && cd /d D:\溢彩\client && pnpm dev"

echo.
echo   Backend: http://localhost:3000
echo   Frontend: http://localhost:5173
echo.
echo   Open http://localhost:5173 in your browser
echo.
pause
