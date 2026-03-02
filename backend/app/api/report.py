from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_report_user
from ..utils.report_helpers import (
    get_worker_by_code,
    get_salary_records_by_worker_and_month,
    get_all_salary_records_by_month,
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


def extract_name_from_display(display_value: str) -> str:
    """从显示值中提取名称，例如: '编码 (名称)' -> '名称'"""
    if not display_value:
        return ""
    # 格式为 "编码 (名称)"，提取括号中的名称
    if '(' in display_value and ')' in display_value:
        try:
            return display_value.split('(')[1].split(')')[0].strip()
        except IndexError:
            return display_value
    return display_value


@router.get("/worker-salary/{worker_code}/{month}", response_model=schemas.WorkerSalaryReport)
def get_worker_salary_report(
    worker_code: str,
    month: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_report_user)
):
    """获取工人月度工资报表（单个工人或所有工人）"""
    
    # 判断是否为"所有工人"模式
    is_all_workers = worker_code.lower() == "all"
    
    if is_all_workers:
        # 获取所有工人在指定月份的工资记录
        records = get_all_salary_records_by_month(db, month)

        # 获取所有相关工人信息
        worker_codes = set(record.worker_code for record in records)
        workers = db.query(models.Worker).filter(
            models.Worker.worker_code.in_(worker_codes)
        ).all() if worker_codes else []
        worker_dict = {w.worker_code: w.name for w in workers}

        worker_name = "所有工人"
        worker_code_result = "all"
    else:
        # 检查工人是否存在
        worker = get_worker_by_code(db, worker_code)
        if not worker:
            raise HTTPException(status_code=404, detail="Worker not found")
        
        # 获取工资记录
        records = get_salary_records_by_worker_and_month(db, worker_code, month)
        worker_name = worker.name
        worker_code_result = worker.worker_code
    
    # 计算总金额
    total_amount = calculate_total_amount(records)
    
    # 构建详情列表 - 使用视图中的显示字段
    details = []
    for record in records:
        # 从视图的显示字段中提取名称
        model_name = extract_name_from_display(record.model_display)  # 型号
        cat2_name = extract_name_from_display(record.cat2_display)    # 工序类别
        process_name = extract_name_from_display(record.process_display)  # 工序名
        
        # 获取工人姓名
        if is_all_workers:
            # 从worker_dict中获取工人姓名
            worker_name_detail = worker_dict.get(record.worker_code, record.worker_code)
        else:
            worker_name_detail = worker_name
        
        details.append({
            "worker_name": worker_name_detail,       # 职工姓名
            "quota_id": record.quota_id,             # 定额编号
            "model_name": model_name,                # 型号
            "process_category": cat2_name,           # 工序类别
            "process_name": process_name,            # 工序名
            "quantity": float(record.quantity) if record.quantity else 0,  # 数量
            "unit_price": float(record.unit_price) if record.unit_price else 0,  # 单价
            "amount": float(record.amount) if record.amount else 0,      # 金额
            "record_date": record.record_date.strftime("%Y-%m-%d") if record.record_date else ""  # 记录日期
        })
    
    return {
        "worker_code": worker_code_result,
        "worker_name": worker_name,
        "month": month,
        "total_amount": float(total_amount) if total_amount else 0,
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
