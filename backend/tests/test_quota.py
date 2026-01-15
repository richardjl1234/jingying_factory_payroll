from decimal import Decimal
from fastapi.testclient import TestClient


def test_get_filter_combinations_unauthenticated(client):
    """测试未认证用户获取过滤器组合列表"""
    response = client.get("/api/quotas/filter-combinations/")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_get_filter_combinations_authenticated(client, test_user, test_quota):
    """测试已认证用户获取过滤器组合列表"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # 获取过滤器组合列表
    response = client.get(
        "/api/quotas/filter-combinations/",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # 验证返回数据结构
    if len(data) > 0:
        item = data[0]
        assert "cat1_code" in item
        assert "cat1_name" in item
        assert "cat2_code" in item
        assert "cat2_name" in item
        assert "effective_date" in item


def test_get_filter_combinations_ordering(client, test_user, test_quota):
    """测试过滤器组合按 生效日期, 工段类别, 工序类别 排序"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    response = client.get(
        "/api/quotas/filter-combinations/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    
    if len(data) >= 2:
        # 验证排序顺序
        for i in range(1, len(data)):
            prev = data[i - 1]
            curr = data[i]
            # 按effective_date排序
            assert prev["effective_date"] <= curr["effective_date"]


def test_get_quota_matrix_unauthenticated(client):
    """测试未认证用户获取定额矩阵数据"""
    response = client.get(
        "/api/quotas/matrix/",
        params={"cat1_code": "C1T", "cat2_code": "C2T", "effective_date": "2023-01-01"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_get_quota_matrix_success(client, test_user, test_quota):
    """测试成功获取定额矩阵数据"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # 获取矩阵数据
    response = client.get(
        "/api/quotas/matrix/",
        params={
            "cat1_code": "C1T",
            "cat2_code": "C2T",
            "effective_date": "2023-01-01"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # 验证返回数据结构
    assert "cat1" in data
    assert "cat2" in data
    assert "effective_date" in data
    assert "rows" in data
    assert "columns" in data
    
    # 验证cat1结构
    assert "code" in data["cat1"]
    assert "name" in data["cat1"]
    
    # 验证cat2结构
    assert "code" in data["cat2"]
    assert "name" in data["cat2"]
    
    # 验证rows结构
    if len(data["rows"]) > 0:
        row = data["rows"][0]
        assert "model_code" in row
        assert "model_name" in row
        assert "prices" in row
    
    # 验证columns结构
    if len(data["columns"]) > 0:
        col = data["columns"][0]
        assert "process_code" in col
        assert "process_name" in col


def test_get_quota_matrix_not_found(client, test_user):
    """测试获取不存在的组合返回404"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # 尝试获取不存在的组合
    response = client.get(
        "/api/quotas/matrix/",
        params={
            "cat1_code": "INVALID",
            "cat2_code": "INVALID",
            "effective_date": "2099-01-01"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 404


def test_get_quota_matrix_missing_params(client, test_user):
    """测试缺少必需参数返回422"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # 尝试不传参数
    response = client.get(
        "/api/quotas/matrix/",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 422  # Validation error


def test_get_quotas_list(client, test_user, test_quota):
    """测试获取定额列表"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    response = client.get(
        "/api/quotas/",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_quota(client, test_user, test_quota):
    """测试创建新定额"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # 创建新定额
    response = client.post(
        "/api/quotas/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "process_code": test_quota.process_code,
            "cat1_code": "C1T",
            "cat2_code": "C2T",
            "model_code": "100-1",
            "unit_price": "15.00",
            "effective_date": "2023-06-01"
        }
    )
    
    assert response.status_code == 201
    assert response.json()["cat1_code"] == "C1T"
    assert response.json()["cat2_code"] == "C2T"
    assert response.json()["model_code"] == "100-1"


def test_update_quota(client, test_user, test_quota):
    """测试更新定额"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # 获取定额列表
    quotas_response = client.get(
        "/api/quotas/",
        headers={"Authorization": f"Bearer {token}"}
    )
    quota_id = quotas_response.json()[0]["id"]
    
    # 更新定额
    response = client.put(
        f"/api/quotas/{quota_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "unit_price": "20.00"
        }
    )
    
    assert response.status_code == 200
    assert float(response.json()["unit_price"]) == 20.00


def test_delete_quota(client, test_user, test_quota):
    """测试删除定额"""
    # 登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # 获取定额列表
    quotas_response = client.get(
        "/api/quotas/",
        headers={"Authorization": f"Bearer {token}"}
    )
    quota_id = quotas_response.json()[0]["id"]
    
    # 删除定额
    response = client.delete(
        f"/api/quotas/{quota_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    
    # 验证定额已被删除
    get_response = client.get(
        f"/api/quotas/{quota_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_response.status_code == 404
