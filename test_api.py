import requests
import json

# 测试登录API
login_url = "http://localhost:8000/api/auth/login"
login_data = {
    "username": "root",
    "password": "root123"
}

print("测试登录API...")
try:
    response = requests.post(login_url, json=login_data)
    if response.status_code == 200:
        login_result = response.json()
        print("登录成功!")
        print(f"访问令牌: {login_result['access_token']}")
        
        # 使用访问令牌测试工序列表API
        processes_url = "http://localhost:8000/api/processes/"
        headers = {
            "Authorization": f"Bearer {login_result['access_token']}"
        }
        
        print("\n测试工序列表API...")
        processes_response = requests.get(processes_url, headers=headers)
        if processes_response.status_code == 200:
            processes = processes_response.json()
            print(f"获取工序列表成功，共 {len(processes)} 条记录")
            for process in processes[:5]:  # 只显示前5条
                print(f"工序: {process['name']} (编码: {process['process_code']})")
        else:
            print(f"获取工序列表失败: {processes_response.status_code} - {processes_response.text}")
    else:
        print(f"登录失败: {response.status_code} - {response.text}")
except Exception as e:
    print(f"发生错误: {e}")