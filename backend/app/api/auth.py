from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

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

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    login_data: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    """用户登录，获取访问令牌"""
    # 验证用户
    user = crud.get_user_by_username(db, username=login_data.username)
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
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
