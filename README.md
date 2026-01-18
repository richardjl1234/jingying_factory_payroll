# 工厂定额和计件工资管理系统

## 项目简介

工厂定额和计件工资管理系统是一个用于工厂管理工序定额和工人计件工资的Web应用。该系统支持工序管理、定额设置、工人信息管理、工资记录以及报表统计等功能，帮助工厂实现自动化的工资计算和管理。

## 最近更新 (2026-01-01)

### 定额表新增作废日期字段与业务逻辑优化
1. **新增 `obsolete_date` 字段**：在定额表 (`quotas`) 中新增作废日期字段
   - 默认值：`9999-12-31`，表示当前有效的定额
   - 数据库迁移脚本自动为现有记录添加该字段
   - 更新数据库结构文档 (`document/DATABASE_SCHEMA.md`)

2. **后端业务逻辑优化**：
   - **定额创建逻辑 (`create_quota`)**：
     - 当创建新定额时，系统会自动查找相同组合（工序编码、工段编码、工序类别编码、电机型号）且作废日期为 `9999-12-31` 的现有定额
     - 如果找到，将现有定额的作废日期更新为新定额生效日期的前一天
     - 确保同一时间只有一个有效的定额组合
     - 记录警告日志以便跟踪定额更新历史
   
   - **工作记录验证逻辑 (`create_work_record`)**：
     - 创建工作记录时，验证工作记录日期是否在定额的有效期内（生效日期 ≤ 工作记录日期 ≤ 作废日期）
     - 如果日期早于定额生效日期或晚于作废日期，抛出 `ValueError` 并阻止记录创建
     - 提供清晰的错误信息便于调试和用户反馈

3. **前端更新**：
   - 更新定额管理页面 (`frontend/src/pages/QuotaManagement.jsx`) 显示作废日期字段
   - 更新TypeScript类型定义 (`frontend/src/types/index.ts`) 包含新字段

4. **测试验证**：
   - 运行完整测试套件 (`test/development/99_overall_test.sh`) 验证所有功能正常
   - 所有API测试、前端测试和Puppeteer测试通过

### TypeScript迁移与前端优化 (2025-12-24)
1. **TypeScript迁移完成**：前端核心基础设施已迁移到TypeScript
   - 核心文件迁移：`App.tsx`, `Layout.tsx`, `Login.tsx`, `api.ts`, `main.tsx`
   - 删除JavaScript重复文件：`App.jsx`, `Layout.jsx`, `Login.jsx`, `api.js`, `main.jsx`
   - 菜单结构优化：重新排序侧边栏菜单项，"工序管理"现在位于"工序类别"之后

2. **前端架构优化**：
   - 统一使用TypeScript作为入口点 (`main.tsx`)
   - 保留JavaScript页面组件用于渐进式迁移
   - 修复TypeScript编译警告（未使用的导入等）

3. **菜单结构调整**：
   - 工人管理 → 型号管理 → 工段类别管理 → 工序类别管理 → 工序管理 → 定额管理 → 工资记录 → 报表统计
   - 符合业务逻辑流程，优化用户体验

### HTTPS部署与云服务器配置 (2025-12-05)
1. **HTTPS部署完成**：成功在云服务器 `124.220.108.154` 上完成HTTPS部署
   - 生成自签名SSL证书
   - 配置Nginx反向代理支持HTTPS
   - 实现HTTP到HTTPS自动重定向
   - 新增 `nginx-https-production.conf` 配置文件

2. **SSH免密登录配置**：为云服务器配置SSH密钥，实现Git免密操作
   - 生成SSH密钥对
   - 配置SSH免密登录到Gitee
   - 支持云服务器自动拉取代码更新

3. **部署流程优化**：
   - 创建标准化HTTPS部署流程文档 (`HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md`)
   - 优化Docker容器部署脚本
   - 添加自动化测试脚本 (`test_https_puppeteer.js`)

4. **系统验证**：
   - 通过Puppeteer自动化测试验证HTTPS登录功能
   - 测试API接口在HTTPS环境下的正常工作
   - 验证前端资源正确加载

### 密码重置与系统优化 (2025-12-04)
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
- 系统现在可通过HTTPS访问：`https://124.220.108.154`
- HTTP请求自动重定向到HTTPS
- 登录时如遇问题，请尝试浏览器硬刷新 (Ctrl+F5) 以清除缓存。

## 待办事项 (TODO)

### TypeScript迁移 - 第二阶段 (未来计划)
当前前端采用混合架构（TypeScript核心 + JavaScript页面组件）。以下是未来迁移计划：

#### 已完成迁移 (Phase 1 & 2)
- ✅ **核心基础设施**: `App.tsx`, `Layout.tsx`, `Login.tsx`, `api.ts`, `main.tsx`
- ✅ **菜单优化**: 重新排序侧边栏菜单，"工序管理"位于"工序类别"之后
- ✅ **构建验证**: TypeScript编译通过，仅存在预期的类型警告

#### 待迁移页面 (10个JavaScript文件)
1. `Home.jsx` - 首页/统计面板
2. `UserManagement.jsx` - 用户管理页面
3. `WorkerManagement.jsx` - 工人管理页面
4. `ProcessManagement.jsx` - 工序管理页面
5. `ProcessCat1Management.jsx` - 工段类别管理
6. `ProcessCat2Management.jsx` - 工序类别管理
7. `MotorModelManagement.jsx` - 电机型号管理
8. `QuotaManagement.jsx` - 定额管理页面
9. `SalaryRecord.jsx` - 工资记录页面
10. `Report.jsx` - 报表统计页面

#### 迁移风险评估
- **当前状态**: 稳定，功能正常，混合架构可接受
- **风险等级**: 低到中等（类型安全缺口，但运行时功能正常）
- **建议**: 按页面使用频率和复杂度逐步迁移

#### 迁移步骤 (未来执行)
1. **准备阶段**: 检查`types/index.ts`类型定义完整性
2. **迁移执行**: 逐个页面转换为`.tsx`，添加类型注解
3. **测试验证**: 每个页面迁移后手动测试功能
4. **清理阶段**: 删除原始`.jsx`文件，更新导入

#### 优先级建议
1. **高优先级**: `UserManagement.jsx`, `WorkerManagement.jsx`（频繁使用）
2. **中优先级**: `ProcessManagement.jsx`, `QuotaManagement.jsx`（核心业务）
3. **低优先级**: 其他稳定页面

## 技术栈

### 后端
- **框架**: FastAPI
- **数据库**: MySQL（通过环境变量 `MYSQL_DB_URL` 配置）
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
│   │   │   ├── process_cat1.py  # 工段类别API
│   │   │   ├── process_cat2.py  # 工序类别API
│   │   │   ├── motor_model.py   # 电机型号API
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
│   ├── scripts/            # 工具脚本
│   │   ├── init_db.py          # 数据库初始化脚本
│   │   ├── generate_test_data.py # 测试数据生成脚本
│   │   ├── check_routes.py     # 路由检查脚本
│   │   └── query_quota_records.py # 定额记录查询脚本
│   └── payroll.db          # 数据库文件（使用MySQL，无需本地文件）
├── frontend/               # 前端代码
│   ├── src/               # 源代码
│   │   ├── components/    # React组件 (Layout.tsx)
│   │   ├── pages/         # 页面组件 (混合: .jsx + .tsx)
│   │   ├── services/      # API服务 (api.ts)
│   │   ├── types/         # TypeScript类型定义
│   │   ├── App.tsx        # 应用组件 (TypeScript)
│   │   └── main.tsx       # 应用入口 (TypeScript)
│   ├── package.json       # 依赖配置
│   ├── tsconfig.json      # TypeScript配置
│   └── vite.config.js     # Vite配置
├── test/                  # 测试脚本和资源
│   ├── development/       # 开发测试脚本
│   │   ├── test_api.py        # API测试脚本
│   │   ├── test_login.js      # 前端登录测试
│   │   ├── test_user_management.js  # 用户管理测试
│   │   ├── test_worker_process_operations.js  # 工人工序操作测试
│   │   └── test_new_tables.js  # 新表测试
│   ├── docker_puppeteer/  # Docker Puppeteer测试
│   └── *.png              # 测试截图
├── Dockerfile             # Docker配置
├── nginx-https-production.conf # 生产环境HTTPS Nginx配置
├── CLOUD_DEPLOYMENT.md    # 云服务器部署指南
├── HTTPS_DEPLOYMENT_GUIDE.md # HTTPS部署指南
├── HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md # HTTPS部署分析与流程文档（最新）
├── SSH_Password_Less_Login_Guide.md # SSH免密登录指南
├── generate_ssl_cert.sh   # SSL证书生成脚本
├── fix_password_hash.py   # 密码哈希修复脚本
├── test_https_puppeteer.js # HTTPS自动化测试脚本
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

### 3. 工段类别管理
- 工段分类信息维护（如：精加工、装配喷漆、绕嵌排等）
- 工段编码和名称管理

### 4. 工序类别管理
- 工序分类信息维护
- 工序类别编码和名称管理

### 5. 电机型号管理
- 电机型号信息维护
- 电机型号名称和别名管理

### 6. 工序管理
- 工序信息维护
- 工序编码、名称和描述管理

### 7. 定额管理
- 工序定额设置（关联工序、工段、工序类别、电机型号）
- 单价和生效日期管理
- 定额历史记录

### 8. 工资记录
- 工人工作记录录入（数量、日期）
- 工资自动计算（数量 × 单价）
- 按日期统计和查询

### 9. 报表功能
- 工人工资报表生成
- 工序工作量报表
- 工资汇总报表
- 数据导出功能

### 10. 统计功能
- 系统数据统计（用户数、工人数、工序数等）
- 工序定额统计
- 工人工资统计
- 生产效率分析

## 安全配置

### 🔐 数据库凭证安全最佳实践

系统已实现安全的数据库凭证管理，遵循以下最佳实践：

1. **系统环境变量**：敏感信息存储在系统环境变量中，不硬编码在代码中
2. **环境变量文件**：使用 `~/shared/jianglei/payroll/env_local.sh` 集中管理环境变量
3. **Git忽略**：`.env` 文件已添加到 `.gitignore`，防止敏感信息泄露
4. **Docker安全**：Docker容器支持运行时环境变量注入

### 环境变量配置

系统使用系统环境变量进行配置，不再依赖 `.env` 文件。

#### 设置环境变量（必需）
在启动应用之前，必须先设置环境变量。

**本地开发：**
```bash
source ~/shared/jianglei/payroll/env_local.sh
```

**云服务器部署：**
```bash
source ~/shared/jianglei/payroll/env_cloud.sh
```

**注意**：每次打开新的终端窗口都需要重新执行此命令。

#### 必需的环境变量
确保以下环境变量已在系统中设置：

**后端变量：**
- `MYSQL_DB_URL` - MySQL数据库连接URL
- `SECRET_KEY` - JWT密钥
- `ALGORITHM` - JWT算法（默认：HS256）
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token过期时间（默认：30）

**前端变量（VITE_*）：**
- `VITE_API_BASE_URL` - 前端API基础URL（开发：`/api`，生产：`https://124.220.108.154/api`）
- `VITE_APP_ENV` - 应用环境（开发：`development`，生产：`production`）
- `VITE_ENABLE_HTTPS` - 是否启用HTTPS（仅生产环境）

#### Docker环境变量
运行Docker容器时传递环境变量：
```bash
docker run -d -p 8000:8000 \
  -e MYSQL_DB_URL="mysql+pymysql://username:password@host:port/database" \
  -e SECRET_KEY="your-secret-key" \
  payroll-system
```

### 验证环境配置
运行应用前，请确保环境变量已正确设置：
```bash
echo $MYSQL_DB_URL
echo $SECRET_KEY
```
如果以上命令返回空值，请先执行 `source ~/shared/jianglei/payroll/env_local.sh`。

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

5. 设置环境变量（必需）
```bash
source ~/shared/jianglei/payroll/env_local.sh
```

6. 初始化数据库
```bash
python scripts/init_db.py
```

7. 运行后端服务
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
   - description: 描述
   - created_at: 创建时间

4. **process_cat1** - 工段类别表
   - cat1_code: 工段编码
   - name: 工段名称
   - description: 工段描述
   - created_at: 创建时间

5. **process_cat2** - 工序类别表
   - cat2_code: 工序类别编码
   - name: 工序类别名称
   - description: 工序类别描述
   - created_at: 创建时间

6. **motor_models** - 电机型号表
   - name: 电机型号名称
   - aliases: 电机型号别名
   - description: 电机型号描述
   - created_at: 创建时间

7. **quotas** - 定额表
   - id: 定额ID
   - process_code: 工序编码
   - cat1_code: 工段编码
   - cat2_code: 工序类别编码
   - model_name: 电机型号名称
   - unit_price: 单价
   - effective_date: 生效日期
   - obsolete_date: 作废日期（默认值：9999-12-31，表示当前有效定额）
   - created_by: 创建人
   - created_at: 创建时间

8. **work_records** - 工作记录表
   - id: 记录ID
   - worker_code: 工号
   - quota_id: 定额ID
   - quantity: 数量
   - record_date: 记录日期（YYYY-MM-DD）
   - created_by: 创建人
   - created_at: 创建时间

9. **v_salary_records** - 工资记录视图
   - id: 记录ID
   - worker_code: 工号
   - quota_id: 定额ID
   - quantity: 数量
   - unit_price: 单价
   - amount: 金额（自动计算：quantity × unit_price）
   - record_date: 记录日期
   - created_by: 创建人
   - created_at: 创建时间
   - model_display: 电机型号显示
   - cat1_display: 工段类别显示
   - cat2_display: 工序类别显示
   - process_display: 工序显示

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

- **TypeScript架构**：核心基础设施使用TypeScript (`App.tsx`, `Layout.tsx`, `Login.tsx`, `api.ts`)
- **混合页面**：页面组件采用渐进式迁移策略（当前为JavaScript，未来迁移到TypeScript）
- **新增页面**：在 `frontend/src/pages/` 目录下创建新的页面组件（建议使用`.tsx`）
- **新增组件**：在 `frontend/src/components/` 目录下创建新的组件（建议使用`.tsx`）
- **API调用**：通过 `frontend/src/services/api.ts` 封装的API方法调用后端接口
- **类型定义**：在 `frontend/src/types/` 目录下维护TypeScript类型定义

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
系统已配置支持云服务器HTTPS部署，请参考最新的部署文档。

#### 推荐部署流程
参考 [HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md](HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md) 文件中的"Robust HTTPS Deployment Procedure"章节，包含完整的准备、数据库准备、Docker部署、验证和回滚步骤。

#### 详细部署指南
- **CLOUD_DEPLOYMENT.md**: 基础云服务器部署指南（已更新）
- **HTTPS_DEPLOYMENT_GUIDE.md**: HTTPS部署指南（已更新）
- **HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md**: 详细的HTTPS部署分析与流程文档（最新）

#### 关键文件
- `nginx-https-production.conf`: 生产环境Nginx HTTPS配置
- `generate_ssl_cert.sh`: SSL证书生成脚本
- `fix_password_hash.py`: 密码哈希修复脚本（如遇登录问题）
- `test_https_puppeteer.js`: HTTPS自动化测试脚本（部署验证）

### Docker部署架构说明
系统采用双容器架构，分别运行后端应用和Nginx反向代理：

#### 1. 后端容器 (payroll-backend)
- **镜像构建**：使用项目根目录的 `Dockerfile` 构建
- **基础镜像**：`python:3.10`
- **包含内容**：
  - Python后端应用代码
  - 前端构建的静态文件 (`frontend/dist/`)
  - 系统依赖和Python包
- **运行命令**：
  ```bash
  docker build -t payroll-backend -f Dockerfile .
  docker run -d --name payroll-backend -p 8000:8000 payroll-backend
  ```

#### 2. Nginx容器 (payroll-nginx)
- **镜像来源**：直接使用官方 `nginx:alpine` 镜像，**无需自定义Dockerfile**
- **配置方式**：运行时挂载配置文件
- **创建命令**：
  ```bash
  docker run -d --name payroll-nginx \
    -p 80:80 -p 443:443 \
    -v /path/to/nginx-https-production.conf:/etc/nginx/conf.d/default.conf:ro \
    -v /path/to/ssl:/app/ssl:ro \
    -v /path/to/frontend-dist:/app/frontend/dist:ro \
    nginx:alpine
  ```

#### 架构优势
1. **分离关注点**：后端和Nginx独立容器，便于维护和扩展
2. **配置灵活**：Nginx配置可随时修改，无需重新构建镜像
3. **轻量级**：使用Alpine镜像，资源占用少
4. **官方维护**：Nginx镜像由Docker官方维护，安全更新及时

#### 容器间通信
```
用户请求 → Nginx容器 (80/443) → 后端容器 (8000) → 数据库
         ↑                    ↑
     SSL终止             反向代理
```

#### 配置文件说明
- `nginx-https-production.conf`：生产环境HTTPS配置
  - HTTP自动重定向到HTTPS
  - 静态文件服务 (`/app/frontend/dist`)
  - API反向代理 (`/api/` → `http://172.17.0.1:8000`)
  - SSL证书配置

#### 数据持久化
- **数据库**：MySQL（通过环境变量 `MYSQL_DB_URL` 配置）
- **配置文件**：Nginx配置、SSL证书、前端文件均通过卷挂载
- **优势**：数据在容器重启后不会丢失，配置可随时更新

## 测试

项目包含测试脚本，位于 `test/` 目录下。运行测试以确保功能正常：

```bash
cd test/development
# 运行API测试
python test_api.py
# 运行前端测试
node test_login.js
```

## 快速开始

### 本地开发
```bash
# 克隆代码
git clone https://gitee.com/richardjl/payroll-system.git
cd payroll-system

# 设置环境变量（必需）
source ~/shared/jianglei/payroll/env_local.sh

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
请参考最新的HTTPS部署文档 [HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md](HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md) 中的完整步骤。

简要步骤：
```bash
# 登录云服务器
ssh ubuntu@124.220.108.154

# 克隆代码
git clone https://gitee.com/richardjl/payroll-system.git
cd payroll-system

# 生成SSL证书
./generate_ssl_cert.sh

# 准备前端环境（使用系统环境变量）
source ~/shared/jianglei/payroll/env_cloud.sh

# 构建前端
cd frontend
npm install
npm run build
cd ..

# 部署（详细命令请参考文档）
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
