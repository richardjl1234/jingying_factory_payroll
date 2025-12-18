// Development environment test configuration
// This file contains configuration settings for all development tests

module.exports = {
  // Test environment URLs
  BASE_URLS: {
    backend: process.env.BACKEND_URL || 'http://localhost:8000',
    frontend: process.env.FRONTEND_URL || 'http://localhost:5173'
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
  
  // Test timeout settings (in milliseconds)
  TIMEOUTS: {
    short: 5000,
    medium: 15000,
    long: 30000
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
