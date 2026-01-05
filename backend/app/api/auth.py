"""
Authentication routes for Flask application
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, current_user
from datetime import timedelta
from app.database import db
from app import crud, schemas
from app.models import User
from app.utils.auth import verify_password

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"detail": "Username and password are required"}), 400
    
    user = crud.get_user_by_username(db.session, username=username)
    if not user or not verify_password(password, user.password):
        return jsonify({"detail": "Incorrect username or password"}), 401
    
    access_token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(minutes=30)
    )
    
    user_data = {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "role": user.role,
        "wechat_openid": user.wechat_openid,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "need_change_password": user.need_change_password
    }
    
    return jsonify({
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    })


@auth_bp.route('/auth/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change password endpoint"""
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    
    if not old_password or not new_password or not confirm_password:
        return jsonify({"detail": "All password fields are required"}), 400
    
    user = User.query.get(int(get_jwt_identity()))
    
    if not user:
        return jsonify({"detail": "User not found"}), 404
    
    if not verify_password(old_password, user.password):
        return jsonify({"detail": "Incorrect old password"}), 400
    
    if new_password != confirm_password:
        return jsonify({"detail": "New password and confirm password do not match"}), 400
    
    if len(new_password) < 6:
        return jsonify({"detail": "Password must be at least 6 characters"}), 400
    
    updated_user = crud.update_user(
        db.session,
        user_id=user.id,
        user_update=schemas.UserUpdate(password=new_password)
    )
    updated_user.need_change_password = False
    db.session.commit()
    
    return jsonify({"message": "Password changed successfully"})


@auth_bp.route('/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    user = User.query.get(int(get_jwt_identity()))
    
    if not user:
        return jsonify({"detail": "User not found"}), 404
    
    user_data = {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "role": user.role,
        "wechat_openid": user.wechat_openid,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "need_change_password": user.need_change_password
    }
    
    return jsonify(user_data)
