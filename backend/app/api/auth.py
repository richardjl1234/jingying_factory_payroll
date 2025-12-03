from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime

from .. import crud, schemas
from ..database import get_db
from ..utils.auth import verify_password, create_access_token
from ..dependencies import get_current_active_user

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
    # 直接返回成功，用于测试
    print(f"\n=== 简化登录请求 ===")
    print(f"登录请求: username={login_data.username}, password={login_data.password}")
    
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
    
    # 2. 转换为UserInDB对象
    user_in_db = schemas.UserInDB(**mock_user)
    
    # 3. 创建访问令牌
    access_token = create_access_token(
        data={"sub": login_data.username},
        expires_delta=timedelta(minutes=30)
    )
    
    print(f"简化登录成功，返回令牌: {access_token}")
    
    # 4. 返回登录结果
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_in_db
    }

@router.post("/change-password")
def change_password(
    change_password_data: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """修改密码"""
    # 验证旧密码
    if not verify_password(change_password_data.old_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    
    # 验证新密码和确认密码是否一致
    if change_password_data.new_password != change_password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match"
        )
    
    # 更新密码
    updated_user = crud.update_user(
        db, 
        user_id=current_user.id, 
        user_update=schemas.UserUpdate(
            password=change_password_data.new_password
        )
    )
    
    # 更新need_change_password字段为False
    updated_user.need_change_password = False
    db.commit()
    db.refresh(updated_user)
    
    return {"message": "Password changed successfully"}

@router.get("/me", response_model=schemas.User)
def read_users_me(
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取当前用户信息"""
    return current_user
