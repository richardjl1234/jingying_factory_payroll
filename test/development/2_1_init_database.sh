#!/bin/bash

# Initialize Database
# This script initializes the database structure using Python scripts.
#
# Usage:
# 1. Navigate to the test/development directory
# 2. Run: ./2_1_init_database.sh
#
# What this script does:
# - Cleans all existing data in the database (DROPS ALL TABLES)
# - Creates database tables
# - Adds obsolete_date column to quotas table if it doesn't exist
# - Creates v_salary_records view
# - Creates root user (username: root, password: root123)
#
# WARNING: This script will DELETE ALL existing data in the database!

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
    write_color_output "Starting Database Initialization Script" "white"
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
    
    # Drop all tables to clean existing data
    write_color_output "" "white"
    write_color_output "2. Cleaning existing database data..." "yellow"
    write_color_output "   WARNING: All existing data will be deleted!" "red"
    
    cd "$BACKEND_DIR" || {
        write_color_output "Failed to change to directory: $BACKEND_DIR" "red"
        return 1
    }
    
    export PYTHONPATH="$BACKEND_DIR:$PYTHONPATH"
    export PYTHONIOENCODING="utf-8"
    
    local drop_output
    local drop_exit_code
    
    set +e
    drop_output=$("$python_cmd" -c "
from sqlalchemy import text
from app.database import SessionLocal, engine

db = SessionLocal()
try:
    # Drop view first (if exists)
    db.execute(text('DROP VIEW IF EXISTS v_salary_records'))
    print('Dropped view: v_salary_records')
    
    # Drop all tables
    db.execute(text('SET FOREIGN_KEY_CHECKS=0'))
    # Get all table names
    result = db.execute(text(\"SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'\"))
    tables = result.fetchall()
    for table in tables:
        table_name = table[0]
        print(f'Dropping table: {table_name}')
        db.execute(text(f'DROP TABLE IF EXISTS {table_name}'))
    db.execute(text('SET FOREIGN_KEY_CHECKS=1'))
    db.commit()
    print('All tables and views dropped successfully')
except Exception as e:
    print(f'Error: {e}')
    db.rollback()
finally:
    db.close()
" 2>&1)
    drop_exit_code=$?
    set -e
    
    while IFS= read -r line; do
        write_color_output "$line" "white"
    done <<< "$drop_output"
    
    unset PYTHONPATH
    unset PYTHONIOENCODING
    
    if [ $drop_exit_code -ne 0 ]; then
        write_color_output "Failed to drop tables" "red"
        return 1
    fi
    
    write_color_output "Database cleaned successfully!" "green"
    
    # Initialize database
    write_color_output "" "white"
    write_color_output "3. Initializing database structure..." "yellow"
    local init_db_script="$BACKEND_SCRIPTS_DIR/init_db.py"
    if ! run_python_script "$init_db_script" "$BACKEND_DIR"; then
        write_color_output "Database initialization failed" "red"
        return 1
    fi
    
    write_color_output "" "white"
    write_color_output "Database initialization completed successfully!" "green"
    write_color_output "All existing data has been cleaned and new structure created." "white"
    write_color_output "Root user: root / root123" "white"
    
    return 0
}

# Run main function
if main; then
    exit 0
else
    write_color_output "Script failed with error" "red"
    exit 1
fi
