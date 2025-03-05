<#
.SYNOPSIS
    Automates the installation of Word-GPT-Plus for Microsoft Word
.DESCRIPTION
    This script builds the Word-GPT-Plus add-in and installs it to Microsoft Word
#>

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "Please run this script as Administrator"
    Exit
}

# Check for Node.js
try {
    $nodeVersion = node -v
    Write-Host "Found Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 18.x or later."
    Exit
}

# Set variables
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$manifestPath = Join-Path $repoRoot "manifest.xml"
$distPath = Join-Path $repoRoot "dist"

# Change to the repository root
Set-Location $repoRoot

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the project
Write-Host "Building the project..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if (-not (Test-Path $distPath)) {
    Write-Error "Build failed. Check the build logs for more information."
    Exit
}

# Determine Office add-ins folder
$officeVersion = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Office\ClickToRun\Configuration" -ErrorAction SilentlyContinue).VersionToReport
if (-not $officeVersion) {
    $officeVersion = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Office\16.0\Common\ProductVersion" -ErrorAction SilentlyContinue).LastProduct
}

Write-Host "Detected Office version: $officeVersion" -ForegroundColor Green

# Check for Office Add-ins folder paths
$addinFolders = @(
    "$env:USERPROFILE\AppData\Local\Microsoft\Office\16.0\Wef\",
    "$env:LOCALAPPDATA\Microsoft\Office\16.0\Wef\"
)

$addinFolder = $null
foreach ($folder in $addinFolders) {
    if (Test-Path $folder) {
        $addinFolder = $folder
        break
    }
}

if (-not $addinFolder) {
    Write-Error "Could not find the Office Add-ins folder."
    Exit
}

# Create a subfolder for our add-in
$addInName = "WordGPTPlus"
$addInPath = Join-Path $addinFolder $addInName
if (-not (Test-Path $addInPath)) {
    New-Item -Path $addInPath -ItemType Directory | Out-Null
}

# Copy the manifest to the add-in folder
Copy-Item -Path $manifestPath -Destination $addInPath -Force
Write-Host "Copied manifest to: $addInPath" -ForegroundColor Green

# Setup web server for local development
Write-Host "Setting up local development server..." -ForegroundColor Yellow

# Add hosts file entry for localhost
$hostsFile = "$env:windir\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsFile -Raw
if (-not ($hostsContent -match "127.0.0.1\s+localhost")) {
    Add-Content -Path $hostsFile -Value "`n127.0.0.1`tlocalhost" -Force
    Write-Host "Added localhost entry to hosts file" -ForegroundColor Green
}

# Configure SSL for local development
$certSubject = "CN=localhost"
$cert = Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object { $_.Subject -eq $certSubject }

if (-not $cert) {
    Write-Host "Creating self-signed certificate for localhost..." -ForegroundColor Yellow
    $cert = New-SelfSignedCertificate -Subject $certSubject -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1") -DnsName "localhost" -KeyUsage DigitalSignature -KeyAlgorithm RSA -KeyLength 2048 -CertStoreLocation "Cert:\LocalMachine\My"
    
    # Trust the certificate
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store "Root", "LocalMachine"
    $store.Open("ReadWrite")
    $store.Add($cert)
    $store.Close()
    
    Write-Host "Created and trusted self-signed certificate for localhost" -ForegroundColor Green
}

# Register the manifest for sideloading
Write-Host "Registering the add-in for Word..." -ForegroundColor Yellow

# Create registry key for the add-in
$addInRegistryPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer\".Replace("\", "\\")

if (-not (Test-Path $addInRegistryPath)) {
    New-Item -Path $addInRegistryPath -Force | Out-Null
}

$manifestFullPath = Join-Path $addInPath "manifest.xml"
$manifestFullPath = $manifestFullPath.Replace("\", "\\")

# Add registry entry for the add-in
New-ItemProperty -Path $addInRegistryPath -Name "WordGPTPlus" -Value $manifestFullPath -PropertyType String -Force | Out-Null
Write-Host "Registered add-in in Windows Registry" -ForegroundColor Green

# Update the manifest with the actual server URL
$manifestContent = Get-Content -Path $manifestPath -Raw
$manifestContent = $manifestContent.Replace("https://localhost:3000", "https://localhost:3000")
Set-Content -Path (Join-Path $addInPath "manifest.xml") -Value $manifestContent

Write-Host "Installation completed successfully!" -ForegroundColor Green
Write-Host "To use the add-in:"
Write-Host "1. Run 'npm run dev' to start the development server"
Write-Host "2. Open Word and go to Insert > My Add-ins > Developer Add-ins > Word-GPT-Plus"
