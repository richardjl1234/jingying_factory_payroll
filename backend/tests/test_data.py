#!/usr/bin/env python3
"""
测试数据脚本 - 用于向新表中添加测试数据
"""

import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app import models

# 数据库连接配置 - 使用MySQL测试数据库
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://jingying_motor:Q!2we34rt56yu78i@localhost/payroll_test"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 创建会话本地类
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_test_data():
    """创建测试数据"""
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    
    # 创建数据库会话
    db = SessionLocal()
    
    try:
        # 检查是否已有数据
        existing_cat1 = db.query(models.ProcessCat1).count()
        existing_cat2 = db.query(models.ProcessCat2).count()
        existing_models = db.query(models.MotorModel).count()
        
        if existing_cat1 > 0 or existing_cat2 > 0 or existing_models > 0:
            print("数据库中已存在数据，跳过数据创建")
            return
        
        # 创建工段类别测试数据
        process_cat1_data = [
            {
                "cat1_code": "A",
                "name": "机加工",
                "description": "机械加工相关工序"
            },
            {
                "cat1_code": "B", 
                "name": "焊接",
                "description": "焊接相关工序"
            },
            {
                "cat1_code": "C",
                "name": "装配",
                "description": "产品装配相关工序"
            },
            {
                "cat1_code": "D",
                "name": "表面处理",
                "description": "表面处理相关工序"
            }
        ]
        
        for data in process_cat1_data:
            process_cat1 = models.ProcessCat1(**data)
            db.add(process_cat1)
        
        # 创建工序类别测试数据
        process_cat2_data = [
            {
                "cat2_code": "A1",
                "name": "车削",
                "description": "车床加工工序"
            },
            {
                "cat2_code": "A2",
                "name": "铣削", 
                "description": "铣床加工工序"
            },
            {
                "cat2_code": "B1",
                "name": "电弧焊",
                "description": "电弧焊接工序"
            },
            {
                "cat2_code": "B2",
                "name": "气焊",
                "description": "气焊焊接工序"
            },
            {
                "cat2_code": "C1",
                "name": "总装",
                "description": "产品总装工序"
            },
            {
                "cat2_code": "C2",
                "name": "调试",
                "description": "产品调试工序"
            },
            {
                "cat2_code": "D1",
                "name": "喷涂",
                "description": "表面喷涂处理"
            },
            {
                "cat2_code": "D2",
                "name": "电镀",
                "description": "电镀表面处理"
            }
        ]
        
        for data in process_cat2_data:
            process_cat2 = models.ProcessCat2(**data)
            db.add(process_cat2)
        
        # 创建型号测试数据
        model_data = [
            {
                "name": "X100",
                "aliases": "X-100, X100型",
                "description": "标准型号X100"
            },
            {
                "name": "Y200",
                "aliases": "Y-200, Y200型",
                "description": "增强型号Y200"
            },
            {
                "name": "Z300",
                "aliases": "Z-300, Z300型",
                "description": "专业型号Z300"
            },
            {
                "name": "A400",
                "aliases": "A-400, A400型",
                "description": "高级型号A400"
            },
            {
                "name": "B500",
                "aliases": "B-500, B500型",
                "description": "基础型号B500"
            }
        ]
        
        for data in model_data:
            model = models.MotorModel(**data)
            db.add(model)
        
        # 提交事务
        db.commit()
        
        print("测试数据创建成功！")
        print(f"- 工段类别: {len(process_cat1_data)} 条记录")
        print(f"- 工序类别: {len(process_cat2_data)} 条记录")
        print(f"- 型号: {len(model_data)} 条记录")
        
    except Exception as e:
        db.rollback()
        print(f"创建测试数据时出错: {e}")
        raise
    finally:
        db.close()

def main():
    """主函数"""
    print("开始创建测试数据...")
    create_test_data()
    print("测试数据创建完成！")

if __name__ == "__main__":
    main()
