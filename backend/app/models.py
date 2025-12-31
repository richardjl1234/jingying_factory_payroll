from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Numeric, UniqueConstraint, Boolean, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    """用户表"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    name = Column(String(50), nullable=False)
    role = Column(String(20), nullable=False, comment="角色: admin/statistician/report")
    wechat_openid = Column(String(100), unique=True, nullable=True, comment="微信OpenID，Phase 2使用")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    need_change_password = Column(Boolean, default=True, nullable=False, comment="是否需要修改密码，新用户默认为True")
    
    # 关系
    quotas = relationship("Quota", back_populates="creator")
    work_records = relationship("WorkRecord", back_populates="creator")

class Worker(Base):
    """工人表"""
    __tablename__ = "workers"
    
    worker_code = Column(String(20), primary_key=True, index=True, comment="工号")
    name = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    work_records = relationship("WorkRecord", back_populates="worker")

class Process(Base):
    """工序表"""
    __tablename__ = "processes"
    
    process_code = Column(String(20), primary_key=True, index=True, comment="工序编码")
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    quotas = relationship("Quota", back_populates="process")

class Quota(Base):
    """定额表"""
    __tablename__ = "quotas"
    
    id = Column(Integer, primary_key=True, index=True)
    process_code = Column(String(20), ForeignKey("processes.process_code"), nullable=False, index=True)
    cat1_code = Column(String(4), ForeignKey("process_cat1.cat1_code", ondelete="CASCADE"), nullable=False, index=True)
    cat2_code = Column(String(4), ForeignKey("process_cat2.cat2_code", ondelete="CASCADE"), nullable=False, index=True)
    model_name = Column(String(20), ForeignKey("motor_models.name", ondelete="CASCADE"), nullable=False, index=True)
    unit_price = Column(Numeric(10, 2), nullable=False, comment="单价，保留两位小数")
    effective_date = Column(Date, nullable=False, comment="生效日期", index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 约束：同一工序、工段、工序类别、电机型号在同一日期只能有一个生效定额
    __table_args__ = (
        UniqueConstraint('process_code', 'cat1_code', 'cat2_code', 'model_name', 'effective_date', name='_process_effective_date_uc'),
    )
    
    # 关系
    process = relationship("Process", back_populates="quotas")
    cat1 = relationship("ProcessCat1", passive_deletes=True)
    cat2 = relationship("ProcessCat2", passive_deletes=True)
    model = relationship("MotorModel", passive_deletes=True)
    creator = relationship("User", back_populates="quotas")
    work_records = relationship("WorkRecord", back_populates="quota", passive_deletes=True)

class WorkRecord(Base):
    """工作记录表"""
    __tablename__ = "work_records"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_code = Column(String(20), ForeignKey("workers.worker_code"), nullable=False, index=True)
    quota_id = Column(Integer, ForeignKey("quotas.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Numeric(10, 2), nullable=False, comment="数量，保留两位小数")
    record_date = Column(Date, nullable=False, comment="记录日期", index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    worker = relationship("Worker", back_populates="work_records")
    quota = relationship("Quota", back_populates="work_records", passive_deletes=True)
    creator = relationship("User", back_populates="work_records")


class ProcessCat1(Base):
    """工段类别表"""
    __tablename__ = "process_cat1"
    
    cat1_code = Column(String(4), primary_key=True, index=True, comment="工段编码")
    name = Column(String(50), nullable=False, index=True, comment="工段名称")
    description = Column(String(100), nullable=True, comment="工段描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    quotas = relationship("Quota", back_populates="cat1", passive_deletes=True)


class ProcessCat2(Base):
    """工序类别表"""
    __tablename__ = "process_cat2"
    
    cat2_code = Column(String(4), primary_key=True, index=True, comment="工序类别编码")
    name = Column(String(50), nullable=False, index=True, comment="工序类别名称")
    description = Column(String(100), nullable=True, comment="工序类别描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    quotas = relationship("Quota", back_populates="cat2", passive_deletes=True)


class MotorModel(Base):
    """电机型号表"""
    __tablename__ = "motor_models"
    
    name = Column(String(20), primary_key=True, index=True, comment="电机型号名称")
    aliases = Column(String(100), nullable=True, comment="电机型号别名")
    description = Column(String(100), nullable=True, comment="电机型号描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    quotas = relationship("Quota", back_populates="model", passive_deletes=True)


class VSalaryRecord(Base):
    """工资记录视图"""
    __tablename__ = "v_salary_records"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_code = Column(String(20), nullable=False, index=True)
    quota_id = Column(Integer, nullable=False, index=True)
    quantity = Column(Numeric(10, 2), nullable=False, comment="数量，保留两位小数")
    unit_price = Column(Numeric(10, 2), nullable=False, comment="单价，保留两位小数")
    amount = Column(Numeric(10, 2), nullable=False, comment="金额，保留两位小数")
    record_date = Column(Date, nullable=False, comment="记录日期", index=True)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    
    # 注意：视图没有外键约束，但我们可以定义关系以便查询
    worker = relationship("Worker", foreign_keys=[worker_code], primaryjoin="VSalaryRecord.worker_code == Worker.worker_code", viewonly=True)
    quota = relationship("Quota", foreign_keys=[quota_id], primaryjoin="VSalaryRecord.quota_id == Quota.id", viewonly=True)
    creator = relationship("User", foreign_keys=[created_by], primaryjoin="VSalaryRecord.created_by == User.id", viewonly=True)
