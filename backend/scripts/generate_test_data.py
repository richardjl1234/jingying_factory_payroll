#!/usr/bin/env python3
"""
生成测试数据脚本
用于批量生成工人、工序、定额和工资记录数据
"""

from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from decimal import Decimal
import random

from app.database import SessionLocal, engine
from app import models
from app.utils.auth import get_password_hash

# 创建数据库表
models.Base.metadata.create_all(bind=engine)

# 测试数据配置
NUM_WORKERS = 10  # 生成的工人数量
NUM_PROCESSES = 5  # 生成的工序数量
NUM_QUOTAS = 15  # 生成的定额数量
NUM_SALARY_RECORDS = 50  # 生成的工资记录数量

# 随机数据生成函数
def random_date(start_date, end_date):
    """生成指定范围内的随机日期"""
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)

def random_month(start_year, end_year):
    """生成指定年份范围内的随机月份，格式：YYYY-MM"""
    year = random.randint(start_year, end_year)
    month = random.randint(1, 12)
    return f"{year:04d}-{month:02d}"

def main():
    """生成并导入测试数据"""
    db = SessionLocal()
    
    try:
        # 0. 删除现有数据（按外键依赖顺序删除）
        print("删除现有数据...")
        
        # 删除工资记录（有外键指向工人、定额和用户）
        salary_record_count = db.query(models.SalaryRecord).delete()
        print(f"删除工资记录: {salary_record_count} 条")
        
        # 删除定额（有外键指向工序和用户）
        quota_count = db.query(models.Quota).delete()
        print(f"删除定额: {quota_count} 个")
        
        # 删除工序（被定额表引用）
        process_count = db.query(models.Process).delete()
        print(f"删除工序: {process_count} 个")
        
        # 删除工人（被工资记录表引用）
        worker_count = db.query(models.Worker).delete()
        print(f"删除工人: {worker_count} 个")
        
        # 删除新表数据
        model_count = db.query(models.MotorModel).delete()
        print(f"删除型号: {model_count} 个")
        
        process_cat1_count = db.query(models.ProcessCat1).delete()
        print(f"删除工段类别: {process_cat1_count} 个")
        
        process_cat2_count = db.query(models.ProcessCat2).delete()
        print(f"删除工序类别: {process_cat2_count} 个")
        
        # 删除用户（保留root用户，只删除其他用户）
        user_count = db.query(models.User).filter(models.User.username != "root").delete()
        print(f"删除用户: {user_count} 个")
        
        db.commit()
        print("现有数据删除完成")
        
        # 1. 创建root用户
        print("\n创建root用户...")
        # 检查是否已存在root用户
        root_user = db.query(models.User).filter(models.User.username == "root").first()
        if not root_user:
            root_user = models.User(
                username="root",
                password=get_password_hash("root123"),
                name="超级管理员",
                role="admin",
                need_change_password=False
            )
            db.add(root_user)
            db.commit()
            print(f"创建root用户成功: {root_user.username}")
        else:
            print(f"root用户已存在: {root_user.username}")
        
        # 2. 创建测试用户
        print("\n创建测试用户...")
        # 检查是否已存在测试用户
        test_user = db.query(models.User).filter(models.User.username == "test").first()
        if not test_user:
            test_user = models.User(
                username="test",
                password=get_password_hash("test123"),
                name="测试用户",
                role="admin",
                need_change_password=False
            )
            db.add(test_user)
            db.commit()
            print(f"创建测试用户成功: {test_user.username}")
        else:
            print(f"测试用户已存在: {test_user.username}")
        
        # 2. 生成工人数据
        print("\n生成工人数据...")
        workers = []
        
        for i in range(NUM_WORKERS):
            worker_code = f"W{i+1:03d}"
            worker_name = f"工人{i+1}"
            
            # 检查是否已存在该工人
            existing_worker = db.query(models.Worker).filter(models.Worker.worker_code == worker_code).first()
            if not existing_worker:
                worker = models.Worker(
                    worker_code=worker_code,
                    name=worker_name
                )
                db.add(worker)
                workers.append(worker)
                print(f"生成工人: {worker_code} - {worker_name}")
            else:
                workers.append(existing_worker)
                print(f"工人已存在: {worker_code} - {existing_worker.name}")
        
        db.commit()
        print(f"\n工人数据生成完成，共生成 {len(workers)} 个工人")
        
        # 3. 生成工序数据
        print("\n生成工序数据...")
        process_data = [
            {"name": "组装", "description": "组装工序描述"},
            {"name": "焊接", "description": "焊接工序描述"},
            {"name": "喷漆", "description": "喷漆工序描述"},
            {"name": "包装", "description": "包装工序描述"},
            {"name": "质检", "description": "质检工序描述"}
        ]
        processes = []
        
        for i, process_info in enumerate(process_data):
            process_code = f"P{i+1:02d}"
            name = process_info["name"]
            description = process_info["description"]
            
            # 检查是否已存在该工序
            existing_process = db.query(models.Process).filter(models.Process.process_code == process_code).first()
            if not existing_process:
                process = models.Process(
                    process_code=process_code,
                    name=name,
                    description=description
                )
                db.add(process)
                processes.append(process)
                print(f"生成工序: {process_code} - {name}")
            else:
                processes.append(existing_process)
                print(f"工序已存在: {process_code} - {existing_process.name}")
        
        db.commit()
        print(f"\n工序数据生成完成，共生成 {len(processes)} 个工序")
        
        # 3.1 生成工段类别数据
        print("\n生成工段类别数据...")
        cat1_data = [
            {"code": "C101", "name": "机械加工", "description": "机械加工类别"},
            {"code": "C102", "name": "装配制造", "description": "装配制造类别"},
            {"code": "C103", "name": "表面处理", "description": "表面处理类别"},
            {"code": "C104", "name": "包装物流", "description": "包装物流类别"}
        ]
        process_cat1s = []
        
        for cat1_info in cat1_data:
            # 检查是否已存在该工段类别
            existing_cat1 = db.query(models.ProcessCat1).filter(models.ProcessCat1.cat1_code == cat1_info["code"]).first()
            if not existing_cat1:
                cat1 = models.ProcessCat1(
                    cat1_code=cat1_info["code"],
                    name=cat1_info["name"],
                    description=cat1_info["description"]
                )
                db.add(cat1)
                process_cat1s.append(cat1)
                print(f"生成工段类别: {cat1_info['code']} - {cat1_info['name']}")
            else:
                process_cat1s.append(existing_cat1)
                print(f"工段类别已存在: {cat1_info['code']} - {existing_cat1.name}")
        
        # 3.2 生成工序类别数据
        print("\n生成工序类别数据...")
        cat2_data = [
            {"code": "C201", "name": "车床加工", "description": "车床加工类别"},
            {"code": "C202", "name": "铣床加工", "description": "铣床加工类别"},
            {"code": "C203", "name": "钻床加工", "description": "钻床加工类别"},
            {"code": "C204", "name": "手工装配", "description": "手工装配类别"},
            {"code": "C205", "name": "自动装配", "description": "自动装配类别"}
        ]
        process_cat2s = []
        
        for cat2_info in cat2_data:
            # 检查是否已存在该工序类别
            existing_cat2 = db.query(models.ProcessCat2).filter(models.ProcessCat2.cat2_code == cat2_info["code"]).first()
            if not existing_cat2:
                cat2 = models.ProcessCat2(
                    cat2_code=cat2_info["code"],
                    name=cat2_info["name"],
                    description=cat2_info["description"]
                )
                db.add(cat2)
                process_cat2s.append(cat2)
                print(f"生成工序类别: {cat2_info['code']} - {cat2_info['name']}")
            else:
                process_cat2s.append(existing_cat2)
                print(f"工序类别已存在: {cat2_info['code']} - {existing_cat2.name}")
        
        # 3.3 生成型号数据
        print("\n生成型号数据...")
        model_data = [
            {"name": "A100", "aliases": "A系列, A-100", "description": "A100型号描述"},
            {"name": "B200", "aliases": "B系列, B-200", "description": "B200型号描述"},
            {"name": "C300", "aliases": "C系列, C-300", "description": "C300型号描述"},
            {"name": "D400", "aliases": "D系列, D-400", "description": "D400型号描述"},
            {"name": "E500", "aliases": "E系列, E-500", "description": "E500型号描述"}
        ]
        models_list = []
        
        for model_info in model_data:
            # 检查是否已存在该型号
            existing_model = db.query(models.MotorModel).filter(models.MotorModel.name == model_info["name"]).first()
            if not existing_model:
                model = models.MotorModel(
                    name=model_info["name"],
                    aliases=model_info["aliases"],
                    description=model_info["description"]
                )
                db.add(model)
                models_list.append(model)
                print(f"生成型号: {model_info['name']} - {model_info['aliases']}")
            else:
                models_list.append(existing_model)
                print(f"型号已存在: {model_info['name']} - {existing_model.aliases}")
        
        db.commit()
        print(f"\n工段类别数据生成完成，共生成 {len(process_cat1s)} 个工段类别")
        print(f"工序类别数据生成完成，共生成 {len(process_cat2s)} 个工序类别")
        print(f"型号数据生成完成，共生成 {len(models_list)} 个型号")
        
        # 4. 生成定额数据
        print("\n生成定额数据...")
        start_date = date(2023, 1, 1)
        end_date = date(2025, 12, 31)
        quotas = []
        
        # 为每个工序生成多个定额（不同生效日期）
        for process in processes:
            # 为每个工序生成3个不同生效日期的定额
            for i in range(3):
                effective_date = start_date + timedelta(days=i*365)
                unit_price = Decimal(f"{random.uniform(5.0, 50.0):.2f}")
                # 随机选择工段类别、工序类别和型号
                cat1 = random.choice(process_cat1s)
                cat2 = random.choice(process_cat2s)
                model = random.choice(models_list)
                
                # 检查是否已存在该定额（基于新的唯一约束）
                existing_quota = db.query(models.Quota).filter(
                    models.Quota.process_code == process.process_code,
                    models.Quota.cat1_code == cat1.cat1_code,
                    models.Quota.cat2_code == cat2.cat2_code,
                    models.Quota.model_name == model.name,
                    models.Quota.effective_date == effective_date
                ).first()
                
                if not existing_quota:
                    quota = models.Quota(
                        process_code=process.process_code,
                        cat1_code=cat1.cat1_code,
                        cat2_code=cat2.cat2_code,
                        model_name=model.name,
                        unit_price=unit_price,
                        effective_date=effective_date,
                        created_by=test_user.id
                    )
                    db.add(quota)
                    quotas.append(quota)
                    print(f"生成定额: {process.process_code} - {cat1.cat1_code} - {cat2.cat2_code} - {model.name} - {effective_date} - ¥{unit_price}")
                else:
                    quotas.append(existing_quota)
                    print(f"定额已存在: {process.process_code} - {cat1.cat1_code} - {cat2.cat2_code} - {model.name} - {effective_date}")
        
        db.commit()
        print(f"\n定额数据生成完成，共生成 {len(quotas)} 个定额")
        
        # 5. 生成工资记录数据
        print("\n生成工资记录数据...")
        salary_records = []
        
        for i in range(NUM_SALARY_RECORDS):
            # 随机选择工人
            worker = random.choice(workers)
            
            # 随机选择定额
            quota = random.choice(quotas) if quotas else None
            if not quota:
                continue
            
            # 生成随机数量
            quantity = Decimal(f"{random.uniform(10.0, 200.0):.2f}")
            # 生成随机日期（2023-01-01 到 2025-12-31）
            record_date = random_date(date(2023, 1, 1), date(2025, 12, 31))
            
            # 计算金额
            amount = quantity * quota.unit_price
            
            # 创建工资记录
            salary_record = models.SalaryRecord(
                worker_code=worker.worker_code,
                quota_id=quota.id,
                quantity=quantity,
                unit_price=quota.unit_price,
                amount=amount,
                record_date=record_date,
                created_by=test_user.id
            )
            
            db.add(salary_record)
            salary_records.append(salary_record)
            
            if (i + 1) % 10 == 0:
                print(f"生成工资记录: {i + 1}/{NUM_SALARY_RECORDS}")
        
        db.commit()
        print(f"\n工资记录数据生成完成，共生成 {len(salary_records)} 条工资记录")
        
        print("\n=== 测试数据生成完成 ===")
        print(f"工人数量: {len(workers)}")
        print(f"工序数量: {len(processes)}")
        print(f"工段类别数量: {len(process_cat1s)}")
        print(f"工序类别数量: {len(process_cat2s)}")
        print(f"型号数量: {len(models_list)}")
        print(f"定额数量: {len(quotas)}")
        print(f"工资记录数量: {len(salary_records)}")
        print(f"测试用户: test / test123")
        print(f"Root用户: root / root123")
        print("\n使用以下命令运行服务：")
        print("  后端服务: python run.py")
        print("  前端服务: npm run dev (在frontend目录下)")
        print("\n访问地址：")
        print("  前端: http://localhost:5173")
        print("  后端API文档: http://localhost:8000/docs")
        
    except Exception as e:
        print(f"生成测试数据时发生错误: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    from datetime import timedelta
    main()
