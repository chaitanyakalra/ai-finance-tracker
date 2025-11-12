@echo off
REM Deployment script for FinanceGuard AI (Windows)
REM This script helps you deploy the built frontend to your server

SET SERVER_IP=13.200.222.100
SET SERVER_USER=ubuntu
SET WEB_ROOT=/var/www/html

echo.
echo ========================================
echo   FinanceGuard AI - Deployment Helper
echo ========================================
echo.

REM Check if dist folder exists
if not exist "frontend\dist" (
    echo [ERROR] frontend\dist folder not found!
    echo Please run: cd frontend ^&^& npm run build
    echo.
    pause
    exit /b 1
)

echo [OK] Build files found in frontend\dist
echo.
echo Your built files are ready in: frontend\dist\
echo.
echo ========================================
echo   Deployment Options:
echo ========================================
echo.
echo Option 1: Using SCP (if you have SSH access)
echo    scp -r frontend/dist/* %SERVER_USER%@%SERVER_IP%:%WEB_ROOT%/
echo.
echo Option 2: Using FileZilla or WinSCP
echo    1. Open FileZilla/WinSCP
echo    2. Connect to: %SERVER_IP%
echo    3. Navigate to: %WEB_ROOT%
echo    4. Upload all files from: frontend\dist\
echo.
echo Option 3: Manual Upload
echo    1. Compress frontend\dist\ to a ZIP file
echo    2. Upload ZIP to your server
echo    3. Extract on server to web root
echo.
echo ========================================
echo.
echo After uploading, visit: http://%SERVER_IP%
echo.
echo If changes don't appear:
echo   - Clear browser cache (Ctrl+Shift+R)
echo   - Open in incognito mode
echo   - Wait 30 seconds for server to update
echo.
pause
