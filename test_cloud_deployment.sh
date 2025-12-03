#!/bin/bash
# 云服务器部署测试脚本

echo "=== 云服务器部署测试 ==="
echo "服务器IP: 124.220.108.154"
echo ""

# 测试健康检查端点
echo "1. 测试健康检查端点..."
curl -f http://124.220.108.154/api/health
if [ $? -eq 0 ]; then
    echo "✅ 健康检查通过"
else
    echo "❌ 健康检查失败"
    exit 1
fi

echo ""

# 测试登录API
echo "2. 测试登录API..."
LOGIN_RESPONSE=$(curl -s -X POST http://124.220.108.154/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test123"}')

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✅ 登录API测试通过"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo "获取到Token: ${TOKEN:0:20}..."
else
    echo "❌ 登录API测试失败"
    echo "响应: $LOGIN_RESPONSE"
    exit 1
fi

echo ""

# 测试获取用户列表API
echo "3. 测试获取用户列表API..."
USERS_RESPONSE=$(curl -s -X GET http://124.220.108.154/api/users/ \
  -H "Authorization: Bearer $TOKEN")

if echo "$USERS_RESPONSE" | grep -q "username"; then
    echo "✅ 用户列表API测试通过"
    USER_COUNT=$(echo "$USERS_RESPONSE" | grep -o '"username"' | wc -l)
    echo "获取到 $USER_COUNT 个用户"
else
    echo "❌ 用户列表API测试失败"
    echo "响应: $USERS_RESPONSE"
    exit 1
fi

echo ""

# 测试前端页面访问
echo "4. 测试前端页面访问..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://124.220.108.154/)

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✅ 前端页面访问通过 (HTTP 200)"
else
    echo "❌ 前端页面访问失败 (HTTP $FRONTEND_RESPONSE)"
    exit 1
fi

echo ""
echo "=== 所有测试通过 ==="
echo "✅ 云服务器部署成功"
echo "✅ 后端API服务正常"
echo "✅ 前端页面服务正常"
echo "✅ 数据库连接正常"
echo ""
echo "应用访问地址: http://124.220.108.154"
echo "API文档地址: http://124.220.108.154/docs"
