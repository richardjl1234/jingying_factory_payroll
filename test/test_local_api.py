import requests
import sys
import os

# Allow overriding the base URL with environment variable
BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")

print(f"=== 测试本地API (BASE_URL: {BASE_URL}) ===")

# 测试登录API
def test_login():
    url = f"{BASE_URL}/api/auth/login"
    payload = {
        "username": "test",
        "password": "test123"
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"请求失败: {e}")
        return False

# 测试获取用户列表API
def test_get_users():
    url = f"{BASE_URL}/api/users/"
    
    try:
        # First get a token by logging in
        login_url = f"{BASE_URL}/api/auth/login"
        login_payload = {
            "username": "test",
            "password": "test123"
        }
        login_response = requests.post(login_url, json=login_payload)
        if login_response.status_code != 200:
            print(f"登录失败，无法获取token: {login_response.text}")
            return False
            
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(url, headers=headers)
        print(f"状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"请求失败: {e}")
        return False

if __name__ == "__main__":
    print("=== 测试登录API ===")
    login_success = test_login()
    print(f"登录测试: {'成功' if login_success else '失败'}")
    
    print("\n=== 测试获取用户列表API ===")
    get_users_success = test_get_users()
    print(f"获取用户列表测试: {'成功' if get_users_success else '失败'}")
    
    # Overall result
    if login_success and get_users_success:
        print("\n✅ 所有API测试通过!")
        sys.exit(0)
    else:
        print("\n❌ API测试失败!")
        sys.exit(1)
