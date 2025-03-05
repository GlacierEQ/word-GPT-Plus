
$manifestPath = "C:\\Users\\casey\\OneDrive\\Documents\\GitHub\\word-GPT-Plus\\manifest.xml";
$registryPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer\";
if (-not (Test-Path $registryPath)) {
    New-Item -Path $registryPath -Force | Out-Null;
}
New-ItemProperty -Path $registryPath -Name "TestAddin" -Value $manifestPath -PropertyType String -Force | Out-Null;
Write-Host "Add-in registered in registry!";
