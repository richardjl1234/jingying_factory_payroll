#!/bin/bash
# =============================================================================
# Docker Startup Script - Starts both nginx and Python backend
# =============================================================================

echo "[STARTUP] Starting Payroll System..."

# Start nginx in the background
echo "[STARTUP] Starting nginx..."
nginx -g 'daemon off;' &

# Wait a moment for nginx to start
sleep 2

# Start the Python backend
echo "[STARTUP] Starting Python backend..."
exec python backend/run.py
