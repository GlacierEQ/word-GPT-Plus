<#
.SYNOPSIS
    Uninstalls Word-GPT-Plus from Microsoft Word
.DESCRIPTION
    Removes Word-GPT-Plus add-in from Word, including registry entries and cached files
#>

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges." -ForegroundColor Yellow
    Write-Host "Please restart the script as an administrator." -ForegroundColor Yellow
    exit 1
}

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   WORD-GPT-PLUS UNINSTALLATION" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Word is running
$wordProcess = Get-Process | Where-Object { $_.ProcessName -eq "WINWORD" }
if ($wordProcess) {
    Write-Host "Microsoft Word is currently running. Please close Word before continuing." -ForegroundColor Yellow
    $closeWord = Read-Host "Would you like to close Word now? (y/n)"
    if ($closeWord -eq 'y') {
        Write-Host "Closing Word..." -ForegroundColor Yellow
        $wordProcess | ForEach-Object { $_.CloseMainWindow() }
        Start-Sleep -Seconds 2
        
        # If Word didn't close gracefully, kill the process
        $wordProcess = Get-Process | Where-Object { $_.ProcessName -eq "WINWORD" }
        if ($wordProcess) {
            Write-Host "Forcing Word to close..." -ForegroundColor Yellow
            $wordProcess | ForEach-Object { $_.Kill() }
            Start-Sleep -Seconds 2
        }
    } else {
        Write-Host "Cannot continue while Word is running." -ForegroundColor Red
        exit 1
    }
}

# Step 2: Remove dev server if running
Write-Host "Checking if development server is running..." -ForegroundColor Yellow
$nodeProcess = Get-Process | Where-Object { $_.ProcessName -eq "node" }
if ($nodeProcess) {
    Write-Host "Stopping development server..." -ForegroundColor Yellow
    $nodeProcess | ForEach-Object { $_.Kill() }
    Start-Sleep -Seconds 2
}

# Step 3: Remove registry entries
Write-Host "Removing registry entries..." -ForegroundColor Yellow
$regPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer\"
if (Test-Path $regPath) {
    try {
        Remove-ItemProperty -Path $regPath -Name "WordGPTPlus" -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Registry entry removed" -ForegroundColor Green
    }
    catch {
        Write-Host "Registry entry not found or could not be removed" -ForegroundColor Yellow
    }
}

# Step 4: Remove add-in files
$addinFolders = @(
    "$env:USERPROFILE\AppData\Local\Microsoft\Office\16.0\Wef\",
    "$env:LOCALAPPDATA\Microsoft\Office\16.0\Wef\"
)

foreach ($folder in $addinFolders) {
    $addInPath = Join-Path $folder "WordGPTPlus"
    if (Test-Path $addInPath) {
        Write-Host "Removing add-in files from $addInPath..." -ForegroundColor Yellow
        Remove-Item -Path $addInPath -Recurse -Force
        Write-Host "✅ Add-in files removed" -ForegroundColor Green
    }
}

# Step 5: Clean Office Cache (optional)
$clearCache = Read-Host "Do you want to clear Office web add-ins cache? (y/n)"
if ($clearCache -eq 'y') {
    Write-Host "Clearing Office web add-ins cache..." -ForegroundColor Yellow
    $cacheFolders = @(
        "$env:LOCALAPPDATA\Microsoft\Office\16.0\Wef\",
        "$env:USERPROFILE\AppData\Local\Microsoft\Office\16.0\Wef\WebCache\"
    )

    foreach ($folder in $cacheFolders) {
        if (Test-Path $folder) {
            try {
                Get-ChildItem -Path $folder -Recurse | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "✅ Cache cleared from $folder" -ForegroundColor Green
            } catch {
                Write-Host "⚠️ Could not clear all cache files from $folder" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host "`nUninstallation completed successfully!" -ForegroundColor Green
Write-Host "Word-GPT-Plus has been removed from Microsoft Word." -ForegroundColor Green
Write-Host "Project files remain intact in the repository." -ForegroundColor Green
