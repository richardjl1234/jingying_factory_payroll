"""
JWT authentication decorators for Flask
"""
from functools import wraps
from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, jwt_required
from app.models import User


def jwt_required(f):
    """Decorator to require JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        g.current_user = User.query.get(current_user_id)
        if g.current_user is None:
            return jsonify({"detail": "User not found"}), 401
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        g.current_user = User.query.get(current_user_id)
        if g.current_user is None:
            return jsonify({"detail": "User not found"}), 401
        if g.current_user.role != 'admin':
            return jsonify({"detail": "Not enough permissions"}), 403
        return f(*args, **kwargs)
    return decorated


def report_user_required(f):
    """Decorator to require report/statistician/admin role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        g.current_user = User.query.get(current_user_id)
        if g.current_user is None:
            return jsonify({"detail": "User not found"}), 401
        if g.current_user.role not in ['admin', 'report', 'statistician']:
            return jsonify({"detail": "Not enough permissions"}), 403
        return f(*args, **kwargs)
    return decorated
