"""
User management routes for Flask application
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import db
from app import crud
from app.models import User

user_bp = Blueprint('user', __name__)


def user_to_dict(user):
    """Convert User model to dictionary"""
    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "role": user.role,
        "wechat_openid": user.wechat_openid,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "need_change_password": user.need_change_password
    }


def check_admin():
    """Check if current user is admin"""
    user = db.session.query(User).get(int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return False, jsonify({"detail": "Not enough permissions"}), 403
    return True, user


@user_bp.route('/users/', methods=['GET'])
@jwt_required()
def get_users():
    """Get user list"""
    # Check admin
    ok, result = check_admin()
    if not ok:
        return result
    
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    
    users = crud.get_users(db.session, skip=skip, limit=limit)
    return jsonify([user_to_dict(user) for user in users])


@user_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get user by ID"""
    # Check admin
    ok, result = check_admin()
    if not ok:
        return result
    
    user = crud.get_user_by_id(db.session, user_id=user_id)
    if not user:
        return jsonify({"detail": "User not found"}), 404
    return jsonify(user_to_dict(user))


@user_bp.route('/users/', methods=['POST'])
@jwt_required()
def create_user():
    """Create new user"""
    # Check admin
    ok, result = check_admin()
    if not ok:
        return result
    
    data = request.get_json()
    
    username = data.get('username')
    name = data.get('name')
    role = data.get('role')
    password = data.get('password')
    
    if not username or not name or not role or not password:
        return jsonify({"detail": "All fields are required"}), 400
    
    if len(username) < 3 or len(username) > 50:
        return jsonify({"detail": "Username must be between 3 and 50 characters"}), 400
    
    if role not in ['admin', 'statistician', 'report']:
        return jsonify({"detail": "Invalid role"}), 400
    
    if len(password) < 6:
        return jsonify({"detail": "Password must be at least 6 characters"}), 400
    
    if crud.get_user_by_username(db.session, username=username):
        return jsonify({"detail": "Username already registered"}), 400
    
    from app.schemas import UserCreate
    user_data = UserCreate(username=username, name=name, role=role, password=password)
    user = crud.create_user(db.session, user=user_data)
    
    return jsonify(user_to_dict(user)), 201


@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user info"""
    # Check admin
    ok, result = check_admin()
    if not ok:
        return result
    
    data = request.get_json()
    
    from app.schemas import UserUpdate
    user_update = UserUpdate(**data)
    
    user = crud.update_user(db.session, user_id=user_id, user_update=user_update)
    if not user:
        return jsonify({"detail": "User not found"}), 404
    
    return jsonify(user_to_dict(user))


@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete user"""
    # Check admin
    ok, result = check_admin()
    if not ok:
        return result
    
    result = crud.delete_user(db.session, user_id=user_id)
    if not result:
        return jsonify({"detail": "User not found"}), 404
    
    return jsonify({"message": "用户删除成功", "user_id": user_id})
