// Development environment test configuration
// This file contains configuration settings for all development tests

// Try to read frontend URL from .service_pids file if FRONTEND_URL env var is not set
let frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  try {
    const fs = require('fs');
    const path = require('path');
    const servicePidsPath = path.join(__dirname, '.service_pids');
    if (fs.existsSync(servicePidsPath)) {
      const content = fs.readFileSync(servicePidsPath, 'utf8');
      const match = content.match(/FRONTEND_URL=(.+)/);
      if (match) {
        frontendUrl = match[1];
      }
    }
  } catch (error) {
    // Ignore errors, use default
  }
}

module.exports = {
  // Test environment URLs
  BASE_URLS: {
    backend: process.env.BACKEND_URL || 'http://localhost:8000',
    frontend: frontendUrl || 'http://localhost:5173'
  },
  
  // Test credentials
  TEST_CREDENTIALS: {
    admin: {
      username: 'test',
      password: 'test123'
    },
    report: {
      username: 'report_user',
      password: 'test123'
    }
  },
  
  // Test timeout settings (in milliseconds) - Reduced for faster testing
  TIMEOUTS: {
    short: 2000,    // Reduced from 5000 to 2000
    medium: 5000,   // Reduced from 15000 to 5000
    long: 10000     // Reduced from 30000 to 10000
  },
  
  // Test user roles
  ROLES: {
    admin: 'admin',
    report: 'report'
  },
  
  // API endpoints
  API_ENDPOINTS: {
    login: '/api/auth/login',
    users: '/api/users/',
    workers: '/api/workers/',
    processes: '/api/processes/',
    quotas: '/api/quotas/'
  }
};
