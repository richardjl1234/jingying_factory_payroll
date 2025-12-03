from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import date
from decimal import Decimal

from . import models, schemas
from .utils.auth import get_password_hash

# 用户相关CRUD

def get_user_by_username(db: Session, username: str):
    """根据用户名获取用户"""
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_id(db: Session, user_id: int):
    """根据ID获取用户"""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """获取用户列表"""
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    """创建用户"""
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        password=hashed_password,
        name=user.name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    """更新用户"""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["password"] = get_password_hash(update_data["password"])
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    """删除用户"""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    
    db.delete(db_user)
    db.commit()
    return db_user

# 工人相关CRUD

def get_worker_by_code(db: Session, worker_code: str):
    """根据工号获取工人"""
    return db.query(models.Worker).filter(models.Worker.worker_code == worker_code).first()

def get_workers(db: Session, skip: int = 0, limit: int = 100):
    """获取工人列表"""
    return db.query(models.Worker).offset(skip).limit(limit).all()

def create_worker(db: Session, worker: schemas.WorkerCreate):
    """创建工人"""
    db_worker = models.Worker(**worker.dict())
    db.add(db_worker)
    db.commit()
    db.refresh(db_worker)
    return db_worker

def update_worker(db: Session, worker_code: str, worker_update: schemas.WorkerUpdate):
    """更新工人"""
    db_worker = get_worker_by_code(db, worker_code)
    if not db_worker:
        return None
    
    update_data = worker_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_worker, field, value)
    
    db.commit()
    db.refresh(db_worker)
    return db_worker

def delete_worker(db: Session, worker_code: str):
    """删除工人"""
    db_worker = get_worker_by_code(db, worker_code)
    if not db_worker:
        return None
    
    db.delete(db_worker)
    db.commit()
    return db_worker

# 工序相关CRUD

def get_process_by_code(db: Session, process_code: str):
    """根据工序编码获取工序"""
    return db.query(models.Process).filter(models.Process.process_code == process_code).first()

def get_processes(db: Session, skip: int = 0, limit: int = 100):
    """获取工序列表"""
    return db.query(models.Process).offset(skip).limit(limit).all()

def create_process(db: Session, process: schemas.ProcessCreate):
    """创建工序"""
    db_process = models.Process(**process.dict())
    db.add(db_process)
    db.commit()
    db.refresh(db_process)
    return db_process

def update_process(db: Session, process_code: str, process_update: schemas.ProcessUpdate):
    """更新工序"""
    db_process = get_process_by_code(db, process_code)
    if not db_process:
        return None
    
    update_data = process_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_process, field, value)
    
    db.commit()
    db.refresh(db_process)
    return db_process

def delete_process(db: Session, process_code: str):
    """删除工序"""
    db_process = get_process_by_code(db, process_code)
    if not db_process:
        return None
    
    db.delete(db_process)
    db.commit()
    return db_process

# 定额相关CRUD

def get_quota_by_id(db: Session, quota_id: int):
    """根据ID获取定额"""
    return db.query(models.Quota).filter(models.Quota.id == quota_id).first()

def get_quotas(db: Session, process_code: str = None, skip: int = 0, limit: int = 100):
    """获取定额列表"""
    query = db.query(models.Quota)
    if process_code:
        query = query.filter(models.Quota.process_code == process_code)
    return query.order_by(desc(models.Quota.effective_date)).offset(skip).limit(limit).all()

def get_latest_quota(db: Session, process_code: str, effective_date: date = None):
    """获取指定日期前的最新定额"""
    if not effective_date:
        effective_date = date.today()
    
    return db.query(models.Quota).filter(
        models.Quota.process_code == process_code,
        models.Quota.effective_date <= effective_date
    ).order_by(desc(models.Quota.effective_date)).first()

def create_quota(db: Session, quota: schemas.QuotaCreate, created_by: int):
    """创建定额"""
    db_quota = models.Quota(
        **quota.dict(),
        created_by=created_by
    )
    db.add(db_quota)
    db.commit()
    db.refresh(db_quota)
    return db_quota

def update_quota(db: Session, quota_id: int, quota_update: schemas.QuotaUpdate):
    """更新定额"""
    db_quota = get_quota_by_id(db, quota_id)
    if not db_quota:
        return None
    
    update_data = quota_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_quota, field, value)
    
    db.commit()
    db.refresh(db_quota)
    return db_quota

def delete_quota(db: Session, quota_id: int):
    """删除定额"""
    db_quota = get_quota_by_id(db, quota_id)
    if not db_quota:
        return None
    
    db.delete(db_quota)
    db.commit()
    return db_quota

# 工资记录相关CRUD

def get_salary_record_by_id(db: Session, record_id: int):
    """根据ID获取工资记录"""
    return db.query(models.SalaryRecord).filter(models.SalaryRecord.id == record_id).first()

def get_salary_records(db: Session, worker_code: str = None, record_date: str = None, skip: int = 0, limit: int = 100):
    """获取工资记录列表"""
    query = db.query(models.SalaryRecord)
    if worker_code:
        query = query.filter(models.SalaryRecord.worker_code == worker_code)
    if record_date:
        query = query.filter(models.SalaryRecord.record_date == record_date)
    return query.order_by(desc(models.SalaryRecord.created_at)).offset(skip).limit(limit).all()

def create_salary_record(db: Session, record: schemas.SalaryRecordCreate, created_by: int):
    """创建工资记录"""
    # 获取定额信息
    quota = get_quota_by_id(db, record.quota_id)
    if not quota:
        return None
    
    # 计算金额
    amount = record.quantity * quota.unit_price
    
    db_record = models.SalaryRecord(
        **record.dict(),
        unit_price=quota.unit_price,
        amount=amount,
        created_by=created_by
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

def update_salary_record(db: Session, record_id: int, record_update: schemas.SalaryRecordUpdate):
    """更新工资记录"""
    db_record = get_salary_record_by_id(db, record_id)
    if not db_record:
        return None
    
    update_data = record_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_record, field, value)
    
    # 如果更新了数量，重新计算金额
    if "quantity" in update_data:
        db_record.amount = db_record.quantity * db_record.unit_price
    
    db.commit()
    db.refresh(db_record)
    return db_record

def delete_salary_record(db: Session, record_id: int):
    """删除工资记录"""
    db_record = get_salary_record_by_id(db, record_id)
    if not db_record:
        return None
    
    db.delete(db_record)
    db.commit()
    return db_record

def get_worker_salary_summary(db: Session, worker_code: str, record_date: str):
    """获取工人月度工资汇总"""
    result = db.query(
        func.sum(models.SalaryRecord.amount).label("total_amount")
    ).filter(
        models.SalaryRecord.worker_code == worker_code,
        models.SalaryRecord.record_date == record_date
    ).first()
    
    return result.total_amount or Decimal("0.00")

def get_department_salary_summary(db: Session, department: str, record_date: str):
    """获取部门月度工资汇总"""
    result = db.query(
        func.sum(models.SalaryRecord.amount).label("total_amount")
    ).join(
        models.Worker, models.SalaryRecord.worker_code == models.Worker.worker_code
    ).filter(
        models.Worker.department == department,
        models.SalaryRecord.record_date == record_date
    ).first()
    
    return result.total_amount or Decimal("0.00")
