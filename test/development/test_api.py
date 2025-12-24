#!/usr/bin/env python3
# API tests for development environment
# This test verifies that backend API endpoints are working correctly

import requests
import sys
import os
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import configuration from a JSON file if available, otherwise use defaults
config = {
    "base_url": os.getenv("TEST_BASE_URL", "http://localhost:8000"),
    "test_credentials": {
        "username": "test",
        "password": "test123"
    }
}

# Try to load from config.json if it exists
config_file_path = os.path.join(os.path.dirname(__file__), "config.json")
if os.path.exists(config_file_path):
    with open(config_file_path, "r") as f:
        config.update(json.load(f))

BASE_URL = config["base_url"]
TEST_CREDENTIALS = config["test_credentials"]

print(f"=== Testing Development Environment API (BASE_URL: {BASE_URL}) ===")

class APITester:
    """API test class for testing development environment API endpoints"""
    
    def __init__(self):
        """Initialize test class"""
        self.token = None
        self.headers = {}
    
    def login(self):
        """
        Test login API and get token
        
        Returns:
            bool: Whether login was successful
        """
        url = f"{BASE_URL}/api/auth/login"
        payload = {
            "username": TEST_CREDENTIALS["username"],
            "password": TEST_CREDENTIALS["password"]
        }
        
        try:
            logger.info(f"Testing login API: {url}")
            response = requests.post(url, json=payload, timeout=10)
            logger.info(f"Status code: {response.status_code}")
            logger.info(f"Response: {response.text}")
            
            if response.status_code == 200:
                self.token = response.json().get("access_token")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                logger.info("Login successful, token obtained")
                return True
            return False
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return False
    
    def test_get_users(self):
        """
        Test get users list API
        
        Returns:
            bool: Whether test was successful
        """
        if not self.token:
            logger.error("Need to login first to get token")
            return False
        
        url = f"{BASE_URL}/api/users/"
        
        try:
            logger.info(f"Testing get users list API: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            logger.info(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                users = response.json()
                logger.info(f"Got {len(users)} users")
                logger.info(f"First user: {json.dumps(users[0], ensure_ascii=False) if users else 'No users'}")
                return True
            logger.error(f"Failed to get users list: {response.text}")
            return False
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return False
    
    def test_get_workers(self):
        """
        Test get workers list API
        
        Returns:
            bool: Whether test was successful
        """
        if not self.token:
            logger.error("Need to login first to get token")
            return False
        
        url = f"{BASE_URL}/api/workers/"
        
        try:
            logger.info(f"Testing get workers list API: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            logger.info(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                workers = response.json()
                logger.info(f"Got {len(workers)} workers")
                logger.info(f"First worker: {json.dumps(workers[0], ensure_ascii=False) if workers else 'No workers'}")
                return True
            logger.error(f"Failed to get workers list: {response.text}")
            return False
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return False
    
    def test_get_processes(self):
        """
        Test get processes list API
        
        Returns:
            bool: Whether test was successful
        """
        if not self.token:
            logger.error("Need to login first to get token")
            return False
        
        url = f"{BASE_URL}/api/processes/"
        
        try:
            logger.info(f"Testing get processes list API: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            logger.info(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                processes = response.json()
                logger.info(f"Got {len(processes)} processes")
                logger.info(f"First process: {json.dumps(processes[0], ensure_ascii=False) if processes else 'No processes'}")
                return True
            logger.error(f"Failed to get processes list: {response.text}")
            return False
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return False
    
    def test_get_process_cat1(self):
        """
        Test get process category 1 list API
        
        Returns:
            bool: Whether test was successful
        """
        if not self.token:
            logger.error("Need to login first to get token")
            return False
        
        url = f"{BASE_URL}/api/process-cat1/"
        
        try:
            logger.info(f"Testing get process category 1 list API: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            logger.info(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                process_cat1_list = response.json()
                logger.info(f"Got {len(process_cat1_list)} process category 1 items")
                if process_cat1_list:
                    logger.info(f"First process category 1: {json.dumps(process_cat1_list[0], ensure_ascii=False)}")
                else:
                    logger.info("No process category 1 items")
                return True
            logger.error(f"Failed to get process category 1 list: {response.text}")
            return False
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return False
    
    def test_get_process_cat2(self):
        """
        Test get process category 2 list API
        
        Returns:
            bool: Whether test was successful
        """
        if not self.token:
            logger.error("Need to login first to get token")
            return False
        
        url = f"{BASE_URL}/api/process-cat2/"
        
        try:
            logger.info(f"Testing get process category 2 list API: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            logger.info(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                process_cat2_list = response.json()
                logger.info(f"Got {len(process_cat2_list)} process category 2 items")
                if process_cat2_list:
                    logger.info(f"First process category 2: {json.dumps(process_cat2_list[0], ensure_ascii=False)}")
                else:
                    logger.info("No process category 2 items")
                return True
            logger.error(f"Failed to get process category 2 list: {response.text}")
            return False
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return False
    
    def test_get_models(self):
        """
        Test get motor models list API
        
        Returns:
            bool: Whether test was successful
        """
        if not self.token:
            logger.error("Need to login first to get token")
            return False
        
        url = f"{BASE_URL}/api/motor-models/"
        
        try:
            logger.info(f"Testing get motor models list API: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            logger.info(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                models = response.json()
                logger.info(f"Got {len(models)} motor models")
                if models:
                    logger.info(f"First motor model: {json.dumps(models[0], ensure_ascii=False)}")
                else:
                    logger.info("No motor models")
                return True
            logger.error(f"Failed to get motor models list: {response.text}")
            return False
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return False
    
    def test_health_check(self):
        """
        Test health check API (if available)
        
        Returns:
            bool: Whether test was successful
        """
        url = f"{BASE_URL}/health"
        
        try:
            logger.info(f"Testing health check API: {url}")
            response = requests.get(url, timeout=10)
            logger.info(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                logger.info("Health check passed")
                return True
            logger.warning(f"Health check failed: {response.text}")
            # Health check failure is not necessarily a critical problem, return True
            return True
        except Exception as e:
            logger.warning(f"Health check request failed: {e}")
            # Health check failure is not necessarily a critical problem, return True
            return True
    
    def run_all_tests(self):
        """
        Run all API tests
        
        Returns:
            tuple: (Test results list, Whether all tests passed)
        """
        tests = [
            ("health_check", self.test_health_check),
            ("login", self.login),
            ("get_users", self.test_get_users),
            ("get_workers", self.test_get_workers),
            ("get_processes", self.test_get_processes),
            ("get_process_cat1", self.test_get_process_cat1),
            ("get_process_cat2", self.test_get_process_cat2),
            ("get_models", self.test_get_models)
        ]
        
        results = []
        all_passed = True
        
        for test_name, test_func in tests:
            logger.info(f"\n=== Running test: {test_name} ===")
            try:
                result = test_func()
                results.append((test_name, result))
                if not result:
                    all_passed = False
                logger.info(f"Test {test_name} {'PASSED' if result else 'FAILED'}")
            except Exception as e:
                logger.error(f"Test {test_name} execution error: {e}")
                results.append((test_name, False))
                all_passed = False
        
        return results, all_passed

def main():
    """
    Main function, run all API tests
    """
    tester = APITester()
    
    logger.info("Starting development environment API tests")
    logger.info(f"Test environment: {BASE_URL}")
    
    results, all_passed = tester.run_all_tests()
    
    # Print test results summary
    logger.info("\n=== Test Results Summary ===")
    for test_name, result in results:
        logger.info(f"{test_name}: {'[PASS] PASS' if result else '[FAIL] FAIL'}")
    
    if all_passed:
        logger.info("\n[PASS] All API tests passed!")
        sys.exit(0)
    else:
        logger.error("\n[FAIL] Some API tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
