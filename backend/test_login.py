import os
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app import models
from app.utils.auth import get_password_hash, verify_password, create_access_token
from fastapi import FastAPI, HTTPException

# 创建数据库会话
db = SessionLocal()

try:
    print("=== 测试登录功能 ===")
    
    # 1. 创建一个新的测试用户
    username = "test_new"
    password = "test123"
    
    print(f"\n1. 创建新测试用户: {username}")
    hashed_password = get_password_hash(password)
    
    # 检查用户是否已存在
    existing_user = db.query(models.User).filter(models.User.username == username).first()
    if existing_user:
        print(f"用户 {username} 已存在，删除后重新创建")
        db.delete(existing_user)
        db.commit()
    
    # 创建新用户
    new_user = models.User(
        username=username,
        password=hashed_password,
        name="新测试用户",
        role="admin"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print(f"已创建用户: {new_user.username}, 密码哈希: {new_user.password}")
    
    # 2. 验证密码
    print(f"\n2. 验证密码: {password}")
    is_valid = verify_password(password, new_user.password)
    print(f"密码验证结果: {is_valid}")
    
    # 3. 测试JWT令牌生成
    print("\n3. 测试JWT令牌生成")
    access_token = create_access_token(data={"sub": new_user.username})
    print(f"生成的令牌: {access_token}")
    
    # 4. 模拟登录流程
    print("\n4. 模拟登录流程")
    # 模拟前端发送的登录请求
    login_data = {
        "username": username,
        "password": password
    }
    
    # 执行登录逻辑
    user = db.query(models.User).filter(models.User.username == login_data["username"]).first()
    print(f"查询用户结果: {user}")
    
    if user:
        print(f"找到用户: username={user.username}, password_hash={user.password}")
        is_valid = verify_password(login_data["password"], user.password)
        print(f"密码验证结果: {is_valid}")
    
    if not user or not verify_password(login_data["password"], user.password):
        print("登录失败: 用户不存在或密码错误")
    else:
        print("登录成功！")
        # 生成令牌
        access_token = create_access_token(data={"sub": user.username})
        print(f"登录成功，生成令牌: {access_token}")
    
    print("\n=== 测试完成 ===")
    
except Exception as e:
    print(f"发生错误: {e}")
finally:
    db.close()