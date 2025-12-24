<#
Initialize Database and Add Test Data
This script initializes the database and adds test data using Python scripts.

Usage:
1. Open PowerShell as Administrator
2. Navigate to the test\development directory
3. Run: .\2_init_database_add_test_data.ps1
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
$BackendScriptsDir = Join-Path $BackendDir "scripts"

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

# Function to check if Python is available
function Test-PythonAvailable {
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "Python found: $pythonVersion" -ColorCode "Green"
            return $true
        } else {
            Write-ColorOutput "Python not found or not in PATH" -ColorCode "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "Error checking Python: $_" -ColorCode "Red"
        return $false
    }
}

# Function to check if required Python packages are installed
function Test-PythonPackages {
    param(
        [string[]]$Packages
    )
    
    $allPackagesInstalled = $true
    
    foreach ($package in $Packages) {
        try {
            $null = python -c "import $package" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "Package '$package' is installed" -ColorCode "Green"
            } else {
                Write-ColorOutput "Package '$package' is NOT installed" -ColorCode "Red"
                $allPackagesInstalled = $false
            }
        } catch {
            Write-ColorOutput "Error checking package '$package': $_" -ColorCode "Red"
            $allPackagesInstalled = $false
        }
    }
    
    return $allPackagesInstalled
}

# Function to run Python script using virtual environment
function Invoke-PythonScript {
    param(
        [string]$ScriptPath,
        [string]$WorkingDirectory
    )
    
    if (-not (Test-Path $ScriptPath)) {
        Write-ColorOutput "Python script not found: $ScriptPath" -ColorCode "Red"
        return $false
    }
    
    Write-ColorOutput "Running Python script: $(Split-Path $ScriptPath -Leaf)" -ColorCode "Yellow"
    
    try {
        # Change to the working directory
        $originalLocation = Get-Location
        Set-Location $WorkingDirectory
        
        # Check if virtual environment exists
        $venvPath = Join-Path $WorkingDirectory "venv"
        $venvPython = Join-Path $venvPath "Scripts\python.exe"
        
        if (Test-Path $venvPython) {
            Write-ColorOutput "Using virtual environment: $venvPath" -ColorCode "Green"
            $pythonCommand = $venvPython
        } else {
            Write-ColorOutput "Virtual environment not found, using system Python" -ColorCode "Yellow"
            $pythonCommand = "python"
        }
        
        # Get the relative path of the script from the working directory
        $scriptRelativePath = Resolve-Path $ScriptPath -Relative
        
        # Set PYTHONPATH to include the current directory so Python can find the app module
        $originalPythonPath = $env:PYTHONPATH
        $env:PYTHONPATH = "$WorkingDirectory;$env:PYTHONPATH"
        
        # Set Python output encoding to UTF-8 to handle Chinese characters
        $originalPythonIOEncoding = $env:PYTHONIOENCODING
        $env:PYTHONIOENCODING = "utf-8"
        
        # Run the Python script from the working directory
        $output = & $pythonCommand $scriptRelativePath 2>&1
        $exitCode = $LASTEXITCODE
        
        # Restore environment variables
        $env:PYTHONPATH = $originalPythonPath
        $env:PYTHONIOENCODING = $originalPythonIOEncoding
        
        # Write output
        $output | ForEach-Object {
            Write-ColorOutput $_ -ColorCode "White"
        }
        
        # Restore original location
        Set-Location $originalLocation
        
        if ($exitCode -eq 0) {
            Write-ColorOutput "Python script completed successfully" -ColorCode "Green"
            return $true
        } else {
            Write-ColorOutput "Python script failed with exit code: $exitCode" -ColorCode "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "Error running Python script: $_" -ColorCode "Red"
        # Restore original location in case of error
        Set-Location $originalLocation
        return $false
    }
}

# Main script execution
try {
    Write-ColorOutput "Starting Database Initialization Script" -ColorCode "White"
    Write-ColorOutput "Project Root: ${RootDir}" -ColorCode "White"
    Write-ColorOutput "Backend Directory: ${BackendDir}" -ColorCode "White"
    Write-ColorOutput "Backend Scripts Directory: ${BackendScriptsDir}" -ColorCode "White"
    Write-ColorOutput "Test Directory: ${TestDir}" -ColorCode "White"
    Write-ColorOutput "="*60 -ColorCode "White"
    
    # Step 1: Check Python availability
    Write-ColorOutput "`n1. Checking Python environment..." -ColorCode "Yellow"
    if (-not (Test-PythonAvailable)) {
        throw "Python is required but not found. Please install Python and add it to PATH."
    }
    
    # Step 2: Check virtual environment and required Python packages
    Write-ColorOutput "`n2. Checking virtual environment and Python packages..." -ColorCode "Yellow"
    
    # Check if virtual environment exists
    $venvPath = Join-Path $BackendDir "venv"
    $venvPython = Join-Path $venvPath "Scripts\python.exe"
    
    if (Test-Path $venvPython) {
        Write-ColorOutput "Virtual environment found: $venvPath" -ColorCode "Green"
        
        # Check packages in virtual environment
        $venvPip = Join-Path $venvPath "Scripts\pip.exe"
        if (Test-Path $venvPip) {
            Write-ColorOutput "Checking packages in virtual environment..." -ColorCode "Yellow"
            
            # Check if requirements are already installed
            Set-Location $BackendDir
            $checkOutput = & $venvPip freeze 2>&1
            $hasAllPackages = $true
            
            # Simple check for key packages
            $keyPackages = @("fastapi", "sqlalchemy", "pydantic")
            foreach ($pkg in $keyPackages) {
                if ($checkOutput -match $pkg) {
                    Write-ColorOutput "Package '$pkg' found in virtual environment" -ColorCode "Green"
                } else {
                    Write-ColorOutput "Package '$pkg' NOT found in virtual environment" -ColorCode "Yellow"
                    $hasAllPackages = $false
                }
            }
            
            if (-not $hasAllPackages) {
                Write-ColorOutput "Installing missing packages in virtual environment..." -ColorCode "Yellow"
                $installOutput = & $venvPip install -r requirements.txt 2>&1
                $installOutput | ForEach-Object {
                    Write-ColorOutput $_ -ColorCode "White"
                }
                
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorOutput "Packages installed successfully in virtual environment" -ColorCode "Green"
                } else {
                    Write-ColorOutput "Failed to install packages in virtual environment" -ColorCode "Red"
                    # Continue anyway, the scripts might still work
                }
            } else {
                Write-ColorOutput "All required packages are already installed in virtual environment" -ColorCode "Green"
            }
        }
    } else {
        Write-ColorOutput "Virtual environment not found, checking system Python packages..." -ColorCode "Yellow"
        
        $requiredPackages = @("sqlalchemy", "fastapi", "pydantic", "passlib", "python-jose", "python-multipart")
        if (-not (Test-PythonPackages -Packages $requiredPackages)) {
            Write-ColorOutput "Some required packages are missing. Attempting to install..." -ColorCode "Yellow"
            
            try {
                # Install required packages
                Set-Location $BackendDir
                $installOutput = pip install -r requirements.txt 2>&1
                $installOutput | ForEach-Object {
                    Write-ColorOutput $_ -ColorCode "White"
                }
                
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorOutput "Packages installed successfully" -ColorCode "Green"
                } else {
                    Write-ColorOutput "Failed to install packages" -ColorCode "Red"
                    # Continue anyway, the scripts might still work
                }
            } catch {
                Write-ColorOutput "Error installing packages: $_" -ColorCode "Red"
                # Continue anyway, the scripts might still work
            }
        }
    }
    
    # Step 3: Initialize database
    Write-ColorOutput "`n3. Initializing database..." -ColorCode "Yellow"
    $initDbScript = Join-Path $BackendScriptsDir "init_db.py"
    if (-not (Invoke-PythonScript -ScriptPath $initDbScript -WorkingDirectory $BackendDir)) {
        throw "Database initialization failed"
    }
    
    # Step 4: Generate test data
    Write-ColorOutput "`n4. Generating test data..." -ColorCode "Yellow"
    $generateTestDataScript = Join-Path $BackendScriptsDir "generate_test_data.py"
    if (-not (Invoke-PythonScript -ScriptPath $generateTestDataScript -WorkingDirectory $BackendDir)) {
        throw "Test data generation failed"
    }
    
    Write-ColorOutput "`nDatabase initialization completed successfully!" -ColorCode "Green"
    Write-ColorOutput "Database has been initialized with:" -ColorCode "White"
    Write-ColorOutput "  - Root user: root / root123" -ColorCode "White"
    Write-ColorOutput "  - Test user: test / test123" -ColorCode "White"
    Write-ColorOutput "  - Sample workers, processes, quotas, and salary records" -ColorCode "White"
    Write-ColorOutput "  - New tables data (motor models, process categories)" -ColorCode "White"
    
    exit 0
    
} catch {
    $errMsg = $_.Exception.Message
    $stackTrace = $_.ScriptStackTrace
    Write-ColorOutput "Script failed with error: ${errMsg}" -ColorCode "Red"
    Write-ColorOutput $stackTrace -ColorCode "Red"
    
    exit 1
}
