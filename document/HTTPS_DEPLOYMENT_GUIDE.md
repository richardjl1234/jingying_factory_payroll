# HTTPS部署指南

## 概述
本指南介绍如何将工厂定额和计件工资管理系统部署为HTTPS访问。基于最新的部署经验，提供了标准化的HTTPS部署流程。

## 当前状态
- 服务器IP: 124.220.108.154
- 当前访问地址: https://124.220.108.154 (HTTPS已部署)
- HTTP自动重定向到HTTPS

## 部署方案

### 方案一：使用自签名证书（测试/内部环境）
适用于测试环境或内部使用，浏览器会有安全警告。

#### 部署步骤：
参考完整的部署流程文档：[HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md](HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md)

##### 关键步骤：
1. **生成SSL证书**
   ```bash
   ./generate_ssl_cert.sh  # 创建ssl/cert.pem和ssl/key.pem
   ```

2. **准备前端环境**
   ```bash
   cat > frontend/.env << 'EOF'
   VITE_API_BASE_URL=/api
   VITE_APP_ENV=production
   VITE_ENABLE_HTTPS=true
   EOF
   ```

3. **构建前端**
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

4. **数据库准备**（如遇登录问题）
   ```bash
   python3 fix_password_hash.py
   ```

5. **Docker部署**
   ```bash
   # 构建后端镜像
   docker build -t payroll-backend -f Dockerfile .
    
   # 运行后端容器（通过环境变量配置MySQL连接）
   docker run -d --name payroll-backend \
     -p 8000:8000 \
     -e MYSQL_DB_URL="mysql+pymysql://username:password@host:port/database" \
     payroll-backend
    
   # 运行Nginx容器
   docker run -d --name payroll-nginx \
     -p 80:80 -p 443:443 \
     -v $(pwd)/nginx-https-production.conf:/etc/nginx/conf.d/default.conf:ro \
     -v $(pwd)/ssl:/app/ssl:ro \
     -v $(pwd)/frontend/dist:/app/frontend/dist:ro \
     nginx:alpine
   ```

#### 文件说明：
- `nginx-https-production.conf` - 生产环境HTTPS Nginx配置
- `generate_ssl_cert.sh` - SSL证书生成脚本
- `fix_password_hash.py` - 密码哈希修复脚本（如遇登录问题）
- `test_https_puppeteer.js` - HTTPS自动化测试脚本

### 方案二：使用受信任的SSL证书（生产环境推荐）
适用于生产环境，需要域名和CA颁发的证书。

#### 步骤：
1. **获取域名和SSL证书**
   - 购买域名并解析到 124.220.108.154
   - 申请SSL证书（推荐使用Let's Encrypt免费证书）

2. **使用certbot获取证书**
   ```bash
   # 安装certbot
   sudo apt-get update
   sudo apt-get install certbot
    
   # 获取证书（需要域名）
   sudo certbot certonly --standalone -d your-domain.com
   ```

3. **更新Nginx配置**
   修改 `nginx-https-production.conf` 中的证书路径：
   ```nginx
   ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
   ```

4. **部署应用**
   使用与方案一相同的Docker命令，确保挂载正确的证书路径。

## 架构说明

### HTTPS部署架构
```
用户浏览器
    ↓ HTTPS (443)
Nginx反向代理 (payroll-nginx容器)
    ↓ HTTP (内部网络)
后端应用 (payroll-backend容器:8000)
    ↓
MySQL数据库（通过环境变量 MYSQL_DB_URL 配置）
```

### 端口映射
- 外部80端口 → Nginx容器80端口 (HTTP重定向到HTTPS)
- 外部443端口 → Nginx容器443端口 (HTTPS)
- 内部8000端口 → 后端应用8000端口

## 测试验证

### 1. 健康检查
```bash
# HTTP重定向测试
curl -v http://124.220.108.154/api/health

# HTTPS连接测试（跳过证书验证）
curl -k https://124.220.108.154/api/health
# 预期: {"status":"healthy","timestamp":...}
```

### 2. 浏览器测试
1. 打开浏览器访问 http://124.220.108.154
   - 应自动重定向到 https://124.220.108.154
   - 显示安全警告（自签名证书）
   - 点击"高级" → "继续前往"

2. 直接访问 https://124.220.108.154
   - 显示安全警告
   - 点击"高级" → "继续前往"

### 3. API测试
```bash
# 测试登录API
curl -k -X POST https://124.220.108.154/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test123"}'
# 预期: JWT令牌响应
```

### 4. 自动化测试（推荐）
```bash
cd test
npm install puppeteer
node test_https_puppeteer.js
# 预期: ✅ HTTPS登录测试成功
```

## 维护操作

### 查看日志
```bash
# 查看Nginx日志
docker logs payroll-nginx

# 查看后端日志
docker logs payroll-backend

# 查看实时日志
docker logs -f payroll-nginx
```

### 重启服务
```bash
# 重启所有服务
docker restart payroll-backend payroll-nginx

# 仅重启Nginx
docker restart payroll-nginx

# 仅重启后端
docker restart payroll-backend
```

### 更新证书
```bash
# 重新生成自签名证书
./generate_ssl_cert.sh

# 重启Nginx使新证书生效
docker restart payroll-nginx
```

### 回滚到HTTP
```bash
# 停止HTTPS服务
docker stop payroll-backend payroll-nginx
docker rm payroll-backend payroll-nginx

# 启动单容器HTTP服务（如需要，使用环境变量配置数据库）
docker build -t payroll-system .
docker run -d -p 80:8000 -e MYSQL_DB_URL="mysql+pymysql://username:password@host:port/database" --name payroll-system payroll-system
```

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :443
   netstat -tulpn | grep :80
    
   # 停止占用进程或修改端口
   ```

2. **证书问题**
   - 自签名证书：浏览器安全警告是正常的
   - 证书过期：重新生成证书 `./generate_ssl_cert.sh`
   - 证书路径错误：检查Nginx配置中的证书路径

3. **Nginx启动失败**
   ```bash
   # 检查Nginx配置
   docker exec payroll-nginx nginx -t
    
   # 查看错误日志
   docker logs payroll-nginx
   ```

4. **后端连接失败**
   ```bash
   # 检查后端是否运行
   docker ps | grep payroll-backend
    
   # 检查后端日志
   docker logs payroll-backend
    
   # 测试内部连接
   curl http://localhost:8000/api/health
   ```

5. **前端API连接失败**
   - 检查前端构建配置 `frontend/.env`
   - 确保 `VITE_API_BASE_URL=/api`（相对路径）
   - 重新构建前端 `cd frontend && npm run build`

6. **登录失败（密码哈希问题）**
   ```bash
   # 运行密码哈希修复脚本
   python3 fix_password_hash.py
    
   # 重启后端容器
   docker restart payroll-backend
   ```

### 日志分析
```bash
# 查看最近错误
docker logs payroll-nginx --tail 100 | grep error
docker logs payroll-backend --tail 100 | grep error

# 查看访问日志
docker exec payroll-nginx tail -f /var/log/nginx/access.log

# 查看错误日志
docker exec payroll-nginx tail -f /var/log/nginx/error.log
```

## 安全建议

1. **生产环境使用CA证书**
   - 自签名证书仅适用于测试环境
   - 生产环境应使用Let's Encrypt或商业CA证书

2. **定期更新证书**
   - 自签名证书有效期1年
   - Let's Encrypt证书有效期90天，设置自动续期

3. **防火墙配置**
   ```bash
   # 开放必要端口
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

4. **监控和告警**
   - 设置证书过期监控
   - 监控服务可用性
   - 设置访问日志分析

5. **访问控制**
   - 使用强密码和定期更换JWT密钥
   - 限制管理接口访问

## 扩展阅读
- [HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md](HTTPS_DEPLOYMENT_ANALYSIS_AND_PROCEDURE.md) - 详细的HTTPS部署分析与流程，包含所有遇到的问题和解决方案
- [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md) - 云服务器部署指南（已更新）
- [README.md](README.md) - 项目总体说明

## 联系方式
如有部署问题，请参考最新文档或联系系统管理员。
