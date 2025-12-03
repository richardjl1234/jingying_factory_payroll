from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models
from ..database import get_db
from ..dependencies import get_report_user

# 创建路由
router = APIRouter(
    prefix="/stats",
    tags=["statistics"],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
def get_statistics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_report_user)
):
    """获取系统统计数据"""
    # 获取各表的记录数
    worker_count = db.query(func.count(models.Worker.worker_code)).scalar()
    process_count = db.query(func.count(models.Process.process_code)).scalar()
    quota_count = db.query(func.count(models.Quota.id)).scalar()
    salary_record_count = db.query(func.count(models.SalaryRecord.id)).scalar()
    
    return {
        "worker_count": worker_count,
        "process_count": process_count,
        "quota_count": quota_count,
        "salary_record_count": salary_record_count
    }
