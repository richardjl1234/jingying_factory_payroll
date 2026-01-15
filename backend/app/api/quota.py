from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, models
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
    if not crud.get_motor_model_by_code(db, model_code=quota.model_code):
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

@router.get("/filter-combinations/", response_model=List[schemas.QuotaFilterCombination])
def get_filter_combinations(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    获取所有唯一的 (工段类别, 工序类别, 生效日期) 组合
    按 生效日期, 工段类别, 工序类别 排序
    """
    return crud.get_quota_filter_combinations(db)

@router.get("/effective-dates/", response_model=List[str])
def get_effective_dates(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    获取所有唯一的生效日期列表
    按生效日期排序
    """
    results = db.query(models.Quota.effective_date).distinct().order_by(
        models.Quota.effective_date
    ).all()
    
    return [str(r.effective_date) for r in results]

@router.get("/cat2-options/")
def get_cat2_options(
    cat1_code: str = Query(None, description="工段类别编码"),
    effective_date: str = Query(None, description="生效日期"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    获取工序类别选项
    根据工段类别和生效日期动态返回可用的工序类别列表
    """
    query = db.query(
        models.Quota.cat2_code,
        models.ProcessCat2.name.label('cat2_name')
    ).join(
        models.ProcessCat2,
        models.Quota.cat2_code == models.ProcessCat2.cat2_code,
        isouter=True
    )
    
    if cat1_code:
        query = query.filter(models.Quota.cat1_code == cat1_code)
    
    if effective_date:
        query = query.filter(models.Quota.effective_date == effective_date)
    
    results = query.distinct(models.Quota.cat2_code).all()
    
    return [
        {
            "value": r.cat2_code,
            "label": f"{r.cat2_name} ({r.cat2_code})" if r.cat2_name else r.cat2_code
        }
        for r in results
    ]

@router.get("/matrix/", response_model=schemas.QuotaMatrixResponse)
def get_quota_matrix(
    cat1_code: str = Query(..., description="工段类别编码"),
    cat2_code: str = Query(..., description="工序类别编码"),
    effective_date: str = Query(..., description="生效日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    获取指定 (工段类别, 工序类别, 生效日期) 的定额矩阵数据
    
    返回矩阵格式：
    - 行索引: 型号 (model_code)
    - 列索引: 加工工序 (process_code)
    - 单元格值: 定额单价 (unit_price)
    """
    matrix_data = crud.get_quota_matrix_data(db, cat1_code, cat2_code, effective_date)
    if not matrix_data:
        raise HTTPException(
            status_code=404, 
            detail=f"No quota found for combination: cat1={cat1_code}, cat2={cat2_code}, date={effective_date}"
        )
    return matrix_data
