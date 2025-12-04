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

# 测试报表用户登录和角色验证
def test_report_user_login():
    # 使用现有的报表用户 "llll" (密码未知) 或 "abc". 但密码未知. 我们无法测试登录.
    # 改为测试管理员可以创建报表用户并验证角色.
    # 先创建临时报表用户
    import random
    temp_username = f"temp_report_{random.randint(1000,9999)}"
    temp_password = "test123"
    # 首先登录管理员
    admin_login_url = f"{BASE_URL}/api/auth/login"
    admin_payload = {"username": "test", "password": "test123"}
    try:
        admin_resp = requests.post(admin_login_url, json=admin_payload)
        if admin_resp.status_code != 200:
            print(f"管理员登录失败: {admin_resp.text}")
            return False
        admin_token = admin_resp.json().get("access_token")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        # 创建临时报表用户
        create_payload = {
            "username": temp_username,
            "password": temp_password,
            "name": "临时报表用户",
            "role": "report"
        }
        create_resp = requests.post(f"{BASE_URL}/api/users/", json=create_payload, headers=admin_headers)
        if create_resp.status_code != 201:
            print(f"创建临时报表用户失败: {create_resp.text}")
            return False
        # 登录临时报表用户
        login_url = f"{BASE_URL}/api/auth/login"
        payload = {"username": temp_username, "password": temp_password}
        response = requests.post(login_url, json=payload)
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            role = data['user']['role']
            need_change_password = data['user']['need_change_password']
            print(f"报表用户角色: {role}, need_change_password: {need_change_password}")
            if role != 'report':
                print(f"错误: 预期角色为'report', 实际为'{role}'")
                return False
            # 清理：删除临时用户
            delete_resp = requests.delete(f"{BASE_URL}/api/users/{data['user']['id']}", headers=admin_headers)
            if delete_resp.status_code != 200:
                print(f"警告: 临时用户清理失败")
            return True
        else:
            print(f"登录失败: {response.text}")
            return False
    except Exception as e:
        print(f"请求失败: {e}")
        return False

# 测试报表用户权限（不能访问用户管理）
def test_report_user_permissions():
    # 创建临时报表用户并测试权限
    import random
    temp_username = f"temp_report_{random.randint(1000,9999)}"
    temp_password = "test123"
    # 管理员登录
    admin_login_url = f"{BASE_URL}/api/auth/login"
    admin_payload = {"username": "test", "password": "test123"}
    try:
        admin_resp = requests.post(admin_login_url, json=admin_payload)
        if admin_resp.status_code != 200:
            print(f"管理员登录失败: {admin_resp.text}")
            return False
        admin_token = admin_resp.json().get("access_token")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        # 创建临时报表用户
        create_payload = {
            "username": temp_username,
            "password": temp_password,
            "name": "临时报表用户",
            "role": "report"
        }
        create_resp = requests.post(f"{BASE_URL}/api/users/", json=create_payload, headers=admin_headers)
        if create_resp.status_code != 201:
            print(f"创建临时报表用户失败: {create_resp.text}")
            return False
        user_id = create_resp.json()['id']
        # 登录临时报表用户
        login_url = f"{BASE_URL}/api/auth/login"
        login_payload = {"username": temp_username, "password": temp_password}
        login_response = requests.post(login_url, json=login_payload)
        if login_response.status_code != 200:
            print(f"报表用户登录失败: {login_response.text}")
            return False
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # 尝试创建用户（应该被禁止，因为只有admin可以）
        create_url = f"{BASE_URL}/api/users/"
        create_payload = {
            "username": "unauthorized",
            "password": "test123",
            "name": "未授权用户",
            "role": "report"
        }
        response = requests.post(create_url, json=create_payload, headers=headers)
        print(f"创建用户状态码: {response.status_code}")
        # 报表用户应该没有权限，期望403或401
        if response.status_code == 403 or response.status_code == 401:
            print("权限检查通过: 报表用户无法创建用户")
            # 清理临时用户
            requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=admin_headers)
            return True
        else:
            print(f"权限检查失败: 预期403或401, 实际{response.status_code}")
            # 清理
            requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=admin_headers)
            return False
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
    
    print("\n=== 测试报表用户登录和角色 ===")
    report_login_success = test_report_user_login()
    print(f"报表用户登录测试: {'成功' if report_login_success else '失败'}")
    
    print("\n=== 测试报表用户权限 ===")
    report_permission_success = test_report_user_permissions()
    print(f"报表用户权限测试: {'成功' if report_permission_success else '失败'}")
    
    # Overall result
    if login_success and get_users_success and report_login_success and report_permission_success:
        print("\n✅ 所有API测试通过!")
        sys.exit(0)
    else:
        print("\n❌ API测试失败!")
        sys.exit(1)
