#!/bin/bash
# 修复Docker权限脚本

echo "=== 修复Docker权限 ==="
echo ""

# 检查当前用户是否在docker组
if groups $USER | grep -q '\bdocker\b'; then
    echo "✅ 用户 $USER 已在docker组中"
else
    echo "⚠️  用户 $USER 不在docker组中"
    echo "添加用户到docker组..."
    sudo usermod -aG docker $USER
    echo "✅ 用户已添加到docker组"
    echo "需要重新登录或运行: newgrp docker"
fi

echo ""

# 检查Docker socket权限
DOCKER_SOCK="/var/run/docker.sock"
if [ -e "$DOCKER_SOCK" ]; then
    echo "检查Docker socket权限..."
    SOCK_PERM=$(stat -c "%A %U %G" "$DOCKER_SOCK")
    echo "Docker socket权限: $SOCK_PERM"
    
    if [[ "$SOCK_PERM" == *"docker"* ]]; then
        echo "✅ Docker socket权限正确"
    else
        echo "⚠️  Docker socket权限可能需要调整"
        echo "可以运行: sudo chmod 666 /var/run/docker.sock (临时)"
        echo "或: sudo chown root:docker /var/run/docker.sock"
    fi
else
    echo "❌ Docker socket不存在: $DOCKER_SOCK"
    echo "请确保Docker服务正在运行: sudo systemctl status docker"
fi

echo ""
echo "=== 修复完成 ==="
echo "如果仍有权限问题，可以:"
echo "1. 重新登录: logout 然后重新SSH登录"
echo "2. 运行: newgrp docker"
echo "3. 或使用sudo运行部署脚本: sudo ./deploy_on_cloud.sh"
echo ""
echo "验证Docker权限:"
echo "docker info"
