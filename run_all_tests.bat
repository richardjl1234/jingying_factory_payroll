@echo off
echo ============================================
echo Payroll System - Complete Test Suite
echo ============================================
echo.

echo [1/5] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    exit /b 1
)
echo ✓ Docker is available

echo.
echo [2/5] Rebuilding Docker image...
echo Building payroll-system:latest...
docker build -t payroll-system:latest .

if %errorlevel% neq 0 (
    echo ERROR: Docker build failed
    exit /b 1
)
echo ✓ Docker image built successfully

echo.
echo [3/5] Stopping and removing existing container...
docker stop payroll-system >nul 2>&1
docker rm payroll-system >nul 2>&1
echo ✓ Cleaned up existing container

echo.
echo [4/5] Starting new Docker container...
docker run -d -p 8000:8000 --name payroll-system payroll-system:latest
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker container
    exit /b 1
)

echo Waiting for container to start...
timeout /t 10 /nobreak >nul

echo Checking container status...
docker ps | findstr "payroll-system" >nul
if %errorlevel% neq 0 (
    echo ERROR: Container is not running
    exit /b 1
)
echo ✓ Docker container is running on port 8000

echo.
echo [5/5] Initializing database and generating test data...
echo Initializing database tables...
docker exec payroll-system python backend/init_db.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to initialize database
    exit /b 1
)
echo ✓ Database initialized successfully

echo Generating test data...
docker exec payroll-system python backend/generate_test_data.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate test data
    exit /b 1
)
echo ✓ Test data generated successfully

echo.
echo ============================================
echo Available Puppeteer Test Cases
echo ============================================
echo.
echo Found the following test cases in the test/ folder:
echo.
echo 1. test_confirmation_dialogs.js      - Tests confirmation dialogs for delete operations
echo 2. test_deletion_operations.js       - Tests basic delete operations
echo 3. test_deletion_with_creation.js    - Tests delete operations with data creation
echo 4. test_worker_process_operations.js - Tests worker and process management operations
echo 5. test_worker_process_operations_local.js - Local version of worker/process tests
echo 6. user_management_test_local.js     - Tests user management operations
echo.
echo Note: test_https_puppeteer.js is for HTTPS testing and requires external server
echo.

echo ============================================
echo Running All Test Cases
echo ============================================
echo.

setlocal enabledelayedexpansion
set test_count=0
set passed_count=0
set failed_count=0
set test_results=

echo Starting test execution at: %date% %time%
echo.

REM Function to run a test and capture results
:run_test
set test_file=%1
set test_name=%2
set /a test_count+=1

echo [Test !test_count!] Running: !test_name!
echo --------------------------------------------------------------------

cd test
node !test_file! > "!test_name!_output.txt" 2>&1
set test_exit_code=%errorlevel%
cd ..

if !test_exit_code! equ 0 (
    echo ✓ PASS: !test_name!
    set /a passed_count+=1
    set "test_results=!test_results!!test_count!. ✓ !test_name!^
"
) else (
    echo ✗ FAIL: !test_name! (Exit code: !test_exit_code!)
    set /a failed_count+=1
    set "test_results=!test_results!!test_count!. ✗ !test_name!^
"
    echo Last 5 lines of output:
    for /f "skip=0" %%i in ('find /c /v "" ^< "test/!test_name!_output.txt"') do set /a lines=%%i
    if !lines! gtr 5 (
        set /a skip=!lines!-5
    ) else (
        set skip=0
    )
    more +!skip! "test/!test_name!_output.txt" 2>nul || echo "No output file found"
)

echo.
goto :eof

REM Run all test cases
call :run_test test_deletion_with_creation.js "Deletion with Creation Test"
call :run_test test_deletion_operations.js "Deletion Operations Test"
call :run_test test_worker_process_operations_local.js "Worker/Process Operations Test"
call :run_test user_management_test_local.js "User Management Test"
call :run_test test_confirmation_dialogs.js "Confirmation Dialogs Test"

echo ============================================
echo Test Report
echo ============================================
echo.
echo Test Execution Summary:
echo -----------------------
echo Total Tests Run: %test_count%
echo Tests Passed:    %passed_count%
echo Tests Failed:    %failed_count%
echo.
set /a success_rate=passed_count*100/test_count 2>nul || set success_rate=0
echo Success Rate: %passed_count%/%test_count% (%success_rate%%%)
echo.

if %failed_count% equ 0 (
    echo ✅ ALL TESTS PASSED!
    echo.
    echo The payroll system is fully functional and all tests have passed.
) else (
    echo ⚠️  SOME TESTS FAILED
    echo.
    echo The following tests failed:
    for /f "tokens=*" %%i in ('echo !test_results! ^| findstr "✗"') do echo %%i
    echo.
    echo Check the individual test output files in the test/ folder for details.
)

echo.
echo ============================================
echo Application Information
echo ============================================
echo.
echo Application URL: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo Health Check: http://localhost:8000/api/health
echo.
echo Test Credentials:
echo   - Username: test
echo   - Password: test123
echo   - Admin: root / root123
echo.
echo Container Status:
docker ps --filter "name=payroll-system" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
echo ============================================
echo Test Execution Complete
echo ============================================
echo.
echo All test output files are saved in the test/ folder with names:
echo   - [test_name]_output.txt
echo.
echo To view detailed logs for a specific test:
echo   type test\[test_name]_output.txt
echo.
pause
