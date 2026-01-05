"""
Motor model routes for Flask application
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.database import db
from app import crud

motor_model_bp = Blueprint('motor_model', __name__)


def model_to_dict(model):
    return {
        "name": model.name,
        "aliases": model.aliases,
        "description": model.description,
        "created_at": model.created_at.isoformat() if model.created_at else None,
        "updated_at": model.updated_at.isoformat() if model.updated_at else None
    }


@motor_model_bp.route('/motor-models/test', methods=['GET'])
def test():
    return jsonify({"message": "motor-models endpoint is working"})


@motor_model_bp.route('/motor-models/', methods=['GET'])
@jwt_required()
def get_list():
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    return jsonify([model_to_dict(m) for m in crud.get_motor_model_list(db.session, skip=skip, limit=limit)])


@motor_model_bp.route('/motor-models/<name>', methods=['GET'])
@jwt_required()
def get_model(name):
    model = crud.get_motor_model_by_name(db.session, name=name)
    if not model:
        return jsonify({"detail": "Motor model not found"}), 404
    return jsonify(model_to_dict(model))


@motor_model_bp.route('/motor-models/', methods=['POST'])
@jwt_required()
def create_model():
    data = request.get_json()
    from app.schemas import MotorModelSchemaCreate
    model = crud.create_motor_model(db.session, MotorModelSchemaCreate(**data))
    return jsonify(model_to_dict(model)), 201


@motor_model_bp.route('/motor-models/<name>', methods=['PUT'])
@jwt_required()
def update_model(name):
    from app.schemas import MotorModelSchemaUpdate
    model = crud.update_motor_model(db.session, name=name, motor_model_update=MotorModelSchemaUpdate(**request.get_json()))
    if not model:
        return jsonify({"detail": "Motor model not found"}), 404
    return jsonify(model_to_dict(model))


@motor_model_bp.route('/motor-models/<name>', methods=['DELETE'])
@jwt_required()
def delete_model(name):
    if not crud.delete_motor_model(db.session, name=name):
        return jsonify({"detail": "Motor model not found"}), 404
    return jsonify({"message": "电机型号删除成功", "name": name})
