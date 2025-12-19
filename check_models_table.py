#!/usr/bin/env python3
"""
检查数据库中的models表
"""

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
import sys
import os

# 获取项目根目录
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))

# 添加backend到Python路径
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'backend'))

from app import models

# 创建数据库引擎和会话 - 使用项目根目录下的payroll.db
engine = create_engine(f'sqlite:///{os.path.join(PROJECT_ROOT, "payroll.db")}')
Session = sessionmaker(bind=engine)
session = Session()

print("=== 检查motor_models表 ===")

# 1. 检查表是否存在
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"数据库中存在的表: {tables}")

if 'motor_models' in tables:
    print("✓ motor_models表存在")
    
    # 2. 获取表结构
    print("\nmotor_models表结构:")
    columns = inspector.get_columns('motor_models')
    for column in columns:
        print(f"  - {column['name']}: {column['type']} (nullable: {column['nullable']})")
    
    # 3. 查询表中的数据
    print("\nmotor_models表中的数据:")
    motor_models_list = session.query(models.MotorModel).all()
    print(f"  共有 {len(motor_models_list)} 条记录")
    
    for motor_model in motor_models_list:
        print(f"  - {motor_model.name}: {motor_model.aliases} - {motor_model.description}")
else:
    print("✗ motor_models表不存在")

# 关闭会话
session.close()
print("\n检查完成")
