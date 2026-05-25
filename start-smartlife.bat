@echo off
cd /d "%~dp0Myweb"
echo Starting SmartLife Web Server...
start "" cmd /c "timeout /t 2 && start http://localhost:8080"
npx -y http-server -a localhost -p 8080
