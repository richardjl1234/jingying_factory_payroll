# Development Test Scripts

This directory contains Linux shell scripts for testing and managing the payroll system backend and frontend services.

## Scripts Overview

### 1. Service Management Scripts

- **`0_stop_backend_frontend.sh`** - Stops all backend and frontend services
- **`1_start_backend_frontend.sh`** - Starts backend and frontend services
- **`2_init_database_add_test_data.sh`** - Initializes database and adds test data
- **`3_perform_backend_api_test.sh`** - Runs backend API tests
- **`4_perform_frontend_puppeteer_test.sh`** - Runs frontend Puppeteer tests (JavaScript)
- **`5_perform_pytest_puppeteer_test.sh`** - Runs Python PyTest Puppeteer tests
- **`99_overall_test.sh`** - Orchestrates all test steps in sequence

### 2. Individual Test Files

- **`test_login.js`** - Tests login functionality
- **`test_user_management.js`** - Tests user management
- **`test_worker.js`** - Tests worker management
- **`test_process.js`** - Tests process management
- **`test_new_tables.js`** - Tests new tables (motor models, process categories)

## Quick Start

### Make scripts executable:
```bash
chmod +x *.sh
```

### Start services:
```bash
./0_stop_backend_frontend.sh  # Stop any running services first
./1_start_backend_frontend.sh  # Start backend and frontend
```

### Initialize database with test data:
```bash
./2_init_database_add_test_data.sh
```

### Run backend API tests:
```bash
./3_perform_backend_api_test.sh
```

### Run frontend tests:
```bash
./4_perform_frontend_puppeteer_test.sh
```

### Run Python PyTest Puppeteer tests:
```bash
./5_perform_pytest_puppeteer_test.sh
```

### Run complete test suite:
```bash
./99_overall_test.sh
```

## Service URLs

- **Backend API**: http://localhost:8000
- **Backend API Documentation**: http://localhost:8000/docs
- **Frontend UI**: http://localhost:5173

## Test Credentials

After running `2_init_database_add_test_data.sh`, you can use:

- **Root user**: `root` / `root123`
- **Test user**: `test` / `test123`

## Test Data

The test data includes:
- 10 workers
- 5 processes
- 4 process category 1 items
- 5 process category 2 items
- 5 motor models
- 15 quotas
- 50 work records (stored in work_records table, accessible via v_salary_records view)

## Troubleshooting

### Services not starting
1. Check if ports 8000 and 5173 are already in use:
   ```bash
   lsof -i :8000
   lsof -i :5173
   ```
2. Stop conflicting services or use `./0_stop_backend_frontend.sh`

### Database initialization issues
1. Ensure Python environment is set up:
   ```bash
   python3 --version
   pip list | grep -E "sqlalchemy|fastapi|pydantic"
   ```
2. Check backend requirements:
   ```bash
   cd ../backend && pip install -r requirements.txt
   ```

### Frontend tests failing
Frontend Puppeteer tests may fail due to:
- Missing Chrome/Chromium browser
- Missing npm dependencies
- Timing issues with service startup

Install dependencies:
```bash
cd ../frontend && npm install
```

### Python PyTest tests failing
Python PyTest Puppeteer tests may fail due to:
- Missing Python virtual environment
- Missing Python packages
- Chrome/Chromium browser not installed

Install Python dependencies:
```bash
# Activate virtual environment first
cd ../backend && source venv_linux/bin/activate
# Install test packages
pip install -r ../test/development/requirements-test.txt
```

Note: Python tests use shared login session via pytest fixtures. Login is performed once at the beginning of test session.

## Log Files

- Backend logs: `../backend/backend.log`
- Frontend logs: `../frontend/frontend.log`
- Test reports: Generated in current directory with timestamp

## Notes

- All scripts include colored output for better readability
- Each script generates detailed log files
- The overall test script (`99_overall_test.sh`) orchestrates all steps and generates a comprehensive report
- Scripts are designed to be idempotent (can be run multiple times safely)
