# 直接测试登录逻辑，绕过FastAPI

import sys
import os

# 添加当前目录到sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app import models
from app.crud import get_user_by_username
from app.utils.auth import verify_password

# 创建数据库表
models.Base.metadata.create_all(bind=engine)

# 测试直接登录逻辑
def test_direct_login():
    print("测试直接登录逻辑...")
    
    # 创建数据库会话
    db = SessionLocal()
    
    try:
        # 测试用户名和密码
        username = "root"
        password = "123456"
        
        print(f"当前工作目录: {os.getcwd()}")
        print(f"数据库文件路径: {os.path.abspath('payroll.db')}")
        print(f"是否存在数据库文件: {os.path.exists('payroll.db')}")
        
        # 查询所有用户
        users = db.query(models.User).all()
        print(f"数据库中共有 {len(users)} 个用户")
        for user in users:
            print(f"用户: {user.username}, 密码哈希: {user.password}")
        
        # 测试get_user_by_username函数
        print(f"\n测试get_user_by_username('{username}')...")
        user = get_user_by_username(db, username=username)
        print(f"找到用户: {user}")
        
        if user:
            print(f"用户名: {user.username}")
            print(f"密码哈希: {user.password}")
            
            # 测试密码验证
            is_valid = verify_password(password, user.password)
            print(f"密码验证结果: {is_valid}")
            
            if is_valid:
                print("登录成功！")
            else:
                print("密码错误！")
        else:
            print("用户不存在！")
    finally:
        db.close()

if __name__ == "__main__":
    test_direct_login()