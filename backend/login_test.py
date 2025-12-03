import requests

# 登录API地址
login_url = "http://localhost:8000/api/auth/login"

# 登录凭证
login_data = {
    "username": "root",
    "password": "123456"
}

try:
    # 发送登录请求
    response = requests.post(login_url, json=login_data)
    print(f"登录请求状态码: {response.status_code}")
    
    if response.status_code == 200:
        # 获取登录成功后的响应数据
        login_result = response.json()
        print(f"登录成功，token: {login_result.get('access_token')}")
        
        # 使用获取到的token请求用户列表
        token = login_result.get('access_token')
        users_url = "http://localhost:8000/api/users"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        users_response = requests.get(users_url, headers=headers)
        print(f"获取用户列表状态码: {users_response.status_code}")
        
        if users_response.status_code == 200:
            users_data = users_response.json()
            print(f"获取到 {len(users_data)} 个用户")
            for user in users_data:
                print(f"用户: {user}")
        else:
            print(f"获取用户列表失败: {users_response.text}")
    else:
        print(f"登录失败: {response.text}")
except Exception as e:
    print(f"发生错误: {e}")