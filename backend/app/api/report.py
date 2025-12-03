from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_report_user

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
    worker = db.query(models.Worker).filter(models.Worker.worker_code == worker_code).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    # 获取工资记录
    records = db.query(models.SalaryRecord).filter(
        models.SalaryRecord.worker_code == worker_code,
        models.SalaryRecord.record_date == month
    ).all()
    
    # 计算总金额
    total_amount = sum(record.amount for record in records)
    
    # 构建详情列表
    details = []
    for record in records:
        # 获取工序信息
        process = db.query(models.Process).filter(
            models.Process.process_code == record.quota.process_code
        ).first()
        
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
    # 查询每个工序的总工作量和总金额
    results = db.query(
        models.Quota.process_code,
        func.sum(models.SalaryRecord.quantity).label("total_quantity"),
        func.sum(models.SalaryRecord.amount).label("total_amount")
    ).join(
        models.SalaryRecord, models.SalaryRecord.quota_id == models.Quota.id
    ).filter(
        models.SalaryRecord.record_date == month
    ).group_by(
        models.Quota.process_code
    ).all()
    
    # 构建报表
    reports = []
    for result in results:
        # 获取工序信息
        process = db.query(models.Process).filter(
            models.Process.process_code == result.process_code
        ).first()
        
        reports.append({
            "process_code": result.process_code,
            "process_name": process.name if process else "未知工序",
            "process_category": process.category if process else "未知类别",
            "month": month,
            "total_quantity": result.total_quantity,
            "total_amount": result.total_amount
        })
    
    return reports

@router.get("/salary-summary/{month}", response_model=schemas.SalarySummaryReport)
def get_salary_summary_report(
    month: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_report_user)
):
    """获取工资汇总报表"""
    # 计算总工人数量
    total_workers = db.query(func.count(distinct(models.SalaryRecord.worker_code))).filter(
        models.SalaryRecord.record_date == month
    ).scalar()
    
    # 计算总金额
    total_amount = db.query(func.sum(models.SalaryRecord.amount)).filter(
        models.SalaryRecord.record_date == month
    ).scalar() or 0
    
    # 按工序类别汇总
    category_results = db.query(
        models.Process.category,
        func.sum(models.SalaryRecord.amount).label("total_amount")
    ).join(
        models.Quota, models.Quota.process_code == models.Process.process_code
    ).join(
        models.SalaryRecord, models.SalaryRecord.quota_id == models.Quota.id
    ).filter(
        models.SalaryRecord.record_date == month
    ).group_by(
        models.Process.category
    ).all()
    
    # 构建工序类别汇总列表
    category_summary = []
    for result in category_results:
        category_summary.append({
            "category": result.category,
            "total_amount": result.total_amount
        })
    
    return {
        "month": month,
        "total_workers": total_workers,
        "total_amount": total_amount,
        "category_summary": category_summary
    }
