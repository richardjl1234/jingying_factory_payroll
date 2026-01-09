#!/bin/bash

# Perform Backend API Tests
# This script runs backend API tests using the Python test script.
#
# Usage:
# 1. Navigate to the test/development directory
# 2. Run: ./3_perform_backend_api_test.sh

set -e  # Stop on errors

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
TEST_DIR="$SCRIPT_DIR"

# Test report file
REPORT_FILE="$TEST_DIR/backend_test_report_$(date '+%Y%m%d_%H%M%S').txt"

# Function to write colored output and to report file
write_test_output() {
    local message="$1"
    local color="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local formatted_message="[$timestamp] $message"
    
    # Write to console with color
    case "$color" in
        "green")
            echo -e "${GREEN}$formatted_message${NC}"
            ;;
        "red")
            echo -e "${RED}$formatted_message${NC}"
            ;;
        "yellow")
            echo -e "${YELLOW}$formatted_message${NC}"
            ;;
        *)
            echo "$formatted_message"
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

# Function to run backend API tests
run_backend_tests() {
    write_test_output "Running backend API tests..." "yellow"
    
    cd "$TEST_DIR" || {
        write_test_output "Failed to change to test directory: $TEST_DIR" "red"
        return 1
    }
    
    # Get Python command from virtual environment
    local python_cmd
    python_cmd=$(get_python_cmd) || {
        write_test_output "Python not found" "red"
        return 1
    }
    
    write_test_output "Using Python command: $python_cmd" "green"
    
    # Run the Python test script
    local output
    local exit_code
    
    # Temporarily disable set -e to capture exit code properly
    set +e
    output=$($python_cmd test_api.py 2>&1)
    exit_code=$?
    set -e
    
    # Write result to report
    while IFS= read -r line; do
        write_test_output "$line" "white"
    done <<< "$output"
    
    if [ $exit_code -eq 0 ]; then
        write_test_output "Backend API tests passed!" "green"
        return 0
    else
        write_test_output "Backend API tests failed with exit code: $exit_code" "red"
        return 1
    fi
}

# Function to generate final report
generate_final_report() {
    local tests_passed="$1"
    
    write_test_output "" "white"
    write_test_output "============================================================" "white"
    write_test_output "BACKEND API TEST REPORT" "white"
    write_test_output "============================================================" "white"
    
    write_test_output "Test Results Summary:" "white"
    if [ "$tests_passed" = true ]; then
        write_test_output "Backend API Tests: PASSED" "green"
    else
        write_test_output "Backend API Tests: FAILED" "red"
    fi
    
    write_test_output "" "white"
    if [ "$tests_passed" = true ]; then
        write_test_output "🎉 All backend API tests passed!" "green"
    else
        write_test_output "❌ Backend API tests failed!" "red"
    fi
    
    write_test_output "Report saved to: $REPORT_FILE" "white"
    write_test_output "============================================================" "white"
}

# Main script execution
main() {
    # Initialize report file
    > "$REPORT_FILE"
    
    write_test_output "Starting Backend API Test Script" "white"
    write_test_output "Project Root: $ROOT_DIR" "white"
    write_test_output "Backend Directory: $BACKEND_DIR" "white"
    write_test_output "Test Directory: $TEST_DIR" "white"
    write_test_output "============================================================" "white"
    
    # Run backend API tests
    write_test_output "" "white"
    write_test_output "Running backend API tests..." "yellow"
    local tests_passed=false
    if run_backend_tests; then
        tests_passed=true
    fi
    
    # Generate final report
    generate_final_report "$tests_passed"
    
    if [ "$tests_passed" = true ]; then
        write_test_output "Backend API test suite completed successfully!" "green"
        return 0
    else
        write_test_output "Backend API test suite completed with failures!" "red"
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
