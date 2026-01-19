# ============================================================
# Multi-stage build for reduced image size
# ============================================================

# Stage 1: Python Builder - Install Python dependencies
# (Placed first for better cache utilization since Python deps change less frequently)
FROM python:3.10-slim AS builder

WORKDIR /build

# Install system dependencies needed for Python packages
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt /build/
RUN pip install --no-cache-dir --upgrade pip -i https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set global.trusted-host mirrors.aliyun.com && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Frontend Builder - Build React frontend
# (Placed second since frontend changes more frequently)
FROM docker.m.daocloud.io/node:20-alpine AS frontend-builder

WORKDIR /app

# Configure npm to use Aliyun mirror for faster downloads in China
RUN npm config set registry https://registry.npmmirror.com

# Copy frontend source
COPY frontend/ ./frontend/

# Install dependencies and build
RUN cd frontend && npm install && npm run build

# ============================================================
# Stage 3: Runtime - Final production image
# ============================================================
FROM python:3.10-slim AS runtime

WORKDIR /app

# Install only runtime system dependencies (no compiler needed)
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app/logs

# Copy Python dependencies from builder stage
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /build/requirements.txt /app/requirements.txt

# Copy backend application code
COPY backend/ /app/backend/

# Copy frontend static files from frontend builder stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist/

# Set environment variables
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1

# Change to non-root user
USER appuser

# Expose application port
EXPOSE 8000

# Health check (without requests dependency)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health', timeout=2)" || exit 1

# Start the application
CMD ["python", "backend/run.py"]
