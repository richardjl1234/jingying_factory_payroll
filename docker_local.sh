#!/bin/bash
# =============================================================================
# Local Docker Testing Script for Payroll System
# =============================================================================
# This script builds and runs the backend+frontend in Docker containers for local testing.
# Usage:
#   ./docker_local.sh --build    # Build frontend and Docker image
#   ./docker_local.sh --run      # Run the container
#   ./docker_local.sh --start    # Build and run (both)
#   ./docker_local.sh --stop     # Stop the container
#   ./docker_local.sh --logs     # View container logs
#   ./docker_local.sh --clean    # Clean up container and image
# =============================================================================

set -e

# Configuration
CONTAINER_NAME="payroll-local"
IMAGE_NAME="payroll-local:latest"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Create env file for local Docker testing
create_env_file() {
    log_step "Creating environment file for local Docker testing..."
    
    # Use the existing environment script and convert to Docker env file format
    ENV_SOURCE="$HOME/shared/jianglei/payroll/env_docker_local_mysql.sh"
    
    if [ -f "$ENV_SOURCE" ]; then
        log_info "Using existing environment file: $ENV_SOURCE"
        
        # Source the existing script and create a Docker-compatible env file
        source "$ENV_SOURCE"
        
        # Write to Docker env file format (KEY=VALUE without export)
        cat > "$PROJECT_ROOT/env_local.docker" << EOF
PAYROLL_PROJECT_ROOT=$PAYROLL_PROJECT_ROOT
COMMON_DIR=$COMMON_DIR
TRANSLATION_DICT=$TRANSLATION_DICT
SQLITE_DB_PATH=$SQLITE_DB_PATH
SQLITE_DB_URL=$SQLITE_DB_URL
MYSQL_DB_URL=$MYSQL_DB_URL
SECRET_KEY=$SECRET_KEY
ALGORITHM=$ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES=$ACCESS_TOKEN_EXPIRE_MINUTES
LOG_LEVEL=$LOG_LEVEL
VITE_API_BASE_URL=$VITE_API_BASE_URL
VITE_APP_ENV=$VITE_APP_ENV
HEADLESS=$HEADLESS
EOF
        
        log_info "Environment file created: env_local.docker"
    else
        log_error "Environment file not found: $ENV_SOURCE"
        exit 1
    fi
}

# Build frontend
build_frontend() {
    log_step "Building frontend..."
    
    if [ ! -d "$PROJECT_ROOT/frontend/dist" ]; then
        log_info "Building frontend with npm..."
        cd "$PROJECT_ROOT/frontend"
        npm install
        npm run build
        cd - > /dev/null
    else
        log_info "Frontend already built, skipping..."
    fi
    
    log_info "Frontend build complete"
}

# Build Docker image
build_image() {
    log_step "Building Docker image..."
    
    # Ensure frontend is built first
    build_frontend
    
    cd "$PROJECT_ROOT"
    docker build -t "$IMAGE_NAME" .
    
    log_info "Docker image built: $IMAGE_NAME"
}

# Run container
run_container() {
    log_step "Running Docker container..."
    
    # Create env file if not exists
    if [ ! -f "$PROJECT_ROOT/env_local.docker" ]; then
        create_env_file
    fi
    
    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Stop existing container if running
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_warn "Container already exists, removing..."
        docker rm -f "$CONTAINER_NAME"
    fi
    
    # Run container
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p 8000:8000 \
        --env-file "$PROJECT_ROOT/env_local.docker" \
        -v "$PROJECT_ROOT/logs:/app/logs:rw" \
        --add-host=host.docker.internal:host-gateway \
        --restart unless-stopped \
        "$IMAGE_NAME"
    
    log_info "Container started: $CONTAINER_NAME"
    log_info "Application will be available at: http://localhost:8000"
}

# Stop container
stop_container() {
    log_step "Stopping container..."
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker stop "$CONTAINER_NAME"
        log_info "Container stopped"
    else
        log_warn "Container is not running"
    fi
}

# View logs
view_logs() {
    log_step "Container logs (Ctrl+C to exit):"
    docker logs -f "$CONTAINER_NAME"
}

# Clean up
clean_up() {
    log_step "Cleaning up..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    docker rmi "$IMAGE_NAME" 2>/dev/null || true
    log_info "Cleanup complete"
}

# Show status
show_status() {
    echo ""
    echo "========================================="
    echo "Docker Local Testing Status"
    echo "========================================="
    
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_info "Container: RUNNING"
        docker port "$CONTAINER_NAME"
        echo ""
        echo "Access URLs:"
        echo "  - Frontend: http://localhost:8000"
        echo "  - API: http://localhost:8000/api"
        echo "  - API Docs: http://localhost:8000/docs"
    else
        log_warn "Container: NOT RUNNING"
    fi
    echo ""
}

# Main
main() {
    case "${1:-}" in
        --build)
            create_env_file
            build_image
            ;;
        --run)
            run_container
            ;;
        --start)
            create_env_file
            build_image
            run_container
            sleep 5
            show_status
            ;;
        --stop)
            stop_container
            ;;
        --restart)
            stop_container
            run_container
            sleep 5
            show_status
            ;;
        --logs)
            view_logs
            ;;
        --clean)
            clean_up
            ;;
        --status)
            show_status
            ;;
        --help|-h)
            echo "Local Docker Testing Script for Payroll System"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --build    Build frontend and Docker image"
            echo "  --run      Run the container"
            echo "  --start    Build and run (both)"
            echo "  --stop     Stop the container"
            echo "  --restart  Restart the container"
            echo "  --logs     View container logs"
            echo "  --clean    Clean up container and image"
            echo "  --status   Show container status"
            echo "  --help     Show this help message"
            echo ""
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
}

main "$@"
