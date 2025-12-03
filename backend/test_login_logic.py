from app.database import SessionLocal
from app import models
from app.api import auth
from app.utils.auth import verify_password
from app.schemas import LoginRequest

# 创建数据库会话
db = SessionLocal()

try:
    # 测试登录逻辑
    print("测试登录逻辑...")
    
    # 模拟登录请求
    login_data = LoginRequest(username="root", password="123456")
    
    # 测试crud.get_user_by_username函数
    print("\n测试get_user_by_username函数...")
    user = auth.crud.get_user_by_username(db, username=login_data.username)
    print(f"找到用户: {user}")
    print(f"用户名: {user.username}")
    print(f"密码哈希: {user.password}")
    
    # 测试verify_password函数
    print("\n测试verify_password函数...")
    is_valid = verify_password(login_data.password, user.password)
    print(f"密码验证结果: {is_valid}")
    
    # 测试登录函数
    print("\n测试login_for_access_token函数...")
    # 由于login_for_access_token是FastAPI路由函数，我们直接模拟其逻辑
    user = auth.crud.get_user_by_username(db, username=login_data.username)
    print(f"1. 查询用户: {'成功' if user else '失败'}")
    
    if user:
        is_valid = verify_password(login_data.password, user.password)
        print(f"2. 密码验证: {'成功' if is_valid else '失败'}")
        
        if is_valid:
            print("3. 登录成功！")
            print(f"   用户ID: {user.id}")
            print(f"   用户名: {user.username}")
            print(f"   角色: {user.role}")
            print(f"   需要修改密码: {user.need_change_password}")
        else:
            print("3. 密码验证失败！")
    else:
        print("3. 用户不存在！")
finally:
    # 关闭会话
    db.close()