<#
Stop Backend and Frontend Services
This script stops any running backend and frontend services on ports 8000 and 5173.

Usage:
1. Open PowerShell as Administrator
2. Navigate to the test\development directory
3. Run: .\0_stop_backend_frontend.ps1
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

# Function to kill processes on specific ports
function Stop-ProcessesOnPort {
    param([int[]]$Ports)
    
    foreach ($port in $Ports) {
        Write-ColorOutput "Stopping processes on port ${port}..." -ColorCode "Yellow"
        try {
            $processes = netstat -ano | findstr ":${port} "
            if ($processes) {
                $processes | ForEach-Object {
                    $processId = $_.Split()[-1]
                    # Skip process ID 0 (System Idle Process) and invalid IDs
                    if (-not [string]::IsNullOrEmpty($processId) -and $processId -ne "0") {
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        Write-ColorOutput "Stopped process ${processId} on port ${port}" -ColorCode "Green"
                    }
                }
            } else {
                Write-ColorOutput "No processes found on port ${port}" -ColorCode "Yellow"
            }
        } catch {
            $errMsg = $_.Exception.Message
            Write-ColorOutput "Error stopping processes on port ${port}: ${errMsg}" -ColorCode "Red"
        }
    }
}

# Main script execution
try {
    Write-ColorOutput "Starting Service Stopper Script" -ColorCode "White"
    Write-ColorOutput "Project Root: ${RootDir}" -ColorCode "White"
    Write-ColorOutput "Backend Directory: ${BackendDir}" -ColorCode "White"
    Write-ColorOutput "Frontend Directory: ${FrontendDir}" -ColorCode "White"
    Write-ColorOutput "Test Directory: ${TestDir}" -ColorCode "White"
    Write-ColorOutput "="*60 -ColorCode "White"
    
    # Stop any running processes on relevant ports
    Write-ColorOutput "`nStopping running processes..." -ColorCode "Yellow"
    Stop-ProcessesOnPort -Ports @(8000, 5173)
    
    Write-ColorOutput "`nService stopping completed successfully!" -ColorCode "Green"
    Write-ColorOutput "All backend and frontend services have been stopped." -ColorCode "Green"
    
    exit 0
    
} catch {
    $errMsg = $_.Exception.Message
    $stackTrace = $_.ScriptStackTrace
    Write-ColorOutput "Script failed with error: ${errMsg}" -ColorCode "Red"
    Write-ColorOutput $stackTrace -ColorCode "Red"
    
    exit 1
}
