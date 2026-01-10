#!/bin/bash

# Perform PyTest Puppeteer Tests
# This script runs Python tests using pytest and Pyppeteer.
#
# Usage:
# 1. Navigate to the test/development directory
# 2. Run: ./5_perform_pytest_puppeteer_test.sh
#
# Environment Variables:
#   HEADLESS - Control browser headless mode (default: True)
#     - True/1/yes: Run in headless mode (no browser UI)
#     - False/0/no: Run in non-headless mode (show browser UI)
#     Example: HEADLESS=False ./5_perform_pytest_puppeteer_test.sh

set -e  # Stop on errors

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
TEST_DIR="$SCRIPT_DIR"

# Test report file
REPORT_FILE="$TEST_DIR/pytest_puppeteer_report_$(date '+%Y%m%d_%H%M%S').txt"

# Function to write colored output and to report file
write_test_output() {
    local message="$1"
    local color="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local formatted_message="[$timestamp] $message"
    
    # Write to console with color (to stderr so it doesn't interfere with function return values)
    case "$color" in
        "green")
            echo -e "${GREEN}$formatted_message${NC}" >&2
            ;;
        "red")
            echo -e "${RED}$formatted_message${NC}" >&2
            ;;
        "yellow")
            echo -e "${YELLOW}$formatted_message${NC}" >&2
            ;;
        "blue")
            echo -e "${BLUE}$formatted_message${NC}" >&2
            ;;
        *)
            echo "$formatted_message" >&2
            ;;
    esac
    
    # Write to report file without color codes
    echo "$formatted_message" >> "$REPORT_FILE"
}

# Function to get Python command from virtual environment
get_python_cmd() {
    local venv_dir="$TEST_DIR/venv"
    
    # Check if virtual environment exists
    if [ -d "$venv_dir" ] && [ -f "$venv_dir/bin/python" ]; then
        echo "$venv_dir/bin/python"
        return 0
    else
        # Fallback to system Python
        if command -v python3 &>/dev/null; then
            echo "python3"
            return 0
        elif command -v python &>/dev/null; then
            echo "python"
            return 0
        else
            return 1
        fi
    fi
}

# Function to setup Python environment (virtual environment)
setup_python_environment() {
    write_test_output "Setting up Python environment..." "yellow"
    
    local venv_dir="$TEST_DIR/venv"
    
    # Check if virtual environment exists
    if [ -d "$venv_dir" ] && [ -f "$venv_dir/bin/python" ]; then
        write_test_output "Found virtual environment at: $venv_dir" "green"
        local python_path=$(get_python_cmd)
        write_test_output "Using Python from: $python_path" "green"
        return 0
    else
        write_test_output "Virtual environment not found at: $venv_dir" "red"
        write_test_output "Please create the virtual environment first:" "yellow"
        write_test_output "  cd $TEST_DIR" "yellow"
        write_test_output "  python3 -m venv venv" "yellow"
        write_test_output "  source venv/bin/activate" "yellow"
        write_test_output "  pip install -r requirements-test.txt" "yellow"
        return 1
    fi
}

# Function to run pytest tests
run_pytest_tests() {
    write_test_output "Running pytest tests..." "yellow"
    
    local python_cmd
    python_cmd=$(get_python_cmd) || {
        write_test_output "Python not found" "red"
        return 1
    }
    
    local test_files=(
        "test_login_pyppeteer.py"
        "test_process_pyppeteer.py"
        "test_home_pyppeteer.py"
        "test_user_management_pyppeteer.py"
        "test_worker_pyppeteer.py"
        "test_cat1_pyppeteer.py"
        "test_cat2_pyppeteer.py"
        "test_motor_model_pyppeteer.py"
        "test_new_tables_pyppeteer.py"
        "test_quota_pyppeteer.py"
        "test_salary_record_pyppeteer.py"
    )
    
    local all_passed=true
    declare -A test_results
    
    for test_file in "${test_files[@]}"; do
        local test_path="$TEST_DIR/$test_file"
        
        if [ -f "$test_path" ]; then
            write_test_output "Running pytest test: $test_file" "yellow"
            
            # Create a temporary file for test output
            local temp_output_file=$(mktemp)
            
            # Temporarily disable set -e to capture exit code properly
            set +e
            # Run test with timeout (120 seconds) and capture both stdout and stderr
            timeout 120 $python_cmd -m pytest "$test_path" -v --tb=short > "$temp_output_file" 2>&1
            local exit_code=$?
            set -e
            
            # Check if test was killed by timeout
            if [ $exit_code -eq 124 ]; then
                write_test_output "Test timed out after 120 seconds" "red"
                # Add timeout message to temp file for pattern matching
                echo "[TIMEOUT] Test exceeded 120 second timeout" >> "$temp_output_file"
            fi
            
            # Write ALL test output to report (don't filter anything)
            while IFS= read -r line; do
                write_test_output "$line" "white"
            done < "$temp_output_file"
            
            # Check if test passed based on pytest output
            local test_passed=false
            
            # Check for pytest success indicators
            if grep -qi "passed\|PASSED" "$temp_output_file" && ! grep -qi "failed\|FAILED\|ERROR" "$temp_output_file"; then
                test_passed=true
            fi
            
            # Also check exit code
            if [ $exit_code -eq 0 ] && [ "$test_passed" = false ]; then
                test_passed=true
            fi
            
            if [ "$test_passed" = true ]; then
                write_test_output "Pytest test $test_file passed!" "green"
                test_results["$test_file"]="PASS"
            else
                write_test_output "Pytest test $test_file failed!" "red"
                test_results["$test_file"]="FAIL"
                all_passed=false
            fi
            
            # Clean up temp file
            rm -f "$temp_output_file"
        else
            write_test_output "Pytest test file not found: $test_file" "yellow"
            test_results["$test_file"]="FAIL"
            all_passed=false
        fi
    done
    
    # Return results
    echo "$all_passed"
    for test_file in "${test_files[@]}"; do
        echo "$test_file:${test_results[$test_file]:-FAIL}"
    done
}

# Function to generate final report
generate_final_report() {
    local all_passed="$1"
    shift
    local test_results=("$@")
    
    write_test_output "" "white"
    write_test_output "============================================================" "white"
    write_test_output "PYTEST PUPPETEER TEST REPORT" "white"
    write_test_output "============================================================" "white"
    
    write_test_output "Test Results Summary:" "white"
    
    # Filter out any result lines that don't look like test results
    local filtered_results=()
    for result_line in "${test_results[@]}"; do
        # Only include lines that have a test filename and PASS/FAIL status
        if [[ "$result_line" =~ ^test_.*\.py:[[:space:]]*(PASS|FAIL)$ ]]; then
            # Normalize to remove extra spaces
            local normalized_line=$(echo "$result_line" | sed 's/[[:space:]]*PASS$/PASS/' | sed 's/[[:space:]]*FAIL$/FAIL/')
            filtered_results+=("$normalized_line")
        fi
    done
    
    # If we have filtered results, use them; otherwise use original
    if [ ${#filtered_results[@]} -gt 0 ]; then
        test_results=("${filtered_results[@]}")
    fi
    
    for result_line in "${test_results[@]}"; do
        local test_file=$(echo "$result_line" | cut -d: -f1)
        local status=$(echo "$result_line" | cut -d: -f2)
        
        if [ "$status" = "PASS" ]; then
            write_test_output "  $test_file: ✅ PASS" "white"
        else
            write_test_output "  $test_file: ❌ FAIL" "white"
        fi
    done
    
    write_test_output "" "white"
    
    # Determine if all tests passed based on actual test results
    local actual_all_passed=true
    for result_line in "${test_results[@]}"; do
        # Extract status (remove any emojis, spaces, or special characters)
        local status=$(echo "$result_line" | cut -d: -f2 | tr -d '[:space:]✅❌' | tr '[:lower:]' '[:upper:]')
        if [ "$status" = "FAIL" ]; then
            actual_all_passed=false
            break
        fi
    done
    
    if [ "$actual_all_passed" = true ]; then
        write_test_output "🎉 All pytest puppeteer tests passed!" "green"
    else
        write_test_output "❌ Some pytest puppeteer tests failed!" "red"
    fi
    
    write_test_output "" "white"
    write_test_output "Test artifacts:" "white"
    write_test_output "  - Screenshots: $TEST_DIR/screenshots/" "white"
    write_test_output "  - Debug info: $TEST_DIR/debug/" "white"
    write_test_output "  - Full report: $REPORT_FILE" "white"
    write_test_output "" "white"
    write_test_output "Note: Tests use shared login session via pytest fixtures" "blue"
    write_test_output "      Login is performed once at the beginning of test session" "blue"
    write_test_output "============================================================" "white"
    
    # Return the actual pass/fail status
    echo "$actual_all_passed"
}

# Function to clean up test artifacts
cleanup_test_artifacts() {
    write_test_output "Cleaning up test artifacts..." "yellow"
    
    # Create necessary directories if they don't exist
    mkdir -p "$TEST_DIR/screenshots"
    mkdir -p "$TEST_DIR/debug"
    
    write_test_output "Test artifacts directories ready" "green"
}

# Main script execution
main() {
    # Initialize report file
    > "$REPORT_FILE"
    
    # Check HEADLESS environment variable (default: True)
    local headless_mode="${HEADLESS:-True}"
    export HEADLESS="$headless_mode"
    
    write_test_output "Starting PyTest Puppeteer Test Script" "white"
    write_test_output "Project Root: $ROOT_DIR" "white"
    write_test_output "Backend Directory: $BACKEND_DIR" "white"
    write_test_output "Test Directory: $TEST_DIR" "white"
    write_test_output "============================================================" "white"
    write_test_output "" "white"
    write_test_output "Headless Mode: $headless_mode (controlled by HEADLESS environment variable)" "blue"
    write_test_output "Usage: HEADLESS=False ./5_perform_pytest_puppeteer_test.sh  # Run in non-headless mode" "blue"
    write_test_output "" "white"
    
    # Step 1: Setup Python environment
    write_test_output "" "white"
    write_test_output "1. Setting up Python environment..." "yellow"
    if ! setup_python_environment; then
        write_test_output "Failed to setup Python environment" "red"
        return 1
    fi
    
    # Step 2: Cleanup test artifacts
    write_test_output "" "white"
    write_test_output "2. Preparing test artifacts directories..." "yellow"
    cleanup_test_artifacts
    
    # Step 3: Run pytest tests
    write_test_output "" "white"
    write_test_output "3. Running pytest tests..." "yellow"
    local test_output
    test_output=$(run_pytest_tests)
    
    # Parse test output
    local all_passed=$(echo "$test_output" | head -n1)
    local test_results=()
    while IFS= read -r line; do
        if [[ "$line" == *:* ]]; then
            test_results+=("$line")
        fi
    done <<< "$test_output"
    
    # Step 4: Generate final report and get actual pass/fail status
    local actual_all_passed
    actual_all_passed=$(generate_final_report "$all_passed" "${test_results[@]}")
    
    if [ "$actual_all_passed" = true ]; then
        write_test_output "Pytest puppeteer test suite completed successfully!" "green"
        return 0
    else
        write_test_output "Pytest puppeteer test suite completed with failures!" "red"
        return 1
    fi
}

# Run main function
if main; then
    exit 0
else
    write_test_output "Test suite failed with error" "red"
    exit 1
fi
