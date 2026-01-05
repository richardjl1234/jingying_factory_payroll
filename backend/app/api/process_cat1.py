"""
Process category 1 routes for Flask application
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.database import db
from app import crud

process_cat1_bp = Blueprint('process_cat1', __name__)


def cat1_to_dict(cat1):
    return {
        "cat1_code": cat1.cat1_code,
        "name": cat1.name,
        "description": cat1.description,
        "created_at": cat1.created_at.isoformat() if cat1.created_at else None,
        "updated_at": cat1.updated_at.isoformat() if cat1.updated_at else None
    }


@process_cat1_bp.route('/process-cat1/', methods=['GET'])
@jwt_required()
def get_list():
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    return jsonify([cat1_to_dict(c) for c in crud.get_process_cat1_list(db.session, skip=skip, limit=limit)])


@process_cat1_bp.route('/process-cat1/<cat1_code>', methods=['GET'])
@jwt_required()
def get_cat1(cat1_code):
    cat1 = crud.get_process_cat1_by_code(db.session, cat1_code=cat1_code)
    if not cat1:
        return jsonify({"detail": "Process category 1 not found"}), 404
    return jsonify(cat1_to_dict(cat1))


@process_cat1_bp.route('/process-cat1/', methods=['POST'])
@jwt_required()
def create_cat1():
    data = request.get_json()
    from app.schemas import ProcessCat1Create
    cat1 = crud.create_process_cat1(db.session, ProcessCat1Create(**data))
    return jsonify(cat1_to_dict(cat1)), 201


@process_cat1_bp.route('/process-cat1/<cat1_code>', methods=['PUT'])
@jwt_required()
def update_cat1(cat1_code):
    from app.schemas import ProcessCat1Update
    cat1 = crud.update_process_cat1(db.session, cat1_code=cat1_code, process_cat1_update=ProcessCat1Update(**request.get_json()))
    if not cat1:
        return jsonify({"detail": "Process category 1 not found"}), 404
    return jsonify(cat1_to_dict(cat1))


@process_cat1_bp.route('/process-cat1/<cat1_code>', methods=['DELETE'])
@jwt_required()
def delete_cat1(cat1_code):
    if not crud.delete_process_cat1(db.session, cat1_code=cat1_code):
        return jsonify({"detail": "Process category 1 not found"}), 404
    return jsonify({"message": "工段类别删除成功", "cat1_code": cat1_code})
