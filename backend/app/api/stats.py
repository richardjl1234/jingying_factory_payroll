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
    user_count = db.query(func.count(models.User.id)).scalar()
    worker_count = db.query(func.count(models.Worker.worker_code)).scalar()
    process_cat1_count = db.query(func.count(models.ProcessCat1.cat1_code)).scalar()
    process_cat2_count = db.query(func.count(models.ProcessCat2.cat2_code)).scalar()
    model_count = db.query(func.count(models.MotorModel.name)).scalar()
    process_count = db.query(func.count(models.Process.process_code)).scalar()
    quota_count = db.query(func.count(models.Quota.id)).scalar()
    salary_record_count = db.query(func.count(models.WorkRecord.id)).scalar()
    
    return {
        "user_count": user_count,
        "worker_count": worker_count,
        "process_cat1_count": process_cat1_count,
        "process_cat2_count": process_cat2_count,
        "model_count": model_count,
        "process_count": process_count,
        "quota_count": quota_count,
        "salary_record_count": salary_record_count
    }
