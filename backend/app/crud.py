import logging
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import date
from decimal import Decimal

from . import models, schemas
from .utils.auth import get_password_hash

logger = logging.getLogger(__name__)

# 用户相关CRUD

def get_user_by_username(db: Session, username: str):
    """根据用户名获取用户"""
    logger.debug(f"根据用户名获取用户: username={username}")
    user = db.query(models.User).filter(models.User.username == username).first()
    logger.debug(f"查询结果: {user}")
    return user

def get_user_by_id(db: Session, user_id: int):
    """根据ID获取用户"""
    logger.debug(f"根据ID获取用户: user_id={user_id}")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    logger.debug(f"查询结果: {user}")
    return user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """获取用户列表"""
    logger.debug(f"获取用户列表: skip={skip}, limit={limit}")
    users = db.query(models.User).offset(skip).limit(limit).all()
    logger.debug(f"查询结果: 共{len(users)}个用户")
    return users

def create_user(db: Session, user: schemas.UserCreate):
    """创建用户"""
    logger.debug(f"创建用户: username={user.username}, name={user.name}, role={user.role}")
    hashed_password = get_password_hash(user.password)
    logger.debug(f"密码哈希完成")
    db_user = models.User(
        username=user.username,
        password=hashed_password,
        name=user.name,
        role=user.role
    )
    logger.debug(f"创建用户对象: {db_user}")
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"用户创建成功: username={user.username}, id={db_user.id}")
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    """更新用户"""
    logger.debug(f"更新用户: user_id={user_id}, update_data={user_update.dict(exclude_unset=True)}")
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        logger.warning(f"用户不存在: user_id={user_id}")
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        logger.debug("更新密码字段，进行哈希处理")
        update_data["password"] = get_password_hash(update_data["password"])
    
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    logger.info(f"用户更新成功: user_id={user_id}, username={db_user.username}")
    return db_user

def delete_user(db: Session, user_id: int):
    """删除用户"""
    logger.debug(f"删除用户: user_id={user_id}")
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        logger.warning(f"用户不存在: user_id={user_id}")
        return None
    
    logger.debug(f"删除用户对象: {db_user}")
    db.delete(db_user)
    db.commit()
    logger.info(f"用户删除成功: user_id={user_id}, username={db_user.username}")
    return db_user

# 工人相关CRUD

def get_worker_by_code(db: Session, worker_code: str):
    """根据工号获取工人"""
    logger.debug(f"根据工号获取工人: worker_code={worker_code}")
    worker = db.query(models.Worker).filter(models.Worker.worker_code == worker_code).first()
    logger.debug(f"查询结果: {worker}")
    return worker

def get_workers(db: Session, skip: int = 0, limit: int = 100):
    """获取工人列表"""
    logger.debug(f"获取工人列表: skip={skip}, limit={limit}")
    workers = db.query(models.Worker).offset(skip).limit(limit).all()
    logger.debug(f"查询结果: 共{len(workers)}个工人")
    return workers

def create_worker(db: Session, worker: schemas.WorkerCreate):
    """创建工人"""
    logger.debug(f"创建工人: worker_code={worker.worker_code}, name={worker.name}")
    db_worker = models.Worker(**worker.dict())
    logger.debug(f"创建工人对象: {db_worker}")
    db.add(db_worker)
    db.commit()
    db.refresh(db_worker)
    logger.info(f"工人创建成功: worker_code={worker.worker_code}")
    return db_worker

def update_worker(db: Session, worker_code: str, worker_update: schemas.WorkerUpdate):
    """更新工人"""
    logger.debug(f"更新工人: worker_code={worker_code}, update_data={worker_update.dict(exclude_unset=True)}")
    db_worker = get_worker_by_code(db, worker_code)
    if not db_worker:
        logger.warning(f"工人不存在: worker_code={worker_code}")
        return None
    
    update_data = worker_update.dict(exclude_unset=True)
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_worker, field, value)
    
    db.commit()
    db.refresh(db_worker)
    logger.info(f"工人更新成功: worker_code={worker_code}")
    return db_worker

def delete_worker(db: Session, worker_code: str):
    """删除工人"""
    logger.debug(f"删除工人: worker_code={worker_code}")
    db_worker = get_worker_by_code(db, worker_code)
    if not db_worker:
        logger.warning(f"工人不存在: worker_code={worker_code}")
        return None
    
    # 先删除相关的工资记录
    logger.debug(f"查找工人相关的工资记录: worker_code={worker_code}")
    salary_records = db.query(models.SalaryRecord).filter(
        models.SalaryRecord.worker_code == worker_code
    ).all()
    
    if salary_records:
        logger.debug(f"删除{len(salary_records)}条相关的工资记录")
        for record in salary_records:
            db.delete(record)
    
    logger.debug(f"删除工人对象: {db_worker}")
    db.delete(db_worker)
    db.commit()
    logger.info(f"工人删除成功: worker_code={worker_code}")
    return db_worker

# 工序相关CRUD

def get_process_by_code(db: Session, process_code: str):
    """根据工序编码获取工序"""
    logger.debug(f"根据工序编码获取工序: process_code={process_code}")
    process = db.query(models.Process).filter(models.Process.process_code == process_code).first()
    logger.debug(f"查询结果: {process}")
    return process

def get_processes(db: Session, skip: int = 0, limit: int = 100):
    """获取工序列表"""
    logger.debug(f"获取工序列表: skip={skip}, limit={limit}")
    processes = db.query(models.Process).offset(skip).limit(limit).all()
    logger.debug(f"查询结果: 共{len(processes)}个工序")
    return processes

def create_process(db: Session, process: schemas.ProcessCreate):
    """创建工序"""
    logger.debug(f"创建工序: process_code={process.process_code}, name={process.name}")
    db_process = models.Process(**process.dict())
    logger.debug(f"创建工序对象: {db_process}")
    db.add(db_process)
    db.commit()
    db.refresh(db_process)
    logger.info(f"工序创建成功: process_code={process.process_code}")
    return db_process

def update_process(db: Session, process_code: str, process_update: schemas.ProcessUpdate):
    """更新工序"""
    logger.debug(f"更新工序: process_code={process_code}, update_data={process_update.dict(exclude_unset=True)}")
    db_process = get_process_by_code(db, process_code)
    if not db_process:
        logger.warning(f"工序不存在: process_code={process_code}")
        return None
    
    update_data = process_update.dict(exclude_unset=True)
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_process, field, value)
    
    db.commit()
    db.refresh(db_process)
    logger.info(f"工序更新成功: process_code={process_code}")
    return db_process

def delete_process(db: Session, process_code: str):
    """删除工序"""
    logger.debug(f"删除工序: process_code={process_code}")
    db_process = get_process_by_code(db, process_code)
    if not db_process:
        logger.warning(f"工序不存在: process_code={process_code}")
        return None
    
    # 先删除相关的定额和工资记录
    logger.debug(f"查找工序相关的定额: process_code={process_code}")
    quotas = db.query(models.Quota).filter(
        models.Quota.process_code == process_code
    ).all()
    
    if quotas:
        logger.debug(f"删除{len(quotas)}个相关的定额及其工资记录")
        for quota in quotas:
            # 删除定额相关的工资记录
            salary_records = db.query(models.SalaryRecord).filter(
                models.SalaryRecord.quota_id == quota.id
            ).all()
            if salary_records:
                logger.debug(f"删除定额ID={quota.id}的{len(salary_records)}条工资记录")
                for record in salary_records:
                    db.delete(record)
            
            # 删除定额
            db.delete(quota)
    
    logger.debug(f"删除工序对象: {db_process}")
    db.delete(db_process)
    db.commit()
    logger.info(f"工序删除成功: process_code={process_code}")
    return db_process

# 定额相关CRUD

def get_quota_by_id(db: Session, quota_id: int):
    """根据ID获取定额"""
    logger.debug(f"根据ID获取定额: quota_id={quota_id}")
    quota = db.query(models.Quota).filter(models.Quota.id == quota_id).first()
    logger.debug(f"查询结果: {quota}")
    return quota

def get_quotas(db: Session, process_code: str = None, skip: int = 0, limit: int = 100):
    """获取定额列表"""
    logger.debug(f"获取定额列表: process_code={process_code}, skip={skip}, limit={limit}")
    query = db.query(models.Quota)
    if process_code:
        query = query.filter(models.Quota.process_code == process_code)
    quotas = query.order_by(desc(models.Quota.effective_date)).offset(skip).limit(limit).all()
    logger.debug(f"查询结果: 共{len(quotas)}个定额")
    return quotas

def get_latest_quota(db: Session, process_code: str, effective_date: date = None):
    """获取指定日期前的最新定额"""
    if not effective_date:
        effective_date = date.today()
    logger.debug(f"获取最新定额: process_code={process_code}, effective_date={effective_date}")
    
    quota = db.query(models.Quota).filter(
        models.Quota.process_code == process_code,
        models.Quota.effective_date <= effective_date
    ).order_by(desc(models.Quota.effective_date)).first()
    logger.debug(f"查询结果: {quota}")
    return quota

def create_quota(db: Session, quota: schemas.QuotaCreate, created_by: int):
    """创建定额"""
    logger.debug(f"创建定额: process_code={quota.process_code}, unit_price={quota.unit_price}, effective_date={quota.effective_date}, created_by={created_by}")
    db_quota = models.Quota(
        **quota.dict(),
        created_by=created_by
    )
    logger.debug(f"创建定额对象: {db_quota}")
    db.add(db_quota)
    db.commit()
    db.refresh(db_quota)
    logger.info(f"定额创建成功: id={db_quota.id}, process_code={quota.process_code}")
    return db_quota

def update_quota(db: Session, quota_id: int, quota_update: schemas.QuotaUpdate):
    """更新定额"""
    logger.debug(f"更新定额: quota_id={quota_id}, update_data={quota_update.dict(exclude_unset=True)}")
    db_quota = get_quota_by_id(db, quota_id)
    if not db_quota:
        logger.warning(f"定额不存在: quota_id={quota_id}")
        return None
    
    update_data = quota_update.dict(exclude_unset=True)
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_quota, field, value)
    
    db.commit()
    db.refresh(db_quota)
    logger.info(f"定额更新成功: quota_id={quota_id}")
    return db_quota

def delete_quota(db: Session, quota_id: int):
    """删除定额"""
    logger.debug(f"删除定额: quota_id={quota_id}")
    db_quota = get_quota_by_id(db, quota_id)
    if not db_quota:
        logger.warning(f"定额不存在: quota_id={quota_id}")
        return None
    
    # 先删除相关的工资记录
    logger.debug(f"查找定额相关的工资记录: quota_id={quota_id}")
    salary_records = db.query(models.SalaryRecord).filter(
        models.SalaryRecord.quota_id == quota_id
    ).all()
    
    if salary_records:
        logger.debug(f"删除{len(salary_records)}条相关的工资记录")
        for record in salary_records:
            db.delete(record)
    
    logger.debug(f"删除定额对象: {db_quota}")
    db.delete(db_quota)
    db.commit()
    logger.info(f"定额删除成功: quota_id={quota_id}")
    return db_quota

# 工资记录相关CRUD

def get_salary_record_by_id(db: Session, record_id: int):
    """根据ID获取工资记录"""
    logger.debug(f"根据ID获取工资记录: record_id={record_id}")
    record = db.query(models.SalaryRecord).filter(models.SalaryRecord.id == record_id).first()
    logger.debug(f"查询结果: {record}")
    return record

def get_salary_records(db: Session, worker_code: str = None, record_date: str = None, skip: int = 0, limit: int = 100):
    """获取工资记录列表"""
    logger.debug(f"获取工资记录列表: worker_code={worker_code}, record_date={record_date}, skip={skip}, limit={limit}")
    query = db.query(models.SalaryRecord)
    if worker_code:
        query = query.filter(models.SalaryRecord.worker_code == worker_code)
    if record_date:
        query = query.filter(models.SalaryRecord.record_date == record_date)
    records = query.order_by(desc(models.SalaryRecord.created_at)).offset(skip).limit(limit).all()
    logger.debug(f"查询结果: 共{len(records)}个工资记录")
    return records

def create_salary_record(db: Session, record: schemas.SalaryRecordCreate, created_by: int):
    """创建工资记录"""
    logger.debug(f"创建工资记录: worker_code={record.worker_code}, quota_id={record.quota_id}, quantity={record.quantity}, record_date={record.record_date}, created_by={created_by}")
    
    # 获取定额信息
    logger.debug(f"获取定额信息: quota_id={record.quota_id}")
    quota = get_quota_by_id(db, record.quota_id)
    if not quota:
        logger.warning(f"定额不存在: quota_id={record.quota_id}")
        return None
    
    # 计算金额
    amount = record.quantity * quota.unit_price
    logger.debug(f"计算金额: quantity={record.quantity}, unit_price={quota.unit_price}, amount={amount}")
    
    db_record = models.SalaryRecord(
        **record.dict(),
        unit_price=quota.unit_price,
        amount=amount,
        created_by=created_by
    )
    logger.debug(f"创建工资记录对象: {db_record}")
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    logger.info(f"工资记录创建成功: id={db_record.id}, worker_code={record.worker_code}, amount={amount}")
    return db_record

def update_salary_record(db: Session, record_id: int, record_update: schemas.SalaryRecordUpdate):
    """更新工资记录"""
    logger.debug(f"更新工资记录: record_id={record_id}, update_data={record_update.dict(exclude_unset=True)}")
    db_record = get_salary_record_by_id(db, record_id)
    if not db_record:
        logger.warning(f"工资记录不存在: record_id={record_id}")
        return None
    
    update_data = record_update.dict(exclude_unset=True)
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_record, field, value)
    
    # 如果更新了数量，重新计算金额
    if "quantity" in update_data:
        db_record.amount = db_record.quantity * db_record.unit_price
        logger.debug(f"重新计算金额: quantity={db_record.quantity}, unit_price={db_record.unit_price}, amount={db_record.amount}")
    
    db.commit()
    db.refresh(db_record)
    logger.info(f"工资记录更新成功: record_id={record_id}")
    return db_record

def delete_salary_record(db: Session, record_id: int):
    """删除工资记录"""
    logger.debug(f"删除工资记录: record_id={record_id}")
    db_record = get_salary_record_by_id(db, record_id)
    if not db_record:
        logger.warning(f"工资记录不存在: record_id={record_id}")
        return None
    
    logger.debug(f"删除工资记录对象: {db_record}")
    db.delete(db_record)
    db.commit()
    logger.info(f"工资记录删除成功: record_id={record_id}")
    return db_record

def get_worker_salary_summary(db: Session, worker_code: str, record_date: str):
    """获取工人月度工资汇总"""
    logger.debug(f"获取工人月度工资汇总: worker_code={worker_code}, record_date={record_date}")
    result = db.query(
        func.sum(models.SalaryRecord.amount).label("total_amount")
    ).filter(
        models.SalaryRecord.worker_code == worker_code,
        models.SalaryRecord.record_date == record_date
    ).first()
    
    total = result.total_amount or Decimal("0.00")
    logger.debug(f"工人月度工资汇总结果: worker_code={worker_code}, total_amount={total}")
    return total
