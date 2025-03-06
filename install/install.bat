@echo off
echo ===================================================
echo Word GPT Plus Installer
echo ===================================================
echo.

:: Check for administrative privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
  echo Error: This installation requires administrative privileges.
  echo Please right-click on this file and select "Run as Administrator".
  echo.
  pause
  exit /b 1
)

echo Checking prerequisites...

:: Check for Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
  echo Error: Node.js is not installed or not in PATH.
  echo Please install Node.js from https://nodejs.org/ and try again.
  echo.
  pause
  exit /b 1
)

:: Check for npm
where npm >nul 2>&1
if %errorLevel% neq 0 (
  echo Error: npm is not installed or not in PATH.
  echo Please install Node.js (which includes npm) from https://nodejs.org/ and try again.
  echo.
  pause
  exit /b 1
)

:: Get node and npm versions
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo Node version: %NODE_VERSION%
echo NPM version: %NPM_VERSION%
echo.

:: Create logs directory
if not exist "..\logs" mkdir "..\logs"

echo Starting installation...
echo Installation log will be saved to ..\logs\install.log
echo.

:: Run the Node.js installation script
node setup.js

if %errorLevel% neq 0 (
  echo.
  echo Installation encountered errors. Please check the log file.
  echo If you need help, please contact support@wordgptplus.com
  echo.
  pause
  exit /b 1
) else (
  echo.
  echo Installation completed successfully!
  echo.
  echo To use Word GPT Plus:
  echo 1. Open Microsoft Word
  echo 2. Look for Word GPT Plus in the Home tab
  echo 3. Click to open the panel and get started
  echo.
  pause
  exit /b 0
)
