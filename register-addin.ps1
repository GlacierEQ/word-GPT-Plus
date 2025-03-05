# PowerShell script to register the Word GPT Plus add-in

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$manifestPath = Join-Path $scriptDir "manifest.xml"
$registryPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer\"

Write-Host ""
Write-Host "================================================="
Write-Host "          WORD GPT PLUS - ADD-IN INSTALLER       "
Write-Host "================================================="
Write-Host ""

# Create the HTML file
$distFolder = Join-Path $scriptDir "dist"
if (-not (Test-Path $distFolder)) {
    New-Item -ItemType Directory -Path $distFolder -Force | Out-Null
    Write-Host "✓ Created dist folder"
}

$htmlPath = Join-Path $distFolder "taskpane.html"
$htmlContent = @'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Word GPT Plus</title>
    <script src="https://appsforoffice.microsoft.com/lib/1.1/hosted/office.js"></script>
    <script>
        Office.onReady(function() {
            document.getElementById("status").textContent = "Connected to Word!";
        });
        
        function insertText() {
            Office.context.document.setSelectedDataAsync("Hello from Word GPT Plus!",
                function (result) {
                    document.getElementById("result").textContent =
                        result.status === Office.AsyncResultStatus.Succeeded ?
                            "Text inserted successfully!" : "Error: " + result.error.message;
                }
            );
        }
    </script>
    <style>
        body { font-family: "Segoe UI", Arial, sans-serif; margin: 20px; line-height: 1.6; }
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
</html>
'@

Set-Content -Path $htmlPath -Value $htmlContent -Force
Write-Host "✓ Created HTML interface file"

# Create the manifest file
$fileUri = "file:///$($scriptDir.Replace('\', '/'))/dist/taskpane.html"

$manifestContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp
    xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:type="TaskPaneApp">
    <Id>bf42a789-3391-4479-9d5f-23f73e864ef7</Id>
    <Version>1.0.0</Version>
    <ProviderName>Word GPT Plus</ProviderName>
    <DefaultLocale>en-US</DefaultLocale>
    <DisplayName DefaultValue="Word GPT Plus" />
    <Description DefaultValue="AI-powered assistant for Microsoft Word" />
    <Hosts>
        <Host Name="Document" />
    </Hosts>
    <DefaultSettings>
        <SourceLocation DefaultValue="$fileUri" />
    </DefaultSettings>
    <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>
"@

Set-Content -Path $manifestPath -Value $manifestContent -Force
Write-Host "✓ Created manifest file"

# Create registry key if it doesn't exist
if (-not (Test-Path $registryPath)) {
    Write-Host "Creating registry key..."
    New-Item -Path $registryPath -Force | Out-Null
}

# Register the add-in
New-ItemProperty -Path $registryPath -Name "WordGPTPlus" -Value $manifestPath -PropertyType String -Force | Out-Null

# Verify registration
$registered = Get-ItemProperty -Path $registryPath -Name "WordGPTPlus" -ErrorAction SilentlyContinue
if ($registered) {
    Write-Host "✓ Registration successful!" -ForegroundColor Green
} else {
    Write-Host "× Registration failed. Please try running as administrator." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue
Write-Host "               INSTALLATION COMPLETE               " -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "To use Word GPT Plus:" -ForegroundColor Yellow
Write-Host "1. Close Word completely if it's running" -ForegroundColor Yellow
Write-Host "2. Start Word" -ForegroundColor Yellow
Write-Host "3. Go to Insert tab > Add-ins > My Add-ins" -ForegroundColor Yellow
Write-Host "4. Look for 'Word GPT Plus'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
