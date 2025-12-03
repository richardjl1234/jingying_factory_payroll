# 工厂定额和计件工资管理系统

## 项目简介

工厂定额和计件工资管理系统是一个用于工厂管理工序定额和工人计件工资的Web应用。该系统支持工序管理、定额设置、工人信息管理、工资记录以及报表统计等功能，帮助工厂实现自动化的工资计算和管理。

## 技术栈

### 后端
- **框架**: FastAPI
- **数据库**: SQLite (生产环境可替换为MySQL/PostgreSQL)
- **ORM**: SQLAlchemy
- **认证**: JWT
- **依赖管理**: pip

### 前端
- **框架**: React 19
- **构建工具**: Vite
- **UI组件库**: Ant Design 6
- **路由**: React Router 7
- **HTTP客户端**: Axios

## 项目结构

```
new_payroll/
├── backend/                 # 后端代码
│   ├── app/                # FastAPI应用
│   │   ├── api/            # API路由
│   │   │   ├── auth.py     # 认证相关API
│   │   │   ├── user.py     # 用户管理API
│   │   │   ├── worker.py   # 工人管理API
│   │   │   ├── process.py  # 工序管理API
│   │   │   ├── quota.py    # 定额管理API
│   │   │   ├── salary.py   # 工资记录API
│   │   │   ├── report.py   # 报表API
│   │   │   └── stats.py    # 统计API
│   │   ├── models.py       # 数据库模型
│   │   ├── schemas.py      # Pydantic模型
│   │   ├── database.py     # 数据库连接
│   │   ├── crud.py         # CRUD操作
│   │   └── main.py         # 应用入口
│   ├── requirements.txt     # 依赖列表
│   ├── run.py              # 运行脚本
│   └── payroll.db          # SQLite数据库
├── frontend/               # 前端代码
│   ├── src/               # 源代码
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   ├── App.jsx        # 应用组件
│   │   └── main.jsx       # 应用入口
│   ├── package.json       # 依赖配置
│   └── vite.config.js     # Vite配置
└── Dockerfile             # Docker配置
```

## 功能模块

### 1. 用户管理
- 用户注册、登录、修改密码
- 角色权限管理（管理员、统计员、报表查看员）
- 用户信息维护

### 2. 工人管理
- 工人信息的增删改查
- 工号管理

### 3. 工序管理
- 工序分类管理（精加工、装配喷漆、绕嵌排）
- 工序信息维护

### 4. 定额管理
- 工序定额设置
- 生效日期管理
- 定额历史记录

### 5. 工资记录
- 工人工资记录录入
- 按月份统计
- 工资计算自动化

### 6. 报表功能
- 工资报表生成
- 统计分析
- 数据导出

### 7. 统计功能
- 工序定额统计
- 工人工资统计
- 生产效率分析

## 安装与运行

### 后端安装

1. 进入后端目录
```bash
cd backend
```

2. 创建虚拟环境
```bash
python -m venv venv
```

3. 激活虚拟环境
```bash
# Windows
env\Scripts\activate

# Linux/macOS
source venv/bin/activate
```

4. 安装依赖
```bash
pip install -r requirements.txt
```

5. 初始化数据库
```bash
python init_db.py
```

6. 运行后端服务
```bash
python run.py
```

后端服务将在 http://localhost:8000 启动

### 前端安装

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 开发模式运行
```bash
npm run dev
```

前端开发服务将在 http://localhost:5173 启动

4. 构建生产版本
```bash
npm run build
```

构建后的文件将生成在 `dist` 目录下

## API文档

后端提供了完整的API文档，访问以下地址查看：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 数据库结构

### 主要表结构

1. **users** - 用户表
   - id: 用户ID
   - username: 用户名
   - password: 密码
   - name: 真实姓名
   - role: 角色（admin/statistician/report）
   - created_at: 创建时间

2. **workers** - 工人表
   - worker_code: 工号
   - name: 姓名
   - created_at: 创建时间

3. **processes** - 工序表
   - process_code: 工序编码
   - name: 工序名称
   - category: 工序类别
   - description: 描述

4. **quotas** - 定额表
   - id: 定额ID
   - process_code: 工序编码
   - unit_price: 单价
   - effective_date: 生效日期
   - created_by: 创建人

5. **salary_records** - 工资记录表
   - id: 记录ID
   - worker_code: 工号
   - quota_id: 定额ID
   - quantity: 数量
   - unit_price: 单价
   - amount: 金额
   - record_date: 记录日期（YYYY-MM）
   - created_by: 创建人

## 使用说明

1. **登录系统**
   - 访问 http://localhost:8000
   - 使用管理员账号登录（初始账号可在代码中配置）

2. **基础数据维护**
   - 首先添加工序信息
   - 然后设置各工序的定额
   - 添加工人信息

3. **工资管理**
   - 每月录入工人的生产数量
   - 系统自动计算工资
   - 生成工资报表

4. **报表统计**
   - 查看工资统计报表
   - 分析生产效率
   - 导出数据

## 开发说明

### 后端开发

- 新增API路由：在 `backend/app/api/` 目录下创建新的路由文件
- 新增数据模型：在 `backend/app/models.py` 中定义
- 新增数据校验：在 `backend/app/schemas.py` 中定义
- 新增CRUD操作：在 `backend/app/crud.py` 中实现

### 前端开发

- 新增页面：在 `frontend/src/pages/` 目录下创建新的页面组件
- 新增组件：在 `frontend/src/components/` 目录下创建新的组件
- API调用：通过 `frontend/src/services/api.js` 封装的API方法调用后端接口

## 部署

### 开发环境部署

1. 启动后端服务
2. 启动前端开发服务
3. 访问 http://localhost:5173

### 生产环境部署

1. 构建前端生产版本
2. 启动后端服务（可使用Gunicorn等WSGI服务器）
3. 配置Nginx反向代理
4. 访问生产服务器地址

## Docker部署

1. 构建Docker镜像
```bash
docker build -t payroll-system .
```

2. 运行Docker容器
```bash
docker run -d -p 8000:8000 payroll-system
```

## 注意事项

1. 初始管理员账号需要在代码中配置
2. 生产环境中需要修改CORS配置，限制允许的域名
3. 生产环境建议使用MySQL或PostgreSQL数据库
4. 定期备份数据库

## 项目计划

根据 `.trae/documents/工厂定额和计件工资管理系统开发计划.md` 进行开发，包含以下阶段：

1. 需求分析和系统设计
2. 基础框架搭建
3. 核心功能开发
4. 测试和优化
5. 部署上线

## 联系方式

如有问题或建议，欢迎联系开发团队。