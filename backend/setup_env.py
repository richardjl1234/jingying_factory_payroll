#!/usr/bin/env python3
"""
环境变量设置脚本
帮助用户安全地配置数据库连接信息
"""

import os
import sys
import getpass
from pathlib import Path

def setup_environment():
    """设置环境变量配置文件"""
    print("=" * 60)
    print("工资管理系统 - 环境变量配置")
    print("=" * 60)
    print()
    print("此脚本将帮助您安全地配置数据库连接信息。")
    print("敏感信息将存储在 .env 文件中（已添加到 .gitignore）。")
    print()
    
    # 检查是否已存在 .env 文件
    env_file = Path(".env")
    if env_file.exists():
        print("⚠️  检测到已存在的 .env 文件")
        overwrite = input("是否覆盖现有配置？(y/N): ").strip().lower()
        if overwrite != 'y':
            print("取消配置。")
            return
    
    print("\n📊 数据库配置")
    print("-" * 40)
    
    # 获取数据库配置
    db_host = input("数据库主机 [localhost]: ").strip() or "localhost"
    db_port = input("数据库端口 [3306]: ").strip() or "3306"
    db_name = input("数据库名称 [payroll]: ").strip() or "payroll"
    db_user = input("数据库用户名 [jingying_motor]: ").strip() or "jingying_motor"
    
    # 安全地获取密码
    print("\n🔐 数据库密码")
    print("密码输入将不会显示在屏幕上")
    while True:
        db_password = getpass.getpass("数据库密码: ")
        if not db_password:
            print("❌ 密码不能为空，请重新输入")
            continue
            
        db_password_confirm = getpass.getpass("确认密码: ")
        if db_password != db_password_confirm:
            print("❌ 两次输入的密码不一致，请重新输入")
            continue
        break
    
    print("\n🔑 安全配置")
    print("-" * 40)
    
    # 生成安全的密钥
    import secrets
    secret_key = secrets.token_urlsafe(32)
    print(f"已生成安全的 SECRET_KEY: {secret_key[:16]}...")
    
    # 构建数据库URL
    database_url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    # 写入 .env 文件
    env_content = f"""# Database Configuration
DATABASE_URL={database_url}

# Security Configuration
SECRET_KEY={secret_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Project Configuration
PROJECT_ROOT={os.getcwd()}
"""
    
    try:
        with open(".env", "w") as f:
            f.write(env_content)
        
        print("\n✅ 环境变量配置完成！")
        print(f"📁 配置文件已保存到: {env_file.absolute()}")
        print("\n⚠️  重要提示:")
        print("1. 请确保 .env 文件不被提交到版本控制系统")
        print("2. 在生产环境中，请使用更安全的方式管理密码")
        print("3. 如需修改配置，可重新运行此脚本或直接编辑 .env 文件")
        
        # 显示下一步操作
        print("\n🚀 下一步操作:")
        print("1. 启动数据库服务")
        print("2. 运行数据库初始化: python scripts/init_db.py")
        print("3. 启动应用: python run.py")
        
    except Exception as e:
        print(f"❌ 写入配置文件时出错: {e}")
        sys.exit(1)

def check_environment():
    """检查环境变量配置"""
    print("🔍 检查环境变量配置...")
    
    required_vars = ["DATABASE_URL", "SECRET_KEY"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ 缺少必要的环境变量: {', '.join(missing_vars)}")
        print("请运行以下命令进行配置:")
        print("  python setup_env.py")
        return False
    else:
        print("✅ 环境变量配置完整")
        return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "check":
        sys.exit(0 if check_environment() else 1)
    else:
        setup_environment()
