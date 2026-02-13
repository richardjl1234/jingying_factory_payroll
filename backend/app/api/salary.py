from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from .. import crud, schemas, models
from ..database import get_db
from ..dependencies import get_current_active_user

# 创建路由
router = APIRouter(
    prefix="/salary-records",
    tags=["salary-records"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=list[schemas.SalaryRecord])
def read_salary_records(
    worker_code: str = None,
    record_date: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取工资记录列表（从视图读取）"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[SalaryRecords] User {current_user.username} requesting salary records with params: worker_code={worker_code}, record_date={record_date}, skip={skip}, limit={limit}")
    
    try:
        records = crud.get_salary_records(
            db, 
            worker_code=worker_code, 
            record_date=record_date, 
            skip=skip, 
            limit=limit
        )
        logger.info(f"[SalaryRecords] Retrieved {len(records)} records from database")
        return records
    except Exception as e:
        logger.error(f"[SalaryRecords] Error retrieving salary records: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取工资记录失败: {str(e)}")

@router.get("/{record_id}", response_model=schemas.SalaryRecord)
def read_salary_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """根据ID获取工资记录信息（从视图读取）"""
    record = crud.get_salary_record_by_id(db, record_id=record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Salary record not found")
    return record

@router.post("/", response_model=schemas.WorkRecord, status_code=status.HTTP_201_CREATED)
def create_salary_record(
    record: schemas.WorkRecordCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """创建新工作记录"""
    # 检查工人是否存在
    if not crud.get_worker_by_code(db, worker_code=record.worker_code):
        raise HTTPException(status_code=400, detail="Worker not found")
    
    # 检查定额是否存在
    if not crud.get_quota_by_id(db, quota_id=record.quota_id):
        raise HTTPException(status_code=400, detail="Quota not found")
    
    return crud.create_work_record(db=db, record=record, created_by=current_user.id)

@router.post("/batch", response_model=schemas.BatchWorkRecordCreateResponse, status_code=status.HTTP_201_CREATED)
def create_batch_salary_records(
    records: schemas.BatchWorkRecordCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    批量创建工作记录
    当选择了多个工序时，一次性创建多条记录
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[BatchCreate] User {current_user.username} creating batch records: worker={records.worker_code}, date={records.record_date}, count={len(records.quota_ids)}")
    
    try:
        # 检查工人是否存在
        if not crud.get_worker_by_code(db, worker_code=records.worker_code):
            raise HTTPException(status_code=400, detail="Worker not found")
        
        # 检查所有定额是否存在
        created_records = []
        errors = []
        
        for quota_id in records.quota_ids:
            quota = crud.get_quota_by_id(db, quota_id=quota_id)
            if not quota:
                errors.append({"quota_id": quota_id, "error": "Quota not found"})
                continue
            
            # 计算金额
            amount = float(quota.unit_price) * float(records.quantity)
            
            # 创建记录
            work_record = crud.create_work_record(
                db=db, 
                record=schemas.WorkRecordCreate(
                    worker_code=records.worker_code,
                    quota_id=quota_id,
                    quantity=records.quantity,
                    record_date=records.record_date
                ),
                created_by=current_user.id
            )
            created_records.append({
                "id": work_record.id,
                "quota_id": quota_id,
                "unit_price": float(quota.unit_price),
                "quantity": records.quantity,
                "amount": amount
            })
        
        logger.info(f"[BatchCreate] Created {len(created_records)} records, {len(errors)} errors")
        
        return {
            "message": f"成功创建 {len(created_records)} 条工作记录",
            "created_count": len(created_records),
            "error_count": len(errors),
            "records": created_records,
            "errors": errors
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[BatchCreate] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"批量创建工作记录失败: {str(e)}")

@router.put("/{record_id}", response_model=schemas.WorkRecord)
def update_salary_record(
    record_id: int,
    record_update: schemas.WorkRecordUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """更新工作记录信息"""
    record = crud.update_work_record(db, record_id=record_id, record_update=record_update)
    if not record:
        raise HTTPException(status_code=404, detail="Work record not found")
    return record

@router.delete("/{record_id}")
def delete_salary_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """删除工作记录"""
    record = crud.delete_work_record(db, record_id=record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Work record not found")
    return {"message": "工作记录删除成功", "record_id": record_id}

@router.get("/worker-month/")
def get_worker_month_records(
    worker_code: str = Query(..., description="工人编码"),
    month: str = Query(..., description="月份 (YYYYMM格式)"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    获取指定工人指定月份的所有工资记录
    返回工作记录列表和汇总信息
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[WorkerMonthRecords] User {current_user.username} requesting records for worker={worker_code}, month={month}")
    
    try:
        # 解析月份，获取起始日期和结束日期
        if len(month) != 6 or not month.isdigit():
            raise HTTPException(status_code=400, detail="月份格式必须为YYYYMM，如 202601")
        
        year = int(month[:4])
        month_num = int(month[4:])
        
        if month_num < 1 or month_num > 12:
            raise HTTPException(status_code=400, detail="月份无效，请输入01-12")
        
        start_date = date(year, month_num, 1)
        
        # 计算月末日期
        if month_num == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month_num + 1, 1) - timedelta(days=1)
        
        logger.info(f"[WorkerMonthRecords] Query date range: {start_date} to {end_date}")
        
        # 查询工资记录
        records = crud.get_salary_records_by_worker_and_date_range(
            db, 
            worker_code=worker_code, 
            start_date=start_date,
            end_date=end_date
        )
        
        logger.info(f"[WorkerMonthRecords] Retrieved {len(records)} records")
        
        # 计算汇总
        total_quantity = sum(float(r.quantity) for r in records)
        total_amount = sum(float(r.amount) for r in records)
        
        # 获取工人名称
        worker = crud.get_worker_by_code(db, worker_code=worker_code)
        worker_name = worker.name if worker else worker_code
        
        return {
            "worker_code": worker_code,
            "worker_name": worker_name,
            "month": month,
            "records": records,
            "summary": {
                "total_quantity": round(total_quantity, 2),
                "total_amount": round(total_amount, 2)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[WorkerMonthRecords] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取工资记录失败: {str(e)}")

@router.get("/dictionaries/")
def get_dictionaries(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    获取字典数据，用于前端搜索选择
    返回电机型号列表和定额组合列表
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[Dictionaries] User {current_user.username} requesting dictionaries")
    
    try:
        # 获取所有电机型号
        motor_models = db.query(
            models.MotorModel.model_code,
            models.MotorModel.name
        ).all()
        
        # 获取所有定额组合（去重）
        # 组合格式: cat1_code + cat2_code + process_code
        quota_combinations_query = db.query(
            models.Quota.id.label('quota_id'),
            models.Quota.model_code,
            models.MotorModel.name.label('model_name'),
            models.Quota.cat1_code,
            models.ProcessCat1.name.label('cat1_name'),
            models.Quota.cat2_code,
            models.ProcessCat2.name.label('cat2_name'),
            models.Quota.process_code,
            models.Process.name.label('process_name'),
            models.Quota.unit_price
        ).join(
            models.MotorModel,
            models.Quota.model_code == models.MotorModel.model_code
        ).join(
            models.ProcessCat1,
            models.Quota.cat1_code == models.ProcessCat1.cat1_code
        ).join(
            models.ProcessCat2,
            models.Quota.cat2_code == models.ProcessCat2.cat2_code
        ).join(
            models.Process,
            models.Quota.process_code == models.Process.process_code
        ).filter(
            models.Quota.obsolete_date == date(9999, 12, 31)
        ).distinct(
            models.Quota.model_code,
            models.Quota.cat1_code,
            models.Quota.cat2_code,
            models.Quota.process_code
        ).all()
        
        # 构建定额组合列表
        quota_combinations = []
        for q in quota_combinations_query:
            # 组合格式: model_code + cat1_code + cat2_code + process_code
            combined_code = f"{q.model_code}{q.cat1_code}{q.cat2_code}{q.process_code}"
            quota_combinations.append({
                "quota_id": q.quota_id,
                "combined_code": combined_code,
                "model_code": q.model_code,
                "model_name": q.model_name or q.model_code,
                "cat1_code": q.cat1_code,
                "cat1_name": q.cat1_name or q.cat1_code,
                "cat2_code": q.cat2_code,
                "cat2_name": q.cat2_name or q.cat2_code,
                "process_code": q.process_code,
                "process_name": q.process_name or q.process_code,
                "unit_price": float(q.unit_price)
            })
        
        logger.info(f"[Dictionaries] Found {len(motor_models)} motor models and {len(quota_combinations)} quota combinations")
        
        return {
            "motor_models": [
                {"model_code": m.model_code, "name": m.name or m.model_code}
                for m in motor_models
            ],
            "quota_combinations": quota_combinations
        }
    except Exception as e:
        logger.error(f"[Dictionaries] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取字典数据失败: {str(e)}")

@router.get("/find-quota/")
def find_quota(
    quota_id: int = Query(None, description="定额ID"),
    model_code: str = Query(None, description="型号编码"),
    cat1_code: str = Query(None, description="工段类别编码"),
    cat2_code: str = Query(None, description="工序类别编码"),
    process_code: str = Query(None, description="工序编码"),
    record_date: str = Query(None, description="记录日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    根据条件查询定额
    支持直接输入定额ID，或通过型号+工序组合查找
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[FindQuota] User {current_user.username} finding quota: quota_id={quota_id}, model={model_code}, cat1={cat1_code}, cat2={cat2_code}, process={process_code}, date={record_date}")
    
    try:
        # 方式1：直接通过定额ID查询
        if quota_id:
            quota = crud.get_quota_by_id(db, quota_id=quota_id)
            if not quota:
                # 定额ID不存在
                return {
                    "found": False,
                    "error_type": "not_found",
                    "message": f"该定额id {quota_id} 不存在"
                }
            
            # 验证日期是否在有效期内
            if record_date:
                record_date_obj = date.fromisoformat(record_date)
                if record_date_obj > quota.obsolete_date:
                    # 定额已失效，查找替代定额
                    logger.info(f"[FindQuota] Quota {quota_id} is obsolete, searching for replacement")
                    
                    # 查找相同组合的有效定额
                    replacement = db.query(models.Quota).filter(
                        models.Quota.model_code == quota.model_code,
                        models.Quota.cat1_code == quota.cat1_code,
                        models.Quota.cat2_code == quota.cat2_code,
                        models.Quota.process_code == quota.process_code,
                        models.Quota.effective_date <= record_date_obj,
                        models.Quota.obsolete_date >= record_date_obj
                    ).first()
                    
                    replacement_info = None
                    if replacement:
                        # 获取关联信息
                        process = crud.get_process_by_code(db, process_code=replacement.process_code)
                        cat1 = crud.get_process_cat1_by_code(db, cat1_code=replacement.cat1_code)
                        cat2 = crud.get_process_cat2_by_code(db, cat2_code=replacement.cat2_code)
                        replacement_info = {
                            "quota_id": replacement.id,
                            "model_code": replacement.model_code,
                            "cat1_code": replacement.cat1_code,
                            "cat1_name": cat1.name if cat1 else replacement.cat1_code,
                            "cat2_code": replacement.cat2_code,
                            "cat2_name": cat2.name if cat2 else replacement.cat2_code,
                            "process_code": replacement.process_code,
                            "process_name": process.name if process else replacement.process_code,
                            "unit_price": float(replacement.unit_price),
                            "effective_date": str(replacement.effective_date),
                            "obsolete_date": str(replacement.obsolete_date)
                        }
                    
                    return {
                        "found": False,
                        "error_type": "obsolete",
                        "quota_id": quota.id,
                        "obsolete_date": str(quota.obsolete_date),
                        "replacement": replacement_info,
                        "message": f"该定额id {quota_id} 存在，但是已经失效，失效日期 {quota.obsolete_date}"
                    }
                elif record_date_obj < quota.effective_date:
                    # 定额尚未生效
                    return {
                        "found": False,
                        "error_type": "not_yet_effective",
                        "quota_id": quota.id,
                        "effective_date": str(quota.effective_date),
                        "message": f"该定额id {quota_id} 尚未生效，生效日期 {quota.effective_date}"
                    }
            
            # 获取关联信息
            process = crud.get_process_by_code(db, process_code=quota.process_code)
            cat1 = crud.get_process_cat1_by_code(db, cat1_code=quota.cat1_code)
            cat2 = crud.get_process_cat2_by_code(db, cat2_code=quota.cat2_code)
            
            return {
                "found": True,
                "quota_id": quota.id,
                "model_code": quota.model_code,
                "cat1_code": quota.cat1_code,
                "cat1_name": cat1.name if cat1 else quota.cat1_code,
                "cat2_code": quota.cat2_code,
                "cat2_name": cat2.name if cat2 else quota.cat2_code,
                "process_code": quota.process_code,
                "process_name": process.name if process else quota.process_code,
                "unit_price": float(quota.unit_price),
                "effective_date": str(quota.effective_date),
                "obsolete_date": str(quota.obsolete_date)
            }
        
        # 方式2：通过型号和工序组合查询
        if not all([model_code, cat1_code, cat2_code, process_code, record_date]):
            raise HTTPException(status_code=400, detail="缺少必要参数")
        
        # 验证日期格式
        record_date_obj = date.fromisoformat(record_date)
        
        # 查询定额
        quota = db.query(models.Quota).filter(
            models.Quota.model_code == model_code,
            models.Quota.cat1_code == cat1_code,
            models.Quota.cat2_code == cat2_code,
            models.Quota.process_code == process_code,
            models.Quota.effective_date <= record_date_obj,
            models.Quota.obsolete_date >= record_date_obj
        ).first()
        
        if not quota:
            raise HTTPException(status_code=404, detail=f"未找到符合条件的定额: 型号={model_code}, 工段={cat1_code}, 工序类别={cat2_code}, 工序={process_code}, 日期={record_date}")
        
        # 获取关联信息
        process = crud.get_process_by_code(db, process_code=quota.process_code)
        cat1 = crud.get_process_cat1_by_code(db, cat1_code=quota.cat1_code)
        cat2 = crud.get_process_cat2_by_code(db, cat2_code=quota.cat2_code)
        
        return {
            "found": True,
            "quota_id": quota.id,
            "model_code": quota.model_code,
            "cat1_code": quota.cat1_code,
            "cat1_name": cat1.name if cat1 else quota.cat1_code,
            "cat2_code": quota.cat2_code,
            "cat2_name": cat2.name if cat2 else quota.cat2_code,
            "process_code": quota.process_code,
            "process_name": process.name if process else quota.process_code,
            "unit_price": float(quota.unit_price),
            "effective_date": str(quota.effective_date),
            "obsolete_date": str(quota.obsolete_date)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[FindQuota] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"查询定额失败: {str(e)}")

# 预加载定额数据接口（用于前端级联下拉框）

@router.get("/quota-options/")
def get_quota_options(
    record_date: str = Query(None, description="记录日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    预加载所有定额数据，用于前端进行级联筛选
    返回所有定额组合及其关联的名称翻译
    """
    import logging
    import time
    logger = logging.getLogger(__name__)
    start_time = time.time()
    
    logger.info(f"[QuotaOptions] User {current_user.username} requesting quota options, date={record_date}")
    
    try:
        # 获取所有工段类别名称
        cat1_names = {}
        cat1_query = db.query(models.ProcessCat1.cat1_code, models.ProcessCat1.name).all()
        for c in cat1_query:
            cat1_names[c.cat1_code] = c.name or c.cat1_code
        logger.info(f"[QuotaOptions] Found {len(cat1_names)} cat1 categories")
        
        # 获取所有工序类别名称
        cat2_names = {}
        cat2_query = db.query(models.ProcessCat2.cat2_code, models.ProcessCat2.name).all()
        for c in cat2_query:
            cat2_names[c.cat2_code] = c.name or c.cat2_code
        logger.info(f"[QuotaOptions] Found {len(cat2_names)} cat2 categories")
        
        # 获取所有电机型号名称
        model_names = {}
        model_query = db.query(models.MotorModel.model_code, models.MotorModel.name).all()
        for m in model_query:
            model_names[m.model_code] = m.name or m.model_code
        logger.info(f"[QuotaOptions] Found {len(model_names)} motor models")
        
        # 获取所有工序名称
        process_names = {}
        process_query = db.query(models.Process.process_code, models.Process.name).all()
        for p in process_query:
            process_names[p.process_code] = p.name or p.process_code
        logger.info(f"[QuotaOptions] Found {len(process_names)} processes")
        
        # 查询所有定额及其关联名称
        query = db.query(
            models.Quota.id.label('quota_id'),
            models.Quota.model_code,
            models.Quota.cat1_code,
            models.Quota.cat2_code,
            models.Quota.process_code,
            models.Quota.unit_price,
            models.Quota.effective_date,
            models.Quota.obsolete_date
        )
        
        # 获取所有结果
        results = query.all()
        total_records = len(results)
        logger.info(f"[QuotaOptions] Found {total_records} total quota records")
        
        # 构建返回数据
        quota_options = []
        cat1_set = set()
        cat2_dict = {}
        model_dict = {}
        
        for r in results:
            # 收集工段类别
            cat1_key = r.cat1_code
            if cat1_key and cat1_key not in cat1_set:
                cat1_set.add(cat1_key)
                cat2_dict[cat1_key] = set()
            
            # 收集工序类别（关联到工段）
            cat2_key = r.cat2_code
            if cat1_key and cat2_key:
                cat2_dict[cat1_key].add(cat2_key)
            
            # 收集电机型号 - 跟踪实际的(cat1_code, cat2_code)组合
            model_key = r.model_code
            if model_key:
                if model_key not in model_dict:
                    model_dict[model_key] = {
                        'name': model_names.get(model_key, model_key),
                        'cat1_cat2_pairs': set()  # 存储实际的(cat1, cat2)组合
                    }
                # 添加实际的组合
                model_dict[model_key]['cat1_cat2_pairs'].add((cat1_key, cat2_key))
            
            # 判断是否在有效期内
            is_effective = True
            if record_date:
                record_date_obj = date.fromisoformat(record_date)
                if record_date_obj > r.obsolete_date or record_date_obj < r.effective_date:
                    is_effective = False
            
            if not is_effective:
                continue
            
            quota_options.append({
                'quota_id': r.quota_id,
                'model_code': r.model_code,
                'model_name': model_names.get(r.model_code, r.model_code),
                'cat1_code': r.cat1_code,
                'cat1_name': cat1_names.get(r.cat1_code, r.cat1_code),
                'cat2_code': r.cat2_code,
                'cat2_name': cat2_names.get(r.cat2_code, r.cat2_code),
                'process_code': r.process_code,
                'process_name': process_names.get(r.process_code, r.process_code),
                'unit_price': float(r.unit_price) if r.unit_price else 0,
                'effective_date': str(r.effective_date),
                'obsolete_date': str(r.obsolete_date)
            })
        
        # 构建级联结构，使用实际名称
        cat1_options = []
        for code in sorted(cat1_set):
            name = cat1_names.get(code, code)
            cat1_options.append({
                'value': code,
                'label': f"{name} ({code})"
            })
        
        cat2_options = {}
        for cat1_code, cat2_codes in cat2_dict.items():
            cat2_list = []
            for code in sorted(cat2_codes):
                name = cat2_names.get(code, code)
                cat2_list.append({
                    'value': code,
                    'label': f"{name} ({code})"
                })
            cat2_options[cat1_code] = cat2_list
        
        model_options = []
        for code, info in sorted(model_dict.items()):
            # 将(cat1, cat2)组合转换为前端可用的格式
            cat1_cat2_pairs = []
            for pair in info['cat1_cat2_pairs']:
                cat1_cat2_pairs.append({'cat1': pair[0], 'cat2': pair[1]})
            model_options.append({
                'value': code,
                'label': f"{info['name']} ({code})",
                'cat1_cat2_pairs': cat1_cat2_pairs
            })
        
        elapsed_time = time.time() - start_time
        logger.info(f"[QuotaOptions] Returning {len(quota_options)} effective quota records, {len(cat1_options)} cat1 options, {len(model_options)} model options in {elapsed_time:.2f}s")
        
        return {
            'quota_options': quota_options,
            'cat1_options': cat1_options,
            'cat2_options': cat2_options,
            'model_options': model_options
        }
    except Exception as e:
        logger.error(f"[QuotaOptions] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取定额选项失败: {str(e)}")
