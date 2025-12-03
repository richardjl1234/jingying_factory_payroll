from app.database import SessionLocal
from app import models

# 创建数据库会话
db = SessionLocal()

try:
    # 查询所有用户
    users = db.query(models.User).all()
    print(f'数据库中共有 {len(users)} 个用户')
    
    # 打印每个用户的信息
    for user in users:
        print(f'ID: {user.id}, 用户名: {user.username}, 角色: {user.role}')
finally:
    # 关闭会话
    db.close()