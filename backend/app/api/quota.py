"""
Quota management routes for Flask application
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import db
from app import crud
from datetime import datetime

quota_bp = Blueprint('quota', __name__)


def quota_to_dict(quota):
    return {
        "id": quota.id,
        "process_code": quota.process_code,
        "cat1_code": quota.cat1_code,
        "cat2_code": quota.cat2_code,
        "model_name": quota.model_name,
        "unit_price": float(quota.unit_price) if quota.unit_price else None,
        "effective_date": quota.effective_date.isoformat() if quota.effective_date else None,
        "obsolete_date": quota.obsolete_date.isoformat() if quota.obsolete_date else None,
        "created_by": quota.created_by,
        "created_at": quota.created_at.isoformat() if quota.created_at else None
    }


@quota_bp.route('/quotas/', methods=['GET'])
@jwt_required()
def get_quotas():
    process_code = request.args.get('process_code')
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    quotas = crud.get_quotas(db.session, process_code=process_code, skip=skip, limit=limit)
    return jsonify([quota_to_dict(q) for q in quotas])


@quota_bp.route('/quotas/<int:quota_id>', methods=['GET'])
@jwt_required()
def get_quota(quota_id):
    quota = crud.get_quota_by_id(db.session, quota_id=quota_id)
    if not quota:
        return jsonify({"detail": "Quota not found"}), 404
    return jsonify(quota_to_dict(quota))


@quota_bp.route('/quotas/latest/<process_code>', methods=['GET'])
@jwt_required()
def get_latest_quota(process_code):
    quota = crud.get_latest_quota(db.session, process_code=process_code)
    if not quota:
        return jsonify({"detail": "No quota found"}), 404
    return jsonify(quota_to_dict(quota))


@quota_bp.route('/quotas/', methods=['POST'])
@jwt_required()
def create_quota():
    data = request.get_json()
    if not all([data.get('process_code'), data.get('cat1_code'), data.get('cat2_code'), data.get('model_name'), data.get('unit_price'), data.get('effective_date')]):
        return jsonify({"detail": "All fields are required"}), 400
    
    from app.schemas import QuotaCreate
    quota_data = QuotaCreate(**data)
    quota = crud.create_quota(db.session, quota=quota_data, created_by=get_jwt_identity())
    return jsonify(quota_to_dict(quota)), 201


@quota_bp.route('/quotas/<int:quota_id>', methods=['PUT'])
@jwt_required()
def update_quota(quota_id):
    from app.schemas import QuotaUpdate
    data = request.get_json()
    quota = crud.update_quota(db.session, quota_id=quota_id, quota_update=QuotaUpdate(**data))
    if not quota:
        return jsonify({"detail": "Quota not found"}), 404
    return jsonify(quota_to_dict(quota))


@quota_bp.route('/quotas/<int:quota_id>', methods=['DELETE'])
@jwt_required()
def delete_quota(quota_id):
    result = crud.delete_quota(db.session, quota_id=quota_id)
    if not result:
        return jsonify({"detail": "Quota not found"}), 404
    return jsonify({"message": "定额删除成功", "quota_id": quota_id})
