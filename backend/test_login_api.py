import requests
import json

# 测试登录API
def test_login():
    url = 'http://localhost:8000/api/auth/login'
    headers = {
        'Content-Type': 'application/json'
    }
    
    # 测试root用户登录
    data = {
        'username': 'root',
        'password': '123456'
    }
    
    print('测试root用户登录...')
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data), timeout=10)
        print(f'响应状态码: {response.status_code}')
        print(f'响应头: {response.headers}')
        print(f'响应内容: {response.text}')
        
        if response.status_code == 200:
            print('登录成功!')
            response_data = response.json()
            print(f'返回数据: {json.dumps(response_data, indent=2, ensure_ascii=False)}')
        else:
            print('登录失败!')
    except Exception as e:
        print(f'请求异常: {e}')

if __name__ == '__main__':
    test_login()