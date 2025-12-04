#!/bin/bash
# 生成自签名SSL证书脚本

echo "=== 生成自签名SSL证书 ==="
echo "IP地址: 124.220.108.154"
echo ""

# 创建SSL目录
mkdir -p ssl

# 生成私钥
echo "1. 生成私钥..."
openssl genrsa -out ssl/key.pem 2048

# 生成证书签名请求
echo "2. 生成证书签名请求..."
openssl req -new -key ssl/key.pem -out ssl/csr.pem \
  -subj "/C=CN/ST=Guangdong/L=Shenzhen/O=Factory/CN=124.220.108.154"

# 生成自签名证书
echo "3. 生成自签名证书..."
openssl x509 -req -days 365 -in ssl/csr.pem -signkey ssl/key.pem -out ssl/cert.pem

# 设置权限
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo ""
echo "✅ SSL证书生成完成"
echo "证书位置: ssl/cert.pem"
echo "私钥位置: ssl/key.pem"
echo ""
echo "注意: 自签名证书会在浏览器中显示安全警告"
echo "生产环境建议使用受信任的证书颁发机构(CA)颁发的证书"
