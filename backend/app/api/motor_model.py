from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..schemas import MotorModelSchema, MotorModelSchemaCreate, MotorModelSchemaUpdate
from ..database import get_db
from ..dependencies import get_current_active_user

# 创建路由
router = APIRouter(
    prefix="/motor-models",
    tags=["motor-models"],
    responses={404: {"description": "Not found"}},
)

@router.get("/test")
def test_endpoint():
    """测试端点"""
    return {"message": "motor-models endpoint is working"}

@router.get("/", response_model=list[MotorModelSchema])
def read_motor_model_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """获取电机型号列表"""
    return crud.get_motor_model_list(db, skip=skip, limit=limit)

@router.get("/{name}", response_model=MotorModelSchema)
def read_motor_model(
    name: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """根据电机型号名称获取电机型号信息"""
    motor_model = crud.get_motor_model_by_name(db, name=name)
    if not motor_model:
        raise HTTPException(status_code=404, detail="Motor model not found")
    return motor_model

@router.post("/", response_model=MotorModelSchema, status_code=status.HTTP_201_CREATED)
def create_motor_model(
    motor_model: MotorModelSchemaCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """创建新电机型号"""
    # 检查电机型号名称是否已存在
    if crud.get_motor_model_by_name(db, name=motor_model.name):
        raise HTTPException(status_code=400, detail="Motor model name already exists")
    
    return crud.create_motor_model(db=db, motor_model=motor_model)

@router.put("/{name}", response_model=MotorModelSchema)
def update_motor_model(
    name: str,
    motor_model_update: MotorModelSchemaUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """更新电机型号信息"""
    motor_model = crud.update_motor_model(db, name=name, motor_model_update=motor_model_update)
    if not motor_model:
        raise HTTPException(status_code=404, detail="Motor model not found")
    
    return motor_model

@router.delete("/{name}")
def delete_motor_model(
    name: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """删除电机型号"""
    motor_model = crud.delete_motor_model(db, name=name)
    if not motor_model:
        raise HTTPException(status_code=404, detail="Motor model not found")
    return {"message": "电机型号删除成功", "name": name}