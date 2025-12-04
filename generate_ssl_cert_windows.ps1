# Windows PowerShell SSL证书生成脚本

Write-Host "=== 生成自签名SSL证书 ===" -ForegroundColor Green
Write-Host "IP地址: 124.220.108.154"
Write-Host ""

# 创建SSL目录
$sslDir = "ssl"
if (-not (Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir | Out-Null
    Write-Host "1. 创建SSL目录: $sslDir" -ForegroundColor Yellow
}

# 检查OpenSSL是否可用
$opensslPath = ""
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    $opensslPath = "openssl"
} elseif (Test-Path "C:\Program Files\OpenSSL-Win64\bin\openssl.exe") {
    $opensslPath = "C:\Program Files\OpenSSL-Win64\bin\openssl.exe"
} elseif (Test-Path "C:\Program Files (x86)\OpenSSL-Win32\bin\openssl.exe") {
    $opensslPath = "C:\Program Files (x86)\OpenSSL-Win32\bin\openssl.exe"
} else {
    Write-Host "❌ OpenSSL未安装" -ForegroundColor Red
    Write-Host "请从以下地址下载并安装OpenSSL:" -ForegroundColor Yellow
    Write-Host "https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    Write-Host "或使用以下命令通过Chocolatey安装:" -ForegroundColor Yellow
    Write-Host "choco install openssl" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ OpenSSL路径: $opensslPath" -ForegroundColor Green
Write-Host ""

# 生成私钥
Write-Host "2. 生成私钥..." -ForegroundColor Yellow
& $opensslPath genrsa -out "$sslDir\key.pem" 2048

# 生成证书签名请求
Write-Host "3. 生成证书签名请求..." -ForegroundColor Yellow
& $opensslPath req -new -key "$sslDir\key.pem" -out "$sslDir\csr.pem" `
  -subj "/C=CN/ST=Guangdong/L=Shenzhen/O=Factory/CN=124.220.108.154"

# 生成自签名证书
Write-Host "4. 生成自签名证书..." -ForegroundColor Yellow
& $opensslPath x509 -req -days 365 -in "$sslDir\csr.pem" -signkey "$sslDir\key.pem" -out "$sslDir\cert.pem"

# 设置权限（Windows）
Write-Host "5. 设置文件权限..." -ForegroundColor Yellow
icacls "$sslDir\key.pem" /inheritance:r /grant:r "Users:R"
icacls "$sslDir\cert.pem" /inheritance:r /grant:r "Users:R"

Write-Host ""
Write-Host "✅ SSL证书生成完成" -ForegroundColor Green
Write-Host "证书位置: $sslDir\cert.pem" -ForegroundColor Cyan
Write-Host "私钥位置: $sslDir\key.pem" -ForegroundColor Cyan
Write-Host ""
Write-Host "注意: 自签名证书会在浏览器中显示安全警告" -ForegroundColor Yellow
Write-Host "生产环境建议使用受信任的证书颁发机构(CA)颁发的证书" -ForegroundColor Yellow
