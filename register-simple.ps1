
$manifestPath = "C:\\Users\\casey\\OneDrive\\Documents\\GitHub\\word-GPT-Plus\\manifest.xml";
$registryPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer\";

if (-not (Test-Path $registryPath)) {
    New-Item -Path $registryPath -Force | Out-Null;
}

New-ItemProperty -Path $registryPath -Name "SimpleSuperAddin" -Value $manifestPath -PropertyType String -Force | Out-Null;

Write-Host "✅ Add-in registered in registry. Now:";
Write-Host "1. Start the server with: node super-simple-start.js --serve";
Write-Host "2. Open Word, go to Insert tab > Add-ins > My Add-ins";
Write-Host "3. Look for 'Super Simple Add-in'";
