<#
Start Backend and Frontend Services
This script starts backend and frontend services for testing.

Usage:
1. Open PowerShell as Administrator
2. Navigate to the test\development directory
3. Run: .\1_start_backend_frontend.ps1
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

# Function to write colored output
function Write-ColorOutput {
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
}

# Function to start backend service
function Start-BackendService {
    Write-ColorOutput "Starting backend service..." -ColorCode "Yellow"
    
    try {
        # Change to backend directory
        Set-Location $BackendDir
        
        # Start backend service in a new PowerShell window
        $backendProcess = Start-Process powershell -ArgumentList "python run.py" -PassThru -WorkingDirectory $BackendDir
        Write-ColorOutput "Backend service started with PID: $($backendProcess.Id)" -ColorCode "Green"
        
        # Wait for backend to start
        Write-ColorOutput "Waiting for backend service to initialize..." -ColorCode "Yellow"
        Start-Sleep -Seconds 10
        
        return $backendProcess
    } catch {
        $errMsg = $_.Exception.Message
        Write-ColorOutput "Error starting backend service: ${errMsg}" -ColorCode "Red"
        return $null
    }
}

# Function to start frontend service
function Start-FrontendService {
    Write-ColorOutput "Starting frontend service..." -ColorCode "Yellow"
    
    try {
        # Change to frontend directory
        Set-Location $FrontendDir
        
        # Start frontend service in a new PowerShell window
        $frontendProcess = Start-Process powershell -ArgumentList "npm run dev" -PassThru -WorkingDirectory $FrontendDir
        Write-ColorOutput "Frontend service started with PID: $($frontendProcess.Id)" -ColorCode "Green"
        
        # Wait for frontend to start
        Write-ColorOutput "Waiting for frontend service to initialize..." -ColorCode "Yellow"
        Start-Sleep -Seconds 15
        
        return $frontendProcess
    } catch {
        $errMsg = $_.Exception.Message
        Write-ColorOutput "Error starting frontend service: ${errMsg}" -ColorCode "Red"
        return $null
    }
}

# Main script execution
try {
    Write-ColorOutput "Starting Service Starter Script" -ColorCode "White"
    Write-ColorOutput "Project Root: ${RootDir}" -ColorCode "White"
    Write-ColorOutput "Backend Directory: ${BackendDir}" -ColorCode "White"
    Write-ColorOutput "Frontend Directory: ${FrontendDir}" -ColorCode "White"
    Write-ColorOutput "Test Directory: ${TestDir}" -ColorCode "White"
    Write-ColorOutput "="*60 -ColorCode "White"
    
    # Step 1: Start backend service
    Write-ColorOutput "`n1. Starting backend service..." -ColorCode "Yellow"
    $backendProcess = Start-BackendService
    if (-not $backendProcess) {
        throw "Failed to start backend service"
    }
    
    # Step 2: Start frontend service  
    Write-ColorOutput "`n2. Starting frontend service..." -ColorCode "Yellow"
    $frontendProcess = Start-FrontendService
    if (-not $frontendProcess) {
        throw "Failed to start frontend service"
    }
    
    Write-ColorOutput "`nService starting completed successfully!" -ColorCode "Green"
    Write-ColorOutput "Backend service PID: $($backendProcess.Id)" -ColorCode "Green"
    Write-ColorOutput "Frontend service PID: $($frontendProcess.Id)" -ColorCode "Green"
    Write-ColorOutput "`nServices are now running:" -ColorCode "White"
    Write-ColorOutput "  Backend API: http://localhost:8000" -ColorCode "White"
    Write-ColorOutput "  Frontend UI: http://localhost:5173" -ColorCode "White"
    Write-ColorOutput "  API Documentation: http://localhost:8000/docs" -ColorCode "White"
    
    # Return process information for potential cleanup
    @{
        BackendProcess = $backendProcess
        FrontendProcess = $frontendProcess
    }
    
    exit 0
    
} catch {
    $errMsg = $_.Exception.Message
    $stackTrace = $_.ScriptStackTrace
    Write-ColorOutput "Script failed with error: ${errMsg}" -ColorCode "Red"
    Write-ColorOutput $stackTrace -ColorCode "Red"
    
    # Cleanup if services were partially started
    try {
        Write-ColorOutput "`nCleaning up partially started services..." -ColorCode "Yellow"
        if ($backendProcess -and $backendProcess.HasExited -eq $false) {
            Stop-Process -Id $backendProcess.Id -Force
            Write-ColorOutput "Stopped backend service with PID: $($backendProcess.Id)" -ColorCode "Green"
        }
        
        if ($frontendProcess -and $frontendProcess.HasExited -eq $false) {
            Stop-Process -Id $frontendProcess.Id -Force
            Write-ColorOutput "Stopped frontend service with PID: $($frontendProcess.Id)" -ColorCode "Green"
        }
    } catch {
        $cleanupErrMsg = $_.Exception.Message
        Write-ColorOutput "Error during cleanup: ${cleanupErrMsg}" -ColorCode "Red"
    }
    
    exit 1
}
