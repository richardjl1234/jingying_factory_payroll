import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

print("=== 检查数据库路径 ===")

# 获取环境变量中的数据库URL
print(f"1. 环境变量 DATABASE_URL: {os.getenv('DATABASE_URL')}")

# 获取当前工作目录
print(f"2. 当前工作目录: {os.getcwd()}")

# 检查默认数据库文件路径
print(f"3. 相对路径数据库文件: {'payroll.db'}")
print(f"   绝对路径: {os.path.abspath('payroll.db')}")
print(f"   文件是否存在: {os.path.exists('payroll.db')}")

# 检查后端目录下的数据库文件
backend_dir = os.path.dirname(os.path.abspath(__file__))
backend_db_path = os.path.join(backend_dir, 'payroll.db')
print(f"4. 后端目录数据库文件: {backend_db_path}")
print(f"   文件是否存在: {os.path.exists(backend_db_path)}")

# 检查前端目录下是否有数据库文件
frontend_dir = os.path.join(os.path.dirname(backend_dir), 'frontend')
frontend_db_path = os.path.join(frontend_dir, 'payroll.db')
print(f"5. 前端目录数据库文件: {frontend_db_path}")
print(f"   文件是否存在: {os.path.exists(frontend_db_path)}")

# 列出后端目录下的文件
print(f"\n6. 后端目录文件列表:")
for file in os.listdir(backend_dir):
    if file.endswith('.db'):
        print(f"   - {file}")
        print(f"     大小: {os.path.getsize(os.path.join(backend_dir, file))} 字节")

# 检查数据库文件中的用户数量
print(f"\n7. 读取数据库文件中的用户数量:")
import sqlite3

try:
    conn = sqlite3.connect(backend_db_path)
    cursor = conn.cursor()
    
    # 检查是否存在users表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    table_exists = cursor.fetchone()
    
    if table_exists:
        # 查询用户数量
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"   用户数量: {user_count}")
        
        # 查询所有用户名
        cursor.execute("SELECT username FROM users")
        usernames = cursor.fetchall()
        print(f"   用户名列表: {[user[0] for user in usernames]}")
    else:
        print("   users表不存在")
        
    conn.close()
except Exception as e:
    print(f"   读取数据库失败: {e}")