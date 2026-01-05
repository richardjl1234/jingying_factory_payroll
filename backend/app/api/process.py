"""
Process management routes for Flask application
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import db
from app import crud

process_bp = Blueprint('process', __name__)


def process_to_dict(process):
    return {
        "process_code": process.process_code,
        "name": process.name,
        "description": process.description,
        "created_at": process.created_at.isoformat() if process.created_at else None,
        "updated_at": process.updated_at.isoformat() if process.updated_at else None
    }


@process_bp.route('/processes/', methods=['GET'])
@jwt_required()
def get_processes():
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    processes = crud.get_processes(db.session, skip=skip, limit=limit)
    return jsonify([process_to_dict(p) for p in processes])


@process_bp.route('/processes/<process_code>', methods=['GET'])
@jwt_required()
def get_process(process_code):
    process = crud.get_process_by_code(db.session, process_code=process_code)
    if not process:
        return jsonify({"detail": "Process not found"}), 404
    return jsonify(process_to_dict(process))


@process_bp.route('/processes/', methods=['POST'])
@jwt_required()
def create_process():
    data = request.get_json()
    process_code = data.get('process_code')
    name = data.get('name')
    description = data.get('description')
    
    if not process_code or not name:
        return jsonify({"detail": "Process code and name are required"}), 400
    
    if crud.get_process_by_code(db.session, process_code=process_code):
        return jsonify({"detail": "Process code already exists"}), 400
    
    if crud.get_process_by_name(db.session, process_name=name):
        return jsonify({"detail": "Process name already exists"}), 400
    
    from app.schemas import ProcessCreate
    process = crud.create_process(db.session, ProcessCreate(process_code=process_code, name=name, description=description))
    return jsonify(process_to_dict(process)), 201


@process_bp.route('/processes/<process_code>', methods=['PUT'])
@jwt_required()
def update_process(process_code):
    data = request.get_json()
    from app.schemas import ProcessUpdate
    process_update = ProcessUpdate(**data)
    if process_update.name:
        existing = crud.get_process_by_name(db.session, process_update.name)
        if existing and existing.process_code != process_code:
            return jsonify({"detail": "Process name already exists"}), 400
    process = crud.update_process(db.session, process_code=process_code, process_update=process_update)
    if not process:
        return jsonify({"detail": "Process not found"}), 404
    return jsonify(process_to_dict(process))


@process_bp.route('/processes/<process_code>', methods=['DELETE'])
@jwt_required()
def delete_process(process_code):
    result = crud.delete_process(db.session, process_code=process_code)
    if not result:
        return jsonify({"detail": "Process not found"}), 404
    return jsonify({"message": "工序删除成功", "process_code": process_code})
