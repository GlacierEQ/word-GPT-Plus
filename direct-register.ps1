# Direct registry method for when the UI is hard to find

# Create a very simple manifest file first
$manifestContent = @'
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp
    xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:type="TaskPaneApp">
    <Id>cf735245-102a-45fc-9c55-86a41692a2bf</Id>
    <Version>1.0.0</Version>
    <ProviderName>Test</ProviderName>
    <DefaultLocale>en-US</DefaultLocale>
    <DisplayName DefaultValue="FINDME-TEST-ADDIN" />
    <Description DefaultValue="Test Add-in"/>
    <DefaultSettings>
        <SourceLocation DefaultValue="https://localhost:3000/taskpane.html" />
    </DefaultSettings>
    <Hosts>
        <Host Name="Document" />
    </Hosts>
    <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>
'@

# Save manifest to a temporary file
$tempManifestPath = Join-Path $env:TEMP "test-manifest.xml"
$manifestContent | Out-File -FilePath $tempManifestPath -Encoding UTF8

Write-Host "Created test manifest at: $tempManifestPath" -ForegroundColor Green

# Register in registry
$registryPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer\"

# Create registry key if it doesn't exist
if (-not (Test-Path $registryPath)) {
    New-Item -Path $registryPath -Force | Out-Null
}

# Register the add-in with a very obvious name
New-ItemProperty -Path $registryPath -Name "FINDME-TEST-ADDIN" -Value $tempManifestPath -PropertyType String -Force | Out-Null

Write-Host "✅ Registered test add-in: FINDME-TEST-ADDIN" -ForegroundColor Green
Write-Host "Now follow these steps:" -ForegroundColor Cyan
Write-Host "1. Start the server: node basic-server.js" -ForegroundColor White
Write-Host "2. Open Word and create a new document" -ForegroundColor White
Write-Host "3. Close and reopen Word if it was already open" -ForegroundColor White
Write-Host "4. In Word, click Insert tab > Add-ins dropdown > My Add-ins" -ForegroundColor White
Write-Host "5. Look for FINDME-TEST-ADDIN in the DEVELOPER ADD-INS section" -ForegroundColor Yellow
Write-Host "   (You may need to click on DEVELOPER ADD-INS or SHARED FOLDER tabs)" -ForegroundColor Yellow
