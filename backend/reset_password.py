from app.database import SessionLocal
from app import models
from app.utils.auth import get_password_hash

# 创建数据库会话
db = SessionLocal()

try:
    # 查询root用户
    user = db.query(models.User).filter(models.User.username == "root").first()
    
    if user:
        print(f"找到用户: {user.username}")
        print(f"当前密码哈希: {user.password}")
        
        # 重置密码为123456
        new_password = "123456"
        user.password = get_password_hash(new_password)
        user.need_change_password = False
        
        db.commit()
        db.refresh(user)
        
        print(f"密码已重置为: {new_password}")
        print(f"新密码哈希: {user.password}")
        print(f"need_change_password: {user.need_change_password}")
    else:
        print("未找到root用户")
finally:
    # 关闭会话
    db.close()