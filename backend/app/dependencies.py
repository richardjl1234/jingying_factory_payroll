from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from . import crud, schemas
from .database import get_db
from .utils.auth import SECRET_KEY, ALGORITHM

# 加载环境变量
load_dotenv()

# 创建OAuth2密码Bearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """获取当前用户"""
    import logging
    logger = logging.getLogger(__name__)
    logger.debug(f"get_current_user called, token: {token[:50]}...")
    logger.debug(f"SECRET_KEY: {SECRET_KEY}, ALGORITHM: {ALGORITHM}")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError as e:
        logger.error(f"JWT decode error: {e}, token: {token[:50]}...")
        raise credentials_exception
    
    logger.debug(f"Token payload: {payload}, username: {username}")
    
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        logger.error(f"User not found: {token_data.username}")
        raise credentials_exception
    
    logger.debug(f"User found: {user.username}, role: {user.role}")
    return user

async def get_current_active_user(current_user: schemas.User = Depends(get_current_user)):
    """获取当前活跃用户"""
    return current_user

async def get_admin_user(current_user: schemas.User = Depends(get_current_active_user)):
    """获取管理员用户"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def get_report_user(current_user: schemas.User = Depends(get_current_active_user)):
    """获取报表用户、统计员或管理员用户"""
    import logging
    logger = logging.getLogger(__name__)
    logger.debug(f"get_report_user: username={current_user.username}, role={current_user.role!r}, role type={type(current_user.role)}")
    logger.debug(f"Role list: {['admin', 'report', 'statistician']}")
    if current_user.role not in ["admin", "report", "statistician"]:
        logger.error(f"Role {current_user.role!r} not allowed")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
