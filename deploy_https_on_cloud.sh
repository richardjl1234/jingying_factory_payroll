#!/bin/bash
# 云服务器HTTPS一键部署脚本

echo "=== 工厂定额和计件工资管理系统HTTPS云服务器部署 ==="
echo "服务器IP: 124.220.108.154"
echo "协议: HTTPS"
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    echo "安装命令: sudo apt-get update && sudo apt-get install docker.io"
    exit 1
fi

echo "✅ Docker已安装"

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  Docker Compose未安装，将安装Docker Compose"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Docker Compose已安装"

# 检查OpenSSL是否安装
if ! command -v openssl &> /dev/null; then
    echo "⚠️  OpenSSL未安装，正在安装..."
    sudo apt-get update && sudo apt-get install -y openssl
fi

echo "✅ OpenSSL已安装"

# 检查Docker权限
echo "检查Docker权限..."
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  当前用户无Docker权限，尝试使用sudo或添加用户到docker组"
    echo "可以运行: sudo usermod -aG docker $USER && newgrp docker"
    echo "或使用sudo运行此脚本"
    DOCKER_CMD="sudo docker"
    COMPOSE_CMD="sudo docker-compose"
else
    DOCKER_CMD="docker"
    COMPOSE_CMD="docker-compose"
fi

echo ""

# 克隆代码
echo "1. 克隆代码..."
if [ -d "payroll-system" ]; then
    echo "⚠️  目录已存在，跳过克隆"
    cd payroll-system
    git pull
else
    git clone https://gitee.com/richardjl/payroll-system.git
    cd payroll-system
fi

echo "✅ 代码获取完成"
echo ""

# 生成SSL证书
echo "2. 生成SSL证书..."
if [ -f "generate_ssl_cert.sh" ]; then
    chmod +x generate_ssl_cert.sh
    ./generate_ssl_cert.sh
else
    echo "❌ SSL证书生成脚本不存在"
    exit 1
fi

echo "✅ SSL证书生成完成"
echo ""

# 构建前端
echo "3. 构建前端..."
if [ ! -d "frontend/node_modules" ]; then
    echo "安装前端依赖..."
    cd frontend
    npm install
    cd ..
fi

echo "使用HTTPS云环境配置..."
cp frontend/.env.cloud frontend/.env
cd frontend
npm run build
cd ..

echo "✅ 前端构建完成"
echo ""

# 配置环境
echo "4. 配置环境..."
cp .env.cloud.https .env
echo "✅ 环境配置完成"
echo ""

# 停止现有容器
echo "5. 停止现有容器..."
$COMPOSE_CMD -f docker-compose.yml down 2>/dev/null || true
$DOCKER_CMD stop payroll-system payroll-nginx 2>/dev/null || true
$DOCKER_CMD rm payroll-system payroll-nginx 2>/dev/null || true

echo "✅ 现有容器已停止"
echo ""

# 部署HTTPS应用
echo "6. 部署HTTPS应用..."
echo "使用Docker Compose部署HTTPS版本..."
$COMPOSE_CMD -f docker-compose-https.yml down 2>/dev/null || true
$COMPOSE_CMD -f docker-compose-https.yml build
$COMPOSE_CMD -f docker-compose-https.yml up -d

echo "✅ HTTPS应用部署完成"
echo ""

# 等待应用启动
echo "7. 等待应用启动..."
sleep 15

# 测试HTTPS部署
echo "8. 测试HTTPS部署..."
echo "测试HTTP重定向到HTTPS..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ HTTP重定向测试通过"
else
    echo "⚠️  HTTP重定向可能有问题"
fi

echo "测试HTTPS连接..."
if curl -k -f https://localhost/api/health > /dev/null 2>&1; then
    echo "✅ HTTPS连接测试通过"
else
    echo "❌ HTTPS连接测试失败，请查看日志: $DOCKER_CMD logs payroll-nginx"
    exit 1
fi

echo ""
echo "=== HTTPS部署完成 ==="
echo "✅ 应用已成功部署到云服务器并启用HTTPS"
echo ""
echo "访问地址:"
echo "HTTP (自动重定向到HTTPS): http://124.220.108.154"
echo "HTTPS: https://124.220.108.154"
echo "API文档: https://124.220.108.154/docs"
echo ""
echo "注意: 由于使用自签名证书，浏览器会显示安全警告"
echo "可以点击'高级' -> '继续前往'来访问网站"
echo ""
echo "管理命令:"
echo "查看Nginx日志: $DOCKER_CMD logs payroll-nginx"
echo "查看应用日志: $DOCKER_CMD logs payroll-system"
echo "重启应用: $COMPOSE_CMD -f docker-compose-https.yml restart"
echo "停止应用: $COMPOSE_CMD -f docker-compose-https.yml down"
echo ""
echo "首次登录使用以下账号:"
echo "用户名: test"
echo "密码: test123"
echo ""
echo "如需更新证书，请运行: ./generate_ssl_cert.sh"
echo "然后重启Nginx: $DOCKER_CMD restart payroll-nginx"
