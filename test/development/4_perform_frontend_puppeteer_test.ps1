<#
Perform Frontend Puppeteer Tests
This script runs frontend tests using Node.js and Puppeteer.

Usage:
1. Open PowerShell as Administrator
2. Navigate to the test\development directory
3. Run: .\4_perform_frontend_puppeteer_test.ps1
#>

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Define colors for output
$Green = "`e[92m"
$Red = "`e[91m"
$Yellow = "`e[93m"
$Reset = "`e[0m"

# Project directories
$RootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$TestDir = $PSScriptRoot

# Test report file
$ReportFile = Join-Path $TestDir "frontend_test_report_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

# Function to write colored output and to report file
function Write-TestOutput {
    param(
        [string]$Message,
        [string]$ColorCode = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $formattedMessage = "[$timestamp] $Message"
    
    # Write to console with color
    if ($ColorCode -eq "Green") {
        Write-Host $formattedMessage -ForegroundColor Green
    } elseif ($ColorCode -eq "Red") {
        Write-Host $formattedMessage -ForegroundColor Red
    } elseif ($ColorCode -eq "Yellow") {
        Write-Host $formattedMessage -ForegroundColor Yellow
    } else {
        Write-Host $formattedMessage -ForegroundColor White
    }
    
    # Write to report file without color codes
    Add-Content -Path $ReportFile -Value $formattedMessage
}

# Function to check if Node.js is available
function Test-NodeAvailable {
    try {
        $nodeVersion = node --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-TestOutput "Node.js found: $nodeVersion" -ColorCode "Green"
            return $true
        } else {
            Write-TestOutput "Node.js not found or not in PATH" -ColorCode "Red"
            return $false
        }
    } catch {
        Write-TestOutput "Error checking Node.js: $_" -ColorCode "Red"
        return $false
    }
}

# Function to check if npm packages are installed
function Test-NpmPackages {
    Write-TestOutput "Checking npm packages..." -ColorCode "Yellow"
    
    try {
        Set-Location $TestDir
        
        # Check if node_modules exists
        if (Test-Path "node_modules") {
            Write-TestOutput "node_modules directory exists" -ColorCode "Green"
            return $true
        } else {
            Write-TestOutput "node_modules directory not found, installing packages..." -ColorCode "Yellow"
            
            # Install packages
            $installOutput = npm install 2>&1
            $installOutput | ForEach-Object {
                Write-TestOutput $_ -ColorCode "White"
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-TestOutput "npm packages installed successfully" -ColorCode "Green"
                return $true
            } else {
                Write-TestOutput "Failed to install npm packages" -ColorCode "Red"
                return $false
            }
        }
    } catch {
        Write-TestOutput "Error checking npm packages: $_" -ColorCode "Red"
        return $false
    }
}

# Function to run frontend tests
function Run-FrontendTests {
    Write-TestOutput "Running frontend tests..." -ColorCode "Yellow"
    
    $frontendTestFiles = @(
        "test_login.js",
        "test_user_management.js",
        # "test_worker_process_operations.js",
        "test_new_tables.js"
    )
    
    $allPassed = $true
    $testResults = @()
    
    foreach ($testFile in $frontendTestFiles) {
        $testPath = Join-Path $TestDir $testFile
        
        if (Test-Path $testPath) {
            Write-TestOutput "Running frontend test: ${testFile}" -ColorCode "Yellow"
            try {
                $result = & node $testPath 2>&1
                
                # Write result to report
                $result | ForEach-Object { Write-TestOutput $_ }
                
                # Check if test passed
                if ($result -match "✅ PASS" -or $result -match "TEST PASSED") {
                    Write-TestOutput "Frontend test ${testFile} passed!" -ColorCode "Green"
                    $testResults += @{ Name = $testFile; Passed = $true }
                } else {
                    Write-TestOutput "Frontend test ${testFile} failed!" -ColorCode "Red"
                    $testResults += @{ Name = $testFile; Passed = $false }
                    $allPassed = $false
                }
            } catch {
                $errMsg = $_.Exception.Message
                Write-TestOutput "Error running frontend test ${testFile}: ${errMsg}" -ColorCode "Red"
                $testResults += @{ Name = $testFile; Passed = $false }
                $allPassed = $false
            }
        } else {
            Write-TestOutput "Frontend test file not found: ${testFile}" -ColorCode "Yellow"
            $testResults += @{ Name = $testFile; Passed = $false }
            $allPassed = $false
        }
    }
    
    return @{
        AllPassed = $allPassed
        Results = $testResults
    }
}

# Function to generate final report
function Generate-FinalReport {
    param(
        [hashtable]$TestResults
    )
    
    Write-TestOutput "`n" + "="*60 -ColorCode "White"
    Write-TestOutput "FRONTEND TEST REPORT" -ColorCode "White"
    Write-TestOutput "="*60 -ColorCode "White"
    
    Write-TestOutput "Test Results Summary:" -ColorCode "White"
    
    foreach ($result in $TestResults.Results) {
        $status = if ($result.Passed) { "✅ PASS" } else { "❌ FAIL" }
        Write-TestOutput "  ${result.Name}: $status" -ColorCode "White"
    }
    
    if ($TestResults.AllPassed) {
        Write-TestOutput "`n🎉 All frontend tests passed!" -ColorCode "Green"
    } else {
        Write-TestOutput "`n❌ Some frontend tests failed!" -ColorCode "Red"
    }
    
    Write-TestOutput "Report saved to: ${ReportFile}" -ColorCode "White"
    Write-TestOutput "="*60 -ColorCode "White"
}

# Main script execution
try {
    Write-TestOutput "Starting Frontend Test Script" -ColorCode "White" -Append $false
    Write-TestOutput "Project Root: ${RootDir}" -ColorCode "White"
    Write-TestOutput "Frontend Directory: ${FrontendDir}" -ColorCode "White"
    Write-TestOutput "Test Directory: ${TestDir}" -ColorCode "White"
    Write-TestOutput "="*60 -ColorCode "White"
    
    # Step 1: Check Node.js availability
    Write-TestOutput "`n1. Checking Node.js environment..." -ColorCode "Yellow"
    if (-not (Test-NodeAvailable)) {
        throw "Node.js is required but not found. Please install Node.js and add it to PATH."
    }
    
    # Step 2: Check npm packages
    Write-TestOutput "`n2. Checking npm packages..." -ColorCode "Yellow"
    if (-not (Test-NpmPackages)) {
        throw "Failed to install required npm packages."
    }
    
    # Step 3: Run frontend tests
    Write-TestOutput "`n3. Running frontend tests..." -ColorCode "Yellow"
    $testResults = Run-FrontendTests
    
    # Step 4: Generate final report
    Generate-FinalReport -TestResults $testResults
    
    if ($testResults.AllPassed) {
        Write-TestOutput "Frontend test suite completed successfully!" -ColorCode "Green"
        exit 0
    } else {
        Write-TestOutput "Frontend test suite completed with failures!" -ColorCode "Red"
        exit 1
    }
    
} catch {
    $errMsg = $_.Exception.Message
    $stackTrace = $_.ScriptStackTrace
    Write-TestOutput "Test suite failed with error: ${errMsg}" -ColorCode "Red"
    Write-TestOutput $stackTrace -ColorCode "Red"
    
    exit 1
}
