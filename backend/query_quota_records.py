#!/usr/bin/env python
"""
查询定额表(quotas)的所有记录
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

def query_quota_records():
    """查询定额表的所有记录"""
    try:
        # 创建连接
        with engine.connect() as connection:
            # 执行SQL查询
            result = connection.execute(text("SELECT * FROM quotas"))
            
            # 获取列名
            columns = result.keys()
            
            # 打印列名
            print("\t".join(columns))
            print("-" * 80)
            
            # 打印记录
            row_count = 0
            for row in result:
                row_count += 1
                print("\t".join(str(value) for value in row))
            
            print("-" * 80)
            print(f"共查询到 {row_count} 条记录")
            
    except Exception as e:
        print(f"查询失败: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("查询定额表所有记录...")
    success = query_quota_records()
    if success:
        print("查询完成")
    else:
        print("查询出错")
        sys.exit(1)