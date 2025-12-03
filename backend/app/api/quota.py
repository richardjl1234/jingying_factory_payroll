from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

# 创建路由
router = APIRouter(
    prefix="/quotas",
    tags=["quotas"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=list[schemas.Quota])
def read_quotas(
    process_code: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取定额列表"""
    quotas = crud.get_quotas(db, process_code=process_code, skip=skip, limit=limit)
    return quotas

@router.get("/{quota_id}", response_model=schemas.Quota)
def read_quota(
    quota_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """根据ID获取定额信息"""
    db_quota = crud.get_quota_by_id(db, quota_id=quota_id)
    if db_quota is None:
        raise HTTPException(status_code=404, detail="Quota not found")
    return db_quota

@router.post("/", response_model=schemas.Quota, status_code=status.HTTP_201_CREATED)
def create_quota(
    quota: schemas.QuotaCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """创建新定额"""
    # 检查工序是否存在
    db_process = crud.get_process_by_code(db, process_code=quota.process_code)
    if not db_process:
        raise HTTPException(status_code=400, detail="Process not found")
    
    return crud.create_quota(db=db, quota=quota, created_by=current_user.id)

@router.put("/{quota_id}", response_model=schemas.Quota)
def update_quota(
    quota_id: int,
    quota_update: schemas.QuotaUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """更新定额信息"""
    db_quota = crud.update_quota(db, quota_id=quota_id, quota_update=quota_update)
    if db_quota is None:
        raise HTTPException(status_code=404, detail="Quota not found")
    return db_quota

@router.delete("/{quota_id}", response_model=schemas.Quota)
def delete_quota(
    quota_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """删除定额"""
    db_quota = crud.delete_quota(db, quota_id=quota_id)
    if db_quota is None:
        raise HTTPException(status_code=404, detail="Quota not found")
    return db_quota

@router.get("/latest/{process_code}", response_model=schemas.Quota)
def get_latest_quota(
    process_code: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取指定工序的最新定额"""
    db_quota = crud.get_latest_quota(db, process_code=process_code)
    if db_quota is None:
        raise HTTPException(status_code=404, detail="No quota found for this process")
    return db_quota
