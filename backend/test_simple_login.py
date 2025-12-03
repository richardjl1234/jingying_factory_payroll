from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from datetime import timedelta
from jose import JWTError, jwt
import os

# 配置
SQLALCHEMY_DATABASE_URL = "sqlite:///./payroll.db"
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"

# 创建数据库引擎
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型
Base = declarative_base()

# 导入用户模型
from app import models

# 创建密码上下文
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# 密码验证和哈希函数
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# 创建访问令牌
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 测试登录逻辑
def test_simple_login():
    print("测试简单登录逻辑...")
    
    # 创建数据库会话
    db = SessionLocal()
    
    try:
        # 测试用户名和密码
        username = "root"
        password = "123456"
        
        # 查询用户
        print(f"查询用户: {username}")
        user = db.query(models.User).filter(models.User.username == username).first()
        
        if not user:
            print("用户不存在！")
            return False
        
        print(f"找到用户: {user.username}")
        print(f"密码哈希: {user.password}")
        
        # 验证密码
        is_valid = verify_password(password, user.password)
        print(f"密码验证结果: {is_valid}")
        
        if is_valid:
            print("登录成功！")
            return True
        else:
            print("密码错误！")
            return False
    finally:
        db.close()

if __name__ == "__main__":
    from datetime import datetime
    test_simple_login()