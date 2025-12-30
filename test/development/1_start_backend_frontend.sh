#!/bin/bash

# Start Backend and Frontend Services
# This script starts backend and frontend services for testing.
#
# Usage:
# 1. Navigate to the test/development directory
# 2. Run: ./1_start_backend_frontend.sh

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

# Function to write colored output to stderr (so it doesn't interfere with function return values)
write_color_output() {
    local message="$1"
    local color="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$color" in
        "green")
            echo -e "${GREEN}[$timestamp] $message${NC}" >&2
            ;;
        "red")
            echo -e "${RED}[$timestamp] $message${NC}" >&2
            ;;
        "yellow")
            echo -e "${YELLOW}[$timestamp] $message${NC}" >&2
            ;;
        *)
            echo "[$timestamp] $message" >&2
            ;;
    esac
}

# Function to check if a port is in use
is_port_in_use() {
    local port="$1"
    if lsof -ti:$port >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is not in use
    fi
}

# Function to start backend service
start_backend_service() {
    write_color_output "Starting backend service..." "yellow"
    
    # Check if port 8000 is already in use
    if is_port_in_use 8000; then
        write_color_output "Port 8000 is already in use. Stopping existing processes..." "yellow"
        ./0_stop_backend_frontend.sh >&2
    fi
    
    # Change to backend directory
    cd "$BACKEND_DIR" || {
        write_color_output "Failed to change to backend directory: $BACKEND_DIR" "red"
        return 1
    }
    
    # Check if virtual environment exists (Windows style - not usable on Linux)
    # On Linux, we'll use system Python or check for conda environment
    local python_cmd="python3"
    
    # Check if we're in a conda environment
    if [ -n "$CONDA_DEFAULT_ENV" ]; then
        write_color_output "Using conda environment: $CONDA_DEFAULT_ENV" "green"
    else
        # Check if required packages are installed
        if ! python3 -c "import fastapi" 2>/dev/null; then
            write_color_output "FastAPI not found. Installing required packages..." "yellow"
            pip install fastapi uvicorn sqlalchemy pydantic python-multipart python-jose[cryptography] python-dotenv passlib[bcrypt] >/dev/null 2>&1 || {
                write_color_output "Failed to install Python packages" "red"
                return 1
            }
        fi
    fi
    
    # Start backend service in background with nohup to survive shell exit
    write_color_output "Starting backend with: $python_cmd run.py" "yellow"
    nohup $python_cmd run.py > backend.log 2>&1 &
    local backend_pid=$!
    disown $backend_pid 2>/dev/null || true
    
    write_color_output "Backend service started with PID: $backend_pid" "green"
    
    # Wait for backend to start
    write_color_output "Waiting for backend service to initialize..." "yellow"
    sleep 10
    
    # Verify backend is running
    write_color_output "Verifying backend service is running..." "yellow"
    local backend_running=false
    for i in {1..5}; do
        if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
            backend_running=true
            write_color_output "Backend service is running and responding on http://localhost:8000" "green"
            break
        else
            write_color_output "Backend not responding yet, retrying... ($i/5)" "yellow"
            sleep 2
        fi
    done
    
    if [ "$backend_running" = false ]; then
        write_color_output "Warning: Backend service may not have started properly" "red"
        write_color_output "Check backend.log for errors: $BACKEND_DIR/backend.log" "yellow"
        # Don't fail here, just warn
    fi
    
    echo "$backend_pid"
}

# Function to start frontend service
start_frontend_service() {
    write_color_output "Starting frontend service..." "yellow"
    
    # Check if port 5173 is already in use
    if is_port_in_use 5173; then
        write_color_output "Port 5173 is already in use. Trying alternative port..." "yellow"
        # Frontend will auto-select alternative port if 5173 is busy
    fi
    
    # Change to frontend directory
    cd "$FRONTEND_DIR" || {
        write_color_output "Failed to change to frontend directory: $FRONTEND_DIR" "red"
        return 1
    }
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        write_color_output "node_modules not found. Installing dependencies..." "yellow"
        npm install --no-bin-links >/dev/null 2>&1 || {
            write_color_output "Failed to install npm dependencies" "red"
            return 1
        }
    fi
    
    # Start frontend service in background with nohup to survive shell exit
    write_color_output "Starting frontend with: node node_modules/vite/bin/vite.js" "yellow"
    nohup node node_modules/vite/bin/vite.js > frontend.log 2>&1 &
    local frontend_pid=$!
    disown $frontend_pid 2>/dev/null || true
    
    write_color_output "Frontend service started with PID: $frontend_pid" "green"
    
    # Wait for frontend to start
    write_color_output "Waiting for frontend service to initialize..." "yellow"
    sleep 15
    
    # Verify frontend is running (try multiple ports)
    write_color_output "Verifying frontend service is running..." "yellow"
    local frontend_running=false
    local frontend_port=""
    
    # Check common Vite ports
    for port in 5173 5174 5175 5176; do
        if curl -s http://localhost:$port >/dev/null 2>&1; then
            frontend_running=true
            frontend_port=$port
            write_color_output "Frontend service is running and responding on http://localhost:$port" "green"
            break
        fi
    done
    
    if [ "$frontend_running" = false ]; then
        write_color_output "Warning: Frontend service may not have started properly" "red"
        write_color_output "Check frontend.log for errors: $FRONTEND_DIR/frontend.log" "yellow"
        # Don't fail here, just warn
        frontend_port="5173 (or alternative)"
    fi
    
    echo "$frontend_pid:$frontend_port"
}

# Function to cleanup on error
cleanup() {
    write_color_output "Cleaning up partially started services..." "yellow"
    
    if [ -n "$backend_pid" ] && kill -0 "$backend_pid" 2>/dev/null; then
        kill -9 "$backend_pid" 2>/dev/null && \
            write_color_output "Stopped backend service with PID: $backend_pid" "green" || \
            write_color_output "Failed to stop backend service with PID: $backend_pid" "red"
    fi
    
    if [ -n "$frontend_pid" ] && kill -0 "$frontend_pid" 2>/dev/null; then
        kill -9 "$frontend_pid" 2>/dev/null && \
            write_color_output "Stopped frontend service with PID: $frontend_pid" "green" || \
            write_color_output "Failed to stop frontend service with PID: $frontend_pid" "red"
    fi
}

# Main script execution
main() {
    write_color_output "Starting Service Starter Script" "white"
    write_color_output "Project Root: $ROOT_DIR" "white"
    write_color_output "Backend Directory: $BACKEND_DIR" "white"
    write_color_output "Frontend Directory: $FRONTEND_DIR" "white"
    write_color_output "Test Directory: $TEST_DIR" "white"
    write_color_output "============================================================" "white"
    
    # Step 1: Start backend service
    write_color_output "" "white"
    write_color_output "1. Starting backend service..." "yellow"
    backend_pid=$(start_backend_service)
    if [ -z "$backend_pid" ]; then
        write_color_output "Failed to start backend service" "red"
        return 1
    fi
    
    # Step 2: Start frontend service  
    write_color_output "" "white"
    write_color_output "2. Starting frontend service..." "yellow"
    frontend_info=$(start_frontend_service)
    if [ -z "$frontend_info" ]; then
        write_color_output "Failed to start frontend service" "red"
        cleanup
        return 1
    fi
    
    # Parse frontend info (PID:PORT)
    frontend_pid=$(echo "$frontend_info" | cut -d: -f1)
    frontend_port=$(echo "$frontend_info" | cut -d: -f2)
    
    write_color_output "" "white"
    write_color_output "Service starting completed successfully!" "green"
    write_color_output "Backend service PID: $backend_pid" "green"
    write_color_output "Frontend service PID: $frontend_pid" "green"
    write_color_output "" "white"
    write_color_output "Services are now running:" "white"
    write_color_output "  Backend API: http://localhost:8000" "white"
    write_color_output "  Frontend UI: http://localhost:$frontend_port" "white"
    write_color_output "  API Documentation: http://localhost:8000/docs" "white"
    write_color_output "" "white"
    write_color_output "Log files:" "white"
    write_color_output "  Backend logs: $BACKEND_DIR/backend.log" "white"
    write_color_output "  Frontend logs: $FRONTEND_DIR/frontend.log" "white"
    
    # Save PIDs to file for later cleanup
    echo "BACKEND_PID=$backend_pid" > "$TEST_DIR/.service_pids"
    echo "FRONTEND_PID=$frontend_pid" >> "$TEST_DIR/.service_pids"
    echo "FRONTEND_PORT=$frontend_port" >> "$TEST_DIR/.service_pids"
    
    # Export frontend port as environment variable for child processes
    export FRONTEND_URL="http://localhost:$frontend_port"
    echo "FRONTEND_URL=http://localhost:$frontend_port" >> "$TEST_DIR/.service_pids"
    
    write_color_output "" "white"
    write_color_output "Environment variable set: FRONTEND_URL=http://localhost:$frontend_port" "green"
    write_color_output "Subsequent test scripts can use this URL." "white"
    
    return 0
}

# Run main function
if main; then
    exit 0
else
    write_color_output "Script failed with error" "red"
    exit 1
fi
