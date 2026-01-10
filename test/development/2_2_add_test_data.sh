#!/bin/bash

# Add Test Data
# This script adds test data using Python scripts.
#
# Usage:
# 1. Navigate to the test/development directory
# 2. Run: ./2_2_add_test_data.sh
#
# What this script does:
# - Adds sample workers, processes, quotas, and salary records
# - Creates motor models and process categories data
# - Creates test user (username: test, password: test123)

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
BACKEND_SCRIPTS_DIR="$BACKEND_DIR/scripts"

# Load environment variables
if [ -f "$ROOT_DIR/.env" ]; then
    export $(cat "$ROOT_DIR/.env" | grep -v '^#' | xargs)
fi

# Function to write colored output
write_color_output() {
    local message="$1"
    local color="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$color" in
        "green")
            echo -e "${GREEN}[$timestamp] $message${NC}"
            ;;
        "red")
            echo -e "${RED}[$timestamp] $message${NC}"
            ;;
        "yellow")
            echo -e "${YELLOW}[$timestamp] $message${NC}"
            ;;
        *)
            echo "[$timestamp] $message"
            ;;
    esac
}

# Function to get Python command from virtual environment
get_python_cmd() {
    local venv_dir="$BACKEND_DIR/venv"
    
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

# Function to run Python script
run_python_script() {
    local script_path="$1"
    local working_dir="$2"
    
    if [ ! -f "$script_path" ]; then
        write_color_output "Python script not found: $script_path" "red"
        return 1
    fi
    
    local script_name=$(basename "$script_path")
    write_color_output "Running Python script: $script_name" "yellow"
    
    # Change to working directory
    cd "$working_dir" || {
        write_color_output "Failed to change to directory: $working_dir" "red"
        return 1
    }
    
    # Get Python command from virtual environment
    local python_cmd
    python_cmd=$(get_python_cmd) || {
        write_color_output "Python not found" "red"
        return 1
    }
    
    write_color_output "Using Python: $python_cmd" "green"
    
    # Set Python environment variables
    export PYTHONPATH="$working_dir:$PYTHONPATH"
    export PYTHONIOENCODING="utf-8"
    
    # Run the Python script
    local output
    local exit_code
    
    set +e
    output=$("$python_cmd" "$script_path" 2>&1)
    exit_code=$?
    set -e
    
    # Print output
    while IFS= read -r line; do
        write_color_output "$line" "white"
    done <<< "$output"
    
    # Clean up environment variables
    unset PYTHONPATH
    unset PYTHONIOENCODING
    
    if [ $exit_code -eq 0 ]; then
        write_color_output "Python script completed successfully" "green"
        return 0
    else
        write_color_output "Python script failed with exit code: $exit_code" "red"
        return 1
    fi
}

# Main script execution
main() {
    write_color_output "Starting Test Data Generation Script" "white"
    write_color_output "Project Root: $ROOT_DIR" "white"
    write_color_output "Backend Directory: $BACKEND_DIR" "white"
    write_color_output "Backend Scripts Directory: $BACKEND_SCRIPTS_DIR" "white"
    write_color_output "Test Directory: $TEST_DIR" "white"
    write_color_output "============================================================" "white"
    
    # Print database URL (sanitized)
    write_color_output "" "white"
    write_color_output "Database Configuration:" "yellow"
    if [ -n "$MYSQL_DB_URL" ]; then
        # Mask the password in the URL for security
        local sanitized_url=$(echo "$MYSQL_DB_URL" | sed 's/:[^:]*@/:****@/')
        write_color_output "  Database URL: $sanitized_url" "green"
    else
        write_color_output "  Database URL: NOT SET (check .env file)" "red"
    fi
    write_color_output "" "white"
    
    # Check Python environment
    write_color_output "1. Checking Python environment..." "yellow"
    local python_cmd
    python_cmd=$(get_python_cmd) || {
        write_color_output "Python not found in virtual environment or system" "red"
        return 1
    }
    write_color_output "Using Python: $python_cmd" "green"
    
    # Generate test data
    write_color_output "" "white"
    write_color_output "2. Generating test data..." "yellow"
    local generate_test_data_script="$BACKEND_SCRIPTS_DIR/generate_test_data.py"
    if ! run_python_script "$generate_test_data_script" "$BACKEND_DIR"; then
        write_color_output "Test data generation failed" "red"
        return 1
    fi
    
    write_color_output "" "white"
    write_color_output "Test data added successfully!" "green"
    write_color_output "Database has been populated with:" "white"
    write_color_output "  - Root user: root / root123" "white"
    write_color_output "  - Test user: test / test123" "white"
    write_color_output "  - Sample workers, processes, quotas, and salary records" "white"
    write_color_output "  - New tables data (motor models, process categories)" "white"
    
    return 0
}

# Run main function
if main; then
    exit 0
else
    write_color_output "Script failed with error" "red"
    exit 1
fi
