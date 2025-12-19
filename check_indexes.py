import os
from sqlalchemy import create_engine, inspect
from sqlalchemy.schema import MetaData

# 获取项目根目录
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))

# 检查数据库文件是否存在 - 使用项目根目录下的payroll.db
db_path = os.path.join(PROJECT_ROOT, 'payroll.db')
print(f"Database file exists: {os.path.exists(db_path)}")
print(f"Database path: {db_path}")

# 创建数据库引擎
engine = create_engine(f'sqlite:///{db_path}')

# 使用inspect查看表和索引
inspector = inspect(engine)

# 获取所有表
tables = inspector.get_table_names()
print(f"Tables found: {tables}")

# 打印每个表的索引
for table in tables:
    print(f'\nTable: {table}')
    print('Indexes:')
    indexes = inspector.get_indexes(table)
    if indexes:
        for index in indexes:
            print(f'  {index["name"]}: {index["column_names"]}')
    else:
        print('  No indexes found')
    
    # 打印表的外键
    print('Foreign Keys:')
    foreign_keys = inspector.get_foreign_keys(table)
    if foreign_keys:
        for fk in foreign_keys:
            print(f'  {fk["name"]}: {fk["constrained_columns"]} -> {fk["referred_table"]}.{fk["referred_columns"]}')
    else:
        print('  No foreign keys found')