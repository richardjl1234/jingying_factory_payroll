<#
Development Environment Test Runner
This script restarts backend and frontend services, then runs all tests.

Usage:
1. Open PowerShell as Administrator
2. Navigate to the test\development directory
3. Run: .\run_all_tests.ps1
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
$ReportFile = Join-Path $TestDir "test_report_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

# Function to write to report file
function Write-Report {
    param(
        [string]$Message,
        [string]$ColorCode = "White",
        [switch]$Append = $true
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
    if ($Append) {
        Add-Content -Path $ReportFile -Value $formattedMessage
    } else {
        Set-Content -Path $ReportFile -Value $formattedMessage
    }
}

# Function to kill processes on specific ports
function Stop-ProcessesOnPort {
    param([int[]]$Ports)
    
    foreach ($port in $Ports) {
        Write-Report "Stopping processes on port ${port}..."
        try {
            $processes = netstat -ano | findstr ":${port} "
            if ($processes) {
                $processes | ForEach-Object {
                    $processId = $_.Split()[-1]
                    # Skip process ID 0 (System Idle Process) and invalid IDs
                    if (-not [string]::IsNullOrEmpty($processId) -and $processId -ne "0") {
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        Write-Report "Stopped process ${processId} on port ${port}" -ColorCode "Green"
                    }
                }
            } else {
                Write-Report "No processes found on port ${port}" -ColorCode "Yellow"
            }
        } catch {
            $errMsg = $_.Exception.Message
            Write-Report "Error stopping processes on port ${port}: ${errMsg}" -ColorCode "Red"
        }
    }
}

# Function to start backend service
function Start-BackendService {
    Write-Report "Starting backend service..."
    
    try {
        # Change to backend directory
        Set-Location $BackendDir
        
        # Start backend service in a new PowerShell window
        $backendProcess = Start-Process powershell -ArgumentList "python run.py" -PassThru -WorkingDirectory $BackendDir
        Write-Report "Backend service started with PID: $($backendProcess.Id)" -ColorCode "Green"
        
        # Wait for backend to start
        Write-Report "Waiting for backend service to initialize..."
        Start-Sleep -Seconds 10
        
        return $backendProcess
    } catch {
        $errMsg = $_.Exception.Message
        Write-Report "Error starting backend service: ${errMsg}" -ColorCode "Red"
        return $null
    }
}

# Function to start frontend service
function Start-FrontendService {
    Write-Report "Starting frontend service..."
    
    try {
        # Change to frontend directory
        Set-Location $FrontendDir
        
        # Start frontend service in a new PowerShell window
        $frontendProcess = Start-Process powershell -ArgumentList "npm run dev" -PassThru -WorkingDirectory $FrontendDir
        Write-Report "Frontend service started with PID: $($frontendProcess.Id)" -ColorCode "Green"
        
        # Wait for frontend to start
        Write-Report "Waiting for frontend service to initialize..."
        Start-Sleep -Seconds 15
        
        return $frontendProcess
    } catch {
        $errMsg = $_.Exception.Message
        Write-Report "Error starting frontend service: ${errMsg}" -ColorCode "Red"
        return $null
    }
}

# Function to run backend API tests
function Run-BackendTests {
    Write-Report "Running backend API tests..."
    
    Set-Location $TestDir
    
    try {
        # Temporarily change error action preference to Continue to avoid treating Python output as errors
        $originalErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        
        # Run the Python script and capture all output
        $result = python test_api.py 2>&1
        
        # Restore original error action preference
        $ErrorActionPreference = $originalErrorAction
        
        # Write result to report
        $result | ForEach-Object { Write-Report $_ }
        
        # Check if tests passed by examining exit code
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Report "Backend API tests passed!" -ColorCode "Green"
            return $true
        } else {
            Write-Report "Backend API tests failed with exit code: $exitCode" -ColorCode "Red"
            return $false
        }
    } catch {
        # Restore original error action preference in case of exception
        $ErrorActionPreference = $originalErrorAction
        $errMsg = $_.Exception.Message
        Write-Report "Error running backend API tests: ${errMsg}" -ColorCode "Red"
        return $false
    }
}

# Run frontend tests
    function Run-FrontendTests {
    Write-Report "Running frontend tests..."
    
    $frontendTestFiles = @(
        "test_login.js",
        "test_user_management.js",
        "test_worker_process_operations.js",
        "test_new_tables.js"
    )
    
    $allPassed = $true
    
    foreach ($testFile in $frontendTestFiles) {
        $testPath = Join-Path $TestDir $testFile
        
        if (Test-Path $testPath) {
            Write-Report "Running frontend test: ${testFile}"
            try {
                $result = & node $testPath 2>&1
                
                # Write result to report
                $result | ForEach-Object { Write-Report $_ }
                
                # Check if test passed
                if ($result -match "✅ PASS" -or $result -match "TEST PASSED") {
                    Write-Report "Frontend test ${testFile} passed!" -ColorCode "Green"
                } else {
                    Write-Report "Frontend test ${testFile} failed!" -ColorCode "Red"
                    $allPassed = $false
                }
            } catch {
                $errMsg = $_.Exception.Message
                Write-Report "Error running frontend test ${testFile}: ${errMsg}" -ColorCode "Red"
                $allPassed = $false
            }
        } else {
            Write-Report "Frontend test file not found: ${testFile}" -ColorCode "Yellow"
        }
    }
    
    return $allPassed
}

# Function to generate final report
function Generate-FinalReport {
    param(
        [bool]$BackendTestsPassed,
        [bool]$FrontendTestsPassed
    )
    
    Write-Report "`n" + "="*60
    Write-Report "FINAL TEST REPORT"
    Write-Report "="*60
    
    Write-Report "Test Results Summary:"
    Write-Report "Backend API Tests: ${BackendTestsPassed}" -ColorCode "White"
    Write-Report "Frontend Tests: ${FrontendTestsPassed}" -ColorCode "White"
    
    $OverallResult = $BackendTestsPassed -and $FrontendTestsPassed
    Write-Report "`nOverall Result: ${OverallResult}" -ColorCode "White"
    
    if ($OverallResult) {
        Write-Report "🎉 All tests passed!" -ColorCode "Green"
    } else {
        Write-Report "❌ Some tests failed!" -ColorCode "Red"
    }
    
    Write-Report "Report saved to: ${ReportFile}" -ColorCode "White"
    Write-Report "="*60
}

# Main script execution
try {
    Write-Report "Starting Development Environment Test Suite" -Append $false
    Write-Report "Project Root: ${RootDir}"
    Write-Report "Backend Directory: ${BackendDir}"
    Write-Report "Frontend Directory: ${FrontendDir}"
    Write-Report "Test Directory: ${TestDir}"
    Write-Report "="*60
    
    # Step 1: Stop any running processes on relevant ports
    Write-Report "`n1. Stopping running processes..."
    Stop-ProcessesOnPort -Ports @(8000, 5173)
    
    # Step 2: Start backend service
    Write-Report "`n2. Starting backend service..."
    $backendProcess = Start-BackendService
    if (-not $backendProcess) {
        throw "Failed to start backend service"
    }
    
    # Step 3: Start frontend service  
    Write-Report "`n3. Starting frontend service..."
    $frontendProcess = Start-FrontendService
    if (-not $frontendProcess) {
        throw "Failed to start frontend service"
    }
    
    # Step 4: Run backend API tests
    Write-Report "`n4. Running backend API tests..."
    $backendTestsPassed = Run-BackendTests
    
    # Step 5: Run frontend tests
    Write-Report "`n5. Running frontend tests..."
    $frontendTestsPassed = Run-FrontendTests
    
    # Step 6: Generate final report
    Generate-FinalReport -BackendTestsPassed $backendTestsPassed -FrontendTestsPassed $frontendTestsPassed
    
    # Step 7: Cleanup - stop services if they're still running
    Write-Report "`n6. Cleaning up services..."
    if ($backendProcess -and $backendProcess.HasExited -eq $false) {
        Stop-Process -Id $backendProcess.Id -Force
        Write-Report "Stopped backend service with PID: $($backendProcess.Id)" -ColorCode "Green"
    }
    
    if ($frontendProcess -and $frontendProcess.HasExited -eq $false) {
        Stop-Process -Id $frontendProcess.Id -Force
        Write-Report "Stopped frontend service with PID: $($frontendProcess.Id)" -ColorCode "Green"
    }
    
    # Step 8: Final cleanup - stop any remaining processes on ports
    Stop-ProcessesOnPort -Ports @(8000, 5173)
    
    if ($backendTestsPassed -and $frontendTestsPassed) {
        Write-Report "Test suite completed successfully!" -ColorCode "Green"
    } else {
        Write-Report "Test suite completed with failures!" -ColorCode "Red"
    }
    Write-Report "Report saved to: ${ReportFile}" -ColorCode "White"
    
    # Exit with appropriate code
    if ($backendTestsPassed -and $frontendTestsPassed) {
        exit 0
    } else {
        exit 1
    }
    
} catch {
    $errMsg = $_.Exception.Message
    $stackTrace = $_.ScriptStackTrace
    Write-Report "Test suite failed with error: ${errMsg}" -ColorCode "Red"
    Write-Report $stackTrace -ColorCode "Red"
    
    # Cleanup
    try {
        Write-Report "`nCleaning up services..." -ColorCode "Yellow"
        Stop-ProcessesOnPort -Ports @(8000, 5173)
    } catch {
        $cleanupErrMsg = $_.Exception.Message
        Write-Report "Error during cleanup: ${cleanupErrMsg}" -ColorCode "Red"
    }
    
    exit 1
}
