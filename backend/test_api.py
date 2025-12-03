from fastapi.testclient import TestClient
from app.main import app

# 创建测试客户端
client = TestClient(app)

# 登录获取token
def test_login():
    login_data = {
        "username": "root",
        "password": "123456"
    }
    response = client.post("/api/auth/login", json=login_data)
    print(f"登录请求状态码: {response.status_code}")
    
    if response.status_code == 200:
        login_result = response.json()
        token = login_result.get("access_token")
        print(f"登录成功，token: {token}")
        return token
    else:
        print(f"登录失败: {response.json()}")
        return None

# 使用token获取用户列表
def test_get_users(token):
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = client.get("/api/users", headers=headers)
    print(f"获取用户列表状态码: {response.status_code}")
    
    if response.status_code == 200:
        users_data = response.json()
        print(f"获取到 {len(users_data)} 个用户")
        for user in users_data:
            print(f"用户: {user}")
        return users_data
    else:
        print(f"获取用户列表失败: {response.json()}")
        return None

# 主测试函数
def main():
    print("开始测试API...")
    token = test_login()
    if token:
        test_get_users(token)
    print("测试完成")

if __name__ == "__main__":
    main()