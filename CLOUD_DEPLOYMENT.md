# 云服务器部署指南

## 服务器信息
- IP地址: 124.220.108.154
- SSH登录: 免密码登录已配置

## 环境要求
- Docker
- 支持HTTPS部署（使用Nginx反向代理）

## 部署概述
当前系统采用双容器架构：
1. **后端容器** (payroll-backend): 运行FastAPI应用，端口8000
2. **Nginx容器** (payroll-nginx): 提供HTTPS反向代理，端口80/443

## 推荐部署流程
完整的HTTPS部署流程请参考最新文档：[HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md](HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md)

### 简要步骤

#### 1. 准备环境
```bash
# 克隆代码
git clone https://gitee.com/richardjl/payroll-system.git
cd payroll-system

# 生成SSL证书
./generate_ssl_cert.sh  # 创建ssl/cert.pem和ssl/key.pem

# 准备前端环境
cat > frontend/.env << 'EOF'
VITE_API_BASE_URL=/api
VITE_APP_ENV=production
VITE_ENABLE_HTTPS=true
EOF

# 构建前端
cd frontend
npm install
npm run build
cd ..
```

#### 2. 数据库准备
```bash
# 确保数据库有正确的密码哈希格式（如遇登录问题）
python3 fix_password_hash.py

# 验证测试用户
sqlite3 payroll.db "SELECT username, role FROM users WHERE username='test';"
# 应返回: test|admin
```

#### 3. Docker部署
```bash
# 构建后端镜像
docker build -t payroll-backend -f Dockerfile .

# 运行后端容器
docker run -d --name payroll-backend \
  -p 8000:8000 \
  -v $(pwd)/payroll.db:/app/payroll.db \
  payroll-backend

# 运行Nginx容器
docker run -d --name payroll-nginx \
  -p 80:80 -p 443:443 \
  -v $(pwd)/nginx-https-production.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/ssl:/app/ssl:ro \
  -v $(pwd)/frontend/dist:/app/frontend/dist:ro \
  nginx:alpine
```

## 环境配置

### 前端环境变量
- 开发环境 (`frontend/.env`): `VITE_API_BASE_URL=/api`
- 生产环境 (`frontend/.env`): `VITE_API_BASE_URL=/api` (相对路径，由Nginx代理)

### 后端环境变量
- 数据库: SQLite (`payroll.db`)
- JWT密钥: 通过环境变量 `SECRET_KEY` 设置

## 测试验证

### 1. 健康检查
```bash
# HTTPS健康检查（跳过证书验证）
curl -k https://124.220.108.154/api/health
# 预期: {"status":"healthy","timestamp":...}
```

### 2. 登录测试
```bash
curl -k -X POST https://124.220.108.154/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
# 预期: JWT令牌响应
```

### 3. 前端访问测试
访问: `https://124.220.108.154`

### 4. 自动化测试
```bash
cd test
npm install puppeteer
node test_https_puppeteer.js
# 预期: ✅ HTTPS登录测试成功
```

## 维护操作

### 查看日志
```bash
# Nginx日志
docker logs payroll-nginx

# 后端日志
docker logs payroll-backend

# 实时日志
docker logs -f payroll-backend
```

### 更新应用
```bash
# 拉取最新代码
git pull

# 重新构建前端
cd frontend && npm run build && cd ..

# 重新构建后端镜像
docker build -t payroll-backend -f Dockerfile .

# 重启容器
docker restart payroll-backend
docker restart payroll-nginx
```

### 备份数据库
```bash
# 备份SQLite数据库
cp payroll.db payroll.db.backup.$(date +%Y%m%d)

# 从容器中备份
docker cp payroll-backend:/app/payroll.db ./backup/
```

### 监控
```bash
# 容器状态
docker ps

# 资源使用
docker stats

# 进程检查
docker exec payroll-backend ps aux
```

## 故障排除

### 常见问题

1. **Nginx容器启动失败**
   ```bash
   # 检查配置语法
   docker exec payroll-nginx nginx -t
   
   # 查看错误日志
   docker logs payroll-nginx
   ```

2. **后端连接失败**
   ```bash
   # 检查后端是否运行
   docker ps | grep payroll-backend
   
   # 检查后端日志
   docker logs payroll-backend
   
   # 测试内部连接
   curl http://localhost:8000/api/health
   ```

3. **密码哈希问题**
   ```bash
   # 运行密码哈希修复脚本
   python3 fix_password_hash.py
   
   # 重启后端容器
   docker restart payroll-backend
   ```

4. **SSL证书问题**
   ```bash
   # 重新生成证书
   ./generate_ssl_cert.sh
   
   # 重启Nginx
   docker restart payroll-nginx
   ```

5. **前端API连接失败**
   - 检查前端构建配置 `frontend/.env`
   - 确保 `VITE_API_BASE_URL=/api`
   - 重新构建前端 `cd frontend && npm run build`

### 日志分析
```bash
# 查看最近错误
docker logs payroll-nginx --tail 100 | grep error
docker logs payroll-backend --tail 100 | grep error

# 访问日志
docker exec payroll-nginx tail -f /var/log/nginx/access.log
```

## 安全建议

1. **HTTPS配置**
   - 生产环境建议使用Let's Encrypt证书替换自签名证书
   - 配置HTTP到HTTPS自动重定向

2. **访问控制**
   - 配置防火墙，仅开放必要端口 (80, 443, 22)
   - 使用强密码和定期更换JWT密钥

3. **数据安全**
   - 定期备份数据库
   - 监控容器资源使用，防止资源耗尽

4. **更新维护**
   - 定期更新Docker基础镜像
   - 监控SSL证书过期时间

## 扩展阅读
- [HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md](HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md) - 详细的HTTPS部署分析与流程
- [HTTPS_DEPLOYMENT_GUIDE.md](HTTPS_DEPLOYMENT_GUIDE.md) - HTTPS部署指南（部分内容已更新）
- [SSH_Password_Less_Login_Guide.md](SSH_Password_Less_Login_Guide.md) - SSH免密登录配置指南

## 联系方式
如有部署问题，请参考最新文档或联系系统管理员。
