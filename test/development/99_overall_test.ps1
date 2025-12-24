<#
Overall Test Orchestrator
This script orchestrates all test steps in sequence:
0. Stop backend and frontend services
1. Start backend and frontend services  
2. Initialize database and add test data
3. Perform backend API tests
4. Perform frontend Puppeteer tests
0. Stop backend and frontend services (cleanup)

Usage:
1. Open PowerShell as Administrator
2. Navigate to the test\development directory
3. Run: .\99_overall_test.ps1
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

# Overall test report file
$OverallReportFile = Join-Path $TestDir "overall_test_report_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

# Function to write colored output and to report file
function Write-OverallOutput {
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
    Add-Content -Path $OverallReportFile -Value $formattedMessage
}

# Function to run a step script
function Invoke-TestStep {
    param(
        [string]$StepScript,
        [string]$StepName
    )
    
    $stepScriptPath = Join-Path $TestDir $StepScript
    
    if (-not (Test-Path $stepScriptPath)) {
        Write-OverallOutput "Step script not found: $StepScript" -ColorCode "Red"
        return $false
    }
    
    Write-OverallOutput "`n=== Starting Step: $StepName ===" -ColorCode "Yellow"
    Write-OverallOutput "Running script: $StepScript" -ColorCode "White"
    
    try {
        # Run the step script
        $output = & $stepScriptPath 2>&1
        $exitCode = $LASTEXITCODE
        
        # Write output
        $output | ForEach-Object {
            Write-OverallOutput $_ -ColorCode "White"
        }
        
        if ($exitCode -eq 0) {
            Write-OverallOutput "Step completed successfully: ${StepName}" -ColorCode "Green"
            return $true
        } else {
            Write-OverallOutput "Step failed with exit code ${exitCode}: ${StepName}" -ColorCode "Red"
            return $false
        }
    } catch {
        $errMsg = $_.Exception.Message
        Write-OverallOutput "Error running step ${StepName}: ${errMsg}" -ColorCode "Red"
        return $false
    }
}

# Function to generate final overall report
function Generate-OverallReport {
    param(
        [hashtable]$StepResults
    )
    
    Write-OverallOutput "`n" + "="*60 -ColorCode "White"
    Write-OverallOutput "OVERALL TEST REPORT" -ColorCode "White"
    Write-OverallOutput "="*60 -ColorCode "White"
    
    Write-OverallOutput "Test Sequence Results:" -ColorCode "White"
    
    $allStepsPassed = $true
    
    foreach ($stepKey in $StepResults.Keys) {
        $result = $StepResults[$stepKey]
        $status = if ($result.Passed) { "✅ PASS" } else { "❌ FAIL" }
        $color = if ($result.Passed) { "Green" } else { "Red" }
        
        Write-OverallOutput "  $($stepKey.PadRight(40)) $status" -ColorCode $color
        
        if (-not $result.Passed) {
            $allStepsPassed = $false
        }
    }
    
    Write-OverallOutput "`nOverall Result:" -ColorCode "White"
    
    if ($allStepsPassed) {
        Write-OverallOutput "🎉 ALL TESTS PASSED! The system is working correctly." -ColorCode "Green"
    } else {
        Write-OverallOutput "❌ SOME TESTS FAILED! Please check the individual test reports." -ColorCode "Red"
    }
    
    Write-OverallOutput "`nIndividual Test Reports:" -ColorCode "White"
    Write-OverallOutput "  - Backend API tests: Look for backend_test_report_*.txt" -ColorCode "White"
    Write-OverallOutput "  - Frontend tests: Look for frontend_test_report_*.txt" -ColorCode "White"
    Write-OverallOutput "  - Overall report: $OverallReportFile" -ColorCode "White"
    
    Write-OverallOutput "="*60 -ColorCode "White"
    
    return $allStepsPassed
}

# Main script execution
try {
    Write-OverallOutput "Starting Overall Test Orchestrator" -ColorCode "White" -Append $false
    Write-OverallOutput "Project Root: ${RootDir}" -ColorCode "White"
    Write-OverallOutput "Test Directory: ${TestDir}" -ColorCode "White"
    Write-OverallOutput "="*60 -ColorCode "White"
    
    # Define test steps in sequence
    $testSteps = @(
        @{ Script = "0_stop_backend_frontend.ps1"; Name = "Stop Backend and Frontend Services" },
        @{ Script = "1_start_backend_frontend.ps1"; Name = "Start Backend and Frontend Services" },
        @{ Script = "2_init_database_add_test_data.ps1"; Name = "Initialize Database and Add Test Data" },
        @{ Script = "3_perform_backend_api_test.ps1"; Name = "Perform Backend API Tests" },
        @{ Script = "4_perform_frontend_puppeteer_test.ps1"; Name = "Perform Frontend Puppeteer Tests" },
        @{ Script = "0_stop_backend_frontend.ps1"; Name = "Cleanup - Stop Backend and Frontend Services" }
    )
    
    $stepResults = [ordered]@{}
    
    # Execute each test step
    for ($i = 0; $i -lt $testSteps.Count; $i++) {
        $step = $testSteps[$i]
        
        # Extract step number from filename (e.g., "0_stop_backend_frontend.ps1" -> 0)
        $stepNumberMatch = [regex]::Match($step.Script, '^(\d+)_.+\.ps1$')
        $stepNumber = if ($stepNumberMatch.Success) { $stepNumberMatch.Groups[1].Value } else { ($i + 1).ToString() }
        
        # For cleanup step (last step), use step number 5
        if ($i -eq ($testSteps.Count - 1)) {
            $stepNumber = "5"
        }
        
        $stepKey = "Step ${stepNumber}: $($step.Name)"
        
        Write-OverallOutput "`n" + "="*60 -ColorCode "White"
        Write-OverallOutput "EXECUTING $stepKey" -ColorCode "Yellow"
        Write-OverallOutput "="*60 -ColorCode "White"
        
        $stepPassed = Invoke-TestStep -StepScript $step.Script -StepName $step.Name
        
        $stepResults[$stepKey] = @{
            Passed = $stepPassed
            Script = $step.Script
        }
        
        # If a step fails, we can optionally stop or continue
        if (-not $stepPassed) {
            Write-OverallOutput "Step failed, but continuing with next steps..." -ColorCode "Yellow"
        }
        
        # Add a small delay between steps
        if ($stepNumber -lt $testSteps.Count) {
            Write-OverallOutput "Preparing for next step..." -ColorCode "Yellow"
            Start-Sleep -Seconds 2
        }
    }
    
    # Generate overall report
    $allStepsPassed = Generate-OverallReport -StepResults $stepResults
    
    Write-OverallOutput "`nOverall test orchestration completed!" -ColorCode "White"
    
    if ($allStepsPassed) {
        Write-OverallOutput "All test steps passed successfully!" -ColorCode "Green"
        exit 0
    } else {
        Write-OverallOutput "Some test steps failed. Check individual reports for details." -ColorCode "Red"
        exit 1
    }
    
} catch {
    $errMsg = $_.Exception.Message
    $stackTrace = $_.ScriptStackTrace
    Write-OverallOutput "Overall test orchestration failed with error: ${errMsg}" -ColorCode "Red"
    Write-OverallOutput $stackTrace -ColorCode "Red"
    
    exit 1
}
