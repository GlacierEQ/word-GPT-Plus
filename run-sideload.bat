@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\manual-sideload.ps1"
echo.
echo If the script completed successfully, restart Word and check for the add-in
pause
