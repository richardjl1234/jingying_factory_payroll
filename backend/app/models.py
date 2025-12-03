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
    salary_records = relationship("SalaryRecord", back_populates="creator")

class Worker(Base):
    """工人表"""
    __tablename__ = "workers"
    
    worker_code = Column(String(20), primary_key=True, index=True, comment="工号")
    name = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    salary_records = relationship("SalaryRecord", back_populates="worker")

class Process(Base):
    """工序表"""
    __tablename__ = "processes"
    
    process_code = Column(String(20), primary_key=True, index=True, comment="工序编码")
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(20), nullable=False, comment="工序类别：精加工/装配喷漆/绕嵌排")
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 添加检查约束，确保category值只能是指定的枚举值
    __table_args__ = (
        CheckConstraint("category IN ('精加工', '装配喷漆', '绕嵌排')", name="_process_category_check"),
    )
    
    # 关系
    quotas = relationship("Quota", back_populates="process")

class Quota(Base):
    """定额表"""
    __tablename__ = "quotas"
    
    id = Column(Integer, primary_key=True, index=True)
    process_code = Column(String(20), ForeignKey("processes.process_code"), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False, comment="单价，保留两位小数")
    effective_date = Column(Date, nullable=False, comment="生效日期")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 约束：同一工序在同一日期只能有一个生效定额
    __table_args__ = (
        UniqueConstraint('process_code', 'effective_date', name='_process_effective_date_uc'),
    )
    
    # 关系
    process = relationship("Process", back_populates="quotas")
    creator = relationship("User", back_populates="quotas")
    salary_records = relationship("SalaryRecord", back_populates="quota")

class SalaryRecord(Base):
    """工资记录表"""
    __tablename__ = "salary_records"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_code = Column(String(20), ForeignKey("workers.worker_code"), nullable=False)
    quota_id = Column(Integer, ForeignKey("quotas.id"), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False, comment="数量，保留两位小数")
    unit_price = Column(Numeric(10, 2), nullable=False, comment="单价，保留两位小数")
    amount = Column(Numeric(10, 2), nullable=False, comment="金额，保留两位小数")
    record_date = Column(String(7), nullable=False, comment="记录日期，格式：YYYY-MM")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    worker = relationship("Worker", back_populates="salary_records")
    quota = relationship("Quota", back_populates="salary_records")
    creator = relationship("User", back_populates="salary_records")
