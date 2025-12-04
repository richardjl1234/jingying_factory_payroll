# 工厂定额和计件工资管理系统

## 项目简介

工厂定额和计件工资管理系统是一个用于工厂管理工序定额和工人计件工资的Web应用。该系统支持工序管理、定额设置、工人信息管理、工资记录以及报表统计等功能，帮助工厂实现自动化的工资计算和管理。

## 最近更新 (2025-12-04)

### 密码重置与系统优化
1. **密码重置**：重置了三个关键用户的密码，确保系统安全：
   - `root` → `root123`
   - `test` → `test123`
   - `stat` → `start`

2. **前端配置优化**：
   - 更新了前端环境变量 (`frontend/.env`)，将API基础URL从 `http://localhost:8001/api` 改为相对路径 `/api`，使前端在Docker容器中能正确访问后端API。
   - 重新构建了前端静态文件并更新了Docker镜像。

3. **Docker容器稳定性**：
   - 修复了Docker容器异常退出问题，确保容器健康运行。
   - 更新了Docker Compose配置，确保前端和后端服务正常协作。

4. **测试脚本清理**：
   - 移除了临时测试脚本 (`fix_password.py`, `reset_passwords.py`, `test_new_passwords.py` 等)。
   - 保留了格式化的测试脚本在 `test/` 目录中。

5. **系统验证**：
   - 验证了所有用户的新密码登录功能。
   - 确认了统计员 (`stat`) 能够正常访问统计API。
   - 测试了Docker容器运行状态和API健康检查。

### 使用说明更新
- 登录时如遇问题，请尝试浏览器硬刷新 (Ctrl+F5) 以清除缓存。
- 确保通过 `http://localhost` 访问系统（Docker容器映射到端口80）。

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
│   ├── init_db.py          # 数据库初始化脚本
│   ├── generate_test_data.py # 测试数据生成脚本
│   └── payroll.db          # SQLite数据库（自动生成）
├── frontend/               # 前端代码
│   ├── src/               # 源代码
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   ├── App.jsx        # 应用组件
│   │   └── main.jsx       # 应用入口
│   ├── package.json       # 依赖配置
│   └── vite.config.js     # Vite配置
├── test/                  # 测试脚本和资源
│   ├── test_api.py        # API测试脚本
│   ├── test_local_api.py  # 本地API测试
│   ├── user_management_test.js  # 用户管理测试
│   └── *.png              # 测试截图
├── docs/                  # 文档（可选）
│   └── 用户手册.md        # 用户手册
├── Dockerfile             # Docker配置
├── docker-compose.yml     # Docker Compose配置
├── docker-compose-https.yml # HTTPS Docker Compose配置
├── nginx.conf             # Nginx配置
├── CLOUD_DEPLOYMENT.md    # 云服务器部署指南
├── HTTPS_DEPLOYMENT_GUIDE.md # HTTPS部署指南
├── SSH_Password_Less_Login_Guide.md # SSH免密登录指南
├── deploy_on_cloud.sh     # 云服务器一键部署脚本
├── deploy_https_on_cloud.sh # HTTPS部署脚本
├── generate_ssl_cert.sh   # SSL证书生成脚本
├── generate_ssl_cert_windows.ps1 # Windows SSL证书生成脚本
├── update_cloud_server.sh # 云服务器更新脚本
├── stop_existing_container.sh # 停止现有容器脚本
├── fix_docker_permissions.sh # Docker权限修复脚本
├── test_cloud_deployment.sh # 云服务器部署测试脚本
├── build_frontend_cloud.sh # 前端构建脚本
├── .env.cloud             # 云服务器环境变量模板
├── .env.cloud.https       # HTTPS环境变量模板
└── README.md              # 项目说明
```

## 功能模块

### 1. 用户管理
- 用户注册、登录、修改密码
- 角色权限管理（管理员、统计员、报表查看员）
- 用户信息维护
- 新用户首次登录需修改密码（need_change_password机制）

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
   - 新用户首次登录会提示修改密码

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

详细使用说明请参考 [用户手册.md](用户手册.md)

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

### 本地Docker部署
1. 构建Docker镜像
```bash
docker build -t payroll-system .
```

2. 运行Docker容器
```bash
docker run -d -p 8000:8000 payroll-system
```

### 云服务器部署
系统已配置支持云服务器部署，提供一键部署脚本。

#### 一键部署脚本
```bash
# 克隆代码
git clone https://gitee.com/richardjl/payroll-system.git
cd payroll-system

# 运行部署脚本
chmod +x deploy_on_cloud.sh
./deploy_on_cloud.sh
```

#### 详细部署指南
参考 [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md) 文件

#### HTTPS部署
参考 [HTTPS_DEPLOYMENT_GUIDE.md](HTTPS_DEPLOYMENT_GUIDE.md) 文件

## 测试

项目包含测试脚本，位于 `test/` 目录下。运行测试以确保功能正常：

```bash
cd test
# 运行API测试
python test_api.py
# 运行本地API测试
python test_local_api.py
```

## 快速开始

### 本地开发
```bash
# 克隆代码
git clone https://gitee.com/richardjl/payroll-system.git
cd payroll-system

# 启动后端
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py

# 启动前端（新终端）
cd frontend
npm install
npm run dev
```

### 云服务器部署
```bash
# 登录云服务器
ssh ubuntu@124.220.108.154

# 一键部署
git clone https://gitee.com/richardjl/payroll-system.git
cd payroll-system
chmod +x deploy_on_cloud.sh
./deploy_on_cloud.sh
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
