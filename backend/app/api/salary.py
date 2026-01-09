from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

# 创建路由
router = APIRouter(
    prefix="/salary-records",
    tags=["salary-records"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=list[schemas.SalaryRecord])
def read_salary_records(
    worker_code: str = None,
    record_date: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取工资记录列表（从视图读取）"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[SalaryRecords] User {current_user.username} requesting salary records with params: worker_code={worker_code}, record_date={record_date}, skip={skip}, limit={limit}")
    
    try:
        records = crud.get_salary_records(
            db, 
            worker_code=worker_code, 
            record_date=record_date, 
            skip=skip, 
            limit=limit
        )
        logger.info(f"[SalaryRecords] Retrieved {len(records)} records from database")
        return records
    except Exception as e:
        logger.error(f"[SalaryRecords] Error retrieving salary records: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取工资记录失败: {str(e)}")

@router.get("/{record_id}", response_model=schemas.SalaryRecord)
def read_salary_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """根据ID获取工资记录信息（从视图读取）"""
    record = crud.get_salary_record_by_id(db, record_id=record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Salary record not found")
    return record

@router.post("/", response_model=schemas.WorkRecord, status_code=status.HTTP_201_CREATED)
def create_salary_record(
    record: schemas.WorkRecordCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """创建新工作记录"""
    # 检查工人是否存在
    if not crud.get_worker_by_code(db, worker_code=record.worker_code):
        raise HTTPException(status_code=400, detail="Worker not found")
    
    # 检查定额是否存在
    if not crud.get_quota_by_id(db, quota_id=record.quota_id):
        raise HTTPException(status_code=400, detail="Quota not found")
    
    return crud.create_work_record(db=db, record=record, created_by=current_user.id)

@router.put("/{record_id}", response_model=schemas.WorkRecord)
def update_salary_record(
    record_id: int,
    record_update: schemas.WorkRecordUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """更新工作记录信息"""
    record = crud.update_work_record(db, record_id=record_id, record_update=record_update)
    if not record:
        raise HTTPException(status_code=404, detail="Work record not found")
    return record

@router.delete("/{record_id}")
def delete_salary_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """删除工作记录"""
    record = crud.delete_work_record(db, record_id=record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Work record not found")
    return {"message": "工作记录删除成功", "record_id": record_id}
