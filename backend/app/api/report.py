from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..dependencies import get_report_user
from ..utils.report_helpers import (
    get_worker_by_code,
    get_salary_records_by_worker_and_month,
    calculate_total_amount,
    get_process_by_code,
    get_process_workload_summary,
    get_salary_summary
)

# 创建路由
router = APIRouter(
    prefix="/reports",
    tags=["reports"],
    responses={404: {"description": "Not found"}},
)

@router.get("/worker-salary/{worker_code}/{month}", response_model=schemas.WorkerSalaryReport)
def get_worker_salary_report(
    worker_code: str,
    month: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_report_user)
):
    """获取工人月度工资报表"""
    # 检查工人是否存在
    worker = get_worker_by_code(db, worker_code)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    # 获取工资记录
    records = get_salary_records_by_worker_and_month(db, worker_code, month)
    
    # 计算总金额
    total_amount = calculate_total_amount(records)
    
    # 构建详情列表
    details = []
    for record in records:
        # 获取工序信息
        process = get_process_by_code(db, record.quota.process_code)
        
        details.append({
            "process_code": record.quota.process_code,
            "process_name": process.name if process else "未知工序",
            "process_category": process.category if process else "未知类别",
            "quantity": record.quantity,
            "unit_price": record.unit_price,
            "amount": record.amount
        })
    
    return {
        "worker_code": worker.worker_code,
        "worker_name": worker.name,
        "month": month,
        "total_amount": total_amount,
        "details": details
    }

@router.get("/process-workload/{month}", response_model=list[schemas.ProcessWorkloadReport])
def get_process_workload_report(
    month: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_report_user)
):
    """获取工序工作量报表"""
    return get_process_workload_summary(db, month)

@router.get("/salary-summary/{month}", response_model=schemas.SalarySummaryReport)
def get_salary_summary_report(
    month: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_report_user)
):
    """获取工资汇总报表"""
    return get_salary_summary(db, month)
