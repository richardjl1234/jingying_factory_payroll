from app.database import SessionLocal
from app import models
import json

# 创建数据库会话
db = SessionLocal()

try:
    # 查询root用户的完整信息
    user = db.query(models.User).filter(models.User.username == "root").first()
    
    if user:
        print("用户完整信息:")
        print(f"ID: {user.id}")
        print(f"用户名: {user.username}")
        print(f"姓名: {user.name}")
        print(f"角色: {user.role}")
        print(f"密码哈希: {user.password}")
        print(f"微信OpenID: {user.wechat_openid}")
        print(f"创建时间: {user.created_at}")
        print(f"更新时间: {user.updated_at}")
        print(f"需要修改密码: {user.need_change_password}")
        
        # 测试密码验证
        from app.utils.auth import verify_password
        test_passwords = ["123456", "admin", "password"]
        print("\n密码验证测试:")
        for pwd in test_passwords:
            is_valid = verify_password(pwd, user.password)
            print(f"密码 '{pwd}' 验证结果: {is_valid}")
    else:
        print("未找到root用户")
finally:
    # 关闭会话
    db.close()