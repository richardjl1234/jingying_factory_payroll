<#
Perform Backend API Tests
This script runs backend API tests using the Python test script.

Usage:
1. Open PowerShell as Administrator
2. Navigate to the test\development directory
3. Run: .\3_perform_backend_api_test.ps1
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
$ReportFile = Join-Path $TestDir "backend_test_report_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

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

# Function to check if Python is available
function Test-PythonAvailable {
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-TestOutput "Python found: $pythonVersion" -ColorCode "Green"
            return $true
        } else {
            Write-TestOutput "Python not found or not in PATH" -ColorCode "Red"
            return $false
        }
    } catch {
        Write-TestOutput "Error checking Python: $_" -ColorCode "Red"
        return $false
    }
}

# Function to run backend API tests
function Run-BackendTests {
    Write-TestOutput "Running backend API tests..." -ColorCode "Yellow"
    
    Set-Location $TestDir
    
    try {
        # Temporarily change error action preference to Continue to avoid treating Python output as errors
        $originalErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        
        # Check if virtual environment exists
        $venvPath = Join-Path $BackendDir "venv"
        $venvPython = Join-Path $venvPath "Scripts\python.exe"
        
        if (Test-Path $venvPython) {
            Write-TestOutput "Using virtual environment Python: $venvPython" -ColorCode "Green"
            $pythonCommand = $venvPython
        } else {
            Write-TestOutput "Virtual environment not found, using system Python" -ColorCode "Yellow"
            $pythonCommand = "python"
        }
        
        # Run the Python script and capture all output
        $result = & $pythonCommand test_api.py 2>&1
        
        # Restore original error action preference
        $ErrorActionPreference = $originalErrorAction
        
        # Write result to report
        $result | ForEach-Object { Write-TestOutput $_ }
        
        # Check if tests passed by examining exit code
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-TestOutput "Backend API tests passed!" -ColorCode "Green"
            return $true
        } else {
            Write-TestOutput "Backend API tests failed with exit code: $exitCode" -ColorCode "Red"
            return $false
        }
    } catch {
        # Restore original error action preference in case of exception
        $ErrorActionPreference = $originalErrorAction
        $errMsg = $_.Exception.Message
        Write-TestOutput "Error running backend API tests: ${errMsg}" -ColorCode "Red"
        return $false
    }
}

# Function to generate final report
function Generate-FinalReport {
    param(
        [bool]$TestsPassed
    )
    
    Write-TestOutput "`n" + "="*60 -ColorCode "White"
    Write-TestOutput "BACKEND API TEST REPORT" -ColorCode "White"
    Write-TestOutput "="*60 -ColorCode "White"
    
    Write-TestOutput "Test Results Summary:" -ColorCode "White"
    Write-TestOutput "Backend API Tests: ${TestsPassed}" -ColorCode "White"
    
    if ($TestsPassed) {
        Write-TestOutput "`n🎉 All backend API tests passed!" -ColorCode "Green"
    } else {
        Write-TestOutput "`n❌ Backend API tests failed!" -ColorCode "Red"
    }
    
    Write-TestOutput "Report saved to: ${ReportFile}" -ColorCode "White"
    Write-TestOutput "="*60 -ColorCode "White"
}

# Main script execution
try {
    Write-TestOutput "Starting Backend API Test Script" -ColorCode "White" -Append $false
    Write-TestOutput "Project Root: ${RootDir}" -ColorCode "White"
    Write-TestOutput "Backend Directory: ${BackendDir}" -ColorCode "White"
    Write-TestOutput "Test Directory: ${TestDir}" -ColorCode "White"
    Write-TestOutput "="*60 -ColorCode "White"
    
    # Step 1: Check Python availability
    Write-TestOutput "`n1. Checking Python environment..." -ColorCode "Yellow"
    if (-not (Test-PythonAvailable)) {
        throw "Python is required but not found. Please install Python and add it to PATH."
    }
    
    # Step 2: Run backend API tests
    Write-TestOutput "`n2. Running backend API tests..." -ColorCode "Yellow"
    $testsPassed = Run-BackendTests
    
    # Step 3: Generate final report
    Generate-FinalReport -TestsPassed $testsPassed
    
    if ($testsPassed) {
        Write-TestOutput "Backend API test suite completed successfully!" -ColorCode "Green"
        exit 0
    } else {
        Write-TestOutput "Backend API test suite completed with failures!" -ColorCode "Red"
        exit 1
    }
    
} catch {
    $errMsg = $_.Exception.Message
    $stackTrace = $_.ScriptStackTrace
    Write-TestOutput "Test suite failed with error: ${errMsg}" -ColorCode "Red"
    Write-TestOutput $stackTrace -ColorCode "Red"
    
    exit 1
}
