# ============================================================
# IMPORTANT: PREREQUISITE
# ============================================================
# Before building this Docker image, you MUST build the frontend first:
#   cd frontend && npm run build
#
# This will create the frontend/dist/ directory required by line 54.
# Without it, the Docker build will fail.
# ============================================================

# Multi-stage build for reduced image size

# Stage 1: Builder - Install dependencies and build
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

# ============================================================
# Stage 2: Runtime - Final production image
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

# Copy Python dependencies from builder stage
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /build/requirements.txt /app/requirements.txt

# Copy backend application code
COPY backend/ /app/backend/

# Copy frontend static files (must be built first with: cd frontend && npm run build)
COPY frontend/dist/ /app/frontend/dist/

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
