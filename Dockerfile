# =============================================================================
# Multi-stage Dockerfile for Payroll System
# =============================================================================
# Build optimization:
# - Python deps: cached until backend/requirements.txt changes
# - Frontend: cached until frontend/src or frontend/package.json changes
# - Runtime: rebuilds when either changes
# =============================================================================

# ============================================================
# Stage 1: Python Builder - Install Python dependencies
# ============================================================
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/python:3.10-slim-bookworm AS python-builder

WORKDIR /build

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    gcc g++ default-libmysqlclient-dev build-essential pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /build/
RUN pip install --no-cache-dir --upgrade pip -i https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set global.trusted-host mirrors.aliyun.com && \
    pip install --no-cache-dir -r requirements.txt

# ============================================================
# Stage 2: Frontend Builder - Build frontend inside container
# ============================================================
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/node:18-slim AS frontend-builder

WORKDIR /build/frontend

# Copy package files first (for better caching)
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm config set registry https://registry.npmmirror.com && \
    npm install

# Copy frontend source code and build
COPY frontend/ ./
RUN npm run build

# ============================================================
# Stage 3: Runtime - Final production image
# ============================================================
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/python:3.10-slim-bookworm AS runtime

WORKDIR /app

# Install runtime dependencies
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev libglib2.0-0 libsm6 libxext6 libxrender1 nginx \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# Copy Python dependencies from builder stage
COPY --from=python-builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=python-builder /build/requirements.txt /app/requirements.txt

# Copy backend application code
COPY backend/ /app/backend/

# Copy frontend build output from frontend builder stage
COPY --from=frontend-builder /build/frontend/dist /app/frontend/dist/

# Generate nginx configuration as root (before switching user)
ENV DOMAIN_NAME=localhost
ENV BACKEND_PORT=8000
ENV FRONTEND_PATH=/app/frontend/dist
ENV API_ENDPOINT=http://127.0.0.1:8000

RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
# Auto-generated nginx configuration for CloudBase Run
# Note: CloudBase Run handles SSL termination at load balancer level
# So nginx receives HTTP requests only

server {
    listen 80;
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

# Copy startup script (before switching to non-root user)
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

# Set environment variables
ENV PYTHONPATH=/app PYTHONUNBUFFERED=1

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 8000

# Start the application
CMD ["/app/docker-start.sh"]
