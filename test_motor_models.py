#!/usr/bin/env python3
"""测试电机型号API端点"""

import requests
import json

# 基础URL
base_url = "http://localhost:8000"

# 测试登录获取token
print("Logging in...")
login_data = {
    "username": "test",
    "password": "test"
}

try:
    login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
    print(f"Login status: {login_response.status_code}")
    if login_response.status_code == 200:
        token_data = login_response.json()
        token = token_data.get("access_token")
        print(f"Login successful, token: {token}")
    else:
        print(f"Login failed: {login_response.text}")
        token = None
except Exception as e:
    print(f"Login error: {e}")
    token = None

# 测试电机型号端点
print("\nTesting /api/motor-models/ endpoint...")

# 测试不带认证
print("1. Testing without authentication:")
try:
    response = requests.get(f"{base_url}/api/motor-models/")
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# 测试带认证
if token:
    print("\n2. Testing with authentication:")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.get(f"{base_url}/api/motor-models/", headers=headers)
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

# 测试测试端点
print("\n3. Testing /api/motor-models/test endpoint:")
try:
    response = requests.get(f"{base_url}/api/motor-models/test")
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# 测试健康检查端点
print("\n4. Testing /api/health endpoint:")
try:
    response = requests.get(f"{base_url}/api/health")
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")