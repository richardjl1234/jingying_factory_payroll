#!/bin/bash

# Stop Backend and Frontend Services
# This script stops any running backend and frontend services on ports 8000 and 5173.
#
# Usage:
# 1. Navigate to the test/development directory
# 2. Run: ./0_stop_backend_frontend.sh

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

# Function to kill processes on specific ports
stop_processes_on_port() {
    local port="$1"
    write_color_output "Stopping processes on port $port..." "yellow"
    
    # Find PIDs listening on the port
    local pids=$(lsof -ti:$port 2>/dev/null || echo "")
    
    if [ -n "$pids" ]; then
        for pid in $pids; do
            # Skip PID 0 (System Idle Process) and invalid PIDs
            if [ "$pid" -gt 0 ] 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null && \
                    write_color_output "Stopped process $pid on port $port" "green" || \
                    write_color_output "Failed to stop process $pid on port $port" "red"
            fi
        done
    else
        write_color_output "No processes found on port $port" "yellow"
    fi
}

# Main script execution
main() {
    write_color_output "Starting Service Stopper Script" "white"
    write_color_output "Project Root: $ROOT_DIR" "white"
    write_color_output "Backend Directory: $BACKEND_DIR" "white"
    write_color_output "Frontend Directory: $FRONTEND_DIR" "white"
    write_color_output "Test Directory: $TEST_DIR" "white"
    write_color_output "============================================================" "white"
    
    # Stop any running processes on relevant ports
    write_color_output "" "white"
    write_color_output "Stopping running processes..." "yellow"
    stop_processes_on_port 8000
    stop_processes_on_port 5173
    
    write_color_output "" "white"
    write_color_output "Service stopping completed successfully!" "green"
    write_color_output "All backend and frontend services have been stopped." "green"
    
    return 0
}

# Run main function
if main; then
    exit 0
else
    write_color_output "Script failed with error" "red"
    exit 1
fi
