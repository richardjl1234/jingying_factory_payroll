from fastapi.testclient import TestClient


def test_get_processes_unauthenticated(client):
    """测试未认证用户获取工序列表"""
    response = client.get("/api/processes/")
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"



def test_get_processes_authenticated(client, test_user, test_process):
    """测试已认证用户获取工序列表"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # 获取工序列表
    response = client.get(
        "/api/processes/",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1
    assert any(p["process_code"] == "TESTP01" for p in response.json())



def test_create_process(client, test_user):
    """测试创建工序"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # 创建工序
    response = client.post(
        "/api/processes/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "process_code": "NEWP02",
            "name": "New Process",
            "category": "精加工"
        }
    )
    
    assert response.status_code == 201  # 创建资源应该返回201 Created
    assert response.json()["process_code"] == "NEWP02"
    assert response.json()["name"] == "New Process"
    assert response.json()["category"] == "精加工"



def test_get_process_by_id(client, test_user, test_process):
    """测试根据ID获取工序"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # 获取工序列表
    processes_response = client.get(
        "/api/processes/",
        headers={"Authorization": f"Bearer {token}"}
    )
    process_code = next(p["process_code"] for p in processes_response.json() if p["process_code"] == "TESTP01")
    
    # 根据工序编码获取工序
    response = client.get(
        f"/api/processes/{process_code}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["process_code"] == "TESTP01"



def test_update_process(client, test_user, test_process):
    """测试更新工序"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # 获取工序列表
    processes_response = client.get(
        "/api/processes/",
        headers={"Authorization": f"Bearer {token}"}
    )
    process_code = next(p["process_code"] for p in processes_response.json() if p["process_code"] == "TESTP01")
    
    # 更新工序
    response = client.put(
        f"/api/processes/{process_code}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Updated Process",
            "category": "装配喷漆"
        }
    )
    
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Process"
    assert response.json()["category"] == "装配喷漆"



def test_delete_process(client, test_user, test_process):
    """测试删除工序"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # 获取工序列表
    processes_response = client.get(
        "/api/processes/",
        headers={"Authorization": f"Bearer {token}"}
    )
    process_code = next(p["process_code"] for p in processes_response.json() if p["process_code"] == "TESTP01")
    
    # 删除工序
    response = client.delete(
        f"/api/processes/{process_code}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["process_code"] == "TESTP01"
    
    # 验证工序已被删除
    get_response = client.get(
        f"/api/processes/{process_code}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_response.status_code == 404
