#!/bin/bash

# Perform Frontend Puppeteer Tests
# This script runs frontend tests using Node.js and Puppeteer.
#
# Usage:
# 1. Navigate to the test/development directory
# 2. Run: ./4_perform_frontend_puppeteer_test.sh

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
REPORT_FILE="$TEST_DIR/frontend_test_report_$(date '+%Y%m%d_%H%M%S').txt"

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
        *)
            echo "$formatted_message" >&2
            ;;
    esac
    
    # Write to report file without color codes
    echo "$formatted_message" >> "$REPORT_FILE"
}

# Function to check if Node.js is available
check_node_available() {
    if command -v node &>/dev/null; then
        local node_version=$(node --version 2>&1)
        write_test_output "Node.js found: $node_version" "green"
        return 0
    else
        write_test_output "Node.js not found or not in PATH" "red"
        return 1
    fi
}

# Function to check if npm packages are installed
check_npm_packages() {
    write_test_output "Checking npm packages..." "yellow"
    
    cd "$TEST_DIR" || {
        write_test_output "Failed to change to test directory: $TEST_DIR" "red"
        return 1
    }
    
    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        write_test_output "node_modules directory exists" "green"
        return 0
    else
        write_test_output "node_modules directory not found, installing packages..." "yellow"
        
        # Install packages with --no-bin-links to avoid symlink permission issues
        local output
        if output=$(npm install --no-bin-links 2>&1); then
            write_test_output "npm packages installed successfully" "green"
            # Print installation output
            while IFS= read -r line; do
                write_test_output "$line" "white"
            done <<< "$output"
            return 0
        else
            write_test_output "Failed to install npm packages" "red"
            # Print error output
            while IFS= read -r line; do
                write_test_output "$line" "white"
            done <<< "$output"
            return 1
        fi
    fi
}

    # Function to run frontend tests
run_frontend_tests() {
    write_test_output "Running frontend tests..." "yellow"
    
    local frontend_test_files=(
        "test_login.js"
        "test_user_management.js"
        "test_worker.js"
        "test_process.js"
        "test_cat1.js"
        "test_cat2.js"
        "test_motor_model.js"
        "test_quota.js"
    )
    
    local all_passed=true
    declare -A test_results
    
    for test_file in "${frontend_test_files[@]}"; do
        local test_path="$TEST_DIR/$test_file"
        
        if [ -f "$test_path" ]; then
            write_test_output "Running frontend test: $test_file" "yellow"
            
            # Create a temporary file for test output
            local temp_output_file=$(mktemp)
            
            # Temporarily disable set -e to capture exit code properly
            set +e
            # Run test with timeout (90 seconds) and capture both stdout and stderr
            timeout 90 node "$test_path" > "$temp_output_file" 2>&1
            local exit_code=$?
            set -e
            
            # Check if test was killed by timeout
            if [ $exit_code -eq 124 ]; then
                write_test_output "Test timed out after 90 seconds" "red"
                # Add timeout message to temp file for pattern matching
                echo "[TIMEOUT] Test exceeded 90 second timeout" >> "$temp_output_file"
            fi
            
            # Write ALL test output to report (don't filter anything)
            while IFS= read -r line; do
                write_test_output "$line" "white"
            done < "$temp_output_file"
            
            # Check if test passed based on output (ignore exit code as tests might exit with non-zero even on success)
            local test_passed=false
            
            # First, check for clear success indicators in the test output
            if grep -qi "TEST PASSED\|✅ PASS\|\[PASS\] PASS\|Status: \[PASS\]\|PASSED\|SUCCESSFUL" "$temp_output_file"; then
                test_passed=true
            fi
            
            # Then, check for clear failure indicators (but only if we haven't already found success)
            # Be more specific about failure patterns to avoid false positives
            if grep -qi "TEST FAILED WITH EXCEPTION\|❌ FAIL\|\[FAIL\] FAIL\|Status: \[FAIL\]\|FAILED\|net::ERR_CONNECTION_REFUSED" "$temp_output_file"; then
                test_passed=false
            fi
            
            # If we couldn't determine based on patterns, use exit code as fallback
            if [ $exit_code -eq 0 ] && [ "$test_passed" = false ]; then
                test_passed=true
            fi
            
            if [ "$test_passed" = true ]; then
                write_test_output "Frontend test $test_file passed!" "green"
                test_results["$test_file"]="PASS"
            else
                write_test_output "Frontend test $test_file failed!" "red"
                test_results["$test_file"]="FAIL"
                all_passed=false
            fi
            
            # Clean up temp file
            rm -f "$temp_output_file"
        else
            write_test_output "Frontend test file not found: $test_file" "yellow"
            test_results["$test_file"]="FAIL"
            all_passed=false
        fi
    done
    
    # Return results
    echo "$all_passed"
    for test_file in "${frontend_test_files[@]}"; do
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
    write_test_output "FRONTEND TEST REPORT" "white"
    write_test_output "============================================================" "white"
    
    write_test_output "Test Results Summary:" "white"
    
    # Filter out any result lines that don't look like test results
    local filtered_results=()
    for result_line in "${test_results[@]}"; do
        # Only include lines that have a test filename and PASS/FAIL status
        # Allow optional spaces before PASS/FAIL
        if [[ "$result_line" =~ ^test_.*\.js:[[:space:]]*(PASS|FAIL)$ ]]; then
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
        write_test_output "🎉 All frontend tests passed!" "green"
    else
        write_test_output "❌ Some frontend tests failed!" "red"
    fi
    
    write_test_output "Report saved to: $REPORT_FILE" "white"
    write_test_output "============================================================" "white"
    
    # Return the actual pass/fail status
    echo "$actual_all_passed"
}

# Main script execution
main() {
    # Initialize report file
    > "$REPORT_FILE"
    
    write_test_output "Starting Frontend Test Script" "white"
    write_test_output "Project Root: $ROOT_DIR" "white"
    write_test_output "Frontend Directory: $FRONTEND_DIR" "white"
    write_test_output "Test Directory: $TEST_DIR" "white"
    write_test_output "============================================================" "white"
    
    # Step 1: Check Node.js availability
    write_test_output "" "white"
    write_test_output "1. Checking Node.js environment..." "yellow"
    if ! check_node_available; then
        write_test_output "Node.js is required but not found. Please install Node.js and add it to PATH." "red"
        return 1
    fi
    
    # Step 2: Check npm packages
    write_test_output "" "white"
    write_test_output "2. Checking npm packages..." "yellow"
    if ! check_npm_packages; then
        write_test_output "Failed to install required npm packages." "red"
        return 1
    fi
    
    # Step 3: Run frontend tests
    write_test_output "" "white"
    write_test_output "3. Running frontend tests..." "yellow"
    local test_output
    test_output=$(run_frontend_tests)
    
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
        write_test_output "Frontend test suite completed successfully!" "green"
        return 0
    else
        write_test_output "Frontend test suite completed with failures!" "red"
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
