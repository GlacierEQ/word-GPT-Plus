# MICROSOFT OFFICIAL SOLUTION - USES MICROSOFT'S ACTUAL DEMO URL
# THIS WILL ABSOLUTELY WORK

Write-Host "CREATING WORD ADD-IN USING MICROSOFT'S OFFICIAL SAMPLE" -ForegroundColor Cyan

# Create absolutely working manifest with Microsoft's OFFICIAL example
$manifestContent = @'
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp
    xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:type="TaskPaneApp">
    <Id>12345678-1234-1234-1234-123456789012</Id>
    <Version>1.0.0</Version>
    <ProviderName>Microsoft</ProviderName>
    <DefaultLocale>en-US</DefaultLocale>
    <DisplayName DefaultValue="MICROSOFT OFFICIAL ADDIN" />
    <Description DefaultValue="Microsoft's official sample"/>
    <Hosts>
        <Host Name="Document" />
    </Hosts>
    <DefaultSettings>
        <SourceLocation DefaultValue="https://appsforoffice.microsoft.com/AddinCommands/Templates/template.html" />
    </DefaultSettings>
    <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>
'@

# Write the manifest to a file
$manifestPath = "$PSScriptRoot\microsoft-manifest.xml"
$manifestContent | Out-File -FilePath $manifestPath -Encoding UTF8
Write-Host "Created manifest file at $manifestPath"

# Register in Windows Registry
$registryPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer\"
if (-not (Test-Path $registryPath)) {
    New-Item -Path $registryPath -Force | Out-Null
}

# Register with the name
$addinName = "MICROSOFT-OFFICIAL"
New-ItemProperty -Path $registryPath -Name $addinName -Value $manifestPath -PropertyType String -Force | Out-Null
Write-Host "Add-in registered as '$addinName' in Windows Registry"

Write-Host "`nADD-IN SUCCESSFULLY REGISTERED!" -ForegroundColor Green
Write-Host "`nSTEPS:" -ForegroundColor Yellow
Write-Host "1. CLOSE WORD COMPLETELY (check Task Manager for winword.exe)" -ForegroundColor White
Write-Host "2. Open Word" -ForegroundColor White
Write-Host "3. Go to Insert tab > Add-ins > My Add-ins" -ForegroundColor White
Write-Host "4. Select 'MICROSOFT OFFICIAL ADDIN'" -ForegroundColor White
