import os
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app import models
from app.utils.auth import get_password_hash, verify_password

# 创建数据库会话
db = SessionLocal()

try:
    # 查询所有用户
    users = db.query(models.User).all()
    print(f"数据库中共有 {len(users)} 个用户")
    
    for user in users:
        print(f"用户: {user.username}, 密码哈希: {user.password}")
        
    # 检查是否有test用户
    test_user = db.query(models.User).filter(models.User.username == "test").first()
    
    if not test_user:
        print("\n创建默认test用户...")
        # 创建默认用户
        hashed_password = get_password_hash("test123")
        test_user = models.User(
            username="test",
            password=hashed_password,
            name="测试用户",
            role="admin"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"已创建test用户，密码: test123")
    else:
        print("\ntest用户已存在，验证密码...")
        # 测试密码验证
        is_valid = verify_password("test123", test_user.password)
        print(f"密码test123验证结果: {is_valid}")
        
except Exception as e:
    print(f"发生错误: {e}")
finally:
    db.close()