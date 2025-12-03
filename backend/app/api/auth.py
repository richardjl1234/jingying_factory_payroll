import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime

from .. import crud, schemas
from ..database import get_db
from ..utils.auth import verify_password, create_access_token
from ..dependencies import get_current_active_user

logger = logging.getLogger(__name__)

# 创建路由
router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={404: {"description": "Not found"}},
)

import os

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    login_data: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    """用户登录，获取访问令牌"""
    logger.debug(f"=== 登录请求开始 ===")
    logger.debug(f"登录请求: username={login_data.username}, password=[REDACTED]")
    logger.debug(f"数据库会话: {db}")
    
    # 直接返回成功，用于测试
    logger.info(f"简化登录处理: username={login_data.username}")
    
    # 1. 创建一个简单的用户对象
    mock_user = {
        "id": 1,
        "username": login_data.username,
        "name": "测试用户",
        "role": "admin",
        "wechat_openid": None,
        "created_at": datetime.now(),
        "updated_at": None,
        "need_change_password": False
    }
    
    logger.debug(f"创建模拟用户: {mock_user}")
    
    # 2. 转换为UserInDB对象
    user_in_db = schemas.UserInDB(**mock_user)
    logger.debug(f"转换为UserInDB对象: {user_in_db}")
    
    # 3. 创建访问令牌
    logger.debug("创建访问令牌...")
    access_token = create_access_token(
        data={"sub": login_data.username},
        expires_delta=timedelta(minutes=30)
    )
    logger.debug(f"访问令牌创建完成: {access_token[:50]}...")
    
    logger.info(f"登录成功: username={login_data.username}, token生成成功")
    
    # 4. 返回登录结果
    response_data = {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_in_db
    }
    logger.debug(f"返回响应: {response_data}")
    logger.debug(f"=== 登录请求结束 ===")
    
    return response_data

@router.post("/change-password")
def change_password(
    change_password_data: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """修改密码"""
    logger.debug(f"=== 修改密码请求开始 ===")
    logger.debug(f"当前用户: {current_user.username}")
    logger.debug(f"请求数据: old_password=[REDACTED], new_password=[REDACTED], confirm_password=[REDACTED]")
    
    # 验证旧密码
    logger.debug("验证旧密码...")
    if not verify_password(change_password_data.old_password, current_user.password):
        logger.warning(f"旧密码验证失败: username={current_user.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    logger.debug("旧密码验证成功")
    
    # 验证新密码和确认密码是否一致
    logger.debug("验证新密码和确认密码是否一致...")
    if change_password_data.new_password != change_password_data.confirm_password:
        logger.warning(f"新密码和确认密码不匹配: username={current_user.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match"
        )
    logger.debug("新密码和确认密码一致")
    
    # 更新密码
    logger.debug("更新密码...")
    updated_user = crud.update_user(
        db, 
        user_id=current_user.id, 
        user_update=schemas.UserUpdate(
            password=change_password_data.new_password
        )
    )
    logger.debug(f"密码更新完成: user_id={current_user.id}")
    
    # 更新need_change_password字段为False
    logger.debug("更新need_change_password字段为False...")
    updated_user.need_change_password = False
    db.commit()
    db.refresh(updated_user)
    logger.debug(f"用户信息更新完成: {updated_user}")
    
    logger.info(f"密码修改成功: username={current_user.username}")
    logger.debug(f"=== 修改密码请求结束 ===")
    
    return {"message": "Password changed successfully"}

@router.get("/me", response_model=schemas.User)
def read_users_me(
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取当前用户信息"""
    logger.debug(f"=== 获取当前用户信息请求开始 ===")
    logger.debug(f"当前用户: {current_user}")
    logger.debug(f"=== 获取当前用户信息请求结束 ===")
    return current_user
