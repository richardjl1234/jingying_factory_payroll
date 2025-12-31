from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal

# 用户相关模型
class UserBase(BaseModel):
    """用户基础模型"""
    username: str = Field(..., min_length=3, max_length=50)
    name: str = Field(..., min_length=1, max_length=50)
    role: str = Field(..., pattern="^(admin|statistician|report)$")

class UserCreate(UserBase):
    """创建用户模型"""
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    """更新用户模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    role: Optional[str] = Field(None, pattern="^(admin|statistician|report)$")
    password: Optional[str] = Field(None, min_length=6)

class UserInDB(UserBase):
    """数据库中的用户模型"""
    id: int
    wechat_openid: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    need_change_password: bool = True

    class Config:
        from_attributes = True

class User(UserInDB):
    """返回给客户端的用户模型"""
    pass

# 工人相关模型
class WorkerBase(BaseModel):
    """工人基础模型"""
    worker_code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=50)

class WorkerCreate(WorkerBase):
    """创建工人模型"""
    pass

class WorkerUpdate(BaseModel):
    """更新工人模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)

class WorkerInDB(WorkerBase):
    """数据库中的工人模型"""
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Worker(WorkerInDB):
    """返回给客户端的工人模型"""
    pass

# 工序相关模型
class ProcessBase(BaseModel):
    """工序基础模型"""
    process_code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class ProcessCreate(ProcessBase):
    """创建工序模型"""
    pass

class ProcessUpdate(BaseModel):
    """更新工序模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class ProcessInDB(ProcessBase):
    """数据库中的工序模型"""
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Process(ProcessInDB):
    """返回给客户端的工序模型"""
    pass

# 定额相关模型
class QuotaBase(BaseModel):
    """定额基础模型"""
    process_code: str = Field(..., min_length=1, max_length=20)
    cat1_code: str = Field(..., min_length=1, max_length=4)
    cat2_code: str = Field(..., min_length=1, max_length=4)
    model_name: str = Field(..., min_length=1, max_length=20)
    unit_price: Decimal = Field(..., ge=0, decimal_places=2)
    effective_date: date

class QuotaCreate(QuotaBase):
    """创建定额模型"""
    pass

class QuotaUpdate(BaseModel):
    """更新定额模型"""
    cat1_code: Optional[str] = Field(None, min_length=1, max_length=4)
    cat2_code: Optional[str] = Field(None, min_length=1, max_length=4)
    model_name: Optional[str] = Field(None, min_length=1, max_length=20)
    unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    effective_date: Optional[date] = None

class QuotaInDB(QuotaBase):
    """数据库中的定额模型"""
    id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

class Quota(QuotaInDB):
    """返回给客户端的定额模型"""
    process: Optional[Process] = None
    creator: Optional[User] = None

# 工资记录相关模型
class SalaryRecordBase(BaseModel):
    """工资记录基础模型"""
    worker_code: str = Field(..., min_length=1, max_length=20)
    quota_id: int
    quantity: Decimal = Field(..., ge=0, decimal_places=2)
    record_date: date

class SalaryRecordCreate(SalaryRecordBase):
    """创建工资记录模型"""
    pass

class SalaryRecordUpdate(BaseModel):
    """更新工资记录模型"""
    quantity: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    record_date: Optional[date] = None

class SalaryRecordInDB(SalaryRecordBase):
    """数据库中的工资记录模型"""
    id: int
    unit_price: Decimal
    amount: Decimal
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

class SalaryRecord(SalaryRecordInDB):
    """返回给客户端的工资记录模型"""
    worker: Optional[Worker] = None
    quota: Optional[Quota] = None
    creator: Optional[User] = None

# 认证相关模型
class Token(BaseModel):
    """令牌模型"""
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    """令牌数据模型"""
    username: Optional[str] = None

class LoginRequest(BaseModel):
    """登录请求模型"""
    username: str
    password: str

class ChangePasswordRequest(BaseModel):
    """修改密码请求模型"""
    old_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)

# 报表相关模型
class WorkerSalaryReport(BaseModel):
    """工人工资报表模型"""
    worker_code: str
    worker_name: str
    month: str
    total_amount: Decimal
    details: List[dict]

class ProcessWorkloadReport(BaseModel):
    """工序工作量报表模型"""
    process_code: str
    process_name: str
    process_category: str
    month: str
    total_quantity: Decimal
    total_amount: Decimal

class SalarySummaryReport(BaseModel):
    """工资汇总报表模型"""
    month: str
    total_workers: int
    total_amount: Decimal
    category_summary: List[dict]


# 工段类别相关模型
class ProcessCat1Base(BaseModel):
    """工段类别基础模型"""
    cat1_code: str = Field(..., min_length=1, max_length=4)
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=100)

class ProcessCat1Create(ProcessCat1Base):
    """创建工段类别模型"""
    pass

class ProcessCat1Update(BaseModel):
    """更新工段类别模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=100)

class ProcessCat1InDB(ProcessCat1Base):
    """数据库中的工段类别模型"""
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProcessCat1(ProcessCat1InDB):
    """返回给客户端的工段类别模型"""
    pass


# 工序类别相关模型
class ProcessCat2Base(BaseModel):
    """工序类别基础模型"""
    cat2_code: str = Field(..., min_length=1, max_length=4)
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=100)

class ProcessCat2Create(ProcessCat2Base):
    """创建工序类别模型"""
    pass

class ProcessCat2Update(BaseModel):
    """更新工序类别模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=100)

class ProcessCat2InDB(ProcessCat2Base):
    """数据库中的工序类别模型"""
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProcessCat2(ProcessCat2InDB):
    """返回给客户端的工序类别模型"""
    pass


# 电机型号相关模型
class MotorModelSchemaBase(BaseModel):
    """电机型号基础模型"""
    name: str = Field(..., min_length=1, max_length=20)
    aliases: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=100)

class MotorModelSchemaCreate(MotorModelSchemaBase):
    """创建电机型号模型"""
    pass

class MotorModelSchemaUpdate(BaseModel):
    """更新电机型号模型"""
    aliases: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=100)

class MotorModelSchemaInDB(MotorModelSchemaBase):
    """数据库中的电机型号模型"""
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MotorModelSchema(MotorModelSchemaInDB):
    """返回给客户端的电机型号模型"""
    pass
