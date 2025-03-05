<#
.SYNOPSIS
    Master automation script for Word-GPT-Plus
.DESCRIPTION
    This script automates the complete setup, build, and deployment process for Word-GPT-Plus
#>

param(
    [switch]$ForceRebuild,
    [switch]$SkipTests,
    [switch]$QuickDeploy
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges for sideloading into Word." -ForegroundColor Yellow
    Write-Host "Please restart the script as an administrator." -ForegroundColor Yellow
    exit 1
}

# Display header
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   WORD-GPT-PLUS AUTOMATION SYSTEM" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Prerequisites
Write-Host "STEP 1: Checking prerequisites..." -ForegroundColor Green

# Check for Node.js
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is required but not found!" -ForegroundColor Red
    Write-Host "Please install Node.js 18.x or later from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm -v
    Write-Host "✅ npm $npmVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is required but not found!" -ForegroundColor Red
    exit 1
}

# Check for Office
try {
    $officeInstallPath = Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Office\ClickToRun\Configuration" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty InstallPath
    if ($officeInstallPath) {
        Write-Host "✅ Microsoft Office found: $officeInstallPath" -ForegroundColor Green
    } else {
        throw "Office not found"
    }
} catch {
    Write-Host "⚠️ Microsoft Office installation could not be detected" -ForegroundColor Yellow
    Write-Host "The script will continue, but sideloading may fail if Word isn't installed." -ForegroundColor Yellow
}

# Step 2: Install dependencies
Write-Host "`nSTEP 2: Installing dependencies..." -ForegroundColor Green

# Check if node_modules exists and package.json has changed
$packageJsonPath = Join-Path -Path $repoRoot -ChildPath "package.json"
$packageLockPath = Join-Path -Path $repoRoot -ChildPath "package-lock.json"
$nodeModulesPath = Join-Path -Path $repoRoot -ChildPath "node_modules"

$installDeps = $ForceRebuild -or -not (Test-Path $nodeModulesPath)
if (-not $installDeps -and (Test-Path $packageJsonPath) -and (Test-Path $packageLockPath)) {
    $packageJsonTime = (Get-Item $packageJsonPath).LastWriteTime
    $packageLockTime = (Get-Item $packageLockPath).LastWriteTime
    $nodeModulesTime = (Get-Item $nodeModulesPath).LastWriteTime
    
    # Check if package.json was modified after node_modules was created
    if ($packageJsonTime -gt $nodeModulesTime -or $packageLockTime -gt $nodeModulesTime) {
        $installDeps = $true
    }
}

if ($installDeps) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    Set-Location $repoRoot
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed (use -ForceRebuild to force reinstall)" -ForegroundColor Green
}

# Step 3: Run tests (unless skipped)
if (-not $SkipTests) {
    Write-Host "`nSTEP 3: Running tests..." -ForegroundColor Green
    Set-Location $repoRoot
    npm test
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Tests failed! Continuing anyway, but you may want to fix tests." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Tests passed successfully" -ForegroundColor Green
    }
} else {
    Write-Host "`nSTEP 3: Tests skipped" -ForegroundColor Yellow
}

# Step 4: Create certificates if needed
Write-Host "`nSTEP 4: Setting up SSL certificates..." -ForegroundColor Green

$certsDir = Join-Path -Path $repoRoot -ChildPath "certs"
$certPath = Join-Path -Path $certsDir -ChildPath "localhost.crt"
$keyPath = Join-Path -Path $certsDir -ChildPath "localhost.key"

if (-not (Test-Path $certsDir)) {
    New-Item -Path $certsDir -ItemType Directory | Out-Null
}

if (-not (Test-Path $certPath) -or -not (Test-Path $keyPath)) {
    Write-Host "Creating self-signed certificates..." -ForegroundColor Yellow
    
    # Check if the create-cert.js exists
    $createCertPath = Join-Path -Path $scriptDir -ChildPath "create-cert.js"
    if (Test-Path $createCertPath) {
        node $createCertPath
    } else {
        # Create certificates with PowerShell if script doesn't exist
        $cert = New-SelfSignedCertificate -Subject "CN=localhost" -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1") -DnsName "localhost" -KeyUsage DigitalSignature -KeyAlgorithm RSA -KeyLength 2048 -CertStoreLocation "cert:\LocalMachine\My"
        
        # Export certificate
        $pwd = ConvertTo-SecureString -String "password" -Force -AsPlainText
        $path = "cert:\LocalMachine\My\$($cert.Thumbprint)"
        Export-PfxCertificate -Cert $path -FilePath (Join-Path $certsDir "localhost.pfx") -Password $pwd | Out-Null
        Export-Certificate -Cert $path -FilePath $certPath -Type CERT | Out-Null
        
        # Trust certificate
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store "Root", "LocalMachine"
        $store.Open("ReadWrite")
        $store.Add($cert)
        $store.Close()
        
        Write-Host "✅ Certificates created and trusted" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Certificates already exist" -ForegroundColor Green
}

# Step 5: Build the add-in
Write-Host "`nSTEP 5: Building the add-in..." -ForegroundColor Green
Set-Location $repoRoot

if ($QuickDeploy) {
    npm run dev -- --no-open &
    $devProcess = $LASTEXITCODE
    Write-Host "✅ Development server started (PID: $devProcess)" -ForegroundColor Green
    
    # Wait for server to start
    Write-Host "Waiting for development server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
} else {
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
}

# Step 6: Sideload into Word
Write-Host "`nSTEP 6: Sideloading add-in into Word..." -ForegroundColor Green

# Determine Office add-ins folder path
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
    Write-Host "❌ Could not find Office Add-ins folder" -ForegroundColor Red
    Write-Host "Please make sure Office is installed correctly" -ForegroundColor Red
    exit 1
}

# Create a subfolder for our add-in
$addInName = "WordGPTPlus"
$addInPath = Join-Path $addinFolder $addInName
if (-not (Test-Path $addInPath)) {
    New-Item -Path $addInPath -ItemType Directory | Out-Null
}

# Copy the manifest to the add-in folder
$manifestPath = Join-Path -Path $repoRoot -ChildPath "manifest.xml"
Copy-Item -Path $manifestPath -Destination $addInPath -Force
Write-Host "✅ Copied manifest to: $addInPath" -ForegroundColor Green

# Register the manifest for sideloading
$addInRegistryPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer\"

if (-not (Test-Path $addInRegistryPath)) {
    New-Item -Path $addInRegistryPath -Force | Out-Null
}

$manifestFullPath = Join-Path $addInPath "manifest.xml"

# Add registry entry for the add-in
New-ItemProperty -Path $addInRegistryPath -Name "WordGPTPlus" -Value $manifestFullPath -PropertyType String -Force | Out-Null
Write-Host "✅ Registered add-in in Windows Registry" -ForegroundColor Green

# Step 7: Launch Word if requested
$launchWord = Read-Host "Do you want to launch Word now? (y/n)"
if ($launchWord -eq 'y') {
    Write-Host "`nLaunching Microsoft Word..." -ForegroundColor Green
    Start-Process "winword"
    
    Write-Host @"
    
===============================================
    WORD-GPT-PLUS SETUP COMPLETE!
===============================================

To use Word-GPT-Plus:
1. In Word, go to Home tab
2. Click on the "Add-ins" button
3. Select "Word-GPT-Plus" from the dropdown

If you don't see the add-in, try:
- Insert > My Add-ins > Developer Add-ins > Word-GPT-Plus

For live development:
- Keep the terminal running
- Changes will reload automatically

===============================================
"@ -ForegroundColor Cyan
} else {
    Write-Host @"
    
===============================================
    WORD-GPT-PLUS SETUP COMPLETE!
===============================================

The add-in is now installed and ready to use.
Launch Word and access Word-GPT-Plus from the Insert menu.

===============================================
"@ -ForegroundColor Cyan
}

# Keep the script running if in dev mode
if ($QuickDeploy) {
    Write-Host "Development server is running. Press Ctrl+C to stop." -ForegroundColor Yellow
    try {
        while ($true) { Start-Sleep -Seconds 1 }
    } finally {
        Write-Host "Shutting down development server..." -ForegroundColor Yellow
    }
}
