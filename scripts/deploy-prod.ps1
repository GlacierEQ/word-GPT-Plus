<#
.SYNOPSIS
    Deploys Word-GPT-Plus to production
.DESCRIPTION
    This script builds Word-GPT-Plus and deploys it to production hosting
.PARAMETER Version
    The version number to deploy (e.g. 1.0.0)
#>

param (
    [Parameter(Mandatory = $true)]
    [string]$Version
)

# Set variables
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$distPath = Join-Path $repoRoot "dist"
$manifestPath = Join-Path $repoRoot "manifest.xml"
$prodManifestPath = Join-Path $repoRoot "manifest-prod.xml"
$packagePath = Join-Path $repoRoot "packages"

# Verify version format
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Error "Invalid version format. Expected format: X.Y.Z (e.g. 1.0.0)"
    Exit 1
}

# Change to the repository root
Set-Location $repoRoot

# Clean directories
Write-Host "Cleaning build directories..." -ForegroundColor Yellow
if (Test-Path $distPath) { Remove-Item -Path $distPath -Recurse -Force }
if (Test-Path $packagePath) { Remove-Item -Path $packagePath -Recurse -Force }
New-Item -Path $packagePath -ItemType Directory | Out-Null

# Update package.json version
Write-Host "Updating version to $Version..." -ForegroundColor Yellow
$packageJsonPath = Join-Path $repoRoot "package.json"
$packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
$packageJson.version = $Version
$packageJson | ConvertTo-Json -Depth 100 | Set-Content -Path $packageJsonPath

# Run tests first
Write-Host "Running tests..." -ForegroundColor Yellow
$testScript = Join-Path $scriptDir "run-tests.ps1"
& $testScript
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed. Aborting deployment."
    Exit 1
}

# Build for production
Write-Host "Building project for production..." -ForegroundColor Yellow
npm run build

# Check if build successful
if (-not (Test-Path $distPath)) {
    Write-Error "Build failed. No dist directory found."
    Exit 1
}

# Create production manifest
Write-Host "Creating production manifest..." -ForegroundColor Yellow
$manifestContent = Get-Content -Path $manifestPath -Raw

# Update URLs in manifest to production URLs
$manifestContent = $manifestContent -replace "https://localhost:3000", "https://word-gpt-plus.azurewebsites.net"
$manifestContent = $manifestContent -replace "<Version>.*</Version>", "<Version>$Version</Version>"

# Save production manifest
Set-Content -Path $prodManifestPath -Value $manifestContent

# Create the add-in package
Write-Host "Creating add-in package..." -ForegroundColor Yellow
$zipFileName = "Word-GPT-Plus-$Version.zip"
$zipFilePath = Join-Path $packagePath $zipFileName

# Copy dist content and manifest to temporary package directory
$packageTmpDir = Join-Path $packagePath "tmp"
New-Item -Path $packageTmpDir -ItemType Directory | Out-Null
Copy-Item -Path "$distPath\*" -Destination $packageTmpDir -Recurse
Copy-Item -Path $prodManifestPath -Destination (Join-Path $packageTmpDir "manifest.xml")

# Create the zip file
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($packageTmpDir, $zipFilePath)

# Clean up tmp directory
Remove-Item -Path $packageTmpDir -Recurse -Force

# Get SHA256 hash of the package
$hash = Get-FileHash -Path $zipFilePath -Algorithm SHA256
$hash = $hash.Hash.ToLower()

Write-Host "`nDeployment package created successfully!" -ForegroundColor Green
Write-Host "Package: $zipFilePath" -ForegroundColor Cyan
Write-Host "Version: $Version" -ForegroundColor Cyan
Write-Host "SHA256: $hash" -ForegroundColor Cyan

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Upload the package to your hosting provider"
Write-Host "2. Update any documentation with the new version number"
Write-Host "3. Tag this release in git: git tag v$Version && git push --tags"
Write-Host "4. Submit to the Office Store if desired"
