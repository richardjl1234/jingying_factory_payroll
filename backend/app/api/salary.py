from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
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

@router.get("/worker-month/")
def get_worker_month_records(
    worker_code: str = Query(..., description="工人编码"),
    month: str = Query(..., description="月份 (YYYYMM格式)"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    获取指定工人指定月份的所有工资记录
    返回工作记录列表和汇总信息
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[WorkerMonthRecords] User {current_user.username} requesting records for worker={worker_code}, month={month}")
    
    try:
        # 解析月份，获取起始日期和结束日期
        if len(month) != 6 or not month.isdigit():
            raise HTTPException(status_code=400, detail="月份格式必须为YYYYMM，如 202601")
        
        year = int(month[:4])
        month_num = int(month[4:])
        
        if month_num < 1 or month_num > 12:
            raise HTTPException(status_code=400, detail="月份无效，请输入01-12")
        
        start_date = date(year, month_num, 1)
        
        # 计算月末日期
        if month_num == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month_num + 1, 1) - timedelta(days=1)
        
        logger.info(f"[WorkerMonthRecords] Query date range: {start_date} to {end_date}")
        
        # 查询工资记录
        records = crud.get_salary_records_by_worker_and_date_range(
            db, 
            worker_code=worker_code, 
            start_date=start_date,
            end_date=end_date
        )
        
        logger.info(f"[WorkerMonthRecords] Retrieved {len(records)} records")
        
        # 计算汇总
        total_quantity = sum(float(r.quantity) for r in records)
        total_amount = sum(float(r.amount) for r in records)
        
        # 获取工人名称
        worker = crud.get_worker_by_code(db, worker_code=worker_code)
        worker_name = worker.name if worker else worker_code
        
        return {
            "worker_code": worker_code,
            "worker_name": worker_name,
            "month": month,
            "records": records,
            "summary": {
                "total_quantity": round(total_quantity, 2),
                "total_amount": round(total_amount, 2)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[WorkerMonthRecords] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取工资记录失败: {str(e)}")
