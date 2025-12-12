from fastapi.testclient import TestClient
from app.utils.auth import get_password_hash


def test_login_success(client, test_user):
    """测试登录成功"""
    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "testpass123"
        }
    )
    
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"
    assert response.json()["user"]["username"] == "testuser"



def test_login_failure(client):
    """测试登录失败：用户名不存在"""
    response = client.post(
        "/api/auth/login",
        json={
            "username": "nonexistent",
            "password": "wrongpass"
        }
    )
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"



def test_login_wrong_password(client, test_user):
    """测试登录失败：密码错误"""
    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "wrongpass"
        }
    )
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"



def test_get_me_authenticated(client, test_user):
    """测试已认证用户获取个人信息"""
    # 先登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "testpass123"
        }
    )
    
    token = login_response.json()["access_token"]
    
    # 使用令牌获取个人信息
    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert me_response.status_code == 200
    assert me_response.json()["username"] == "testuser"
    assert me_response.json()["name"] == "Test User"



def test_get_me_unauthenticated(client):
    """测试未认证用户获取个人信息"""
    response = client.get("/api/auth/me")
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"
