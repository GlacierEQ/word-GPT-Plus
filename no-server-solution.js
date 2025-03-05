/**
 * No-Server Solution for Word-GPT-Plus
 * This script sets up the add-in without requiring a continuous server
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('\n🚀 WORD-GPT-PLUS NO-SERVER SETUP\n');

// Create folders
const DIST_DIR = './dist';
if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

// Create a local HTML file that works without a server
const htmlContent = `<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Word GPT Plus</title>
        <script src="https://appsforoffice.microsoft.com/lib/1.1/hosted/office.js"></script>
        <script>
            Office.onReady(function() {
                document.getElementById('status').textContent = 'Connected to Word!';
            });
            
            function insertText() {
                Office.context.document.setSelectedDataAsync('Hello from Word GPT Plus!',
                    function (result) {
                        document.getElementById('result').textContent =
                            result.status === Office.AsyncResultStatus.Succeeded ?
                                'Text inserted successfully!' : 'Error: ' + result.error.message;
                    }
                );
            }
        </script>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h1 { color: #2C5F2D; }
            button { 
                padding: 12px 20px;
                background: #2C5F2D;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                transition: background 0.3s;
            }
            button:hover { background: #1E3F1F; }
            #status { font-weight: bold; color: #2C5F2D; }
            #result { margin-top: 15px; font-style: italic; }
        </style>
    </head>
    <body>
        <h1>Word GPT Plus</h1>
        <p>Status: <span id="status">Loading...</span></p>
        <button onclick="insertText()">Insert Sample Text</button>
        <p id="result"></p>
    </body>
</html>`;
fs.writeFileSync(path.join(DIST_DIR, 'taskpane.html'), htmlContent);
console.log('✅ Created HTML file');

// Create a local file URI path
const currentDir = __dirname.replace(/\\/g, '/');
const fileUri = `file:///${currentDir}/dist/taskpane.html`;
console.log(`File URI path: ${fileUri}`);

// Create manifest with file:// URL
const manifestContent = `<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp
    xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:type="TaskPaneApp">
    <Id>12345678-1234-1234-1234-123456789012</Id>
    <Version>1.0.0</Version>
    <ProviderName>Word GPT Plus</ProviderName>
    <DefaultLocale>en-US</DefaultLocale>
    <DisplayName DefaultValue="Word GPT Plus (Local)" />
    <Description DefaultValue="AI-powered assistant for Microsoft Word" />
    <Hosts>
        <Host Name="Document" />
    </Hosts>
    <DefaultSettings>
        <SourceLocation DefaultValue="${fileUri}" />
    </DefaultSettings>
    <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>`;
fs.writeFileSync('./manifest.xml', manifestContent);
console.log('✅ Created manifest with local file path');

// Create PS1 script (with correct PowerShell string formatting)
const psScript = `
$manifestPath = "${path.resolve('./manifest.xml').replace(/\\/g, '\\\\')}";
$registryPath = "HKCU:\\Software\\Microsoft\\Office\\16.0\\WEF\\Developer\\";

if (-not(Test-Path $registryPath)) {
    New-Item -Path $registryPath -Force | Out-Null;
}

New-ItemProperty -Path $registryPath -Name "WordGPTPlusLocal" -Value $manifestPath -PropertyType String -Force | Out-Null;

Write-Host "Add-in registered in registry!";
Write-Host "";
Write-Host "Next steps:";
Write-Host "1. COMPLETELY close and restart Word";
Write-Host "2. In Word: Insert tab > Add-ins > My Add-ins > Look for 'Word GPT Plus (Local)'";
`;
fs.writeFileSync('./register.ps1', psScript);
console.log('✅ Created registration script');

// Create a simple batch file for one-click setup
const batchContent = `@echo off
echo Running PowerShell registration script...
powershell -ExecutionPolicy Bypass -File "%~dp0register.ps1"
echo.
echo Setup complete! Please restart Word and check Insert > Add-ins > My Add-ins
pause
`;
fs.writeFileSync('./one-click-setup.bat', batchContent);
console.log('✅ Created one-click setup batch file');

// Try to run the PowerShell script automatically
console.log('\nAttempting to register add-in...');
try {
    execSync('powershell -ExecutionPolicy Bypass -File ./register.ps1', { stdio: 'inherit' });
    console.log('\n✅ ADD-IN SUCCESSFULLY REGISTERED!\n');
    console.log('Now:');
    console.log('1. Close Word completely if it\'s open');
    console.log('2. Start Word');
    console.log('3. Go to Insert tab > Add-ins > My Add-ins');
    console.log('4. Look for "Word GPT Plus (Local)"');
} catch (error) {
    console.log('\n⚠️ Could not automatically register the add-in.');
    console.log('Please run the one-click-setup.bat file or use PowerShell to run register.ps1 manually.');
}
