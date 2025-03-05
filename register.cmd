@echo off
echo Word GPT Plus Installer
echo ====================
echo.

:: Check if running with administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with administrator privileges - good!
) else (
    echo This script requires administrator privileges.
    echo Please right-click and select "Run as administrator".
    pause
    exit /b 1
)

echo Installing Word GPT Plus add-in...

:: Get current directory
set "CURRENT_DIR=%~dp0"
set "MANIFEST_PATH=%CURRENT_DIR%manifest.xml"

:: Create manifest file if it doesn't exist
if not exist "%MANIFEST_PATH%" (
    echo Creating manifest file...
    (
        echo ^<?xml version="1.0" encoding="UTF-8"?^>
        echo ^<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1" 
        echo           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        echo           xsi:type="TaskPaneApp"^>
        echo   ^<Id^>%random%-%random%-%random%-%random%^</Id^>
        echo   ^<Version^>1.0.0.0^</Version^>
        echo   ^<ProviderName^>Word GPT Plus^</ProviderName^>
        echo   ^<DefaultLocale^>en-US^</DefaultLocale^>
        echo   ^<DisplayName DefaultValue="Word GPT Plus" /^>
        echo   ^<Description DefaultValue="Integrate AI directly into Microsoft Word" /^>
        echo   ^<IconUrl DefaultValue="https://localhost:3000/assets/icon-32.png" /^>
        echo   ^<HighResolutionIconUrl DefaultValue="https://localhost:3000/assets/icon-80.png" /^>
        echo   ^<SupportUrl DefaultValue="https://github.com/Kuingsmile/word-GPT-Plus" /^>
        echo   ^<AppDomains^>
        echo     ^<AppDomain^>https://localhost:3000^</AppDomain^>
        echo   ^</AppDomains^>
        echo   ^<Hosts^>
        echo     ^<Host Name="Document" /^>
        echo   ^</Hosts^>
        echo   ^<DefaultSettings^>
        echo     ^<SourceLocation DefaultValue="https://localhost:3000/dist/enhanced-taskpane.html" /^>
        echo   ^</DefaultSettings^>
        echo   ^<Permissions^>ReadWriteDocument^</Permissions^>
        echo ^</OfficeApp^>
    ) > "%MANIFEST_PATH%"
)

:: Register the add-in
echo Registering add-in with Word...
powershell -ExecutionPolicy Bypass -Command "$manifestPath = '%MANIFEST_PATH:\=\\%'; $wdTrustedCatalogPath = '$env:APPDATA\Microsoft\Excel\XLSTART'; if (-not (Test-Path $wdTrustedCatalogPath)) { New-Item -Path $wdTrustedCatalogPath -ItemType Directory -Force | Out-Null }; Copy-Item -Path $manifestPath -Destination $wdTrustedCatalogPath -Force; Write-Host 'Add-in registered successfully!'"

echo.
echo Installation completed!
echo.
echo To use Word GPT Plus:
echo 1. Open Word
echo 2. Go to Insert tab
echo 3. Click on "My Add-ins" 
echo 4. Find "Word GPT Plus" and click to open it
echo.
pause
