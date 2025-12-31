from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import List, Dict, Any

from .. import models

def get_process_by_code(db: Session, process_code: str) -> models.Process:
    """
    根据工序编码获取工序信息
    
    Args:
        db: 数据库会话
        process_code: 工序编码
        
    Returns:
        Process: 工序对象
    """
    return db.query(models.Process).filter(models.Process.process_code == process_code).first()

def get_worker_by_code(db: Session, worker_code: str) -> models.Worker:
    """
    根据工号获取工人信息
    
    Args:
        db: 数据库会话
        worker_code: 工号
        
    Returns:
        Worker: 工人对象
    """
    return db.query(models.Worker).filter(models.Worker.worker_code == worker_code).first()

def get_salary_records_by_worker_and_month(db: Session, worker_code: str, month: str) -> List[models.VSalaryRecord]:
    """
    获取工人月度工资记录
    
    Args:
        db: 数据库会话
        worker_code: 工号
        month: 月份（格式：YYYY-MM）
        
    Returns:
        List[VSalaryRecord]: 工资记录列表
    """
    return db.query(models.VSalaryRecord).filter(
        models.VSalaryRecord.worker_code == worker_code,
        models.VSalaryRecord.record_date == month
    ).all()

def calculate_total_amount(records: List[models.VSalaryRecord]) -> float:
    """
    计算工资记录总金额
    
    Args:
        records: 工资记录列表
        
    Returns:
        float: 总金额
    """
    return sum(record.amount for record in records) if records else 0

def build_salary_details(records: List[models.VSalaryRecord], processes: Dict[str, models.Process]) -> List[Dict[str, Any]]:
    """
    构建工资详情列表
    
    Args:
        records: 工资记录列表
        processes: 工序字典，键为工序编码，值为工序对象
        
    Returns:
        List[Dict[str, Any]]: 工资详情列表
    """
    details = []
    for record in records:
        process = processes.get(record.quota.process_code)
        details.append({
            "process_code": record.quota.process_code,
            "process_name": process.name if process else "未知工序",
            "process_category": process.category if process else "未知类别",
            "quantity": record.quantity,
            "unit_price": record.unit_price,
            "amount": record.amount
        })
    return details

def get_process_workload_summary(db: Session, month: str) -> List[Dict[str, Any]]:
    """
    获取工序工作量汇总
    
    Args:
        db: 数据库会话
        month: 月份（格式：YYYY-MM）
        
    Returns:
        List[Dict[str, Any]]: 工序工作量汇总列表
    """
    results = db.query(
        models.Quota.process_code,
        func.sum(models.VSalaryRecord.quantity).label("total_quantity"),
        func.sum(models.VSalaryRecord.amount).label("total_amount")
    ).join(
        models.VSalaryRecord, models.VSalaryRecord.quota_id == models.Quota.id
    ).filter(
        models.VSalaryRecord.record_date == month
    ).group_by(
        models.Quota.process_code
    ).all()
    
    # 获取所有相关工序信息
    process_codes = [result.process_code for result in results]
    processes = db.query(models.Process).filter(
        models.Process.process_code.in_(process_codes)
    ).all()
    process_dict = {p.process_code: p for p in processes}
    
    # 构建报表
    reports = []
    for result in results:
        process = process_dict.get(result.process_code)
        reports.append({
            "process_code": result.process_code,
            "process_name": process.name if process else "未知工序",
            "process_category": process.category if process else "未知类别",
            "month": month,
            "total_quantity": result.total_quantity,
            "total_amount": result.total_amount
        })
    
    return reports

def get_salary_summary(db: Session, month: str) -> Dict[str, Any]:
    """
    获取工资汇总信息
    
    Args:
        db: 数据库会话
        month: 月份（格式：YYYY-MM）
        
    Returns:
        Dict[str, Any]: 工资汇总信息
    """
    # 计算总工人数量
    total_workers = db.query(func.count(distinct(models.VSalaryRecord.worker_code))).filter(
        models.VSalaryRecord.record_date == month
    ).scalar()
    
    # 计算总金额
    total_amount = db.query(func.sum(models.VSalaryRecord.amount)).filter(
        models.VSalaryRecord.record_date == month
    ).scalar() or 0
    
    # 按工序类别汇总
    category_results = db.query(
        models.Process.category,
        func.sum(models.VSalaryRecord.amount).label("total_amount")
    ).join(
        models.Quota, models.Quota.process_code == models.Process.process_code
    ).join(
        models.VSalaryRecord, models.VSalaryRecord.quota_id == models.Quota.id
    ).filter(
        models.VSalaryRecord.record_date == month
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
