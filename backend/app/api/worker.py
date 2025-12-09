from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

# 创建路由
router = APIRouter(
    prefix="/workers",
    tags=["workers"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=list[schemas.Worker])
def read_workers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取工人列表"""
    workers = crud.get_workers(db, skip=skip, limit=limit)
    return workers

@router.get("/{worker_code}", response_model=schemas.Worker)
def read_worker(
    worker_code: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """根据工号获取工人信息"""
    db_worker = crud.get_worker_by_code(db, worker_code=worker_code)
    if db_worker is None:
        raise HTTPException(status_code=404, detail="Worker not found")
    return db_worker

@router.post("/", response_model=schemas.Worker, status_code=status.HTTP_201_CREATED)
def create_worker(
    worker: schemas.WorkerCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """创建新工人"""
    db_worker = crud.get_worker_by_code(db, worker_code=worker.worker_code)
    if db_worker:
        raise HTTPException(status_code=400, detail="Worker code already exists")
    return crud.create_worker(db=db, worker=worker)

@router.put("/{worker_code}", response_model=schemas.Worker)
def update_worker(
    worker_code: str,
    worker_update: schemas.WorkerUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """更新工人信息"""
    db_worker = crud.update_worker(db, worker_code=worker_code, worker_update=worker_update)
    if db_worker is None:
        raise HTTPException(status_code=404, detail="Worker not found")
    return db_worker

@router.delete("/{worker_code}")
def delete_worker(
    worker_code: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """删除工人"""
    db_worker = crud.delete_worker(db, worker_code=worker_code)
    if db_worker is None:
        raise HTTPException(status_code=404, detail="Worker not found")
    return {"message": "工人删除成功", "worker_code": worker_code}
