from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

# 获取环境变量
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# 创建密码上下文，使用pbkdf2_sha256算法避免密码长度限制
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    import logging
    logger = logging.getLogger(__name__)
    logger.debug(f"verify_password: plain_password={plain_password!r}, hashed_password={hashed_password!r}")
    try:
        result = pwd_context.verify(plain_password, hashed_password)
        logger.debug(f"verify_password result: {result}")
        return result
    except Exception as e:
        logger.error(f"verify_password error: {e}")
        raise

def get_password_hash(password: str) -> str:
    """获取密码哈希值"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """创建访问令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
