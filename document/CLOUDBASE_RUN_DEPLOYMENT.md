# 腾讯云云托管 (CloudBase Run) 部署指南

## 概述

本文档介绍如何将工资管理系统部署到腾讯云云托管 (CloudBase Run)。云托管是腾讯云的容器托管服务 (CaaS)，相比云函数 (SCF)，更适合部署完整的Web应用程序。

## 为什么选择云托管？

| 对比项 | 云函数 (SCF) | 云托管 (CloudBase Run) | 本项目需求 |
|-------|-------------|----------------------|-----------|
| 编程模型 | 函数格式 | 任意容器 | ✅ 容器更合适 |
| 长连接 | ❌ 不支持 | ✅ 支持 | ✅ 需要数据库长连接 |
| 数据库连接池 | ❌ 每次调用新建连接 | ✅ 保持长连接 | ✅ 提高性能 |
| 内存限制 | 有 | 更灵活 | ✅ 需要连接池 |
| 启动时间 | 秒级 | 秒级 | 相同 |
| 适合场景 | 事件驱动 | Web应用/API | ✅ Web应用 |

## 架构图

```mermaid
graph TB
    subgraph 用户访问层
        U[用户浏览器] --> H[HTTPS请求]
    end
    
    subgraph 腾讯云基础设施
        D[自定义域名] --> LB[负载均衡器]
        LB --> CR[CloudBase Run]
        
        subgraph CR[云托管容器]
            NG[Nginx反向代理] --> API[FastAPI后端]
            NG --> FE[静态前端文件]
        end
        
        CR --> VPC[私有网络VPC]
        VPC --> DB[(TencentDB MySQL)]
        CR --> CLS[CLS日志服务]
    end
    
    subgraph 开发者
        DEV[开发者] --> TCR[腾讯云镜像仓库TCR]
        TCR --> CR
    end
```

## 前置条件

### 1. 腾讯云账号准备

- [ ] 注册腾讯云账号
- [ ] 完成实名认证
- [ ] 开通云托管服务
- [ ] 开通腾讯云镜像仓库 (TCR)

### 2. 域名和证书准备

- [ ] 准备域名 (需ICP备案)
- [ ] 申请SSL证书 (腾讯云提供免费DV证书)

### 3. 数据库准备

- [ ] 创建TencentDB for MySQL实例
- [ ] 获取数据库连接信息
- [ ] 创建数据库和用户

### 4. 开发环境准备

```bash
# 确认Docker已安装
docker --version

# 确认腾讯云CLI已安装 (可选)
# npm install -g @cloudbase/cli
```

## 第一步：构建Docker镜像

### 1.1 构建镜像

```bash
# 进入项目根目录
cd /home/richard/shared/jianglei/trae/new_payroll

# 构建Docker镜像
docker build -t payroll:latest .

# 验证镜像
docker images | grep payroll
```

### 1.2 测试本地运行

```bash
# 临时运行测试 (不用于生产)
docker run -d \
  --name payroll-test \
  -p 8000:8000 \
  -e MYSQL_DB_URL="your_database_url" \
  -e SECRET_KEY="your_secret_key" \
  payroll:latest

# 检查日志
docker logs -f payroll-test

# 测试健康检查
curl http://localhost:8000/api/health

# 停止测试容器
docker stop payroll-test
docker rm payroll-test
```

## 第二步：推送镜像到TCR

### 2.1 登录TCR

```bash
# 登录腾讯云镜像仓库
docker login --username=<your-username> registry.ap-shanghai.tencentcr.com
```

### 2.2 标记和推送镜像

```bash
# 标记镜像
docker tag payroll:latest registry.ap-shanghai.tencentcr.com/<your-namespace>/payroll:v1.0.0

# 推送镜像
docker push registry.ap-shanghai.tencentcr.com/<your-namespace>/payroll:v1.0.0
```

## 第三步：创建云托管服务

### 3.1 登录腾讯云控制台

1. 打开 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 搜索并进入 **云开发 CloudBase** → **云托管**

### 3.2 创建服务

1. 点击 **创建服务**
2. 填写服务配置：

| 配置项 | 值 | 说明 |
|-------|-----|------|
| 服务名称 | `payroll-service` | 唯一标识 |
| 地域 | `ap-shanghai` | 选择最近的地域 |
| 计费模式 | `按量计费` | 弹性伸缩 |
| 协议 | `HTTP/HTTPS` | 支持HTTPS |

### 3.3 创建版本/部署

在服务页面点击 **创建版本**，配置：

| 配置项 | 值 | 说明 |
|-------|-----|------|
| 镜像地址 | `registry.ap-shanghai.tencentcr.com/<namespace>/payroll:v1.0.0` | 刚才推送的镜像 |
| 端口 | `8000` | 应用监听端口 |
| CPU | `0.5核` | 根据需求调整 |
| 内存 | `1GB` | 根据需求调整 |
| 最小实例数 | `0` | 空闲时缩容到0 |
| 最大实例数 | `10` | 根据流量上限 |

### 3.4 配置环境变量

在版本配置中添加环境变量：

```bash
# 数据库配置
MYSQL_DB_URL="mysql+pymysql://username:password@host:port/database"

# 安全配置
SECRET_KEY="your-secret-key-min-32-chars"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 日志配置
LOG_LEVEL="INFO"
CLOUDBASE_RUN="true"

# 前端配置
VITE_API_BASE_URL="/api"
```

### 3.5 配置VPC和网络

1. **VPC配置**：选择能够访问TencentDB的VPC
2. **子网配置**：选择对应子网
3. **安全组**：确保安全组允许云托管访问数据库端口 (3306)

## 第四步：配置自定义域名和HTTPS

### 4.1 添加自定义域名

1. 在云托管服务页面，点击 **访问配置**
2. 点击 **添加自定义域名**
3. 填写：
   - 域名：`payroll.yourdomain.com`
   - 协议：`HTTPS`

### 4.2 配置SSL证书

1. 在SSL证书控制台申请免费证书：
   - 进入 **SSL证书** 控制台
   - 点击 **申请免费证书**
   - 选择 **DV域名型证书**

2. 绑定证书到自定义域名：
   - 在云托管访问配置中选择证书
   - 或者上传已有的证书文件

### 4.3 配置DNS

在DNS服务商处添加CNAME记录：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| CNAME | payroll | service-xxxxx.tcb.cloud.tcb.cloud.tcb.cloud |

## 第五步：配置日志收集

### 5.1 启用CLS日志

1. 在云托管服务页面，点击 **日志配置**
2. 启用 **日志收集**
3. 选择或创建日志集和日志主题

### 5.2 日志格式

应用日志输出到stdout，格式如下：

```
2024-01-21 10:30:45 - app.main - INFO - 收到请求: GET /api/health
2024-01-21 10:30:45 - uvicorn.access - INFO - 127.0.0.1:12345 - "GET /api/health HTTP/1.1" 200
```

### 5.3 日志检索

在 [CLS控制台](https://console.cloud.tencent.com/cls) 可以：
- 检索特定时间范围的日志
- 按关键词过滤
- 设置告警规则

## 第六步：验证部署

### 6.1 健康检查

```bash
# 测试健康检查端点
curl https://payroll.yourdomain.com/api/health

# 预期响应
{"status": "healthy", "timestamp": 1705823445.123456}
```

### 6.2 登录测试

```bash
# 测试登录接口
curl -X POST https://payroll.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# 预期响应 (成功时)
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {...}
}
```

### 6.3 前端访问

在浏览器中访问 `https://payroll.yourdomain.com`，应该能看到登录页面。

## 更新部署

当代码更新时，执行以下步骤：

```bash
# 1. 重新构建镜像
docker build -t payroll:latest .

# 2. 标记新版本
docker tag payroll:latest registry.ap-shanghai.tencentcr.com/<namespace>/payroll:v1.1.0

# 3. 推送新版本
docker push registry.ap-shanghai.tencentcr.com/<namespace>/payroll:v1.1.0

# 4. 在云托管控制台创建新版本
# 使用新的镜像标签 v1.1.0

# 5. 验证新版本后，切换流量
```

## 监控和运维

### 7.1 监控指标

在云托管控制台可以查看：
- 请求量 (QPS)
- 响应时间 (P50/P95/P99)
- 错误率
- 实例数量
- CPU/内存使用率

### 7.2 自动伸缩

云托管支持基于流量的自动伸缩：

```yaml
最小实例数: 0
最大实例数: 10
伸缩阈值: CPU使用率 > 60%
```

### 7.3 日志告警

在CLS中设置日志告警：

```bash
# 示例：错误日志告警
告警规则: 包含 "ERROR" 的日志数量 > 10 条/5分钟
通知方式: 短信/邮件/Webhook
```

## 费用说明

### 8.1 计费项

| 计费项 | 单价 | 估算 |
|-------|------|------|
| 云托管计算 | 0.05-0.1元/核心/小时 | 50-100元/月 |
| TCR镜像存储 | 0.1元/GB/月 | <1元/月 |
| CLS日志 | 0.1元/GB/月 | 5-10元/月 |
| 域名 | 50-100元/年 | 50-100元/年 |
| TencentDB | 100-500元/月 | 根据配置 |

### 8.2 成本优化建议

1. **设置最小实例数为0**：空闲时自动缩容，节省费用
2. **选择合适的CPU/内存**：根据实际负载调整
3. **使用包年包月数据库**：长期运行更划算
4. **监控和优化**：定期查看使用情况，调整资源配置

## 故障排查

### 常见问题

#### 1. 容器启动失败

```bash
# 检查日志
# 在云托管控制台查看日志，或使用CLI:
tcb service logs --service payroll-service
```

#### 2. 数据库连接失败

- 检查VPC配置是否正确
- 检查安全组是否允许访问
- 验证MYSQL_DB_URL格式是否正确

#### 3. HTTPS访问失败

- 检查域名是否完成ICP备案
- 检查SSL证书是否有效
- 检查自定义域名配置是否正确

### 调试命令

```bash
# 本地测试容器
docker run -it --rm \
  -e MYSQL_DB_URL="your_url" \
  -e SECRET_KEY="your_key" \
  payroll:latest \
  /bin/bash

# 在容器内检查环境
env | grep -E "(MYSQL|SECRET|ALGORITHM)"
python -c "from app.main import app; print('Import successful')"
```

## 最佳实践

1. **版本管理**：使用语义化版本号 (v1.0.0, v1.1.0)
2. **环境隔离**：开发、测试、生产使用不同的云托管服务
3. **安全加固**：
   - 使用环境变量管理敏感信息
   - 定期轮换SECRET_KEY
   - 限制数据库访问IP
4. **监控告警**：设置关键指标的告警规则
5. **备份恢复**：定期备份数据库，测试恢复流程

## 相关文档

- [腾讯云云托管文档](https://cloud.tencent.com/document/product/1243)
- [腾讯云TCR文档](https://cloud.tencent.com/document/product/1141)
- [腾讯云CLS文档](https://cloud.tencent.com/document/product/614)
- [TencentDB for MySQL文档](https://cloud.tencent.com/document/product/236)

## 快速参考

### 环境变量清单

| 变量名 | 必填 | 默认值 | 说明 |
|-------|------|-------|------|
| MYSQL_DB_URL | ✅ | - | 数据库连接字符串 |
| SECRET_KEY | ✅ | - | JWT密钥 (至少32字符) |
| ALGORITHM | ❌ | HS256 | JWT算法 |
| ACCESS_TOKEN_EXPIRE_MINUTES | ❌ | 30 | Token过期时间 |
| LOG_LEVEL | ❌ | INFO | 日志级别 |
| CLOUDBASE_RUN | ❌ | false | 是否CloudBase Run环境 |
| VITE_API_BASE_URL | ❌ | /api | 前端API地址 |
| DOMAIN_NAME | ❌ | payroll.example.com | 域名 (用于nginx配置) |

### 常用命令

```bash
# 构建镜像
docker build -t payroll:latest .

# 本地测试
docker run -d -p 8000:8000 -e MYSQL_DB_URL="..." payroll:latest

# 推送镜像
docker tag payroll:latest registry.ap-shanghai.tencentcr.com/ns/payroll:v1.0.0
docker push registry.ap-shanghai.tencentcr.com/ns/payroll:v1.0.0
```
