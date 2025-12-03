#!/bin/bash
# 云服务器一键部署脚本

echo "=== 工厂定额和计件工资管理系统云服务器部署 ==="
echo "服务器IP: 124.220.108.154"
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
    echo "⚠️  Docker Compose未安装，将使用纯Docker部署"
    USE_COMPOSE=false
else
    echo "✅ Docker Compose已安装"
    USE_COMPOSE=true
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

# 构建前端
echo "2. 构建前端..."
if [ ! -d "frontend/node_modules" ]; then
    echo "安装前端依赖..."
    cd frontend
    npm install
    cd ..
fi

echo "使用云环境配置..."
cp frontend/.env.cloud frontend/.env
cd frontend
npm run build
cd ..

echo "✅ 前端构建完成"
echo ""

# 配置环境
echo "3. 配置环境..."
cp .env.cloud .env
echo "✅ 环境配置完成"
echo ""

# 部署应用
echo "4. 部署应用..."
if [ "$USE_COMPOSE" = true ]; then
    echo "使用Docker Compose部署..."
    docker-compose down 2>/dev/null || true
    docker-compose build
    docker-compose up -d
else
    echo "使用Docker部署..."
    docker stop payroll-system 2>/dev/null || true
    docker rm payroll-system 2>/dev/null || true
    docker build -t payroll-system:latest .
    docker run -d -p 80:8000 -v $(pwd)/payroll.db:/app/payroll.db --name payroll-system payroll-system:latest
fi

echo "✅ 应用部署完成"
echo ""

# 等待应用启动
echo "5. 等待应用启动..."
sleep 10

# 测试部署
echo "6. 测试部署..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ 健康检查通过"
else
    echo "❌ 健康检查失败，请查看日志: docker logs payroll-system"
    exit 1
fi

echo ""
echo "=== 部署完成 ==="
echo "✅ 应用已成功部署到云服务器"
echo ""
echo "访问地址: http://124.220.108.154"
echo "API文档: http://124.220.108.154/docs"
echo ""
echo "管理命令:"
echo "查看日志: docker logs payroll-system"
echo "重启应用: docker-compose restart (或 docker restart payroll-system)"
echo "停止应用: docker-compose down (或 docker stop payroll-system)"
echo ""
echo "首次登录使用以下账号:"
echo "用户名: test"
echo "密码: test123"
