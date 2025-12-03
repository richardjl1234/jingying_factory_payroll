# 云服务器部署指南

## 服务器信息
- IP地址: 124.220.108.154
- SSH登录: 免密码登录已配置

## 环境要求
- Docker
- Docker Compose (可选)

## 部署步骤

### 1. 准备部署文件
将以下文件上传到云服务器：
- `Dockerfile`
- `backend/` 目录
- `frontend/dist/` 目录 (使用云环境构建)
- `.env.cloud` (重命名为 `.env`)
- `docker-compose.yml` (如果使用)

### 2. 构建前端 (云环境)
在本地构建前端用于云环境：
```bash
# 使用云环境配置
cp frontend/.env.cloud frontend/.env
cd frontend
npm run build
```

或者使用提供的脚本：
```bash
chmod +x build_frontend_cloud.sh
./build_frontend_cloud.sh
```

### 3. 上传文件到云服务器
```bash
# 使用scp上传文件
scp -r Dockerfile backend frontend/dist .env.cloud user@124.220.108.154:/path/to/app/
```

### 4. 在云服务器上部署
```bash
# 登录服务器
ssh user@124.220.108.154

# 进入应用目录
cd /path/to/app

# 重命名环境文件
mv .env.cloud .env

# 构建Docker镜像
docker build -t payroll-system:latest .

# 运行容器
docker run -d -p 80:8000 -v /path/to/data/payroll.db:/app/payroll.db --name payroll-system payroll-system:latest
```

### 5. 使用Docker Compose (推荐)
创建 `docker-compose.yml`:
```yaml
version: '3.8'

services:
  payroll:
    build: .
    container_name: payroll-system
    ports:
      - "80:8000"
    volumes:
      - ./data:/app/data
      - ./payroll.db:/app/payroll.db
    environment:
      - DATABASE_URL=sqlite:///./payroll.db
    restart: unless-stopped
```

运行:
```bash
docker-compose up -d
```

## 环境配置

### 本地开发环境
- 前端API基础URL: `http://localhost:8000/api`
- 数据库: SQLite本地文件
- 日志级别: DEBUG

### 云生产环境
- 前端API基础URL: `http://124.220.108.154/api`
- 数据库: SQLite持久化存储
- 日志级别: INFO (可在.env中调整)

## 测试验证

### 1. API测试
```bash
# 测试登录API
curl -X POST http://124.220.108.154/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test123"}'
```

### 2. 前端测试
访问: `http://124.220.108.154`

### 3. 使用测试脚本
```bash
# 修改测试脚本使用云服务器IP
export TEST_BASE_URL=http://124.220.108.154
python test/test_local_api.py
```

## 日志查看
```bash
# 查看容器日志
docker logs payroll-system

# 查看实时日志
docker logs -f payroll-system

# 查看特定时间段的日志
docker logs --since 1h payroll-system
```

## 维护操作

### 更新应用
```bash
# 拉取最新代码
git pull

# 重新构建前端
cd frontend && npm run build

# 重新构建Docker镜像
docker build -t payroll-system:latest .

# 重启容器
docker-compose down
docker-compose up -d
```

### 备份数据库
```bash
# 备份SQLite数据库
cp payroll.db payroll.db.backup.$(date +%Y%m%d)

# 或使用Docker卷备份
docker cp payroll-system:/app/payroll.db ./backup/
```

### 监控
```bash
# 查看容器状态
docker ps

# 查看资源使用
docker stats

# 查看日志文件
docker exec payroll-system tail -f /app/backend_debug_*.log
```

## 故障排除

### 常见问题
1. **端口冲突**: 确保80端口未被占用
2. **数据库权限**: 确保数据库文件可写
3. **前端API连接失败**: 检查VITE_API_BASE_URL配置
4. **容器启动失败**: 查看Docker日志 `docker logs payroll-system`

### 日志级别调整
修改 `.env` 文件中的日志配置，或通过环境变量覆盖：
```bash
docker run -e LOG_LEVEL=INFO ...
```

## 安全建议
1. 修改默认JWT密钥
2. 使用HTTPS (配置反向代理)
3. 定期备份数据库
4. 监控容器资源使用
5. 设置适当的防火墙规则
