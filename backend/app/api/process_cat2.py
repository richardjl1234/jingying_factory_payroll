from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

# 创建路由
router = APIRouter(
    prefix="/process-cat2",
    tags=["process-cat2"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=list[schemas.ProcessCat2])
def read_process_cat2_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取工序类别列表"""
    return crud.get_process_cat2_list(db, skip=skip, limit=limit)

@router.get("/{cat2_code}", response_model=schemas.ProcessCat2)
def read_process_cat2(
    cat2_code: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """根据工序类别编码获取工序类别信息"""
    process_cat2 = crud.get_process_cat2_by_code(db, cat2_code=cat2_code)
    if not process_cat2:
        raise HTTPException(status_code=404, detail="Process category 2 not found")
    return process_cat2

@router.post("/", response_model=schemas.ProcessCat2, status_code=status.HTTP_201_CREATED)
def create_process_cat2(
    process_cat2: schemas.ProcessCat2Create,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """创建新工序类别"""
    # 检查工序类别编码是否已存在
    if crud.get_process_cat2_by_code(db, cat2_code=process_cat2.cat2_code):
        raise HTTPException(status_code=400, detail="Process category 2 code already exists")
    
    # 检查工序类别名称是否已存在
    if crud.get_process_cat2_by_name(db, name=process_cat2.name):
        raise HTTPException(status_code=400, detail="Process category 2 name already exists")
    
    return crud.create_process_cat2(db=db, process_cat2=process_cat2)

@router.put("/{cat2_code}", response_model=schemas.ProcessCat2)
def update_process_cat2(
    cat2_code: str,
    process_cat2_update: schemas.ProcessCat2Update,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """更新工序类别信息"""
    # 检查工序类别名称是否已存在（如果更新了名称）
    if process_cat2_update.name:
        existing_process_cat2 = crud.get_process_cat2_by_name(db, name=process_cat2_update.name)
        if existing_process_cat2 and existing_process_cat2.cat2_code != cat2_code:
            raise HTTPException(status_code=400, detail="Process category 2 name already exists")
    
    process_cat2 = crud.update_process_cat2(db, cat2_code=cat2_code, process_cat2_update=process_cat2_update)
    if not process_cat2:
        raise HTTPException(status_code=404, detail="Process category 2 not found")
    
    return process_cat2

@router.delete("/{cat2_code}")
def delete_process_cat2(
    cat2_code: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """删除工序类别"""
    process_cat2 = crud.delete_process_cat2(db, cat2_code=cat2_code)
    if not process_cat2:
        raise HTTPException(status_code=404, detail="Process category 2 not found")
    return {"message": "工序类别删除成功", "cat2_code": cat2_code}
