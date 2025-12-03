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
    processes = crud.get_processes(db, skip=skip, limit=limit)
    return processes

@router.get("/{process_code}", response_model=schemas.Process)
def read_process(
    process_code: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """根据工序编码获取工序信息"""
    db_process = crud.get_process_by_code(db, process_code=process_code)
    if db_process is None:
        raise HTTPException(status_code=404, detail="Process not found")
    return db_process

@router.post("/", response_model=schemas.Process, status_code=status.HTTP_201_CREATED)
def create_process(
    process: schemas.ProcessCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """创建新工序"""
    # 检查工序编码是否已存在
    db_process = crud.get_process_by_code(db, process_code=process.process_code)
    if db_process:
        raise HTTPException(status_code=400, detail="Process code already exists")
    
    # 检查工序名称是否已存在
    existing_processes = crud.get_processes(db)
    if any(p.name == process.name for p in existing_processes):
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
    db_process = crud.update_process(db, process_code=process_code, process_update=process_update)
    if db_process is None:
        raise HTTPException(status_code=404, detail="Process not found")
    
    # 检查工序名称是否已存在（如果更新了名称）
    if process_update.name:
        existing_processes = crud.get_processes(db)
        if any(p.name == process_update.name and p.process_code != process_code for p in existing_processes):
            raise HTTPException(status_code=400, detail="Process name already exists")
    
    return db_process

@router.delete("/{process_code}", response_model=schemas.Process)
def delete_process(
    process_code: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """删除工序"""
    db_process = crud.delete_process(db, process_code=process_code)
    if db_process is None:
        raise HTTPException(status_code=404, detail="Process not found")
    return db_process
