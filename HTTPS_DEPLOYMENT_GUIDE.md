# HTTPS部署指南

## 概述
本指南介绍如何将工厂定额和计件工资管理系统从HTTP升级到HTTPS访问。

## 当前状态
- 服务器IP: 124.220.108.154
- 当前访问地址: http://124.220.108.154
- 目标访问地址: https://124.220.108.154

## 解决方案
提供了两种HTTPS部署方案：

### 方案一：使用自签名证书（快速部署）
适用于测试环境或内部使用，浏览器会有安全警告。

#### 部署步骤：
1. **登录到云服务器**
   ```bash
   ssh root@124.220.108.154
   ```

2. **运行HTTPS一键部署脚本**
   ```bash
   # 给脚本执行权限
   chmod +x deploy_https_on_cloud.sh
   
   # 运行部署脚本
   ./deploy_https_on_cloud.sh
   ```

3. **验证部署**
   - 访问 http://124.220.108.154 (应自动重定向到HTTPS)
   - 访问 https://124.220.108.154
   - 注意：首次访问需要接受自签名证书警告

#### 文件说明：
- `nginx.conf` - Nginx反向代理配置
- `docker-compose-https.yml` - HTTPS Docker Compose配置
- `generate_ssl_cert.sh` - SSL证书生成脚本
- `deploy_https_on_cloud.sh` - 一键部署脚本
- `frontend/.env.cloud` - 前端HTTPS API配置

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
   修改 `nginx.conf` 中的证书路径：
   ```nginx
   ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
   ```

4. **部署应用**
   ```bash
   # 使用更新后的配置部署
   docker-compose -f docker-compose-https.yml up -d
   ```

## 架构说明

### HTTPS部署架构
```
用户浏览器
    ↓ HTTPS (443)
Nginx反向代理 (payroll-nginx容器)
    ↓ HTTP (内部网络)
主应用 (payroll-system容器:8000)
```

### 端口映射
- 外部80端口 → Nginx容器80端口 (HTTP重定向)
- 外部443端口 → Nginx容器443端口 (HTTPS)
- 内部8000端口 → 主应用8000端口

## 测试验证

### 1. 健康检查
```bash
# HTTP重定向测试
curl -v http://124.220.108.154/api/health

# HTTPS连接测试（跳过证书验证）
curl -k https://124.220.108.154/api/health
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
```

## 维护操作

### 查看日志
```bash
# 查看Nginx日志
docker logs payroll-nginx

# 查看应用日志
docker logs payroll-system

# 查看实时日志
docker logs -f payroll-nginx
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose-https.yml restart

# 仅重启Nginx
docker restart payroll-nginx

# 仅重启应用
docker restart payroll-system
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
docker-compose -f docker-compose-https.yml down

# 启动HTTP服务
docker-compose -f docker-compose.yml up -d
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

4. **应用连接失败**
   ```bash
   # 检查应用是否运行
   docker ps | grep payroll-system
   
   # 检查应用日志
   docker logs payroll-system
   ```

5. **前端API连接失败**
   - 检查前端构建配置 `frontend/.env.cloud`
   - 确保 `VITE_API_BASE_URL=https://124.220.108.154/api`
   - 重新构建前端 `cd frontend && npm run build`

### 日志分析
```bash
# 查看最近错误
docker logs payroll-nginx --tail 100 | grep error

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

## 联系方式
如有问题，请参考原始部署文档或联系系统管理员。
