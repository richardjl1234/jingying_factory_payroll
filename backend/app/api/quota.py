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
    return crud.get_quotas(db, process_code=process_code, skip=skip, limit=limit)

@router.get("/{quota_id}", response_model=schemas.Quota)
def read_quota(
    quota_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """根据ID获取定额信息"""
    quota = crud.get_quota_by_id(db, quota_id=quota_id)
    if not quota:
        raise HTTPException(status_code=404, detail="Quota not found")
    return quota

@router.post("/", response_model=schemas.Quota, status_code=status.HTTP_201_CREATED)
def create_quota(
    quota: schemas.QuotaCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """创建新定额"""
    # 检查工序是否存在
    if not crud.get_process_by_code(db, process_code=quota.process_code):
        raise HTTPException(status_code=400, detail="Process not found")
    
    # 检查工段类别是否存在
    if not crud.get_process_cat1_by_code(db, cat1_code=quota.cat1_code):
        raise HTTPException(status_code=400, detail="Process category 1 not found")
    
    # 检查工序类别是否存在
    if not crud.get_process_cat2_by_code(db, cat2_code=quota.cat2_code):
        raise HTTPException(status_code=400, detail="Process category 2 not found")
    
    # 检查电机型号是否存在
    if not crud.get_motor_model_by_name(db, name=quota.model_name):
        raise HTTPException(status_code=400, detail="Motor model not found")
    
    return crud.create_quota(db=db, quota=quota, created_by=current_user.id)

@router.put("/{quota_id}", response_model=schemas.Quota)
def update_quota(
    quota_id: int,
    quota_update: schemas.QuotaUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """更新定额信息"""
    quota = crud.update_quota(db, quota_id=quota_id, quota_update=quota_update)
    if not quota:
        raise HTTPException(status_code=404, detail="Quota not found")
    return quota

@router.delete("/{quota_id}")
def delete_quota(
    quota_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """删除定额"""
    quota = crud.delete_quota(db, quota_id=quota_id)
    if not quota:
        raise HTTPException(status_code=404, detail="Quota not found")
    return {"message": "定额删除成功", "quota_id": quota_id}

@router.get("/latest/{process_code}", response_model=schemas.Quota)
def get_latest_quota(
    process_code: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取指定工序的最新定额"""
    quota = crud.get_latest_quota(db, process_code=process_code)
    if not quota:
        raise HTTPException(status_code=404, detail="No quota found for this process")
    return quota
