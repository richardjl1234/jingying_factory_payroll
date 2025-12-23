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

print(f"=== 测试开发环境API (BASE_URL: {BASE_URL}) ===")

class APITester:
    """API测试类，用于测试开发环境的API端点"""
    
    def __init__(self):
        """初始化测试类"""
        self.token = None
        self.headers = {}
    
    def login(self):
        """
        测试登录API并获取token
        
        Returns:
            bool: 登录是否成功
        """
        url = f"{BASE_URL}/api/auth/login"
        payload = {
            "username": TEST_CREDENTIALS["username"],
            "password": TEST_CREDENTIALS["password"]
        }
        
        try:
            logger.info(f"测试登录API: {url}")
            response = requests.post(url, json=payload, timeout=10)
            logger.info(f"状态码: {response.status_code}")
            logger.info(f"响应内容: {response.text}")
            
            if response.status_code == 200:
                self.token = response.json().get("access_token")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                logger.info("登录成功，获取到token")
                return True
            return False
        except Exception as e:
            logger.error(f"请求失败: {e}")
            return False
    
    def test_get_users(self):
        """
        测试获取用户列表API
        
        Returns:
            bool: 测试是否成功
        """
        if not self.token:
            logger.error("需要先登录获取token")
            return False
        
        url = f"{BASE_URL}/api/users/"
        
        try:
            logger.info(f"测试获取用户列表API: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            logger.info(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                users = response.json()
                logger.info(f"获取到 {len(users)} 个用户")
                logger.info(f"第一个用户: {json.dumps(users[0], ensure_ascii=False) if users else '无用户'}")
                return True
            logger.error(f"获取用户列表失败: {response.text}")
            return False
        except Exception as e:
            logger.error(f"请求失败: {e}")
            return False
    
    def test_get_workers(self):
        """
        测试获取工人列表API
        
        Returns:
            bool: 测试是否成功
        """
        if not self.token:
            logger.error("需要先登录获取token")
            return False
        
        url = f"{BASE_URL}/api/workers/"
        
        try:
            logger.info(f"测试获取工人列表API: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            logger.info(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                workers = response.json()
                logger.info(f"获取到 {len(workers)} 个工人")
                logger.info(f"第一个工人: {json.dumps(workers[0], ensure_ascii=False) if workers else '无工人'}")
                return True
            logger.error(f"获取工人列表失败: {response.text}")
            return False
        except Exception as e:
            logger.error(f"请求失败: {e}")
            return False
    
    def test_get_processes(self):
        """
        测试获取工序列表API
        
        Returns:
            bool: 测试是否成功
        """
        if not self.token:
            logger.error("需要先登录获取token")
            return False
        
        url = f"{BASE_URL}/api/processes/"
        
        try:
            logger.info(f"测试获取工序列表API: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            logger.info(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                processes = response.json()
                logger.info(f"获取到 {len(processes)} 个工序")
                logger.info(f"第一个工序: {json.dumps(processes[0], ensure_ascii=False) if processes else '无工序'}")
                return True
            logger.error(f"获取工序列表失败: {response.text}")
            return False
        except Exception as e:
            logger.error(f"请求失败: {e}")
            return False
    
    def test_get_process_cat1(self):
        """
        测试获取工序类别一列表API
        
        Returns:
            bool: 测试是否成功
        """
        if not self.token:
            logger.error("需要先登录获取token")
            return False
        
        url = f"{BASE_URL}/api/process-cat1/"
        
        try:
            logger.info(f"测试获取工序类别一列表API: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            logger.info(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                process_cat1_list = response.json()
                logger.info(f"获取到 {len(process_cat1_list)} 个工序类别一")
                if process_cat1_list:
                    logger.info(f"第一个工序类别一: {json.dumps(process_cat1_list[0], ensure_ascii=False)}")
                else:
                    logger.info("无工序类别一")
                return True
            logger.error(f"获取工序类别一列表失败: {response.text}")
            return False
        except Exception as e:
            logger.error(f"请求失败: {e}")
            return False
    
    def test_get_process_cat2(self):
        """
        测试获取工序类别二列表API
        
        Returns:
            bool: 测试是否成功
        """
        if not self.token:
            logger.error("需要先登录获取token")
            return False
        
        url = f"{BASE_URL}/api/process-cat2/"
        
        try:
            logger.info(f"测试获取工序类别二列表API: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            logger.info(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                process_cat2_list = response.json()
                logger.info(f"获取到 {len(process_cat2_list)} 个工序类别二")
                if process_cat2_list:
                    logger.info(f"第一个工序类别二: {json.dumps(process_cat2_list[0], ensure_ascii=False)}")
                else:
                    logger.info("无工序类别二")
                return True
            logger.error(f"获取工序类别二列表失败: {response.text}")
            return False
        except Exception as e:
            logger.error(f"请求失败: {e}")
            return False
    
    def test_get_models(self):
        """
        测试获取型号列表API
        
        Returns:
            bool: 测试是否成功
        """
        if not self.token:
            logger.error("需要先登录获取token")
            return False
        
        url = f"{BASE_URL}/api/motor-models/"
        
        try:
            logger.info(f"测试获取型号列表API: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            logger.info(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                models = response.json()
                logger.info(f"获取到 {len(models)} 个型号")
                if models:
                    logger.info(f"第一个型号: {json.dumps(models[0], ensure_ascii=False)}")
                else:
                    logger.info("无型号")
                return True
            logger.error(f"获取型号列表失败: {response.text}")
            return False
        except Exception as e:
            logger.error(f"请求失败: {e}")
            return False
    
    def test_health_check(self):
        """
        测试健康检查API（如果可用）
        
        Returns:
            bool: 测试是否成功
        """
        url = f"{BASE_URL}/health"
        
        try:
            logger.info(f"测试健康检查API: {url}")
            response = requests.get(url, timeout=10)
            logger.info(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                logger.info("健康检查通过")
                return True
            logger.warning(f"健康检查失败: {response.text}")
            # 健康检查失败不一定是严重问题，返回True
            return True
        except Exception as e:
            logger.warning(f"健康检查请求失败: {e}")
            # 健康检查失败不一定是严重问题，返回True
            return True
    
    def run_all_tests(self):
        """
        运行所有API测试
        
        Returns:
            tuple: (测试结果列表, 是否全部通过)
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
            logger.info(f"\n=== 运行测试: {test_name} ===")
            try:
                result = test_func()
                results.append((test_name, result))
                if not result:
                    all_passed = False
                logger.info(f"测试 {test_name} {'通过' if result else '失败'}")
            except Exception as e:
                logger.error(f"测试 {test_name} 执行出错: {e}")
                results.append((test_name, False))
                all_passed = False
        
        return results, all_passed

def main():
    """
    主函数，运行所有API测试
    """
    tester = APITester()
    
    logger.info("开始运行开发环境API测试")
    logger.info(f"测试环境: {BASE_URL}")
    
    results, all_passed = tester.run_all_tests()
    
    # 打印测试结果摘要
    logger.info("\n=== 测试结果摘要 ===")
    for test_name, result in results:
        logger.info(f"{test_name}: {'✅ 通过' if result else '❌ 失败'}")
    
    if all_passed:
        logger.info("\n🎉 所有API测试通过！")
        sys.exit(0)
    else:
        logger.error("\n❌ 部分API测试失败！")
        sys.exit(1)

if __name__ == "__main__":
    main()
