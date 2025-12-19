#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调试脚本：测试motor-models端点
"""

import requests
import json

def test_endpoints(base_url="http://localhost:8000"):
    """测试所有可能的端点"""
    
    endpoints_to_test = [
        "/api/motor-models/",
        "/api/motor-models/test",
        "/api/test-motor-models",
        "/api/health",
        "/api/auth/login"
    ]
    
    print("=== 开始测试端点 ===")
    
    for endpoint in endpoints_to_test:
        url = base_url + endpoint
        print(f"\n测试端点: {endpoint}")
        print(f"完整URL: {url}")
        
        try:
            response = requests.get(url)
            print(f"状态码: {response.status_code}")
            print(f"响应头: {dict(response.headers)}")
            print(f"响应内容: {response.text[:500]}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"JSON响应: {json.dumps(data, indent=2, ensure_ascii=False)}")
                except:
                    print("响应不是JSON格式")
            
        except Exception as e:
            print(f"请求失败: {e}")
    
    print("\n=== 端点测试完成 ===")

def test_with_authentication(base_url="http://localhost:8000"):
    """测试需要认证的端点"""
    
    print("\n=== 测试认证端点 ===")
    
    # 先登录获取token
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        print(f"登录状态码: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data.get("access_token")
            print(f"获取到的token: {token[:50]}...")
            
            # 使用token测试motor-models端点
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            motor_models_url = f"{base_url}/api/motor-models/"
            print(f"\n测试认证端点: {motor_models_url}")
            
            response = requests.get(motor_models_url, headers=headers)
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.text}")
            
        else:
            print(f"登录失败: {login_response.text}")
            
    except Exception as e:
        print(f"认证测试失败: {e}")

if __name__ == "__main__":
    test_endpoints()
    test_with_authentication()