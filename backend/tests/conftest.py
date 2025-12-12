import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database import get_db, Base
from app import models

# 创建测试数据库引擎
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_payroll.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 创建测试会话本地类
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def test_db():
    """创建测试数据库和会话"""
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    
    # 创建数据库会话
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        # 关闭会话并删除所有表
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
    """创建测试客户端"""
    # 依赖覆盖：使用测试数据库会话
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    # 创建测试客户端
    with TestClient(app) as c:
        yield c
    
    # 清除依赖覆盖
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(test_db):
    """创建测试用户"""
    from app.utils.auth import get_password_hash
    
    user = models.User(
        username="testuser",
        name="Test User",
        role="admin",
        password=get_password_hash("testpass123"),
        need_change_password=False
    )
    
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    
    return user


@pytest.fixture(scope="function")
def test_worker(test_db):
    """创建测试工人"""
    worker = models.Worker(
        worker_code="TEST001",
        name="Test Worker",
        gender="男",
        age=30,
        department="生产部",
        position="操作工",
        phone="13800138000",
        status="在职"
    )
    
    test_db.add(worker)
    test_db.commit()
    test_db.refresh(worker)
    
    return worker


@pytest.fixture(scope="function")
def test_process(test_db):
    """创建测试工序"""
    process = models.Process(
        process_code="TESTP01",
        name="测试工序",
        category="精加工"
    )
    
    test_db.add(process)
    test_db.commit()
    test_db.refresh(process)
    
    return process


@pytest.fixture(scope="function")
def test_quota(test_db, test_process):
    """创建测试定额"""
    from decimal import Decimal
    
    quota = models.Quota(
        process_code=test_process.code,
        unit_price=Decimal("10.50"),
        effective_date="2023-01-01"
    )
    
    test_db.add(quota)
    test_db.commit()
    test_db.refresh(quota)
    
    return quota
