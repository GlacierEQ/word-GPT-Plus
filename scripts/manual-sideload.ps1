# Manual sideloading script for Word-GPT-Plus

$manifestPath = Join-Path $PSScriptRoot ".." "manifest.xml" -Resolve
$addInName = "WordGPTPlus"

# Registry path for Office Add-ins
$registryPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer\"

# Create the registry path if it doesn't exist
if (-not (Test-Path $registryPath)) {
    New-Item -Path $registryPath -Force | Out-Null
    Write-Host "Created registry key for Office Add-ins"
}

# Register the add-in
New-ItemProperty -Path $registryPath -Name $addInName -Value $manifestPath -PropertyType String -Force | Out-Null

Write-Host "✅ Successfully registered Word-GPT-Plus for development"
Write-Host "The add-in should now appear in the 'My Add-ins' section in Word"
Write-Host "If you don't see it, restart Word and ensure the development server is running (npm run dev)"
