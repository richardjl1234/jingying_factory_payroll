from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

# 创建路由
router = APIRouter(
    prefix="/processes",
    tags=["processes"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=list[schemas.Process])
def read_processes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取工序列表"""
    return crud.get_processes(db, skip=skip, limit=limit)

@router.get("/{process_code}", response_model=schemas.Process)
def read_process(
    process_code: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """根据工序编码获取工序信息"""
    process = crud.get_process_by_code(db, process_code=process_code)
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    return process

@router.post("/", response_model=schemas.Process, status_code=status.HTTP_201_CREATED)
def create_process(
    process: schemas.ProcessCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """创建新工序"""
    # 检查工序编码是否已存在
    if crud.get_process_by_code(db, process_code=process.process_code):
        raise HTTPException(status_code=400, detail="Process code already exists")
    
    # 检查工序名称是否已存在
    if crud.get_process_by_name(db, process_name=process.name):
        raise HTTPException(status_code=400, detail="Process name already exists")
    
    return crud.create_process(db=db, process=process)

@router.put("/{process_code}", response_model=schemas.Process)
def update_process(
    process_code: str,
    process_update: schemas.ProcessUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """更新工序信息"""
    # 检查工序名称是否已存在（如果更新了名称）
    if process_update.name:
        existing_process = crud.get_process_by_name(db, process_name=process_update.name)
        if existing_process and existing_process.process_code != process_code:
            raise HTTPException(status_code=400, detail="Process name already exists")
    
    process = crud.update_process(db, process_code=process_code, process_update=process_update)
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    
    return process

@router.delete("/{process_code}")
def delete_process(
    process_code: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """删除工序"""
    process = crud.delete_process(db, process_code=process_code)
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    return {"message": "工序删除成功", "process_code": process_code}
