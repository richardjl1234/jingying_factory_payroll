"""
Process category 2 routes for Flask application
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.database import db
from app import crud

process_cat2_bp = Blueprint('process_cat2', __name__)


def cat2_to_dict(cat2):
    return {
        "cat2_code": cat2.cat2_code,
        "name": cat2.name,
        "description": cat2.description,
        "created_at": cat2.created_at.isoformat() if cat2.created_at else None,
        "updated_at": cat2.updated_at.isoformat() if cat2.updated_at else None
    }


@process_cat2_bp.route('/process-cat2/', methods=['GET'])
@jwt_required()
def get_list():
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    return jsonify([cat2_to_dict(c) for c in crud.get_process_cat2_list(db.session, skip=skip, limit=limit)])


@process_cat2_bp.route('/process-cat2/<cat2_code>', methods=['GET'])
@jwt_required()
def get_cat2(cat2_code):
    cat2 = crud.get_process_cat2_by_code(db.session, cat2_code=cat2_code)
    if not cat2:
        return jsonify({"detail": "Process category 2 not found"}), 404
    return jsonify(cat2_to_dict(cat2))


@process_cat2_bp.route('/process-cat2/', methods=['POST'])
@jwt_required()
def create_cat2():
    data = request.get_json()
    from app.schemas import ProcessCat2Create
    cat2 = crud.create_process_cat2(db.session, ProcessCat2Create(**data))
    return jsonify(cat2_to_dict(cat2)), 201


@process_cat2_bp.route('/process-cat2/<cat2_code>', methods=['PUT'])
@jwt_required()
def update_cat2(cat2_code):
    from app.schemas import ProcessCat2Update
    cat2 = crud.update_process_cat2(db.session, cat2_code=cat2_code, process_cat2_update=ProcessCat2Update(**request.get_json()))
    if not cat2:
        return jsonify({"detail": "Process category 2 not found"}), 404
    return jsonify(cat2_to_dict(cat2))


@process_cat2_bp.route('/process-cat2/<cat2_code>', methods=['DELETE'])
@jwt_required()
def delete_cat2(cat2_code):
    if not crud.delete_process_cat2(db.session, cat2_code=cat2_code):
        return jsonify({"detail": "Process category 2 not found"}), 404
    return jsonify({"message": "工序类别删除成功", "cat2_code": cat2_code})
