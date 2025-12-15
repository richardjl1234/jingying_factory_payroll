from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

# 创建路由
router = APIRouter(
    prefix="/models",
    tags=["models"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=list[schemas.Model])
def read_model_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取型号列表"""
    return crud.get_model_list(db, skip=skip, limit=limit)

@router.get("/{name}", response_model=schemas.Model)
def read_model(
    name: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """根据型号名称获取型号信息"""
    model = crud.get_model_by_name(db, name=name)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model

@router.post("/", response_model=schemas.Model, status_code=status.HTTP_201_CREATED)
def create_model(
    model: schemas.ModelCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """创建新型号"""
    # 检查型号名称是否已存在
    if crud.get_model_by_name(db, name=model.name):
        raise HTTPException(status_code=400, detail="Model name already exists")
    
    return crud.create_model(db=db, model=model)

@router.put("/{name}", response_model=schemas.Model)
def update_model(
    name: str,
    model_update: schemas.ModelUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """更新型号信息"""
    model = crud.update_model(db, name=name, model_update=model_update)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    return model

@router.delete("/{name}")
def delete_model(
    name: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """删除型号"""
    model = crud.delete_model(db, name=name)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"message": "型号删除成功", "name": name}