#!/bin/bash
# =============================================================================
# Tencent Cloud Payroll Deployment Script
# =============================================================================
# Usage:
#   ./deploy.sh              # Deploy using existing image
#   ./deploy.sh --build      # Build & push new image, then deploy
#   ./deploy.sh --help       # Show help
# 
# This script deploys the payroll application to Tencent Cloud with:
# - Docker container for the backend/frontend
# - nginx reverse proxy with HTTPS
# =============================================================================

set -e

# =============================================================================
# Configuration
# =============================================================================
SERVER="jingying@49.235.120.195"
SERVER_DIR="/home/jingying/payroll"
DOMAIN="49.235.120.195"
DOCKER_REGISTRY="ccr.ccs.tencentyun.com/tcb-100044495364-veul/ca-ioonyhof_payroll"
IMAGE_TAG="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# Help
# =============================================================================
show_help() {
    cat << EOF
Tencent Cloud Payroll Deployment Script

Usage: $0 [OPTIONS]

Options:
    --build      Build Docker image, push to registry, then deploy
    --help       Show this help message

Examples:
    $0                  # Deploy using existing image
    $0 --build          # Rebuild image and deploy

EOF
}

# =============================================================================
# Build & Push Docker Image
# =============================================================================
build_image() {
    log_info "Building Docker image..."
    
    # Build the image
    docker build -t ${DOCKER_REGISTRY}:${IMAGE_TAG} .
    
    log_info "Pushing image to registry..."
    docker push ${DOCKER_REGISTRY}:${IMAGE_TAG}
    
    log_info "Image pushed successfully: ${DOCKER_REGISTRY}:${IMAGE_TAG}"
}

# =============================================================================
# Deploy to Server
# =============================================================================
deploy() {
    echo "========================================="
    echo "Deploying Payroll System to Tencent Cloud"
    echo "========================================="
    
    # Step 1: Create directory on server
    log_info "Creating directory on server..."
    ssh $SERVER "mkdir -p $SERVER_DIR/ssl $SERVER_DIR/logs"
    
    # Step 2: Create Docker environment file
    log_info "Creating Docker environment file..."
    cat > /tmp/env.docker << 'EOF'
PAYROLL_PROJECT_ROOT=/home/richard/shared/jianglei/payroll
COMMON_DIR=/home/richard/shared/jianglei/payroll/common
TRANSLATION_DICT=/home/richard/shared/jianglei/payroll/common/translation_dict.pkl
SQLITE_DB_PATH=/home/richard/shared/jianglei/payroll/payroll_database.db
SQLITE_DB_URL=sqlite:////home/richard/shared/jianglei/payroll/payroll_database.db
MYSQL_DB_URL=mysql+pymysql://jingying_test:Q!2we34rt56yu78i@sh-cynosdbmysql-grp-icsnw792.sql.tencentcdb.com:21706/payroll_test
SECRET_KEY=mJKK8DRW5dsPT88QBTILFpiHK25U3_LD2YgR98ZzSsM
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=100
LOG_LEVEL=DEBUG
VITE_API_BASE_URL=/api
VITE_APP_ENV=development
HEADLESS=True
EOF
    scp /tmp/env.docker $SERVER:$SERVER_DIR/env.docker
    
    # Step 3: Generate SSL certificate on server
    log_info "Generating SSL certificate..."
    ssh $SERVER "cd $SERVER_DIR/ssl && \
        openssl genrsa -out key.pem 2048 && \
        openssl req -new -x509 -key key.pem -out cert.pem -days 365 \
            -subj '/C=CN/ST=Beijing/L=Beijing/O=Payroll/CN=$DOMAIN' && \
        chmod 600 key.pem"
    
    # Step 4: Create nginx configuration
    log_info "Creating nginx configuration..."
    ssh $SERVER "cat > /tmp/payroll.conf << 'EOFNginx'
upstream payroll_backend { server 127.0.0.1:8000; }
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}
server {
    listen 443 ssl;
    server_name $DOMAIN;
    ssl_certificate $SERVER_DIR/ssl/cert.pem;
    ssl_certificate_key $SERVER_DIR/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location /api/ {
        proxy_pass http://payroll_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location / {
        proxy_pass http://payroll_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOFNginx
    sudo cp /tmp/payroll.conf /etc/nginx/conf.d/payroll.conf"
    
    # Step 5: Install nginx (if not installed)
    log_info "Checking nginx installation..."
    if ! ssh $SERVER "which nginx" > /dev/null 2>&1; then
        log_info "Installing nginx..."
        ssh $SERVER "sudo yum install -y nginx"
    fi
    
    # Step 6: Start/restart nginx and enable auto-start
    log_info "Starting nginx..."
    ssh $SERVER "sudo nginx -t && sudo pkill nginx 2>/dev/null; sudo nginx"
    
    # Enable nginx auto-start on reboot
    log_info "Enabling nginx auto-start..."
    ssh $SERVER "sudo systemctl enable nginx"
    
    # Step 7: Stop existing container and start new one
    log_info "Stopping existing container..."
    ssh $SERVER "docker rm -f payroll 2>/dev/null || true"
    
    log_info "Starting Docker container..."
    ssh $SERVER "cd $SERVER_DIR && docker run -d \
        --name payroll \
        -p 8000:8000 \
        --env-file env.docker \
        -e PYTHONPATH=/app \
        -e PYTHONUNBUFFERED=1 \
        -e LOG_DIR=/app/logs \
        -e CLOUDBASE_RUN=false \
        -e DOMAIN_NAME=localhost \
        -e BACKEND_PORT=8000 \
        -e FRONTEND_PATH=/app/frontend/dist \
        -e API_ENDPOINT=http://127.0.0.1:8000 \
        -v $SERVER_DIR/logs:/app/logs:rw \
        --restart unless-stopped \
        ${DOCKER_REGISTRY}:${IMAGE_TAG}"
    
    # Step 8: Wait and verify
    log_info "Waiting for service to start..."
    sleep 10
    
    # Verify
    echo ""
    echo "========================================="
    echo "Deployment Complete!"
    echo "========================================="
    
    # Check container status
    if ssh $SERVER "docker ps | grep -q payroll"; then
        log_info "Docker container is running"
    else
        log_error "Docker container failed to start"
        ssh $SERVER "docker logs payroll"
    fi
    
    # Check HTTPS
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/health --insecure 2>/dev/null || echo "000")
    if [ "$HTTPS_STATUS" = "200" ]; then
        log_info "HTTPS is working"
    else
        log_warn "HTTPS check returned: $HTTPS_STATUS"
    fi
    
    echo ""
    echo "========================================="
    echo "Access URLs:"
    echo "  HTTP:  http://$DOMAIN (redirects to HTTPS)"
    echo "  HTTPS: https://$DOMAIN"
    echo "  API:   https://$DOMAIN/api/health"
    echo ""
    echo "Image: ${DOCKER_REGISTRY}:${IMAGE_TAG}"
    echo ""
    echo "Useful Commands:"
    echo "  View logs:   ssh $SERVER 'docker logs payroll'"
    echo "  Stop:        ssh $SERVER 'docker stop payroll'"
    echo "  Restart:     ssh $SERVER 'docker restart payroll'"
    echo "  Nginx logs:  ssh $SERVER 'sudo tail -f /var/log/nginx/error.log'"
    echo "========================================="
}

# =============================================================================
# Main
# =============================================================================
main() {
    case "${1:-}" in
        --build)
            build_image
            deploy
            ;;
        --help|-h)
            show_help
            ;;
        "")
            deploy
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
