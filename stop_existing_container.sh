#!/bin/bash
# 停止现有Docker容器脚本

echo "=== 停止现有Docker容器 ==="
echo ""

# 检查Docker是否运行
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装"
    exit 1
fi

# 检查Docker权限
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker权限不足，尝试使用sudo"
    DOCKER_CMD="sudo docker"
else
    DOCKER_CMD="docker"
fi

echo "1. 查看正在运行的容器..."
$DOCKER_CMD ps

echo ""
echo "2. 停止payroll相关容器..."

# 停止所有payroll相关容器
CONTAINERS=$($DOCKER_CMD ps -a --filter "name=payroll" --format "{{.Names}}")

if [ -z "$CONTAINERS" ]; then
    echo "✅ 未找到payroll相关容器"
else
    echo "找到以下容器:"
    echo "$CONTAINERS"
    echo ""
    
    for CONTAINER in $CONTAINERS; do
        echo "停止容器: $CONTAINER"
        $DOCKER_CMD stop $CONTAINER 2>/dev/null && echo "✅ 已停止" || echo "❌ 停止失败"
        
        echo "删除容器: $CONTAINER"
        $DOCKER_CMD rm $CONTAINER 2>/dev/null && echo "✅ 已删除" || echo "❌ 删除失败"
        echo ""
    done
fi

echo "3. 清理Docker资源..."
echo "删除未使用的镜像..."
$DOCKER_CMD image prune -f 2>/dev/null || true

echo "删除未使用的容器..."
$DOCKER_CMD container prune -f 2>/dev/null || true

echo "删除未使用的网络..."
$DOCKER_CMD network prune -f 2>/dev/null || true

echo ""
echo "4. 验证清理结果..."
echo "当前运行的容器:"
$DOCKER_CMD ps

echo ""
echo "所有容器（包括已停止的）:"
$DOCKER_CMD ps -a --filter "name=payroll"

echo ""
echo "=== 清理完成 ==="
echo "现在可以运行部署脚本:"
echo "./deploy_on_cloud.sh"
echo ""
echo "或使用sudo运行:"
echo "sudo ./deploy_on_cloud.sh"
