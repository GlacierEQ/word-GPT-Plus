<#
.SYNOPSIS
    Auto-updater and Word integrator for Word-GPT-Plus
.DESCRIPTION
    Checks for updates, downloads them, and seamlessly integrates the add-in with Word
    while preserving user settings and handling rollbacks if needed
#>

param(
    [switch]$Silent,
    [switch]$ForceUpdate,
    [string]$UpdateSource = "https://api.github.com/repos/yourusername/word-gpt-plus/releases/latest"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$backupDir = Join-Path $repoRoot "backups"
$configFile = Join-Path $repoRoot "update-config.json"
$installLog = Join-Path $scriptDir "update-log.txt"

# Helper function for logging
function Log-Message {
    param(
        [string]$Message,
        [string]$Color = "White",
        [switch]$LogOnly
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    
    # Write to log file
    Add-Content -Path $installLog -Value $logMessage
    
    # Write to console if not silent
    if (-not $LogOnly -and -not $Silent) {
        Write-Host $Message -ForegroundColor $Color
    }
}

# Helper function to show progress
function Show-Progress {
    param(
        [string]$Activity,
        [string]$Status,
        [int]$PercentComplete
    )
    
    if (-not $Silent) {
        Write-Progress -Activity $Activity -Status $Status -PercentComplete $PercentComplete
    } else {
        Log-Message "$Activity - $Status ($PercentComplete%)" -LogOnly
    }
}

# Initialize
Log-Message "Starting Word-GPT-Plus Auto-Updater" -Color Cyan
Log-Message "Repository root: $repoRoot"

# Ensure backup directory exists
if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory | Out-Null
    Log-Message "Created backup directory: $backupDir"
}

# Load update configuration
$config = @{
    lastCheck = [datetime]::MinValue
    currentVersion = "0.0.0"
    updateChannel = "stable"
    autoUpdate = $true
    checkInterval = 86400 # 24 hours in seconds
}

if (Test-Path $configFile) {
    try {
        $savedConfig = Get-Content -Path $configFile | ConvertFrom-Json
        $config.lastCheck = [datetime]::Parse($savedConfig.lastCheck)
        $config.currentVersion = $savedConfig.currentVersion
        $config.updateChannel = $savedConfig.updateChannel
        $config.autoUpdate = $savedConfig.autoUpdate
        $config.checkInterval = $savedConfig.checkInterval
        
        Log-Message "Loaded update configuration. Current version: $($config.currentVersion)"
    } catch {
        Log-Message "Failed to load update configuration. Using defaults." -Color Yellow
    }
} else {
    Log-Message "No existing update configuration. Creating default." -Color Yellow
    
    # Try to detect current version from package.json
    $packageJsonPath = Join-Path $repoRoot "package.json"
    if (Test-Path $packageJsonPath) {
        try {
            $packageJson = Get-Content -Path $packageJsonPath | ConvertFrom-Json
            $config.currentVersion = $packageJson.version
            Log-Message "Detected current version from package.json: $($config.currentVersion)"
        } catch {
            Log-Message "Failed to read version from package.json" -Color Yellow
        }
    }
    
    # Save initial config
    $config | ConvertTo-Json | Set-Content -Path $configFile
}

# Function to check if we should check for updates
function Should-CheckUpdates {
    $now = Get-Date
    $timeSinceLastCheck = ($now - $config.lastCheck).TotalSeconds
    
    if ($ForceUpdate) {
        Log-Message "Force update enabled - checking for updates"
        return $true
    }
    
    if ($timeSinceLastCheck -ge $config.checkInterval) {
        Log-Message "Time since last check ($([int]$timeSinceLastCheck) seconds) exceeds interval ($($config.checkInterval) seconds)"
        return $true
    }
    
    Log-Message "Update check not needed yet" -Color Gray
    return $false
}

# Check for updates
function Get-LatestVersion {
    try {
        Log-Message "Checking for updates from $UpdateSource"
        
        # Set TLS 1.2 for compatibility with GitHub API
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        
        # Add a user agent to avoid 403 errors
        $headers = @{
            "User-Agent" = "Word-GPT-Plus-Updater/1.0"
        }
        
        $response = Invoke-RestMethod -Uri $UpdateSource -Headers $headers
        
        if ($response) {
            $latestVersion = $response.tag_name -replace 'v', ''
            $downloadUrl = $response.assets | Where-Object { $_.name -like "*.zip" } | Select-Object -First 1 -ExpandProperty browser_download_url
            
            if (-not $downloadUrl) {
                $downloadUrl = $response.zipball_url
            }
            
            Log-Message "Latest version: $latestVersion, Download URL: $downloadUrl"
            
            return @{
                Version = $latestVersion
                DownloadUrl = $downloadUrl
                ReleaseNotes = $response.body
                PublishedAt = $response.published_at
            }
        }
        
        Log-Message "No version information found" -Color Yellow
        return $null
    } catch {
        Log-Message "Error checking for updates: $_" -Color Red
        return $null
    }
}

# Compare versions
function Is-NewerVersion {
    param(
        [string]$CurrentVersion,
        [string]$LatestVersion
    )
    
    try {
        $current = [Version]$CurrentVersion
        $latest = [Version]$LatestVersion
        
        return $latest -gt $current
    } catch {
        Log-Message "Error comparing versions: $_" -Color Yellow
        # If parsing fails, use string comparison
        return $LatestVersion -ne $CurrentVersion
    }
}

# Download and apply update
function Update-AddIn {
    param(
        [string]$DownloadUrl,
        [string]$Version
    )
    
    $tempFile = Join-Path $env:TEMP "word-gpt-plus-update.zip"
    $extractPath = Join-Path $env:TEMP "word-gpt-plus-update"
    $backupPath = Join-Path $backupDir "backup-$($config.currentVersion)-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    # Create extraction directory if it doesn't exist
    if (-not (Test-Path $extractPath)) {
        New-Item -Path $extractPath -ItemType Directory -Force | Out-Null
    } else {
        # Clean it if it exists
        Remove-Item -Path $extractPath\* -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    try {
        # Step 1: Download update
        Log-Message "Downloading update from $DownloadUrl" -Color Cyan
        Show-Progress -Activity "Updating Word-GPT-Plus" -Status "Downloading update..." -PercentComplete 20
        
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $tempFile
        
        if (-not (Test-Path $tempFile)) {
            throw "Failed to download update file"
        }
        
        # Step 2: Backup current version
        Log-Message "Backing up current version to $backupPath" -Color Cyan
        Show-Progress -Activity "Updating Word-GPT-Plus" -Status "Backing up current version..." -PercentComplete 40
        
        # Create backup directory
        New-Item -Path $backupPath -ItemType Directory -Force | Out-Null
        
        # Copy important files to backup
        $importantDirs = @("src", "assets", "scripts", "dist")
        $importantFiles = @("package.json", "manifest.xml", "webpack.config.js", "tsconfig.json")
        
        foreach ($dir in $importantDirs) {
            $sourcePath = Join-Path $repoRoot $dir
            $targetPath = Join-Path $backupPath $dir
            
            if (Test-Path $sourcePath) {
                Copy-Item -Path $sourcePath -Destination $targetPath -Recurse -Force
            }
        }
        
        foreach ($file in $importantFiles) {
            $sourcePath = Join-Path $repoRoot $file
            $targetPath = Join-Path $backupPath $file
            
            if (Test-Path $sourcePath) {
                Copy-Item -Path $sourcePath -Destination $targetPath -Force
            }
        }
        
        # Step 3: Extract update
        Log-Message "Extracting update file" -Color Cyan
        Show-Progress -Activity "Updating Word-GPT-Plus" -Status "Extracting update..." -PercentComplete 60
        
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($tempFile, $extractPath)
        
        # Determine actual content directory (GitHub archives contain a top-level directory)
        $contentDir = Get-ChildItem -Path $extractPath | Where-Object { $_.PSIsContainer } | Select-Object -First 1
        if ($contentDir) {
            $contentPath = $contentDir.FullName
        } else {
            $contentPath = $extractPath
        }
        
        # Step 4: Apply update
        Log-Message "Applying update" -Color Cyan
        Show-Progress -Activity "Updating Word-GPT-Plus" -Status "Applying update..." -PercentComplete 80
        
        # Copy files from update to repository
        $excludeFiles = @(".git", "node_modules", "certs", "backups", "update-config.json")
        
        foreach ($item in Get-ChildItem -Path $contentPath) {
            $relativePath = $item.Name
            $sourcePath = $item.FullName
            $targetPath = Join-Path $repoRoot $relativePath
            
            if ($excludeFiles -notcontains $relativePath) {
                if ($item.PSIsContainer) {
                    # Handle directories
                    if (Test-Path $targetPath) {
                        # Remove target directory if it exists
                        Remove-Item -Path $targetPath -Recurse -Force
                    }
                    
                    # Copy directory
                    Copy-Item -Path $sourcePath -Destination $targetPath -Recurse -Force
                } else {
                    # Copy file
                    Copy-Item -Path $sourcePath -Destination $targetPath -Force
                }
            }
        }
        
        # Step 5: Update configuration
        $config.currentVersion = $Version
        $config.lastCheck = Get-Date
        $config | ConvertTo-Json | Set-Content -Path $configFile
        
        Log-Message "Update to version $Version completed successfully!" -Color Green
        return $true
    } catch {
        Log-Message "Error applying update: $_" -Color Red
        
        # Attempt rollback
        if (Test-Path $backupPath) {
            Log-Message "Rolling back to previous version" -Color Yellow
            try {
                # Apply the backup
                $excludeFiles = @(".git", "node_modules", "certs", "backups", "update-config.json")
                
                foreach ($item in Get-ChildItem -Path $backupPath) {
                    $relativePath = $item.Name
                    $sourcePath = $item.FullName
                    $targetPath = Join-Path $repoRoot $relativePath
                    
                    if ($excludeFiles -notcontains $relativePath) {
                        if (Test-Path $targetPath) {
                            Remove-Item -Path $targetPath -Recurse -Force -ErrorAction SilentlyContinue
                        }
                        
                        Copy-Item -Path $sourcePath -Destination $targetPath -Recurse -Force
                    }
                }
                
                Log-Message "Rollback completed successfully" -Color Green
            } catch {
                Log-Message "Error during rollback: $_" -Color Red
                Log-Message "Manual restoration may be required from backup at: $backupPath" -Color Red
            }
        }
        
        return $false
    } finally {
        # Clean up temp files
        if (Test-Path $tempFile) {
            Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
        }
        
        if (Test-Path $extractPath) {
            Remove-Item -Path $extractPath -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# Main update process
if (Should-CheckUpdates) {
    $latestVersion = Get-LatestVersion
    
    if ($latestVersion -and (Is-NewerVersion -CurrentVersion $config.currentVersion -LatestVersion $latestVersion.Version)) {
        Log-Message "New version available: $($latestVersion.Version) (Current: $($config.currentVersion))" -Color Green
        
        # Display release notes
        if (-not $Silent) {
            Write-Host "`nRelease Notes:" -ForegroundColor Cyan
            Write-Host $latestVersion.ReleaseNotes -ForegroundColor White
            Write-Host ""
        }
        
        $shouldUpdate = $ForceUpdate -or $Silent -or $config.autoUpdate
        
        if (-not $Silent -and -not $shouldUpdate) {
            $response = Read-Host "Do you want to update to version $($latestVersion.Version)? (Y/n)"
            $shouldUpdate = $response -eq "" -or $response -eq "y" -or $response -eq "Y"
        }
        
        if ($shouldUpdate) {
            $success = Update-AddIn -DownloadUrl $latestVersion.DownloadUrl -Version $latestVersion.Version
            
            if ($success) {
                # Run npm install to update dependencies
                Log-Message "Installing dependencies..." -Color Cyan
                Set-Location $repoRoot
                & npm install
                
                # Run post-update script if available
                $postUpdateScript = Join-Path $scriptDir "post-update.js"
                if (Test-Path $postUpdateScript) {
                    Log-Message "Running post-update script..." -Color Cyan
                    & node $postUpdateScript
                }
                
                # Check if Word is running
                $wordProcess = Get-Process | Where-Object { $_.ProcessName -eq "WINWORD" }
                if ($wordProcess) {
                    Log-Message "Microsoft Word is currently running." -Color Yellow
                    if (-not $Silent) {
                        $closeWord = Read-Host "Would you like to restart Word to apply changes? (y/N)"
                        if ($closeWord -eq "y" -or $closeWord -eq "Y") {
                            $wordProcess | ForEach-Object { $_.CloseMainWindow() }
                            Start-Sleep -Seconds 2
                            Start-Process "winword"
                        }
                    } else {
                        Log-Message "Please restart Word to apply changes." -Color Yellow
                    }
                }
                
                Log-Message "Update process completed successfully!" -Color Green
            } else {
                Log-Message "Update failed. Please try again later or update manually." -Color Red
            }
        } else {
            Log-Message "Update skipped by user." -Color Yellow
            
            # Update last check time anyway
            $config.lastCheck = Get-Date
            $config | ConvertTo-Json | Set-Content -Path $configFile
        }
    } else {
        Log-Message "You have the latest version: $($config.currentVersion)" -Color Green
        
        # Update last check time
        $config.lastCheck = Get-Date
        $config | ConvertTo-Json | Set-Content -Path $configFile
    }
} else {
    Log-Message "Skipping update check - last check was recent" -Color Gray
}

# Integration with Word (registration & sideloading)
Function Register-WordAddIn {
    Log-Message "Checking Word integration..." -Color Cyan
    
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
        Log-Message "❌ Could not find Office Add-ins folder" -Color Red
        return $false
    }

    # Create a subfolder for our add-in
    $addInName = "WordGPTPlus"
    $addInPath = Join-Path $addinFolder $addInName
    if (-not (Test-Path $addInPath)) {
        New-Item -Path $addInPath -ItemType Directory | Out-Null
        Log-Message "Created add-in folder: $addInPath" -Color Green
    }

    # Copy the manifest to the add-in folder
    $manifestPath = Join-Path -Path $repoRoot -ChildPath "manifest.xml"
    Copy-Item -Path $manifestPath -Destination $addInPath -Force
    Log-Message "✅ Copied manifest to: $addInPath" -Color Green

    # Register the manifest for sideloading
    $addInRegistryPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer\"

    if (-not (Test-Path $addInRegistryPath)) {
        New-Item -Path $addInRegistryPath -Force | Out-Null
    }

    $manifestFullPath = Join-Path $addInPath "manifest.xml"

    # Add registry entry for the add-in
    New-ItemProperty -Path $addInRegistryPath -Name "WordGPTPlus" -Value $manifestFullPath -PropertyType String -Force | Out-Null
    Log-Message "✅ Word integration completed successfully" -Color Green
    return $true
}

# Perform Word integration
$integrationResult = Register-WordAddIn

if ($integrationResult) {
    Log-Message "Word-GPT-Plus is ready to use!" -Color Green
} else {
    Log-Message "Word integration failed. Try running the script as administrator." -Color Red
}

Log-Message "Auto-Updater completed" -Color Cyan
