from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
from app.utils.auth import get_password_hash

# 创建数据库表
models.Base.metadata.create_all(bind=engine)

def init_db():
    """初始化数据库，创建root用户"""
    db = SessionLocal()
    
    try:
        # 检查是否已存在root用户
        root_user = db.query(models.User).filter(models.User.username == "root").first()
        
        if not root_user:
            # 创建root用户
            root_user = models.User(
                username="root",
                password=get_password_hash("root123"),
                name="系统管理员",
                role="admin",
                need_change_password=False
            )
            db.add(root_user)
            db.commit()
            print("Root user created successfully!")
        else:
            # 更新现有root用户的need_change_password字段
            root_user.need_change_password = False
            db.commit()
            print("Root user updated successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
