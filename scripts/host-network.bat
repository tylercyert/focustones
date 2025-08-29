@echo off
echo 🔍 Detecting your local IP address...
echo.

REM Get local IP address (Windows)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)

:found_ip
if "%LOCAL_IP%"=="" (
    echo ❌ Could not detect local IP address automatically
    echo Please run 'ipconfig' to find your IP manually
    pause
    exit /b 1
)

REM Remove leading space
set LOCAL_IP=%LOCAL_IP: =%

echo ✅ Your local IP address is: %LOCAL_IP%
echo.
echo 🌐 Building and hosting FocusTones on your local network...
echo 📱 You can access it from your phone at: http://%LOCAL_IP%:3000
echo 💻 Or from your computer at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Build and host the site
npm run host
