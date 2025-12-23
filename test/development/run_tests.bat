@echo off
REM Development environment test runner for Windows
REM This batch file runs all tests in the development environment

REM Set colors (Windows 10+ only)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "RESET=[0m"

REM Get script directory
set "SCRIPT_DIR=%~dp0"

REM Test results
set "API_TEST_RESULT=0"
set "FRONTEND_TEST_RESULT=0"

REM Function to print a section header
:print_header
    echo.
    echo %YELLOW%============================================%RESET%
    echo %YELLOW%%~1%RESET%
    echo %YELLOW%============================================%RESET%
    goto :eof

REM Function to print a test result
:print_result
    if %~1 EQU 0 (
        echo %GREEN%✅ %~2%RESET%
    ) else (
        echo %RED%❌ %~2%RESET%
    )
    goto :eof

REM Function to run API tests
:run_api_tests
    call :print_header "Running API Tests"
    
    if exist "%SCRIPT_DIR%test_api.py" (
        echo Running API tests: %SCRIPT_DIR%test_api.py
        python "%SCRIPT_DIR%test_api.py"
        set "API_TEST_RESULT=%errorlevel%"
        call :print_result %API_TEST_RESULT% "API Tests"
    ) else (
        echo %RED%API test file not found: %SCRIPT_DIR%test_api.py%RESET%
        set "API_TEST_RESULT=1"
    )
    goto :eof

REM Function to run frontend login test
:run_frontend_login_test
    call :print_header "Running Frontend Login Test"
    
    if exist "%SCRIPT_DIR%test_login.js" (
        echo Running frontend login test: %SCRIPT_DIR%test_login.js
        node "%SCRIPT_DIR%test_login.js"
        set "FRONTEND_TEST_RESULT=%errorlevel%"
        call :print_result %FRONTEND_TEST_RESULT% "Frontend Login Test"
    ) else (
        echo %RED%Frontend login test file not found: %SCRIPT_DIR%test_login.js%RESET%
        set "FRONTEND_TEST_RESULT=1"
    )
    goto :eof

REM Function to run all tests
:run_all_tests
    call :print_header "Starting Development Environment Tests"
    echo Test directory: %SCRIPT_DIR%
    echo Timestamp: %date% %time%
    
    REM Run API tests
    call :run_api_tests
    
    REM Run frontend tests
    call :run_frontend_login_test
    
    REM Print overall results
    call :print_header "Test Results Summary"
    call :print_result %API_TEST_RESULT% "API Tests"
    call :print_result %FRONTEND_TEST_RESULT% "Frontend Login Test"
    
    REM Determine overall result
    if %API_TEST_RESULT% EQU 0 if %FRONTEND_TEST_RESULT% EQU 0 (
        echo.
        echo %GREEN%🎉 All tests passed!%RESET%
        exit /b 0
    ) else (
        echo.
        echo %RED%❌ Some tests failed!%RESET%
        exit /b 1
    )
    goto :eof

REM Function to show help
:show_help
    echo %YELLOW%Development Environment Test Runner%RESET%
    echo.
    echo Usage: %~nx0 [OPTIONS]
    echo.
    echo Options:
    echo   --api-only      Run only API tests
    echo   --frontend-only Run only frontend tests
    echo   --help          Show this help message
    echo.
    echo Without options, all tests will be run.
    exit /b 0
    goto :eof

REM Main script logic
if "%~1" == "--api-only" (
    call :run_api_tests
    exit /b %API_TEST_RESULT%
) else if "%~1" == "--frontend-only" (
    call :run_frontend_login_test
    exit /b %FRONTEND_TEST_RESULT%
) else if "%~1" == "--help" (
    call :show_help
) else if "%~1" == "" (
    call :run_all_tests
    exit /b %errorlevel%
) else (
    echo %RED%Invalid option: %~1%RESET%
    call :show_help
    exit /b 1
)
