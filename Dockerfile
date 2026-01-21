# ============================================================
# Multi-stage build for reduced image size
# ============================================================

# Stage 1: Python Builder - Install Python dependencies
FROM python:3.10-slim AS builder

WORKDIR /build

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    gcc g++ default-libmysqlclient-dev build-essential pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /build/
RUN pip install --no-cache-dir --upgrade pip -i https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set global.trusted-host mirrors.aliyun.com && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Frontend Builder - Build React frontend
FROM docker.m.daocloud.io/node:20-alpine AS frontend-builder

WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
COPY frontend/ ./frontend/
RUN cd frontend && npm install && npm run build

# ============================================================
# Stage 3: Runtime - Final production image for CloudBase Run
# ============================================================
FROM python:3.10-slim AS runtime

WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev libglib2.0-0 libsm6 libxext6 libxrender1 nginx \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# Copy Python dependencies
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /build/requirements.txt /app/requirements.txt

# Copy backend application code
COPY backend/ /app/backend/

# Copy frontend static files
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist/

# Generate nginx configuration as root (before switching user)
ENV DOMAIN_NAME=localhost
ENV BACKEND_PORT=8000
ENV FRONTEND_PATH=/app/frontend/dist
ENV API_ENDPOINT=http://127.0.0.1:8000

RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
# Auto-generated nginx configuration for CloudBase Run

server {
    listen 80;
    server_name localhost;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name localhost;

    # Frontend static files
    location / {
        root /app/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8000/api/health;
        proxy_http_version 1.1;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
    gzip_disable "MSIE [1-6]\.";
}
EOF

# Create logs directory and set permissions
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app/logs && chmod 755 /etc/nginx/conf.d/default.conf

# Set environment variables
ENV PYTHONPATH=/app PYTHONUNBUFFERED=1

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 8000

# Note: Health check is configured in CloudBase Run console, not in Dockerfile
# To configure health check in CloudBase Run:
# 1. Go to CloudBase Console → CloudBase Run
# 2. Select your service
# 3. Go to Configuration → Health Check
# 4. Set:
#    - Port: 8000
#    - Check Path: /api/health
#    - Initial Delay: 15 seconds

# Start the application
CMD ["python", "backend/run.py"]
