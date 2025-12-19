#!/bin/bash

echo "============================================"
echo "Payroll System - Complete Test Suite"
echo "============================================"
echo ""

echo "[1/6] Checking Docker installation..."
docker --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "ERROR: Docker is not installed or not in PATH"
    exit 1
fi
echo "✓ Docker is available"

echo ""
echo "[2/6] Rebuilding frontend..."
echo "Building frontend with npm..."
cd frontend
npm install
npm run build
cd ..

if [ $? -ne 0 ]; then
    echo "ERROR: Frontend build failed"
    exit 1
fi
echo "✓ Frontend built successfully"

echo ""
echo "[3/6] Rebuilding Docker image..."
echo "Building payroll-system:latest..."
docker build -t payroll-system:latest .

if [ $? -ne 0 ]; then
    echo "ERROR: Docker build failed"
    exit 1
fi
echo "✓ Docker image built successfully"

echo ""
echo "[4/6] Stopping and removing existing container..."
docker stop payroll-system > /dev/null 2>&1
docker rm payroll-system > /dev/null 2>&1
echo "✓ Cleaned up existing container"

echo ""
echo "[5/6] Starting new Docker container..."
docker run -d -p 8100:8000 --name payroll-system payroll-system:latest
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start Docker container"
    exit 1
fi

echo "Waiting for container to start..."
sleep 10

echo "Checking container status..."
docker ps | grep "payroll-system" > /dev/null
if [ $? -ne 0 ]; then
    echo "ERROR: Container is not running"
    exit 1
fi
echo "✓ Docker container is running on port 8000"

echo ""
echo "[6/6] Initializing database and generating test data..."
echo "Initializing database tables..."
docker exec payroll-system python backend/init_db.py
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to initialize database"
    exit 1
fi
echo "✓ Database initialized successfully"

echo "Generating test data..."
docker exec payroll-system python backend/generate_test_data.py
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to generate test data"
    exit 1
fi
echo "✓ Test data generated successfully"

echo ""
echo "============================================"
echo "Available Puppeteer Test Cases"
echo "============================================"
echo ""
echo "Found the following test cases in the test/docker_puppeteer/ folder:"
echo ""
echo "1. test_login_basic.js               - Tests basic login functionality"
echo "2. test_confirmation_dialogs.js      - Tests confirmation dialogs for delete operations"
echo "3. test_deletion_operations.js       - Tests basic delete operations"
echo "4. test_deletion_with_creation.js    - Tests delete operations with data creation"
echo "5. test_worker_process_operations.js - Tests worker and process management operations"
echo "6. test_worker_process_operations_local.js - Local version of worker/process tests"
echo "7. user_management_test_local.js     - Tests user management operations"
echo "8. test_worker_deletion_ui.js        - Tests worker deletion through UI"
echo ""
echo "Note: test_https_puppeteer.js is for HTTPS testing and requires external server"
echo "Note: test_new_tables.js is currently in development"
echo "Note: test_quota_salary_deletion.js is in development - see TODO.md"
echo ""

echo "============================================"
echo "Running All Test Cases"
echo "============================================"
echo ""

echo "Starting test execution at: $(date)"
echo ""

test_count=0
passed_count=0
failed_count=0
test_results=""

# Function to run a test and capture results
run_test() {
    local test_file=$1
    local test_name=$2
    ((test_count++))
    
    echo "[Test $test_count] Running: $test_name"
    echo "--------------------------------------------------------------------"
    
    cd test/docker_puppeteer
    # Create a safe filename without spaces
    local safe_name=$(echo "$test_name" | tr ' ' '_' | tr '/' '_')
    node "$test_file" > "${safe_name}_output.txt" 2>&1
    local test_exit_code=$?
    cd ../..
    
    if [ $test_exit_code -eq 0 ]; then
        echo "✓ PASS: $test_name"
        ((passed_count++))
        test_results+="$test_count. ✓ $test_name\n"
    else
        echo "✗ FAIL: $test_name (Exit code: $test_exit_code)"
        ((failed_count++))
        test_results+="$test_count. ✗ $test_name\n"
        echo "Last 5 lines of output:"
        tail -5 "test/docker_puppeteer/${safe_name}_output.txt" 2>/dev/null || echo "No output file found"
    fi
    
    echo ""
}

# Run all test cases
run_test "test_login_basic.js" "Basic Login Test"
run_test "test_deletion_with_creation.js" "Deletion with Creation Test"
run_test "test_deletion_operations.js" "Deletion Operations Test"
run_test "test_worker_process_operations_local.js" "Worker/Process Operations Test"
run_test "user_management_test_local.js" "User Management Test"
run_test "test_confirmation_dialogs.js" "Confirmation Dialogs Test"
run_test "test_worker_deletion_ui.js" "Worker Deletion UI Test"

echo "============================================"
echo "Test Report"
echo "============================================"
echo ""
echo "Test Execution Summary:"
echo "-----------------------"
echo "Total Tests Run: $test_count"
echo "Tests Passed:    $passed_count"
echo "Tests Failed:    $failed_count"
echo ""

if [ $test_count -gt 0 ]; then
    success_rate=$((passed_count * 100 / test_count))
else
    success_rate=0
fi
echo "Success Rate: $passed_count/$test_count ($success_rate%)"
echo ""

if [ $failed_count -eq 0 ]; then
    echo "✅ ALL TESTS PASSED!"
    echo ""
    echo "The payroll system is fully functional and all tests have passed."
else
    echo "⚠️  SOME TESTS FAILED"
    echo ""
    echo "The following tests failed:"
    echo -e "$test_results" | grep "✗"
    echo ""
    echo "Check the individual test output files in the test/ folder for details."
fi

echo ""
echo "============================================"
echo "Application Information"
echo "============================================"
echo ""
echo "Application URL: http://localhost:8100"
echo "API Documentation: http://localhost:8100/docs"
echo "Health Check: http://localhost:8100/api/health"
echo ""
echo "Test Credentials:"
echo "  - Username: test"
echo "  - Password: test123"
echo "  - Admin: root / root123"
echo ""
echo "Container Status:"
docker ps --filter "name=payroll-system" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "============================================"
echo "Test Execution Complete"
echo "============================================"
echo ""
echo "All test output files are saved in the test/docker_puppeteer/ folder with names:"
echo "  - [test_name]_output.txt"
echo ""
echo "To view detailed logs for a specific test:"
echo "  cat test/docker_puppeteer/[test_name]_output.txt"
echo ""
read -p "Press Enter to continue..."
