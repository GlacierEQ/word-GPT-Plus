<#
.SYNOPSIS
    Runs automated tests for Word-GPT-Plus
.DESCRIPTION
    This script runs unit tests, integration tests, and Office add-in validation for Word-GPT-Plus
#>

# Set variables
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$manifestPath = Join-Path $repoRoot "manifest.xml"
$testResultsPath = Join-Path $repoRoot "test-results"
$errorCount = 0

# Create test results directory if it doesn't exist
if (-not (Test-Path $testResultsPath)) {
    New-Item -Path $testResultsPath -ItemType Directory | Out-Null
}

# Change to the repository root
Set-Location $repoRoot

# Check for required tools
Write-Host "Checking for required tools..." -ForegroundColor Yellow

try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    $errorCount++
}

try {
    $npmVersion = npm -v
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed or not in PATH" -ForegroundColor Red
    $errorCount++
}

# Run unit tests
Write-Host "Running unit tests..." -ForegroundColor Yellow
try {
    npm test -- --ci --reporters=default --reporters=jest-junit
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Unit tests failed" -ForegroundColor Red
        $errorCount++
    } else {
        Write-Host "✅ Unit tests passed" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error running unit tests: $_" -ForegroundColor Red
    $errorCount++
}

# Run ESLint
Write-Host "Running ESLint..." -ForegroundColor Yellow
try {
    npm run lint -- --format=junit --output-file=$testResultsPath\eslint-results.xml
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ESLint found issues" -ForegroundColor Red
        $errorCount++
    } else {
        Write-Host "✅ ESLint passed" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error running ESLint: $_" -ForegroundColor Red
    $errorCount++
}

# Validate the manifest
Write-Host "Validating Office Add-in manifest..." -ForegroundColor Yellow
try {
    # Check if office-addin-validator is installed
    $validator = npm list -g office-addin-validator
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Installing office-addin-validator..." -ForegroundColor Yellow
        npm install -g office-addin-validator
    }
    
    office-addin-validator validate $manifestPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Manifest validation failed" -ForegroundColor Red
        $errorCount++
    } else {
        Write-Host "✅ Manifest validation passed" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error validating manifest: $_" -ForegroundColor Red
    $errorCount++
}

# Check if Playwright is available for E2E tests
$hasPlaywright = Test-Path (Join-Path $repoRoot "node_modules\.bin\playwright")
if ($hasPlaywright) {
    Write-Host "Running E2E tests with Playwright..." -ForegroundColor Yellow
    try {
        npx playwright test
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ E2E tests failed" -ForegroundColor Red
            $errorCount++
        } else {
            Write-Host "✅ E2E tests passed" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Error running E2E tests: $_" -ForegroundColor Red
        $errorCount++
    }
} else {
    Write-Host "⚠️ Playwright not found, skipping E2E tests" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
if ($errorCount -gt 0) {
    Write-Host "❌ $errorCount test groups failed" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    exit 0
}
