"""
Salary record management routes for Flask application
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import db
from app import models, crud
from datetime import datetime

salary_bp = Blueprint('salary', __name__)


def salary_to_dict(record):
    """Convert salary record (joined query result) to dictionary"""
    # Handle both VSalaryRecord objects and tuples from joined queries
    if hasattr(record, 'model_display'):
        # VSalaryRecord view object
        return {
            "id": record.id,
            "worker_code": record.worker_code,
            "quota_id": record.quota_id,
            "quantity": float(record.quantity) if record.quantity else None,
            "unit_price": float(record.unit_price) if record.unit_price else None,
            "amount": float(record.amount) if record.amount else None,
            "record_date": record.record_date.isoformat() if record.record_date else None,
            "created_by": record.created_by,
            "created_at": record.created_at.isoformat() if record.created_at else None,
            "model_display": getattr(record, 'model_display', None),
            "cat1_display": getattr(record, 'cat1_display', None),
            "cat2_display": getattr(record, 'cat2_display', None),
            "process_display": getattr(record, 'process_display', None)
        }
    elif hasattr(record, '_fields'):
        # Named tuple from joined query
        return {
            "id": record.id,
            "worker_code": record.worker_code,
            "quota_id": record.quota_id,
            "quantity": float(record.quantity) if record.quantity else None,
            "unit_price": float(record.unit_price) if record.unit_price else None,
            "amount": float(record.amount) if record.amount else None,
            "record_date": record.record_date.isoformat() if record.record_date else None,
            "created_by": record.created_by,
            "created_at": record.created_at.isoformat() if record.created_at else None,
            "model_display": getattr(record, 'model_display', None),
            "cat1_display": getattr(record, 'cat1_display', None),
            "cat2_display": getattr(record, 'cat2_display', None),
            "process_display": getattr(record, 'process_display', None)
        }
    else:
        # WorkRecord object with relationships
        model_display = None
        cat1_display = None
        cat2_display = None
        process_display = None
        
        if record.quota:
            if record.quota.model:
                model_display = f"{record.quota.model.name} ({record.quota.model.aliases})" if record.quota.model.aliases else record.quota.model.name
            if record.quota.cat1:
                cat1_display = f"{record.quota.cat1.cat1_code} ({record.quota.cat1.name})"
            if record.quota.cat2:
                cat2_display = f"{record.quota.cat2.cat2_code} ({record.quota.cat2.name})"
            if record.quota.process:
                process_display = f"{record.quota.process.process_code} ({record.quota.process.name})"
            
            unit_price = float(record.quota.unit_price) if record.quota.unit_price else 0
            amount = float(record.quantity) * unit_price if record.quantity else 0
        else:
            unit_price = 0
            amount = 0
        
        return {
            "id": record.id,
            "worker_code": record.worker_code,
            "quota_id": record.quota_id,
            "quantity": float(record.quantity) if record.quantity else None,
            "unit_price": unit_price,
            "amount": amount,
            "record_date": record.record_date.isoformat() if record.record_date else None,
            "created_by": record.created_by,
            "created_at": record.created_at.isoformat() if record.created_at else None,
            "model_display": model_display,
            "cat1_display": cat1_display,
            "cat2_display": cat2_display,
            "process_display": process_display
        }


@salary_bp.route('/salary-records/', methods=['GET'])
@jwt_required()
def get_records():
    """Get salary records list using joined query instead of view"""
    worker_code = request.args.get('worker_code')
    record_date = request.args.get('record_date')
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    
    # First try to use the view
    try:
        records = crud.get_salary_records(db.session, worker_code=worker_code, record_date=record_date, skip=skip, limit=limit)
        if records:
            return jsonify([salary_to_dict(r) for r in records])
    except Exception as e:
        pass
    
    # Fallback: Use joined query on tables directly
    from sqlalchemy import desc, func
    from app.models import WorkRecord, Quota, MotorModel, ProcessCat1, ProcessCat2, Process
    
    query = db.session.query(
        WorkRecord,
        MotorModel.name.label('model_name'),
        MotorModel.aliases.label('model_aliases'),
        ProcessCat1.cat1_code,
        ProcessCat1.name.label('cat1_name'),
        ProcessCat2.cat2_code,
        ProcessCat2.name.label('cat2_name'),
        Process.process_code,
        Process.name.label('process_name')
    ).outerjoin(
        Quota, WorkRecord.quota_id == Quota.id
    ).outerjoin(
        MotorModel, Quota.model_name == MotorModel.name
    ).outerjoin(
        ProcessCat1, Quota.cat1_code == ProcessCat1.cat1_code
    ).outerjoin(
        ProcessCat2, Quota.cat2_code == ProcessCat2.cat2_code
    ).outerjoin(
        Process, Quota.process_code == Process.process_code
    )
    
    if worker_code:
        query = query.filter(WorkRecord.worker_code == worker_code)
    if record_date:
        try:
            year_month = datetime.strptime(record_date, "%Y-%m")
            query = query.filter(
                func.date_format(WorkRecord.record_date, "%Y-%m") == record_date
            )
        except ValueError:
            query = query.filter(WorkRecord.record_date == record_date)
    
    results = query.order_by(desc(WorkRecord.id)).offset(skip).limit(limit).all()
    
    # Transform results to the expected format
    transformed_results = []
    for row in results:
        work_record = row[0]
        model_name = row[1]
        model_aliases = row[2]
        cat1_code = row[3]
        cat1_name = row[4]
        cat2_code = row[5]
        cat2_name = row[6]
        process_code = row[7]
        process_name = row[8]
        
        model_display = f"{model_name} ({model_aliases})" if model_aliases else model_name if model_name else None
        cat1_display = f"{cat1_code} ({cat1_name})" if cat1_code else None
        cat2_display = f"{cat2_code} ({cat2_name})" if cat2_code else None
        process_display = f"{process_code} ({process_name})" if process_code else None
        
        unit_price = float(row[0].quota.unit_price) if row[0].quota and row[0].quota.unit_price else 0
        amount = float(row[0].quantity) * unit_price if row[0].quantity else 0
        
        transformed_results.append({
            "id": work_record.id,
            "worker_code": work_record.worker_code,
            "quota_id": work_record.quota_id,
            "quantity": float(work_record.quantity) if work_record.quantity else None,
            "unit_price": unit_price,
            "amount": amount,
            "record_date": work_record.record_date.isoformat() if work_record.record_date else None,
            "created_by": work_record.created_by,
            "created_at": work_record.created_at.isoformat() if work_record.created_at else None,
            "model_display": model_display,
            "cat1_display": cat1_display,
            "cat2_display": cat2_display,
            "process_display": process_display
        })
    
    return jsonify(transformed_results)


@salary_bp.route('/salary-records/<int:record_id>', methods=['GET'])
@jwt_required()
def get_record(record_id):
    """Get salary record by ID"""
    # First try the view
    try:
        record = crud.get_salary_record_by_id(db.session, record_id=record_id)
        if record:
            return jsonify(salary_to_dict(record))
    except Exception as e:
        pass
    
    # Fallback: Query WorkRecord with joins
    from sqlalchemy import desc, func
    from app.models import WorkRecord, Quota, MotorModel, ProcessCat1, ProcessCat2, Process
    
    query = db.session.query(
        WorkRecord,
        MotorModel.name.label('model_name'),
        MotorModel.aliases.label('model_aliases'),
        ProcessCat1.cat1_code,
        ProcessCat1.name.label('cat1_name'),
        ProcessCat2.cat2_code,
        ProcessCat2.name.label('cat2_name'),
        Process.process_code,
        Process.name.label('process_name')
    ).outerjoin(
        Quota, WorkRecord.quota_id == Quota.id
    ).outerjoin(
        MotorModel, Quota.model_name == MotorModel.name
    ).outerjoin(
        ProcessCat1, Quota.cat1_code == ProcessCat1.cat1_code
    ).outerjoin(
        ProcessCat2, Quota.cat2_code == ProcessCat2.cat2_code
    ).outerjoin(
        Process, Quota.process_code == Process.process_code
    ).filter(WorkRecord.id == record_id)
    
    row = query.first()
    
    if not row:
        return jsonify({"detail": "Salary record not found"}), 404
    
    work_record = row[0]
    model_name = row[1]
    model_aliases = row[2]
    cat1_code = row[3]
    cat1_name = row[4]
    cat2_code = row[5]
    cat2_name = row[6]
    process_code = row[7]
    process_name = row[8]
    
    model_display = f"{model_name} ({model_aliases})" if model_aliases else model_name if model_name else None
    cat1_display = f"{cat1_code} ({cat1_name})" if cat1_code else None
    cat2_display = f"{cat2_code} ({cat2_name})" if cat2_code else None
    process_display = f"{process_code} ({process_name})" if process_code else None
    
    unit_price = float(work_record.quota.unit_price) if work_record.quota and work_record.quota.unit_price else 0
    amount = float(work_record.quantity) * unit_price if work_record.quantity else 0
    
    return jsonify({
        "id": work_record.id,
        "worker_code": work_record.worker_code,
        "quota_id": work_record.quota_id,
        "quantity": float(work_record.quantity) if work_record.quantity else None,
        "unit_price": unit_price,
        "amount": amount,
        "record_date": work_record.record_date.isoformat() if work_record.record_date else None,
        "created_by": work_record.created_by,
        "created_at": work_record.created_at.isoformat() if work_record.created_at else None,
        "model_display": model_display,
        "cat1_display": cat1_display,
        "cat2_display": cat2_display,
        "process_display": process_display
    })


@salary_bp.route('/salary-records/', methods=['POST'])
@jwt_required()
def create_record():
    """Create new salary record"""
    data = request.get_json()
    if not all([data.get('worker_code'), data.get('quota_id'), data.get('quantity'), data.get('record_date')]):
        return jsonify({"detail": "All fields are required"}), 400
    
    from app.schemas import WorkRecordCreate
    record_data = WorkRecordCreate(**data)
    try:
        record = crud.create_work_record(db.session, record=record_data, created_by=int(get_jwt_identity()))
        return jsonify(salary_to_dict(record)), 201
    except ValueError as e:
        return jsonify({"detail": str(e)}), 400


@salary_bp.route('/salary-records/<int:record_id>', methods=['PUT'])
@jwt_required()
def update_record(record_id):
    """Update salary record"""
    from app.schemas import WorkRecordUpdate
    data = request.get_json()
    record = crud.update_work_record(db.session, record_id=record_id, record_update=WorkRecordUpdate(**data))
    if not record:
        return jsonify({"detail": "Work record not found"}), 404
    return jsonify(salary_to_dict(record))


@salary_bp.route('/salary-records/<int:record_id>', methods=['DELETE'])
@jwt_required()
def delete_record(record_id):
    """Delete salary record"""
    result = crud.delete_work_record(db.session, record_id=record_id)
    if not result:
        return jsonify({"detail": "Work record not found"}), 404
    return jsonify({"message": "工作记录删除成功", "record_id": record_id})
