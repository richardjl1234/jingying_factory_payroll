# 工厂定额和计件工资管理系统 API 接口文档

## 概述

本文档详细描述了工厂定额和计件工资管理系统的前后端交互接口。系统采用前后端分离架构，前端使用 React + TypeScript，后端使用 FastAPI + SQLite。

## 基础信息

- **后端地址**: `http://localhost:8000` (开发环境) 或 `/api` (生产环境)
- **API前缀**: `/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 接口分类

### 1. 认证接口 (Authentication)

#### 1.1 用户登录
- **URL**: `POST /api/auth/login`
- **描述**: 用户登录获取访问令牌
- **请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```
- **响应**:
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "string",
    "name": "string",
    "role": "admin|statistician|report",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00",
    "need_change_password": true
  }
}
```

#### 1.2 修改密码
- **URL**: `POST /api/auth/change-password`
- **描述**: 修改当前用户密码
- **认证**: 需要 Bearer Token
- **请求体**:
```json
{
  "old_password": "string",
  "new_password": "string",
  "confirm_password": "string"
}
```
- **响应**:
```json
{
  "message": "Password changed successfully"
}
```

#### 1.3 获取当前用户信息
- **URL**: `GET /api/auth/me`
- **描述**: 获取当前登录用户信息
- **认证**: 需要 Bearer Token
- **响应**: 同登录接口中的 user 对象

### 2. 用户管理接口 (Users)

#### 2.1 获取用户列表
- **URL**: `GET /api/users/`
- **描述**: 获取所有用户列表（仅管理员）
- **认证**: 需要 Bearer Token + 管理员权限
- **查询参数**:
  - `skip`: 跳过记录数 (默认: 0)
  - `limit`: 返回记录数 (默认: 100)
- **响应**: User 对象数组

#### 2.2 获取单个用户
- **URL**: `GET /api/users/{user_id}`
- **描述**: 根据ID获取用户信息（仅管理员）
- **认证**: 需要 Bearer Token + 管理员权限
- **响应**: User 对象

#### 2.3 创建用户
- **URL**: `POST /api/users/`
- **描述**: 创建新用户（仅管理员）
- **认证**: 需要 Bearer Token + 管理员权限
- **请求体**:
```json
{
  "username": "string",
  "name": "string",
  "role": "admin|statistician|report",
  "password": "string"
}
```
- **响应**: 创建的 User 对象

#### 2.4 更新用户
- **URL**: `PUT /api/users/{user_id}`
- **描述**: 更新用户信息（仅管理员）
- **认证**: 需要 Bearer Token + 管理员权限
- **请求体**:
```json
{
  "name": "string",
  "role": "admin|statistician|report",
  "password": "string"
}
```
- **响应**: 更新后的 User 对象

#### 2.5 删除用户
- **URL**: `DELETE /api/users/{user_id}`
- **描述**: 删除用户（仅管理员）
- **认证**: 需要 Bearer Token + 管理员权限
- **响应**:
```json
{
  "message": "用户删除成功",
  "user_id": 1
}
```

### 3. 工人管理接口 (Workers)

#### 3.1 获取工人列表
- **URL**: `GET /api/workers/`
- **描述**: 获取所有工人列表
- **认证**: 需要 Bearer Token
- **查询参数**:
  - `skip`: 跳过记录数 (默认: 0)
  - `limit`: 返回记录数 (默认: 100)
- **响应**: Worker 对象数组

#### 3.2 获取单个工人
- **URL**: `GET /api/workers/{worker_code}`
- **描述**: 根据工号获取工人信息
- **认证**: 需要 Bearer Token
- **响应**: Worker 对象

#### 3.3 创建工人
- **URL**: `POST /api/workers/`
- **描述**: 创建新工人
- **认证**: 需要 Bearer Token
- **请求体**:
```json
{
  "worker_code": "string",
  "name": "string"
}
```
- **响应**: 创建的 Worker 对象

#### 3.4 更新工人
- **URL**: `PUT /api/workers/{worker_code}`
- **描述**: 更新工人信息
- **认证**: 需要 Bearer Token
- **请求体**:
```json
{
  "name": "string"
}
```
- **响应**: 更新后的 Worker 对象

#### 3.5 删除工人
- **URL**: `DELETE /api/workers/{worker_code}`
- **描述**: 删除工人
- **认证**: 需要 Bearer Token
- **响应**:
```json
{
  "message": "工人删除成功",
  "worker_code": "string"
}
```

### 4. 工序管理接口 (Processes)

#### 4.1 获取工序列表
- **URL**: `GET /api/processes/`
- **描述**: 获取所有工序列表
- **认证**: 需要 Bearer Token
- **查询参数**:
  - `skip`: 跳过记录数 (默认: 0)
  - `limit`: 返回记录数 (默认: 100)
- **响应**: Process 对象数组

#### 4.2 获取单个工序
- **URL**: `GET /api/processes/{process_code}`
- **描述**: 根据工序编码获取工序信息
- **认证**: 需要 Bearer Token
- **响应**: Process 对象

#### 4.3 创建工序
- **URL**: `POST /api/processes/`
- **描述**: 创建新工序
- **认证**: 需要 Bearer Token
- **请求体**:
```json
{
  "process_code": "string",
  "name": "string",
  "description": "string"
}
```
- **响应**: 创建的 Process 对象

#### 4.4 更新工序
- **URL**: `PUT /api/processes/{process_code}`
- **描述**: 更新工序信息
- **认证**: 需要 Bearer Token
- **请求体**:
```json
{
  "name": "string",
  "description": "string"
}
```
- **响应**: 更新后的 Process 对象

#### 4.5 删除工序
- **URL**: `DELETE /api/processes/{process_code}`
- **描述**: 删除工序
- **认证**: 需要 Bearer Token
- **响应**:
```json
{
  "message": "工序删除成功",
  "process_code": "string"
}
```

### 5. 定额管理接口 (Quotas)

#### 5.1 获取定额列表
- **URL**: `GET /api/quotas/`
- **描述**: 获取所有定额列表
- **认证**: 需要 Bearer Token
- **查询参数**:
  - `skip`: 跳过记录数 (默认: 0)
  - `limit`: 返回记录数 (默认: 100)
- **响应**: Quota 对象数组（包含 process 和 creator 信息）

#### 5.2 获取单个定额
- **URL**: `GET /api/quotas/{id}`
- **描述**: 根据ID获取定额信息
- **认证**: 需要 Bearer Token
- **响应**: Quota 对象

#### 5.3 获取最新定额
- **URL**: `GET /api/quotas/latest/{process_code}`
- **描述**: 获取指定工序的最新定额
- **认证**: 需要 Bearer Token
- **响应**: Quota 对象

#### 5.4 创建定额
- **URL**: `POST /api/quotas/`
- **描述**: 创建新定额
- **认证**: 需要 Bearer Token
- **请求体**:
```json
{
  "process_code": "string",
  "cat1_code": "string",
  "cat2_code": "string",
  "model_name": "string",
  "unit_price": 10.50,
  "effective_date": "2024-01-01"
}
```
- **响应**: 创建的 Quota 对象

#### 5.5 更新定额
- **URL**: `PUT /api/quotas/{id}`
- **描述**: 更新定额信息
- **认证**: 需要 Bearer Token
- **请求体**:
```json
{
  "cat1_code": "string",
  "cat2_code": "string",
  "model_name": "string",
  "unit_price": 10.50,
  "effective_date": "2024-01-01"
}
```
- **响应**: 更新后的 Quota 对象

#### 5.6 删除定额
- **URL**: `DELETE /api/quotas/{id}`
- **描述**: 删除定额
- **认证**: 需要 Bearer Token
- **响应**:
```json
{
  "message": "定额删除成功",
  "id": 1
}
```

### 6. 工资记录管理接口 (Salary Records)

#### 6.1 获取工资记录列表
- **URL**: `GET /api/salary-records/`
- **描述**: 获取所有工资记录列表
- **认证**: 需要 Bearer Token
- **查询参数**:
  - `skip`: 跳过记录数 (默认: 0)
  - `limit`: 返回记录数 (默认: 100)
- **响应**: SalaryRecord 对象数组（包含 worker, quota, creator 信息）

#### 6.2 获取单个工资记录
- **URL**: `GET /api/salary-records/{id}`
- **描述**: 根据ID获取工资记录信息
- **认证**: 需要 Bearer Token
- **响应**: SalaryRecord 对象

#### 6.3 创建工资记录
- **URL**: `POST /api/salary-records/`
- **描述**: 创建新工资记录
- **认证**: 需要 Bearer Token
- **请求体**:
```json
{
  "worker_code": "string",
  "quota_id": 1,
  "quantity": 100.50,
  "record_date": "2024-01-01"
}
```
- **响应**: 创建的 SalaryRecord 对象

#### 6.4 更新工资记录
- **URL**: `PUT /api/salary-records/{id}`
- **描述**: 更新工资记录信息
- **认证**: 需要 Bearer Token
- **请求体**:
```json
{
  "quantity": 100.50,
  "record_date": "2024-01-01"
}
```
- **响应**: 更新后的 SalaryRecord 对象

#### 6.5 删除工资记录
- **URL**: `DELETE /api/salary-records/{id}`
- **描述**: 删除工资记录
- **认证**: 需要 Bearer Token
- **响应**:
```json
{
  "message": "工资记录删除成功",
  "id": 1
}
```

### 7. 报表接口 (Reports)

#### 7.1 工人工资报表
- **URL**: `GET /api/reports/worker-salary/{worker_code}/{month}/`
- **描述**: 获取指定工人指定月份的工资报表
- **认证**: 需要 Bearer Token
- **响应**:
```json
{
  "worker_code": "string",
  "worker_name": "string",
  "month": "2024-01",
  "total_amount": 5000.00,
  "details": [
    {
      "process_code": "string",
      "process_name": "string",
      "quantity": 100.00,
      "unit_price": 10.00,
      "amount": 1000.00
    }
  ]
}
```

#### 7.2 工序工作量报表
- **URL**: `GET /api/reports/process-workload/{month}/`
- **描述**: 获取指定月份的工序工作量报表
- **认证**: 需要 Bearer Token
- **响应**: ProcessWorkloadReport 对象数组

#### 7.3 工资汇总报表
- **URL**: `GET /api/reports/salary-summary/{month}/`
- **描述**: 获取指定月份的工资汇总报表
- **认证**: 需要 Bearer Token
- **响应**: SalarySummaryReport 对象

### 8. 统计接口 (Statistics)

#### 8.1 获取系统统计
- **URL**: `GET /api/stats/`
- **描述**: 获取系统各项统计数据
- **认证**: 需要 Bearer Token
- **响应**:
```json
{
  "user_count": 10,
  "worker_count": 50,
  "process_cat1_count": 5,
  "process_cat2_count": 15,
  "model_count": 8,
  "process_count": 30,
  "quota_count": 45,
  "salary_record_count": 1000
}
```

### 9. 工序类别管理接口

#### 9.1 工段类别管理
- **URL**: `GET /api/process-cat1/` - 获取列表
- **URL**: `GET /api/process-cat1/{code}` - 获取单个
- **URL**: `POST /api/process-cat1/` - 创建
- **URL**: `PUT /api/process-cat1/{code}` - 更新
- **URL**: `DELETE /api/process-cat1/{code}` - 删除

#### 9.2 工序类别管理
- **URL**: `GET /api/process-cat2/` - 获取列表
- **URL**: `GET /api/process-cat2/{code}` - 获取单个
- **URL**: `POST /api/process-cat2/` - 创建
- **URL**: `PUT /api/process-cat2/{code}` - 更新
- **URL**: `DELETE /api/process-cat2/{code}` - 删除

#### 9.3 电机型号管理
- **URL**: `GET /api/motor-models/` - 获取列表
- **URL**: `GET /api/motor-models/{name}` - 获取单个
- **URL**: `POST /api/motor-models/` - 创建
- **URL**: `PUT /api/motor-models/{name}` - 更新
- **URL**: `DELETE /api/motor-models/{name}` - 删除

## 前端API服务调用

前端通过 `frontend/src/services/api.ts` 封装的API方法调用后端接口，主要包含以下模块：

1. **authAPI**: 认证相关接口
2. **userAPI**: 用户管理接口
3. **workerAPI**: 工人管理接口
4. **processAPI**: 工序管理接口
5. **quotaAPI**: 定额管理接口
6. **salaryAPI**: 工资记录管理接口
7. **reportAPI**: 报表接口
8. **statsAPI**: 统计接口
9. **processCat1API**: 工段类别管理接口
10. **processCat2API**: 工序类别管理接口
11. **motorModelAPI**: 电机型号管理接口

## 数据模型对应关系

### 近期更新 (2025-12-31)
- **Process 模型**: 移除了 `category` 字段，不再需要工序类别分类
- **Quota 模型**: 新增了 `cat1_code` (工段类别), `cat2_code` (工序类别), `model_name` (电机型号) 三个外键字段，用于更精细的定额管理
- **SalaryRecord 模型**: `record_date` 字段格式从 `YYYY-MM` 改为 `YYYY-MM-DD` (DATE格式)

### 后端模型 (schemas.py) ↔ 前端类型 (types/index.ts)

| 后端模型 | 前端类型 | 差异说明 |
|---------|---------|---------|
| User | User | 字段基本一致，前端多了 `full_name` 字段 |
| Worker | Worker | 前端多了 `department`, `position`, `status` 字段 |
| Process | Process | 字段基本一致 (已移除 category 字段) |
| Quota | Quota | 字段基本一致 (新增 cat1_code, cat2_code, model_name) |
| SalaryRecord | SalaryRecord | 字段基本一致 (record_date 格式为 DATE) |

### 数据库模型 (models.py) ↔ API模型 (schemas.py)

数据库模型包含完整字段，API模型根据接口需求暴露相应字段，通过 Pydantic 进行数据验证和序列化。

## 错误处理

### HTTP 状态码
- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权/认证失败
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

### 错误响应格式
```json
{
  "detail": "错误描述信息",
  "error_type": "错误类型"
}
```

## 认证机制

1. **登录获取Token**: 用户通过 `/api/auth/login` 接口获取 JWT Token
2. **Token使用**: 前端将 Token 存储在 localStorage 中，每次请求通过 `Authorization: Bearer <token>` 头部传递
3. **Token过期**: Token 默认有效期为30分钟，过期后需要重新登录
4. **自动跳转**: 前端拦截器检测到401错误时自动跳转到登录页

## 分页机制

列表接口支持分页参数：
- `skip`: 跳过记录数
- `limit`: 返回记录数

前端通过 `PaginatedResponse<T>` 类型接收分页响应。

## 数据验证

后端使用 Pydantic 进行数据验证，包括：
- 字段类型验证
- 字段长度验证
- 枚举值验证
- 正则表达式验证
- 数值范围验证

前端使用 Ant Design Form 组件进行表单验证，同时依赖后端验证作为最终保障。

## 接口设计特点

1. **RESTful 风格**: 遵循 RESTful 设计原则
2. **资源导向**: 以资源为中心设计接口
3. **统一响应格式**: 所有接口
