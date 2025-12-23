from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

# 创建路由
router = APIRouter(
    prefix="/process-cat1",
    tags=["process-cat1"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=list[schemas.ProcessCat1])
def read_process_cat1_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取工序类别一列表"""
    return crud.get_process_cat1_list(db, skip=skip, limit=limit)

@router.get("/{cat1_code}", response_model=schemas.ProcessCat1)
def read_process_cat1(
    cat1_code: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """根据类别一编码获取工序类别一信息"""
    process_cat1 = crud.get_process_cat1_by_code(db, cat1_code=cat1_code)
    if not process_cat1:
        raise HTTPException(status_code=404, detail="Process category 1 not found")
    return process_cat1

@router.post("/", response_model=schemas.ProcessCat1, status_code=status.HTTP_201_CREATED)
def create_process_cat1(
    process_cat1: schemas.ProcessCat1Create,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """创建新工序类别一"""
    # 检查类别一编码是否已存在
    if crud.get_process_cat1_by_code(db, cat1_code=process_cat1.cat1_code):
        raise HTTPException(status_code=400, detail="Process category 1 code already exists")
    
    # 检查类别一名称是否已存在
    if crud.get_process_cat1_by_name(db, name=process_cat1.name):
        raise HTTPException(status_code=400, detail="Process category 1 name already exists")
    
    return crud.create_process_cat1(db=db, process_cat1=process_cat1)

@router.put("/{cat1_code}", response_model=schemas.ProcessCat1)
def update_process_cat1(
    cat1_code: str,
    process_cat1_update: schemas.ProcessCat1Update,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """更新工序类别一信息"""
    # 检查类别一名称是否已存在（如果更新了名称）
    if process_cat1_update.name:
        existing_process_cat1 = crud.get_process_cat1_by_name(db, name=process_cat1_update.name)
        if existing_process_cat1 and existing_process_cat1.cat1_code != cat1_code:
            raise HTTPException(status_code=400, detail="Process category 1 name already exists")
    
    process_cat1 = crud.update_process_cat1(db, cat1_code=cat1_code, process_cat1_update=process_cat1_update)
    if not process_cat1:
        raise HTTPException(status_code=404, detail="Process category 1 not found")
    
    return process_cat1

@router.delete("/{cat1_code}")
def delete_process_cat1(
    cat1_code: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """删除工序类别一"""
    process_cat1 = crud.delete_process_cat1(db, cat1_code=cat1_code)
    if not process_cat1:
        raise HTTPException(status_code=404, detail="Process category 1 not found")
    return {"message": "工序类别一删除成功", "cat1_code": cat1_code}