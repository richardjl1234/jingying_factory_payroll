import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import date
from decimal import Decimal

from . import models, schemas
from .utils.auth import get_password_hash

logger = logging.getLogger(__name__)

# 用户相关CRUD

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """根据用户名获取用户"""
    logger.debug(f"根据用户名获取用户: username={username}")
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    """根据ID获取用户"""
    logger.debug(f"根据ID获取用户: user_id={user_id}")
    return db.query(models.User).filter(models.User.id == user_id).first()

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
    
    # 保存用户信息用于返回
    user_info = {
        "id": db_user.id,
        "username": db_user.username,
        "name": db_user.name,
        "role": db_user.role
    }
    
    logger.debug(f"删除用户对象: {db_user}")
    db.delete(db_user)
    db.commit()
    logger.info(f"用户删除成功: user_id={user_id}, username={db_user.username}")
    return user_info

# 工人相关CRUD

def get_worker_by_code(db: Session, worker_code: str) -> Optional[models.Worker]:
    """根据工号获取工人"""
    logger.debug(f"根据工号获取工人: worker_code={worker_code}")
    return db.query(models.Worker).filter(models.Worker.worker_code == worker_code).first()

def get_workers(db: Session, skip: int = 0, limit: int = 100) -> List[models.Worker]:
    """获取工人列表"""
    logger.debug(f"获取工人列表: skip={skip}, limit={limit}")
    return db.query(models.Worker).offset(skip).limit(limit).all()

def create_worker(db: Session, worker: schemas.WorkerCreate) -> models.Worker:
    """创建工人"""
    logger.debug(f"创建工人: worker_code={worker.worker_code}, name={worker.name}")
    db_worker = models.Worker(**worker.model_dump())
    logger.debug(f"创建工人对象: {db_worker}")
    db.add(db_worker)
    db.commit()
    db.refresh(db_worker)
    logger.info(f"工人创建成功: worker_code={worker.worker_code}")
    return db_worker

def update_worker(db: Session, worker_code: str, worker_update: schemas.WorkerUpdate) -> Optional[models.Worker]:
    """更新工人"""
    logger.debug(f"更新工人: worker_code={worker_code}, update_data={worker_update.model_dump(exclude_unset=True)}")
    db_worker = get_worker_by_code(db, worker_code)
    if not db_worker:
        logger.warning(f"工人不存在: worker_code={worker_code}")
        return None
    
    update_data = worker_update.model_dump(exclude_unset=True)
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_worker, field, value)
    
    db.commit()
    db.refresh(db_worker)
    logger.info(f"工人更新成功: worker_code={worker_code}")
    return db_worker

def delete_worker(db: Session, worker_code: str) -> Optional[dict]:
    """删除工人"""
    logger.debug(f"删除工人: worker_code={worker_code}")
    db_worker = get_worker_by_code(db, worker_code)
    if not db_worker:
        logger.warning(f"工人不存在: worker_code={worker_code}")
        return None
    
    # 保存工人信息用于返回
    worker_info = {
        "worker_code": db_worker.worker_code,
        "name": db_worker.name
    }
    
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
    return worker_info

# 工序相关CRUD

def get_process_by_code(db: Session, process_code: str) -> Optional[models.Process]:
    """根据工序编码获取工序"""
    logger.debug(f"根据工序编码获取工序: process_code={process_code}")
    return db.query(models.Process).filter(models.Process.process_code == process_code).first()

def get_process_by_name(db: Session, process_name: str) -> Optional[models.Process]:
    """根据工序名称获取工序"""
    logger.debug(f"根据工序名称获取工序: process_name={process_name}")
    return db.query(models.Process).filter(models.Process.name == process_name).first()

def get_processes(db: Session, skip: int = 0, limit: int = 100) -> List[models.Process]:
    """获取工序列表"""
    logger.debug(f"获取工序列表: skip={skip}, limit={limit}")
    return db.query(models.Process).offset(skip).limit(limit).all()

def create_process(db: Session, process: schemas.ProcessCreate) -> models.Process:
    """创建工序"""
    logger.debug(f"创建工序: process_code={process.process_code}, name={process.name}")
    db_process = models.Process(**process.model_dump())
    logger.debug(f"创建工序对象: {db_process}")
    db.add(db_process)
    db.commit()
    db.refresh(db_process)
    logger.info(f"工序创建成功: process_code={process.process_code}")
    return db_process

def update_process(db: Session, process_code: str, process_update: schemas.ProcessUpdate) -> Optional[models.Process]:
    """更新工序"""
    logger.debug(f"更新工序: process_code={process_code}, update_data={process_update.model_dump(exclude_unset=True)}")
    db_process = get_process_by_code(db, process_code)
    if not db_process:
        logger.warning(f"工序不存在: process_code={process_code}")
        return None
    
    update_data = process_update.model_dump(exclude_unset=True)
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_process, field, value)
    
    db.commit()
    db.refresh(db_process)
    logger.info(f"工序更新成功: process_code={process_code}")
    return db_process

def delete_process(db: Session, process_code: str) -> Optional[dict]:
    """删除工序"""
    logger.debug(f"删除工序: process_code={process_code}")
    db_process = get_process_by_code(db, process_code)
    if not db_process:
        logger.warning(f"工序不存在: process_code={process_code}")
        return None
    
    # 保存工序信息用于返回
    process_info = {
        "process_code": db_process.process_code,
        "name": db_process.name
    }
    
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
    return process_info

# 定额相关CRUD

def get_quota_by_id(db: Session, quota_id: int) -> Optional[models.Quota]:
    """根据ID获取定额"""
    logger.debug(f"根据ID获取定额: quota_id={quota_id}")
    return db.query(models.Quota).filter(models.Quota.id == quota_id).first()

def get_quotas(db: Session, process_code: str = None, skip: int = 0, limit: int = 100) -> List[models.Quota]:
    """获取定额列表"""
    logger.debug(f"获取定额列表: process_code={process_code}, skip={skip}, limit={limit}")
    query = db.query(models.Quota)
    if process_code:
        query = query.filter(models.Quota.process_code == process_code)
    return query.order_by(desc(models.Quota.id)).offset(skip).limit(limit).all()

def get_latest_quota(db: Session, process_code: str, effective_date: date = None) -> Optional[models.Quota]:
    """获取指定日期前的最新定额"""
    if not effective_date:
        effective_date = date.today()
    logger.debug(f"获取最新定额: process_code={process_code}, effective_date={effective_date}")
    
    return db.query(models.Quota).filter(
        models.Quota.process_code == process_code,
        models.Quota.effective_date <= effective_date
    ).order_by(desc(models.Quota.effective_date)).first()

def create_quota(db: Session, quota: schemas.QuotaCreate, created_by: int) -> models.Quota:
    """创建定额"""
    logger.debug(f"创建定额: process_code={quota.process_code}, unit_price={quota.unit_price}, effective_date={quota.effective_date}, created_by={created_by}")
    db_quota = models.Quota(
        **quota.model_dump(),
        created_by=created_by
    )
    logger.debug(f"创建定额对象: {db_quota}")
    db.add(db_quota)
    db.commit()
    db.refresh(db_quota)
    logger.info(f"定额创建成功: id={db_quota.id}, process_code={quota.process_code}")
    return db_quota

def update_quota(db: Session, quota_id: int, quota_update: schemas.QuotaUpdate) -> Optional[models.Quota]:
    """更新定额"""
    logger.debug(f"更新定额: quota_id={quota_id}, update_data={quota_update.model_dump(exclude_unset=True)}")
    db_quota = get_quota_by_id(db, quota_id)
    if not db_quota:
        logger.warning(f"定额不存在: quota_id={quota_id}")
        return None
    
    update_data = quota_update.model_dump(exclude_unset=True)
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_quota, field, value)
    
    db.commit()
    db.refresh(db_quota)
    logger.info(f"定额更新成功: quota_id={quota_id}")
    return db_quota

def delete_quota(db: Session, quota_id: int) -> Optional[dict]:
    """删除定额"""
    logger.debug(f"删除定额: quota_id={quota_id}")
    db_quota = get_quota_by_id(db, quota_id)
    if not db_quota:
        logger.warning(f"定额不存在: quota_id={quota_id}")
        return None
    
    # 保存定额信息用于返回
    quota_info = {
        "id": db_quota.id,
        "process_code": db_quota.process_code,
        "unit_price": str(db_quota.unit_price),
        "effective_date": str(db_quota.effective_date)
    }
    
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
    return quota_info

# 工资记录相关CRUD

def get_salary_record_by_id(db: Session, record_id: int) -> Optional[models.SalaryRecord]:
    """根据ID获取工资记录"""
    logger.debug(f"根据ID获取工资记录: record_id={record_id}")
    return db.query(models.SalaryRecord).filter(models.SalaryRecord.id == record_id).first()

def get_salary_records(db: Session, worker_code: str = None, record_date: str = None, skip: int = 0, limit: int = 100) -> List[models.SalaryRecord]:
    """获取工资记录列表"""
    logger.debug(f"获取工资记录列表: worker_code={worker_code}, record_date={record_date}, skip={skip}, limit={limit}")
    query = db.query(models.SalaryRecord)
    if worker_code:
        query = query.filter(models.SalaryRecord.worker_code == worker_code)
    if record_date:
        # record_date is in YYYY-MM format, filter by month
        from datetime import datetime
        try:
            year_month = datetime.strptime(record_date, "%Y-%m")
            # Filter records where record_date's year and month match
            query = query.filter(
                db.func.strftime("%Y-%m", models.SalaryRecord.record_date) == record_date
            )
        except ValueError:
            logger.warning(f"Invalid record_date format: {record_date}, expected YYYY-MM")
            # If invalid format, treat as exact date (YYYY-MM-DD)
            query = query.filter(models.SalaryRecord.record_date == record_date)
    return query.order_by(desc(models.SalaryRecord.created_at)).offset(skip).limit(limit).all()

def create_salary_record(db: Session, record: schemas.SalaryRecordCreate, created_by: int) -> Optional[models.SalaryRecord]:
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
        **record.model_dump(),
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

def update_salary_record(db: Session, record_id: int, record_update: schemas.SalaryRecordUpdate) -> Optional[models.SalaryRecord]:
    """更新工资记录"""
    logger.debug(f"更新工资记录: record_id={record_id}, update_data={record_update.model_dump(exclude_unset=True)}")
    db_record = get_salary_record_by_id(db, record_id)
    if not db_record:
        logger.warning(f"工资记录不存在: record_id={record_id}")
        return None
    
    update_data = record_update.model_dump(exclude_unset=True)
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

def delete_salary_record(db: Session, record_id: int) -> Optional[dict]:
    """删除工资记录"""
    logger.debug(f"删除工资记录: record_id={record_id}")
    db_record = get_salary_record_by_id(db, record_id)
    if not db_record:
        logger.warning(f"工资记录不存在: record_id={record_id}")
        return None
    
    # 保存记录信息用于返回
    record_info = {
        "id": db_record.id,
        "worker_code": db_record.worker_code,
        "quota_id": db_record.quota_id,
        "quantity": str(db_record.quantity),
        "record_date": db_record.record_date,
        "unit_price": str(db_record.unit_price),
        "amount": str(db_record.amount)
    }
    
    logger.debug(f"删除工资记录对象: {db_record}")
    db.delete(db_record)
    db.commit()
    logger.info(f"工资记录删除成功: record_id={record_id}")
    return record_info

def get_worker_salary_summary(db: Session, worker_code: str, record_date: str) -> Decimal:
    """获取工人月度工资汇总"""
    logger.debug(f"获取工人月度工资汇总: worker_code={worker_code}, record_date={record_date}")
    # record_date is in YYYY-MM format, filter by month
    result = db.query(
        func.sum(models.SalaryRecord.amount).label("total_amount")
    ).filter(
        models.SalaryRecord.worker_code == worker_code,
        db.func.strftime("%Y-%m", models.SalaryRecord.record_date) == record_date
    ).first()
    
    total = result.total_amount or Decimal("0.00")
    logger.debug(f"工人月度工资汇总结果: worker_code={worker_code}, total_amount={total}")
    return total


# 工段类别相关CRUD

def get_process_cat1_by_code(db: Session, cat1_code: str) -> Optional[models.ProcessCat1]:
    """根据工段类别编码获取工段类别"""
    logger.debug(f"根据工段类别编码获取工段类别: cat1_code={cat1_code}")
    return db.query(models.ProcessCat1).filter(models.ProcessCat1.cat1_code == cat1_code).first()

def get_process_cat1_by_name(db: Session, name: str) -> Optional[models.ProcessCat1]:
    """根据工段类别名称获取工段类别"""
    logger.debug(f"根据工段类别名称获取工段类别: name={name}")
    return db.query(models.ProcessCat1).filter(models.ProcessCat1.name == name).first()

def get_process_cat1_list(db: Session, skip: int = 0, limit: int = 100) -> List[models.ProcessCat1]:
    """获取工段类别列表"""
    logger.debug(f"获取工段类别列表: skip={skip}, limit={limit}")
    return db.query(models.ProcessCat1).offset(skip).limit(limit).all()

def create_process_cat1(db: Session, process_cat1: schemas.ProcessCat1Create) -> models.ProcessCat1:
    """创建工段类别"""
    logger.debug(f"创建工段类别: cat1_code={process_cat1.cat1_code}, name={process_cat1.name}")
    db_process_cat1 = models.ProcessCat1(**process_cat1.model_dump())
    logger.debug(f"创建工段类别对象: {db_process_cat1}")
    db.add(db_process_cat1)
    db.commit()
    db.refresh(db_process_cat1)
    logger.info(f"工段类别创建成功: cat1_code={process_cat1.cat1_code}")
    return db_process_cat1

def update_process_cat1(db: Session, cat1_code: str, process_cat1_update: schemas.ProcessCat1Update) -> Optional[models.ProcessCat1]:
    """更新工段类别"""
    logger.debug(f"更新工段类别: cat1_code={cat1_code}, update_data={process_cat1_update.model_dump(exclude_unset=True)}")
    db_process_cat1 = get_process_cat1_by_code(db, cat1_code)
    if not db_process_cat1:
        logger.warning(f"工段类别不存在: cat1_code={cat1_code}")
        return None
    
    update_data = process_cat1_update.model_dump(exclude_unset=True)
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_process_cat1, field, value)
    
    db.commit()
    db.refresh(db_process_cat1)
    logger.info(f"工段类别更新成功: cat1_code={cat1_code}")
    return db_process_cat1

def delete_process_cat1(db: Session, cat1_code: str) -> Optional[dict]:
    """删除工段类别"""
    logger.debug(f"删除工段类别: cat1_code={cat1_code}")
    db_process_cat1 = get_process_cat1_by_code(db, cat1_code)
    if not db_process_cat1:
        logger.warning(f"工段类别不存在: cat1_code={cat1_code}")
        return None
    
    # 保存工段类别信息用于返回
    process_cat1_info = {
        "cat1_code": db_process_cat1.cat1_code,
        "name": db_process_cat1.name
    }
    
    logger.debug(f"删除工段类别对象: {db_process_cat1}")
    db.delete(db_process_cat1)
    db.commit()
    logger.info(f"工段类别删除成功: cat1_code={cat1_code}")
    return process_cat1_info


# 工序类别相关CRUD

def get_process_cat2_by_code(db: Session, cat2_code: str) -> Optional[models.ProcessCat2]:
    """根据工序类别编码获取工序类别"""
    logger.debug(f"根据工序类别编码获取工序类别: cat2_code={cat2_code}")
    return db.query(models.ProcessCat2).filter(models.ProcessCat2.cat2_code == cat2_code).first()

def get_process_cat2_by_name(db: Session, name: str) -> Optional[models.ProcessCat2]:
    """根据工序类别名称获取工序类别"""
    logger.debug(f"根据工序类别名称获取工序类别: name={name}")
    return db.query(models.ProcessCat2).filter(models.ProcessCat2.name == name).first()

def get_process_cat2_list(db: Session, skip: int = 0, limit: int = 100) -> List[models.ProcessCat2]:
    """获取工序类别列表"""
    logger.debug(f"获取工序类别列表: skip={skip}, limit={limit}")
    return db.query(models.ProcessCat2).offset(skip).limit(limit).all()

def create_process_cat2(db: Session, process_cat2: schemas.ProcessCat2Create) -> models.ProcessCat2:
    """创建工序类别"""
    logger.debug(f"创建工序类别: cat2_code={process_cat2.cat2_code}, name={process_cat2.name}")
    db_process_cat2 = models.ProcessCat2(**process_cat2.model_dump())
    logger.debug(f"创建工序类别对象: {db_process_cat2}")
    db.add(db_process_cat2)
    db.commit()
    db.refresh(db_process_cat2)
    logger.info(f"工序类别创建成功: cat2_code={process_cat2.cat2_code}")
    return db_process_cat2

def update_process_cat2(db: Session, cat2_code: str, process_cat2_update: schemas.ProcessCat2Update) -> Optional[models.ProcessCat2]:
    """更新工序类别"""
    logger.debug(f"更新工序类别: cat2_code={cat2_code}, update_data={process_cat2_update.model_dump(exclude_unset=True)}")
    db_process_cat2 = get_process_cat2_by_code(db, cat2_code)
    if not db_process_cat2:
        logger.warning(f"工序类别不存在: cat2_code={cat2_code}")
        return None
    
    update_data = process_cat2_update.model_dump(exclude_unset=True)
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_process_cat2, field, value)
    
    db.commit()
    db.refresh(db_process_cat2)
    logger.info(f"工序类别更新成功: cat2_code={cat2_code}")
    return db_process_cat2

def delete_process_cat2(db: Session, cat2_code: str) -> Optional[dict]:
    """删除工序类别"""
    logger.debug(f"删除工序类别: cat2_code={cat2_code}")
    db_process_cat2 = get_process_cat2_by_code(db, cat2_code)
    if not db_process_cat2:
        logger.warning(f"工序类别不存在: cat2_code={cat2_code}")
        return None
    
    # 保存工序类别信息用于返回
    process_cat2_info = {
        "cat2_code": db_process_cat2.cat2_code,
        "name": db_process_cat2.name
    }
    
    logger.debug(f"删除工序类别对象: {db_process_cat2}")
    db.delete(db_process_cat2)
    db.commit()
    logger.info(f"工序类别删除成功: cat2_code={cat2_code}")
    return process_cat2_info


# 电机型号相关CRUD

def get_motor_model_by_name(db: Session, name: str) -> Optional[models.MotorModel]:
    """根据电机型号名称获取电机型号"""
    logger.debug(f"根据电机型号名称获取电机型号: name={name}")
    return db.query(models.MotorModel).filter(models.MotorModel.name == name).first()

def get_motor_model_by_alias(db: Session, alias: str) -> Optional[models.MotorModel]:
    """根据电机型号别名获取电机型号"""
    logger.debug(f"根据电机型号别名获取电机型号: alias={alias}")
    return db.query(models.MotorModel).filter(models.MotorModel.aliases.contains(alias)).first()

def get_motor_model_list(db: Session, skip: int = 0, limit: int = 100) -> List[models.MotorModel]:
    """获取电机型号列表"""
    logger.debug(f"获取电机型号列表: skip={skip}, limit={limit}")
    return db.query(models.MotorModel).offset(skip).limit(limit).all()

def create_motor_model(db: Session, motor_model: schemas.MotorModelSchemaCreate) -> models.MotorModel:
    """创建电机型号"""
    logger.debug(f"创建电机型号: name={motor_model.name}, aliases={motor_model.aliases}")
    db_motor_model = models.MotorModel(**motor_model.model_dump())
    logger.debug(f"创建电机型号对象: {db_motor_model}")
    db.add(db_motor_model)
    db.commit()
    db.refresh(db_motor_model)
    logger.info(f"电机型号创建成功: name={motor_model.name}")
    return db_motor_model

def update_motor_model(db: Session, name: str, motor_model_update: schemas.MotorModelSchemaUpdate) -> Optional[models.MotorModel]:
    """更新电机型号"""
    logger.debug(f"更新电机型号: name={name}, update_data={motor_model_update.model_dump(exclude_unset=True)}")
    db_motor_model = get_motor_model_by_name(db, name)
    if not db_motor_model:
        logger.warning(f"电机型号不存在: name={name}")
        return None
    
    update_data = motor_model_update.model_dump(exclude_unset=True)
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_motor_model, field, value)
    
    db.commit()
    db.refresh(db_motor_model)
    logger.info(f"电机型号更新成功: name={name}")
    return db_motor_model

def delete_motor_model(db: Session, name: str) -> Optional[dict]:
    """删除电机型号"""
    logger.debug(f"删除电机型号: name={name}")
    db_motor_model = get_motor_model_by_name(db, name)
    if not db_motor_model:
        logger.warning(f"电机型号不存在: name={name}")
        return None
    
    # 保存电机型号信息用于返回
    motor_model_info = {
        "name": db_motor_model.name,
        "aliases": db_motor_model.aliases
    }
    
    logger.debug(f"删除电机型号对象: {db_motor_model}")
    db.delete(db_motor_model)
    db.commit()
    logger.info(f"电机型号删除成功: name={name}")
    return motor_model_info
