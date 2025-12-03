from app.database import SessionLocal
from app import models, schemas
from app.utils.auth import get_password_hash, verify_password
from app.crud import get_users

# 创建数据库会话
db = SessionLocal()

try:
    # 查询所有用户
    users = get_users(db)
    print(f'数据库中共有 {len(users)} 个用户')
    
    # 打印每个用户的信息
    for user in users:
        print(f'ID: {user.id}, 用户名: {user.username}, 角色: {user.role}, 密码: {user.password}')
        
        # 测试密码是否为 '123456'
        is_correct = verify_password('123456', user.password)
        print(f'密码是否为 "123456": {is_correct}')
    
    # 测试直接调用API响应模型
    print('\n测试API响应模型:')
    for user in users:
        try:
            # 尝试将用户转换为API响应模型
            user_schema = schemas.User.from_orm(user)
            print(f'用户 {user.username} 转换成功: {user_schema}')
        except Exception as e:
            print(f'用户 {user.username} 转换失败: {e}')
finally:
    # 关闭会话
    db.close()