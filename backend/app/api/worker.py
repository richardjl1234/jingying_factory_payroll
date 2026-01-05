"""
Worker management routes for Flask application
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import db
from app import crud

worker_bp = Blueprint('worker', __name__)


def worker_to_dict(worker):
    """Convert Worker model to dictionary"""
    return {
        "worker_code": worker.worker_code,
        "name": worker.name,
        "created_at": worker.created_at.isoformat() if worker.created_at else None,
        "updated_at": worker.updated_at.isoformat() if worker.updated_at else None
    }


@worker_bp.route('/workers/', methods=['GET'])
@jwt_required()
def get_workers():
    """Get worker list"""
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    
    workers = crud.get_workers(db.session, skip=skip, limit=limit)
    return jsonify([worker_to_dict(worker) for worker in workers])


@worker_bp.route('/workers/<worker_code>', methods=['GET'])
@jwt_required()
def get_worker(worker_code):
    """Get worker by code"""
    worker = crud.get_worker_by_code(db.session, worker_code=worker_code)
    if not worker:
        return jsonify({"detail": "Worker not found"}), 404
    return jsonify(worker_to_dict(worker))


@worker_bp.route('/workers/', methods=['POST'])
@jwt_required()
def create_worker():
    """Create new worker"""
    data = request.get_json()
    
    worker_code = data.get('worker_code')
    name = data.get('name')
    
    if not worker_code or not name:
        return jsonify({"detail": "Worker code and name are required"}), 400
    
    if len(worker_code) < 1 or len(worker_code) > 20:
        return jsonify({"detail": "Worker code must be between 1 and 20 characters"}), 400
    
    if len(name) < 1 or len(name) > 50:
        return jsonify({"detail": "Name must be between 1 and 50 characters"}), 400
    
    if crud.get_worker_by_code(db.session, worker_code=worker_code):
        return jsonify({"detail": "Worker code already exists"}), 400
    
    from app.schemas import WorkerCreate
    worker_data = WorkerCreate(worker_code=worker_code, name=name)
    worker = crud.create_worker(db.session, worker=worker_data)
    
    return jsonify(worker_to_dict(worker)), 201


@worker_bp.route('/workers/<worker_code>', methods=['PUT'])
@jwt_required()
def update_worker(worker_code):
    """Update worker info"""
    data = request.get_json()
    
    from app.schemas import WorkerUpdate
    worker_update = WorkerUpdate(**data)
    
    worker = crud.update_worker(db.session, worker_code=worker_code, worker_update=worker_update)
    if not worker:
        return jsonify({"detail": "Worker not found"}), 404
    
    return jsonify(worker_to_dict(worker))


@worker_bp.route('/workers/<worker_code>', methods=['DELETE'])
@jwt_required()
def delete_worker(worker_code):
    """Delete worker"""
    result = crud.delete_worker(db.session, worker_code=worker_code)
    if not result:
        return jsonify({"detail": "Worker not found"}), 404
    
    return jsonify({"message": "工人删除成功", "worker_code": worker_code})
