# Development environment test configuration for Python tests
import os
from pathlib import Path

# Try to read frontend URL from .service_pids file if FRONTEND_URL env var is not set
frontend_url = os.getenv('FRONTEND_URL')
if not frontend_url:
    try:
        service_pids_path = Path(__file__).parent / '.service_pids'
        if service_pids_path.exists():
            content = service_pids_path.read_text()
            import re
            match = re.search(r'FRONTEND_URL=(.+)', content)
            if match:
                frontend_url = match.group(1)
    except Exception:
        pass

# Test environment URLs
BASE_URLS = {
    'backend': os.getenv('BACKEND_URL', 'http://localhost:8000'),
    'frontend': frontend_url or 'http://localhost:5173'
}

# Test credentials
TEST_CREDENTIALS = {
    'admin': {
        'username': 'test',
        'password': 'test123'
    },
    'report': {
        'username': 'report_user',
        'password': 'test123'
    }
}

# Test timeout settings (in milliseconds) - Reduced for faster testing
TIMEOUTS = {
    'short': 2000,    # Reduced from 5000 to 2000
    'medium': 5000,   # Reduced from 15000 to 5000
    'long': 10000     # Reduced from 30000 to 10000
}

# Test user roles
ROLES = {
    'admin': 'admin',
    'report': 'report'
}

# API endpoints
API_ENDPOINTS = {
    'login': '/api/auth/login',
    'users': '/api/users/',
    'workers': '/api/workers/',
    'processes': '/api/processes/',
    'quotas': '/api/quotas/'
}
