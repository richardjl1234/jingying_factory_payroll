#!/bin/bash
# ============================================================================
# docker-entrypoint.sh - 容器启动脚本
# ============================================================================
#
# ⚠️ 注意：此脚本当前未被使用！
#
# 由于nginx配置已在Dockerfile构建时预生成（第59-110行），
# 运行时不需要执行任何脚本。容器直接通过 CMD 运行 Python 应用。
#
# 如果需要同时启动nginx和Python服务，请按以下步骤启用：
#
# 1. 修改 Dockerfile:
#    移除: CMD ["python", "backend/run.py"]
#    添加: ENTRYPOINT ["/docker-entrypoint.sh"]
#
# 2. 当前容器启动流程（无需此脚本）:
#    docker compose up → Docker运行容器 → 执行 CMD → Python应用启动
#
# 3. 启用后的启动流程:
#    docker compose up → Docker运行容器 → 执行 ENTRYPOINT → 执行此脚本
#    此脚本会:
#    - 生成nginx配置
#    - 启动nginx (后台)
#    - exec python backend/run.py
#
# ============================================================================

set -e

echo "=== Payroll System Startup ==="
echo "Time: $(date)"
echo "Hostname: $(hostname)"

# Get configuration from environment variables or use defaults
DOMAIN_NAME="${DOMAIN_NAME:-payroll.example.com}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PATH="${FRONTEND_PATH:-/app/frontend/dist}"
API_ENDPOINT="${API_ENDPOINT:-http://127.0.0.1:8000}"

# Use pre-generated nginx config from /nginx-template.conf
# Replace placeholders with actual values
echo "Configuring nginx for domain: $DOMAIN_NAME"

# Replace placeholders in nginx template
sed -i "s/\${DOMAIN_NAME:-payroll.example.com}/$DOMAIN_NAME/g" /nginx-template.conf
sed -i "s/\${FRONTEND_PATH:-/app\/frontend\/dist}/$FRONTEND_PATH/g" /nginx-template.conf
sed -i "s/\${API_ENDPOINT:-http:\/\/127.0.0.1:8000}/$API_ENDPOINT/g" /nginx-template.conf

# Copy configured nginx config
cp /nginx-template.conf /etc/nginx/conf.d/default.conf

echo "Nginx configuration installed successfully"

# Verify configuration
nginx -t

# Create logs directory symlink to stdout
# CloudBase Run captures container logs from stdout/stderr
ln -sf /dev/stdout /app/logs/access.log 2>/dev/null || true
ln -sf /dev/stderr /app/logs/error.log 2>/dev/null || true

echo "=== Starting Services ==="

# Start nginx in background
echo "Starting nginx..."
nginx

# Start backend application (replaces current shell process)
echo "Starting FastAPI backend..."
exec python backend/run.py
