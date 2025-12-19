#!/usr/bin/env python3
"""
测试CRUD函数，直接调用get_model_list函数
"""

import sys
import os

# 添加backend到Python路径
sys.path.insert(0, 'backend')

# 从app.crud导入get_model_list函数
from app import crud
from app.database import SessionLocal

def test_get_model_list():
    """测试获取型号列表"""
    print("测试获取型号列表...")
    
    # 创建数据库会话
    db = SessionLocal()
    
    try:
        # 调用get_model_list函数
        models = crud.get_model_list(db)
        print(f"获取到 {len(models)} 个型号")
        
        for model in models:
            print(f"- {model.name}: {model.aliases} - {model.description}")
        
        return True
    except Exception as e:
        print(f"获取型号列表失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # 关闭数据库会话
        db.close()

if __name__ == "__main__":
    print("=== 测试CRUD函数 ===")
    success = test_get_model_list()
    
    if success:
        print("\n✓ 测试通过")
    else:
        print("\n✗ 测试失败")
