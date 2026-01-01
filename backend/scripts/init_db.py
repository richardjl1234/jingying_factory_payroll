from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from app.database import SessionLocal, engine
from app import models
from app.utils.auth import get_password_hash

# 创建数据库表
models.Base.metadata.create_all(bind=engine)

def add_obsolete_date_column():
    """为quotas表添加obsolete_date列（如果不存在）"""
    db = SessionLocal()
    try:
        # 检查quotas表是否存在obsolete_date列
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('quotas')]
        
        if 'obsolete_date' not in columns:
            print("为quotas表添加obsolete_date列...")
            # 添加obsolete_date列
            db.execute(text("ALTER TABLE quotas ADD COLUMN obsolete_date DATE DEFAULT '9999-12-31'"))
            db.commit()
            print("obsolete_date列添加成功")
        else:
            print("obsolete_date列已存在")
    except Exception as e:
        print(f"添加obsolete_date列时出错: {e}")
        db.rollback()
    finally:
        db.close()

def create_salary_records_view():
    """创建工资记录视图（替换可能被创建的表）"""
    db = SessionLocal()
    try:
        # 首先检查是否是视图
        view_exists = db.execute(
            text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'v_salary_records'")
        ).fetchone()
        
        if view_exists:
            print("工资记录视图已存在")
            return
        
        # 检查是否是表（SQLAlchemy可能创建了表）
        table_exists = db.execute(
            text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'v_salary_records' AND TABLE_TYPE = 'BASE TABLE'")
        ).fetchone()
        
        if table_exists:
            print("v_salary_records表存在，删除并创建视图...")
            # 删除表
            db.execute(text("DROP TABLE v_salary_records"))
            db.commit()
            print("已删除v_salary_records表")
        
        # 创建视图 - 使用MySQL的CONCAT函数代替SQLite的||操作符
        create_view_sql = """
        CREATE VIEW v_salary_records AS
        SELECT 
            wr.id,
            wr.worker_code,
            wr.quota_id,
            wr.quantity,
            q.unit_price,
            (wr.quantity * q.unit_price) AS amount,
            wr.record_date,
            wr.created_by,
            wr.created_at,
            -- 电机型号: 型号名称 (别名)
            CONCAT(mm.name, ' (', COALESCE(mm.aliases, ''), ')') AS model_display,
            -- 工段类别: 编码 (名称)
            CONCAT(pc1.cat1_code, ' (', pc1.name, ')') AS cat1_display,
            -- 工序类别: 编码 (名称)
            CONCAT(pc2.cat2_code, ' (', pc2.name, ')') AS cat2_display,
            -- 工序名称: 编码 (名称)
            CONCAT(p.process_code, ' (', p.name, ')') AS process_display
        FROM work_records wr
        JOIN quotas q ON wr.quota_id = q.id
        JOIN processes p ON q.process_code = p.process_code
        JOIN process_cat1 pc1 ON q.cat1_code = pc1.cat1_code
        JOIN process_cat2 pc2 ON q.cat2_code = pc2.cat2_code
        JOIN motor_models mm ON q.model_name = mm.name
        """
        db.execute(text(create_view_sql))
        db.commit()
        print("工资记录视图创建成功!")
        
        # 验证视图
        result = db.execute(text("SELECT COUNT(*) as count FROM v_salary_records")).fetchone()
        print(f"视图验证: 包含 {result.count} 条记录")
        
    except Exception as e:
        print(f"创建工资记录视图时出错: {e}")
        db.rollback()
        # 如果视图创建失败，尝试创建表作为后备方案
        try:
            print("视图创建失败，尝试创建表...")
            # 检查表是否存在
            table_exists = db.execute(
                text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'v_salary_records' AND TABLE_TYPE = 'BASE TABLE'")
            ).fetchone()
            
            if not table_exists:
                # 创建表（SQLAlchemy会创建，但我们确保它存在）
                print("v_salary_records表不存在，将由SQLAlchemy模型创建")
            else:
                print("v_salary_records表已存在")
        except Exception as e2:
            print(f"检查/创建表时出错: {e2}")
    finally:
        db.close()

def init_db():
    """初始化数据库，创建root用户"""
    db = SessionLocal()
    
    try:
        # 检查是否已存在root用户
        root_user = db.query(models.User).filter(models.User.username == "root").first()
        
        if not root_user:
            # 创建root用户
            root_user = models.User(
                username="root",
                password=get_password_hash("root123"),
                name="系统管理员",
                role="admin",
                need_change_password=False
            )
            db.add(root_user)
            db.commit()
            print("Root user created successfully!")
        else:
            # 更新现有root用户的need_change_password字段
            root_user.need_change_password = False
            db.commit()
            print("Root user updated successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    # 添加obsolete_date列（如果不存在）
    add_obsolete_date_column()
    # 创建视图
    create_salary_records_view()
    # 初始化数据库
    init_db()
