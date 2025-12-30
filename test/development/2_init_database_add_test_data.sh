#!/bin/bash

# Initialize Database and Add Test Data
# This script initializes the database and adds test data using Python scripts.
#
# Usage:
# 1. Navigate to the test/development directory
# 2. Run: ./2_init_database_add_test_data.sh

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

# Function to check if Python is available
check_python_available() {
    if command -v python3 &>/dev/null; then
        local python_version=$(python3 --version 2>&1)
        write_color_output "Python found: $python_version" "green"
        return 0
    elif command -v python &>/dev/null; then
        local python_version=$(python --version 2>&1)
        write_color_output "Python found: $python_version" "green"
        return 0
    else
        write_color_output "Python not found or not in PATH" "red"
        return 1
    fi
}

# Function to check if required Python packages are installed
check_python_packages() {
    local packages=("sqlalchemy" "fastapi" "pydantic" "passlib" "python-jose" "python-multipart")
    local all_installed=true
    
    for package in "${packages[@]}"; do
        if python3 -c "import $package" 2>/dev/null; then
            write_color_output "Package '$package' is installed" "green"
        else
            write_color_output "Package '$package' is NOT installed" "red"
            all_installed=false
        fi
    done
    
    if [ "$all_installed" = false ]; then
        write_color_output "Some required packages are missing. Installing..." "yellow"
        cd "$BACKEND_DIR" && pip install -r requirements.txt >/dev/null 2>&1
        if [ $? -eq 0 ]; then
            write_color_output "Packages installed successfully" "green"
            return 0
        else
            write_color_output "Failed to install packages" "red"
            return 1
        fi
    fi
    
    return 0
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
    
    # Set Python environment variables
    export PYTHONPATH="$working_dir:$PYTHONPATH"
    export PYTHONIOENCODING="utf-8"
    
    # Run the Python script
    local output
    if command -v python3 &>/dev/null; then
        output=$(python3 "$script_path" 2>&1)
    else
        output=$(python "$script_path" 2>&1)
    fi
    local exit_code=$?
    
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
    write_color_output "Starting Database Initialization Script" "white"
    write_color_output "Project Root: $ROOT_DIR" "white"
    write_color_output "Backend Directory: $BACKEND_DIR" "white"
    write_color_output "Backend Scripts Directory: $BACKEND_SCRIPTS_DIR" "white"
    write_color_output "Test Directory: $TEST_DIR" "white"
    write_color_output "============================================================" "white"
    
    # Step 1: Check Python availability
    write_color_output "" "white"
    write_color_output "1. Checking Python environment..." "yellow"
    if ! check_python_available; then
        write_color_output "Python is required but not found. Please install Python and add it to PATH." "red"
        return 1
    fi
    
    # Step 2: Check Python packages
    write_color_output "" "white"
    write_color_output "2. Checking Python packages..." "yellow"
    if ! check_python_packages; then
        write_color_output "Failed to install required Python packages" "red"
        return 1
    fi
    
    # Step 3: Initialize database
    write_color_output "" "white"
    write_color_output "3. Initializing database..." "yellow"
    local init_db_script="$BACKEND_SCRIPTS_DIR/init_db.py"
    if ! run_python_script "$init_db_script" "$BACKEND_DIR"; then
        write_color_output "Database initialization failed" "red"
        return 1
    fi
    
    # Step 4: Generate test data
    write_color_output "" "white"
    write_color_output "4. Generating test data..." "yellow"
    local generate_test_data_script="$BACKEND_SCRIPTS_DIR/generate_test_data.py"
    if ! run_python_script "$generate_test_data_script" "$BACKEND_DIR"; then
        write_color_output "Test data generation failed" "red"
        return 1
    fi
    
    write_color_output "" "white"
    write_color_output "Database initialization completed successfully!" "green"
    write_color_output "Database has been initialized with:" "white"
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
