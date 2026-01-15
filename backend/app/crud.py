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
    
    # 先删除相关的工作记录
    logger.debug(f"查找工人相关的工作记录: worker_code={worker_code}")
    work_records = db.query(models.WorkRecord).filter(
        models.WorkRecord.worker_code == worker_code
    ).all()
    
    if work_records:
        logger.debug(f"删除{len(work_records)}条相关的工作记录")
        for record in work_records:
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
    
    # 先删除相关的定额和工作记录
    logger.debug(f"查找工序相关的定额: process_code={process_code}")
    quotas = db.query(models.Quota).filter(
        models.Quota.process_code == process_code
    ).all()
    
    if quotas:
        logger.debug(f"删除{len(quotas)}个相关的定额及其工作记录")
        for quota in quotas:
            # 删除定额相关的工作记录
            work_records = db.query(models.WorkRecord).filter(
                models.WorkRecord.quota_id == quota.id
            ).all()
            if work_records:
                logger.debug(f"删除定额ID={quota.id}的{len(work_records)}条工作记录")
                for record in work_records:
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
    logger.debug(f"创建定额: process_code={quota.process_code}, cat1_code={quota.cat1_code}, cat2_code={quota.cat2_code}, model_code={quota.model_code}, unit_price={quota.unit_price}, effective_date={quota.effective_date}, created_by={created_by}")
    
    # 1. 查找是否存在相同组合且obsolete_date为'9999-12-31'的记录
    existing_quota = db.query(models.Quota).filter(
        models.Quota.process_code == quota.process_code,
        models.Quota.cat1_code == quota.cat1_code,
        models.Quota.cat2_code == quota.cat2_code,
        models.Quota.model_code == quota.model_code,
        models.Quota.obsolete_date == '9999-12-31'
    ).first()
    
    if existing_quota:
        # 2. 如果存在，更新其obsolete_date为当前定额的effective_date的前一天
        from datetime import timedelta
        new_obsolete_date = quota.effective_date - timedelta(days=1)
        existing_quota.obsolete_date = new_obsolete_date
        logger.warning(f"更新现有定额的作废日期: 定额ID={existing_quota.id}, 新作废日期={new_obsolete_date}, 组合(process_code={quota.process_code}, cat1_code={quota.cat1_code}, cat2_code={quota.cat2_code}, model_code={quota.model_code})")
    
    # 3. 创建新的定额
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
    
    # 先删除相关的工作记录
    logger.debug(f"查找定额相关的工作记录: quota_id={quota_id}")
    work_records = db.query(models.WorkRecord).filter(
        models.WorkRecord.quota_id == quota_id
    ).all()
    
    if work_records:
        logger.debug(f"删除{len(work_records)}条相关的工作记录")
        for record in work_records:
            db.delete(record)
    
    logger.debug(f"删除定额对象: {db_quota}")
    db.delete(db_quota)
    db.commit()
    logger.info(f"定额删除成功: quota_id={quota_id}")
    return quota_info

# 工作记录相关CRUD

def get_work_record_by_id(db: Session, record_id: int) -> Optional[models.WorkRecord]:
    """根据ID获取工作记录"""
    logger.debug(f"根据ID获取工作记录: record_id={record_id}")
    return db.query(models.WorkRecord).filter(models.WorkRecord.id == record_id).first()

def get_work_records(db: Session, worker_code: str = None, record_date: str = None, skip: int = 0, limit: int = 100) -> List[models.WorkRecord]:
    """获取工作记录列表"""
    logger.debug(f"获取工作记录列表: worker_code={worker_code}, record_date={record_date}, skip={skip}, limit={limit}")
    query = db.query(models.WorkRecord)
    if worker_code:
        query = query.filter(models.WorkRecord.worker_code == worker_code)
    if record_date:
        # record_date is in YYYY-MM format, filter by month
        from datetime import datetime
        try:
            year_month = datetime.strptime(record_date, "%Y-%m")
            # Filter records where record_date's year and month match
            # MySQL uses DATE_FORMAT instead of SQLite's strftime
            query = query.filter(
                func.date_format(models.WorkRecord.record_date, "%Y-%m") == record_date
            )
        except ValueError:
            logger.warning(f"Invalid record_date format: {record_date}, expected YYYY-MM")
            # If invalid format, treat as exact date (YYYY-MM-DD)
            query = query.filter(models.WorkRecord.record_date == record_date)
    return query.order_by(desc(models.WorkRecord.created_at)).offset(skip).limit(limit).all()

def create_work_record(db: Session, record: schemas.WorkRecordCreate, created_by: int) -> Optional[models.WorkRecord]:
    """创建工作记录"""
    logger.debug(f"创建工作记录: worker_code={record.worker_code}, quota_id={record.quota_id}, quantity={record.quantity}, record_date={record.record_date}, created_by={created_by}")
    
    # 获取定额信息
    logger.debug(f"获取定额信息: quota_id={record.quota_id}")
    quota = get_quota_by_id(db, record.quota_id)
    if not quota:
        logger.warning(f"定额不存在: quota_id={record.quota_id}")
        return None
    
    # 验证工作记录日期是否在定额有效期内
    if record.record_date < quota.effective_date:
        error_msg = f"工作记录日期{record.record_date}早于定额生效日期{quota.effective_date}"
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    if record.record_date > quota.obsolete_date:
        error_msg = f"工作记录日期{record.record_date}晚于定额作废日期{quota.obsolete_date}"
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    logger.debug(f"定额验证通过: 工作记录日期{record.record_date}在定额有效期内[{quota.effective_date}, {quota.obsolete_date}]")
    
    db_record = models.WorkRecord(
        **record.model_dump(),
        created_by=created_by
    )
    logger.debug(f"创建工作记录对象: {db_record}")
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    logger.info(f"工作记录创建成功: id={db_record.id}, worker_code={record.worker_code}")
    return db_record

def update_work_record(db: Session, record_id: int, record_update: schemas.WorkRecordUpdate) -> Optional[models.WorkRecord]:
    """更新工作记录"""
    logger.debug(f"更新工作记录: record_id={record_id}, update_data={record_update.model_dump(exclude_unset=True)}")
    db_record = get_work_record_by_id(db, record_id)
    if not db_record:
        logger.warning(f"工作记录不存在: record_id={record_id}")
        return None
    
    update_data = record_update.model_dump(exclude_unset=True)
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_record, field, value)
    
    db.commit()
    db.refresh(db_record)
    logger.info(f"工作记录更新成功: record_id={record_id}")
    return db_record

def delete_work_record(db: Session, record_id: int) -> Optional[dict]:
    """删除工作记录"""
    logger.debug(f"删除工作记录: record_id={record_id}")
    db_record = get_work_record_by_id(db, record_id)
    if not db_record:
        logger.warning(f"工作记录不存在: record_id={record_id}")
        return None
    
    # 保存记录信息用于返回
    record_info = {
        "id": db_record.id,
        "worker_code": db_record.worker_code,
        "quota_id": db_record.quota_id,
        "quantity": str(db_record.quantity),
        "record_date": db_record.record_date
    }
    
    logger.debug(f"删除工作记录对象: {db_record}")
    db.delete(db_record)
    db.commit()
    logger.info(f"工作记录删除成功: record_id={record_id}")
    return record_info

# 工资记录视图相关CRUD

def get_salary_record_by_id(db: Session, record_id: int) -> Optional[models.VSalaryRecord]:
    """根据ID获取工资记录（视图）"""
    logger.debug(f"根据ID获取工资记录（视图）: record_id={record_id}")
    return db.query(models.VSalaryRecord).filter(models.VSalaryRecord.id == record_id).first()

def get_salary_records(db: Session, worker_code: str = None, record_date: str = None, skip: int = 0, limit: int = 100) -> List[models.VSalaryRecord]:
    """获取工资记录列表（视图）"""
    logger.info(f"[CRUD] get_salary_records called with: worker_code={worker_code}, record_date={record_date}, skip={skip}, limit={limit}")
    
    # First, check if the view exists and is accessible
    try:
        from sqlalchemy import text
        view_check = db.execute(text("SELECT COUNT(*) FROM v_salary_records LIMIT 1")).fetchone()
        logger.info(f"[CRUD] View v_salary_records check: {view_check[0]} records accessible")
    except Exception as e:
        logger.error(f"[CRUD] View v_salary_records access error: {str(e)}")
        raise
    
    query = db.query(models.VSalaryRecord)
    if worker_code:
        query = query.filter(models.VSalaryRecord.worker_code == worker_code)
    if record_date:
        # record_date is in YYYY-MM format, filter by month
        from datetime import datetime
        try:
            year_month = datetime.strptime(record_date, "%Y-%m")
            # Filter records where record_date's year and month match
            # MySQL uses DATE_FORMAT instead of SQLite's strftime
            query = query.filter(
                func.date_format(models.VSalaryRecord.record_date, "%Y-%m") == record_date
            )
        except ValueError:
            logger.warning(f"Invalid record_date format: {record_date}, expected YYYY-MM")
            # If invalid format, treat as exact date (YYYY-MM-DD)
            query = query.filter(models.VSalaryRecord.record_date == record_date)
    
    result = query.order_by(desc(models.VSalaryRecord.id)).offset(skip).limit(limit).all()
    logger.info(f"[CRUD] get_salary_records returning {len(result)} records")
    return result

def get_worker_salary_summary(db: Session, worker_code: str, record_date: str) -> Decimal:
    """获取工人月度工资汇总"""
    logger.debug(f"获取工人月度工资汇总: worker_code={worker_code}, record_date={record_date}")
    # record_date is in YYYY-MM format, filter by month
    result = db.query(
        func.sum(models.VSalaryRecord.amount).label("total_amount")
    ).filter(
        models.VSalaryRecord.worker_code == worker_code,
        func.date_format(models.VSalaryRecord.record_date, "%Y-%m") == record_date
    ).first()
    
    total = result.total_amount or Decimal("0.00")
    logger.debug(f"工人月度工资汇总结果: worker_code={worker_code}, total_amount={total}")
    return total

def get_salary_records_by_worker_and_date_range(
    db: Session, 
    worker_code: str, 
    start_date: date,
    end_date: date
) -> List[models.VSalaryRecord]:
    """根据工人编码和日期范围获取工资记录"""
    logger.debug(f"根据工人和日期范围获取工资记录: worker_code={worker_code}, start_date={start_date}, end_date={end_date}")
    
    query = db.query(models.VSalaryRecord).filter(
        models.VSalaryRecord.worker_code == worker_code,
        models.VSalaryRecord.record_date >= start_date,
        models.VSalaryRecord.record_date <= end_date
    )
    
    result = query.order_by(models.VSalaryRecord.record_date).all()
    logger.debug(f"查询到 {len(result)} 条工资记录")
    return result


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

def get_motor_model_by_code(db: Session, model_code: str) -> Optional[models.MotorModel]:
    """根据电机型号编码获取电机型号"""
    logger.debug(f"根据电机型号编码获取电机型号: model_code={model_code}")
    return db.query(models.MotorModel).filter(models.MotorModel.model_code == model_code).first()

def get_motor_model_list(db: Session, skip: int = 0, limit: int = 100) -> List[models.MotorModel]:
    """获取电机型号列表"""
    logger.debug(f"获取电机型号列表: skip={skip}, limit={limit}")
    return db.query(models.MotorModel).offset(skip).limit(limit).all()

def create_motor_model(db: Session, motor_model: schemas.MotorModelSchemaCreate) -> models.MotorModel:
    """创建电机型号"""
    logger.debug(f"创建电机型号: model_code={motor_model.model_code}, name={motor_model.name}")
    db_motor_model = models.MotorModel(**motor_model.model_dump())
    logger.debug(f"创建电机型号对象: {db_motor_model}")
    db.add(db_motor_model)
    db.commit()
    db.refresh(db_motor_model)
    logger.info(f"电机型号创建成功: model_code={motor_model.model_code}")
    return db_motor_model

def update_motor_model(db: Session, model_code: str, motor_model_update: schemas.MotorModelSchemaUpdate) -> Optional[models.MotorModel]:
    """更新电机型号"""
    logger.debug(f"更新电机型号: model_code={model_code}, update_data={motor_model_update.model_dump(exclude_unset=True)}")
    db_motor_model = get_motor_model_by_code(db, model_code)
    if not db_motor_model:
        logger.warning(f"电机型号不存在: model_code={model_code}")
        return None
    
    update_data = motor_model_update.model_dump(exclude_unset=True)
    logger.debug(f"更新字段: {update_data}")
    for field, value in update_data.items():
        setattr(db_motor_model, field, value)
    
    db.commit()
    db.refresh(db_motor_model)
    logger.info(f"电机型号更新成功: model_code={model_code}")
    return db_motor_model

def delete_motor_model(db: Session, model_code: str) -> Optional[dict]:
    """删除电机型号"""
    logger.debug(f"删除电机型号: model_code={model_code}")
    db_motor_model = get_motor_model_by_code(db, model_code)
    if not db_motor_model:
        logger.warning(f"电机型号不存在: model_code={model_code}")
        return None
    
    # 保存电机型号信息用于返回
    motor_model_info = {
        "model_code": db_motor_model.model_code,
        "name": db_motor_model.name
    }
    
    logger.debug(f"删除电机型号对象: {db_motor_model}")
    db.delete(db_motor_model)
    db.commit()
    logger.info(f"电机型号删除成功: model_code={model_code}")
    return motor_model_info


# 定额矩阵相关CRUD

def get_quota_filter_combinations(db: Session) -> List[dict]:
    """
    获取所有唯一的 (工段类别, 工序类别, 生效日期) 组合
    按 生效日期, 工段类别, 工序类别 排序
    """
    logger.debug("获取定额过滤器组合列表")
    
    results = db.query(
        models.Quota.cat1_code,
        models.ProcessCat1.name.label('cat1_name'),
        models.Quota.cat2_code,
        models.ProcessCat2.name.label('cat2_name'),
        models.Quota.effective_date
    ).join(
        models.ProcessCat1, 
        models.Quota.cat1_code == models.ProcessCat1.cat1_code, 
        isouter=True
    ).join(
        models.ProcessCat2, 
        models.Quota.cat2_code == models.ProcessCat2.cat2_code, 
        isouter=True
    ).distinct(
        models.Quota.cat1_code,
        models.Quota.cat2_code,
        models.Quota.effective_date
    ).order_by(
        models.Quota.effective_date,
        models.Quota.cat1_code,
        models.Quota.cat2_code
    ).all()
    
    return [
        {
            "cat1_code": r.cat1_code,
            "cat1_name": r.cat1_name or r.cat1_code,
            "cat2_code": r.cat2_code,
            "cat2_name": r.cat2_name or r.cat2_code,
            "effective_date": str(r.effective_date)
        }
        for r in results
    ]


def get_quota_matrix_data(db: Session, cat1_code: str, cat2_code: str, effective_date: str) -> Optional[dict]:
    """
    获取指定组合的定额矩阵数据
    
    返回:
        {
            "cat1": {"code": str, "name": str},
            "cat2": {"code": str, "name": str},
            "effective_date": str,
            "rows": [{"model_code": str, "model_name": str, "prices": {}}],
            "columns": [{"process_code": str, "process_name": str}]
        }
    """
    logger.debug(f"获取定额矩阵数据: cat1_code={cat1_code}, cat2_code={cat2_code}, effective_date={effective_date}")
    
    # 获取所有相关定额记录，同时获取工序名称
    quotas = db.query(
        models.Quota,
        models.Process.name.label('process_name'),
        models.MotorModel.name.label('model_name')
    ).join(
        models.Process,
        models.Quota.process_code == models.Process.process_code
    ).join(
        models.MotorModel,
        models.Quota.model_code == models.MotorModel.model_code
    ).filter(
        models.Quota.cat1_code == cat1_code,
        models.Quota.cat2_code == cat2_code,
        models.Quota.effective_date == effective_date
    ).all()
    
    if not quotas:
        logger.warning(f"未找到定额数据: cat1_code={cat1_code}, cat2_code={cat2_code}, effective_date={effective_date}")
        return None
    
    # 获取名称映射
    cat1 = get_process_cat1_by_code(db, cat1_code)
    cat2 = get_process_cat2_by_code(db, cat2_code)
    
    # 构建矩阵数据
    model_codes = set()
    process_codes = set()
    price_map = {}  # (model_code, process_code) -> unit_price
    process_names = {}  # process_code -> process_name
    model_names = {}  # model_code -> model_name
    
    for quota, process_name, model_name in quotas:
        model_codes.add(quota.model_code)
        process_codes.add(quota.process_code)
        price_map[(quota.model_code, quota.process_code)] = float(quota.unit_price)
        # 保存工序名称（优先使用实际名称，如果为空则使用code）
        if process_name:
            process_names[quota.process_code] = process_name
        else:
            process_names[quota.process_code] = quota.process_code
        # 保存型号名称
        if model_name:
            model_names[quota.model_code] = model_name
        else:
            model_names[quota.model_code] = quota.model_code
    
    # 排序型号（按数字前缀排序）
    def get_model_sort_key(model_code):
        try:
            part = model_code.split('-')[0]
            return int(part)
        except (ValueError, AttributeError):
            return 0
    
    sorted_models = sorted(model_codes, key=get_model_sort_key)
    sorted_processes = sorted(process_codes)
    
    # 构建响应
    rows = []
    for model_code in sorted_models:
        prices = {}
        for process_code in sorted_processes:
            price = price_map.get((model_code, process_code))
            if price is not None:
                prices[process_code] = price
        
        model_name = model_names.get(model_code, model_code)
        
        rows.append({
            "model_code": model_code,
            "model_name": model_name,
            "prices": prices
        })
    
    columns = []
    for process_code in sorted_processes:
        process_name = process_names.get(process_code, process_code)
        columns.append({
            "process_code": process_code,
            "process_name": process_name
        })
    
    return {
        "cat1": {
            "code": cat1_code,
            "name": cat1.name if cat1 else cat1_code
        },
        "cat2": {
            "code": cat2_code,
            "name": cat2.name if cat2 else cat2_code
        },
        "effective_date": effective_date,
        "rows": rows,
        "columns": columns
    }
