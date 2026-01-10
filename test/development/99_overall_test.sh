#!/bin/bash

# Overall Test Orchestrator
# This script orchestrates all test steps in sequence:
# 0. Stop backend and frontend services
# 1. Start backend and frontend services
# 2. Initialize database (clean and create structure)
# 3. Add test data
# 4. Restart services after DB init
# 5. Perform backend API tests
# 6. Perform Python PyTest Puppeteer tests (replaces JavaScript frontend tests)
# 7. Stop backend and frontend services (cleanup)
#
# Usage:
# 1. Navigate to the test/development directory
# 2. Run: ./99_overall_test.sh

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

# Overall test report file
OVERALL_REPORT_FILE="$TEST_DIR/overall_test_report_$(date '+%Y%m%d_%H%M%S').txt"

# Function to write colored output and to report file
write_overall_output() {
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
    echo "$formatted_message" >> "$OVERALL_REPORT_FILE"
}

# Function to run a step script
run_test_step() {
    local step_script="$1"
    local step_name="$2"
    
    local step_script_path="$TEST_DIR/$step_script"
    
    if [ ! -f "$step_script_path" ]; then
        write_overall_output "Step script not found: $step_script" "red"
        return 1
    fi
    
    write_overall_output "" "white"
    write_overall_output "=== Starting Step: $step_name ===" "yellow"
    write_overall_output "Running script: $step_script" "white"
    
    # Make script executable
    chmod +x "$step_script_path" 2>/dev/null || true
    
    # Temporarily disable set -e to capture exit code properly
    set +e
    local output
    output=$("$step_script_path" 2>&1)
    local exit_code=$?
    set -e
    
    # Write output
    while IFS= read -r line; do
        write_overall_output "$line" "white"
    done <<< "$output"
    
    if [ $exit_code -eq 0 ]; then
        write_overall_output "Step completed successfully: $step_name" "green"
        return 0
    else
        write_overall_output "Step failed with exit code $exit_code: $step_name" "red"
        return 1
    fi
}

# Function to generate final overall report
generate_overall_report() {
    local -n step_results_ref=$1
    
    write_overall_output "" "white"
    write_overall_output "============================================================" "white"
    write_overall_output "OVERALL TEST REPORT" "white"
    write_overall_output "============================================================" "white"
    
    write_overall_output "Test Sequence Results:" "white"
    
    local all_steps_passed=true
    
    # Sort step keys to maintain order
    local sorted_keys
    sorted_keys=$(for key in "${!step_results_ref[@]}"; do echo "$key"; done | sort)
    
    while IFS= read -r step_key; do
        local result="${step_results_ref[$step_key]}"
        local passed=$(echo "$result" | cut -d: -f1)
        local script_name=$(echo "$result" | cut -d: -f2)
        
        if [ "$passed" = "true" ]; then
            write_overall_output "  $(printf "%-50s" "$step_key") ✅ PASS" "green"
        else
            write_overall_output "  $(printf "%-50s" "$step_key") ❌ FAIL" "red"
            all_steps_passed=false
        fi
    done <<< "$sorted_keys"
    
    write_overall_output "" "white"
    write_overall_output "Overall Result:" "white"
    
    if [ "$all_steps_passed" = true ]; then
        write_overall_output "🎉 ALL TESTS PASSED! The system is working correctly." "green"
    else
        write_overall_output "❌ SOME TESTS FAILED! Please check the individual test reports." "red"
    fi
    
    write_overall_output "" "white"
    write_overall_output "Individual Test Reports:" "white"
    write_overall_output "  - Backend API tests: Look for backend_test_report_*.txt" "white"
    write_overall_output "  - Frontend tests: Look for frontend_test_report_*.txt" "white"
    write_overall_output "  - Overall report: $OVERALL_REPORT_FILE" "white"
    
    write_overall_output "============================================================" "white"
    
    echo "$all_steps_passed"
}

# Main script execution
main() {
    # Initialize report file
    > "$OVERALL_REPORT_FILE"
    
    write_overall_output "Starting Overall Test Orchestrator" "white"
    write_overall_output "Project Root: $ROOT_DIR" "white"
    write_overall_output "Test Directory: $TEST_DIR" "white"
    write_overall_output "============================================================" "white"
    
    # Define test steps in sequence (using indexed arrays to preserve order)
    declare -a step_keys=(
        "Step 0: Stop Backend and Frontend Services"
        "Step 1: Start Backend and Frontend Services"
        "Step 2: Initialize Database"
        "Step 3: Add Test Data"
        "Step 4: Restart Services After DB Init"
        "Step 5: Perform Backend API Tests"
        # "Step 6: Perform Frontend Puppeteer Tests"  # Commented out, using Python tests instead
        "Step 6: Perform Python PyTest Puppeteer Tests"
        "Step 7: Cleanup - Stop Backend and Frontend Services"
    )
    
    declare -A step_scripts
    step_scripts["Step 0: Stop Backend and Frontend Services"]="0_stop_backend_frontend.sh"
    step_scripts["Step 1: Start Backend and Frontend Services"]="1_start_backend_frontend.sh"
    step_scripts["Step 2: Initialize Database"]="2_1_init_database.sh"
    step_scripts["Step 3: Add Test Data"]="2_2_add_test_data.sh"
    step_scripts["Step 4: Restart Services After DB Init"]="1_start_backend_frontend.sh"
    step_scripts["Step 5: Perform Backend API Tests"]="3_perform_backend_api_test.sh"
    # step_scripts["Step 6: Perform Frontend Puppeteer Tests"]="4_perform_frontend_puppeteer_test.sh"  # Commented out
    step_scripts["Step 6: Perform Python PyTest Puppeteer Tests"]="5_perform_pytest_puppeteer_test.sh"
    step_scripts["Step 7: Cleanup - Stop Backend and Frontend Services"]="0_stop_backend_frontend.sh"
    
    declare -A step_results
    
    # Execute each test step in order
    for step_key in "${step_keys[@]}"; do
        local step_script="${step_scripts[$step_key]}"
        local step_name="${step_key#Step [0-9]: }"
        
        write_overall_output "" "white"
        write_overall_output "============================================================" "white"
        write_overall_output "EXECUTING $step_key" "yellow"
        write_overall_output "============================================================" "white"
        
        if run_test_step "$step_script" "$step_name"; then
            step_results["$step_key"]="true:$step_script"
        else
            step_results["$step_key"]="false:$step_script"
            write_overall_output "Step failed, but continuing with next steps..." "yellow"
        fi
        
        # Add a small delay between steps (except after last step)
        if [ "$step_key" != "Step 7: Cleanup - Stop Backend and Frontend Services" ]; then
            write_overall_output "Preparing for next step..." "yellow"
            sleep 2
        fi
    done
    
    # Generate overall report
    local all_steps_passed
    all_steps_passed=$(generate_overall_report step_results)
    
    write_overall_output "" "white"
    write_overall_output "Overall test orchestration completed!" "white"
    
    # Trim whitespace and newlines from all_steps_passed
    all_steps_passed=$(echo "$all_steps_passed" | tr -d '[:space:]')
    
    if [ "$all_steps_passed" = "true" ]; then
        write_overall_output "All test steps passed successfully!" "green"
        return 0
    else
        write_overall_output "Some test steps failed. Check individual reports for details." "red"
        return 1
    fi
}

# Run main function
if main; then
    exit 0
else
    write_overall_output "Overall test orchestration failed with error" "red"
    exit 1
fi
