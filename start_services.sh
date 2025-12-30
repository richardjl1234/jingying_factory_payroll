#!/bin/bash

# Simple script to start backend and frontend services
# Usage: ./start_services.sh

echo "========================================="
echo "Starting Payroll System Services"
echo "========================================="

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "Error: Backend or frontend directory not found."
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "1. Checking if services are already running..."
if lsof -i :8000 >/dev/null 2>&1; then
    echo "   Backend service is already running on port 8000"
else
    echo "   Backend service is not running"
fi

if lsof -i :5173 >/dev/null 2>&1; then
    echo "   Frontend service is already running on port 5173"
else
    echo "   Frontend service is not running"
fi

echo ""
echo "2. Starting services using test scripts..."
echo "   (Using scripts from test/development directory)"

# Use the test scripts to start services
if [ -f "test/development/0_stop_backend_frontend.sh" ]; then
    echo "   Stopping any existing services first..."
    test/development/0_stop_backend_frontend.sh >/dev/null 2>&1
    sleep 2
fi

if [ -f "test/development/1_start_backend_frontend.sh" ]; then
    echo "   Starting backend and frontend services..."
    test/development/1_start_backend_frontend.sh
else
    echo "   Error: Start script not found!"
    echo "   Starting services manually..."
    
    echo "   Starting backend..."
    cd backend && python3 run.py &
    BACKEND_PID=$!
    echo "   Backend started with PID: $BACKEND_PID"
    
    echo "   Waiting for backend to initialize..."
    sleep 10
    
    echo "   Starting frontend..."
    cd ../frontend && npm run dev &
    FRONTEND_PID=$!
    echo "   Frontend started with PID: $FRONTEND_PID"
fi

echo ""
echo "3. Verifying services are running..."
echo "   Waiting for services to start..."
sleep 5

echo ""
echo "   Checking backend health..."
if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
    echo "   ✅ Backend is running at http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
else
    echo "   ❌ Backend is not responding"
fi

echo ""
echo "   Checking frontend..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null | grep -q "200"; then
    echo "   ✅ Frontend is running at http://localhost:5173"
else
    echo "   ❌ Frontend is not responding"
fi

echo ""
echo "========================================="
echo "Services Status Summary"
echo "========================================="
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Test credentials (if database initialized):"
echo "  - Username: test, Password: test123"
echo "  - Username: root, Password: root123"
echo ""
echo "To initialize database with test data:"
echo "  ./test/development/2_init_database_add_test_data.sh"
echo ""
echo "To stop services:"
echo "  ./test/development/0_stop_backend_frontend.sh"
echo "========================================="
