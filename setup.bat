@echo off
echo Starting Word-GPT-Plus setup...
echo.

echo Installing dependencies...
npm install

echo.
echo Running setup script...
start cmd /k "node setup.js"

echo.
echo Waiting for server to start...
timeout /t 3 /nobreak > nul

echo Opening browser to accept certificate...
start https://localhost:3000

echo.
echo Waiting for browser...
timeout /t 5 /nobreak > nul

echo Registering add-in...
powershell -ExecutionPolicy Bypass -File ./register.ps1

echo.
echo Setup complete! Please completely close and restart Word.
echo When Word reopens, go to: Insert tab > Add-ins > My Add-ins > Test Word Add-in
echo.
pause
