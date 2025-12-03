#!/bin/bash
# 云服务器更新脚本

echo "=== 更新云服务器代码 ==="
echo ""

# 检查是否在payroll-system目录
if [ ! -f "deploy_on_cloud.sh" ]; then
    echo "❌ 不在payroll-system目录"
    echo "请先进入目录: cd payroll-system"
    exit 1
fi

echo "1. 备份本地修改..."
if git diff --quiet; then
    echo "✅ 无本地修改"
else
    echo "⚠️  检测到本地修改，创建备份..."
    cp deploy_on_cloud.sh deploy_on_cloud.sh.backup
    echo "✅ 备份创建: deploy_on_cloud.sh.backup"
fi

echo ""

echo "2. 重置本地修改..."
git checkout -- deploy_on_cloud.sh
git checkout -- docker-compose.yml 2>/dev/null || true
echo "✅ 本地修改已重置"

echo ""

echo "3. 拉取最新代码..."
git pull
if [ $? -eq 0 ]; then
    echo "✅ 代码更新成功"
else
    echo "❌ 代码更新失败"
    echo "可以尝试: git stash && git pull"
    exit 1
fi

echo ""

echo "4. 更新脚本权限..."
chmod +x deploy_on_cloud.sh fix_docker_permissions.sh
echo "✅ 脚本权限更新完成"

echo ""

echo "5. 运行Docker权限修复..."
./fix_docker_permissions.sh

echo ""
echo "=== 更新完成 ==="
echo "现在可以运行部署脚本:"
echo "./deploy_on_cloud.sh"
echo ""
echo "或使用sudo运行:"
echo "sudo ./deploy_on_cloud.sh"
