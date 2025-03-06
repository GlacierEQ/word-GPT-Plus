@echo off
echo ===================================
echo Word GPT Plus Installation Helper
echo ===================================

echo Checking for admin privileges...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Admin privileges confirmed.
) else (
    echo This script requires administrator privileges.
    echo Please right-click and select 'Run as administrator'.
    pause
    exit /b 1
)

echo Creating target directory...
if not exist "%APPDATA%\Microsoft\Word\STARTUP\Add-ins\WordGPTPlus" (
    mkdir "%APPDATA%\Microsoft\Word\STARTUP\Add-ins\WordGPTPlus"
)

echo Copying files...
xcopy /s /y ".\*" "%APPDATA%\Microsoft\Word\STARTUP\Add-ins\WordGPTPlus\"

echo Registering add-in...
reg add "HKCU\Software\Microsoft\Office\Word\Addins\WordGPTPlus" /v "Description" /t REG_SZ /d "Advanced AI assistant for Microsoft Word" /f
reg add "HKCU\Software\Microsoft\Office\Word\Addins\WordGPTPlus" /v "FriendlyName" /t REG_SZ /d "Word GPT Plus" /f
reg add "HKCU\Software\Microsoft\Office\Word\Addins\WordGPTPlus" /v "LoadBehavior" /t REG_DWORD /d 3 /f
reg add "HKCU\Software\Microsoft\Office\Word\Addins\WordGPTPlus" /v "Manifest" /t REG_SZ /d "%APPDATA%\Microsoft\Word\STARTUP\Add-ins\WordGPTPlus\Manifest.xml" /f

echo Installation complete!
echo Please restart Microsoft Word to use Word GPT Plus.
pause
