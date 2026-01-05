"""
Statistics routes for Flask application
"""
from flask import Blueprint, jsonify
from sqlalchemy import func
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import db
from app.models import User

stats_bp = Blueprint('stats', __name__)


def check_report_user():
    user = db.session.query(User).get(int(get_jwt_identity()))
    if not user or user.role not in ['admin', 'report', 'statistician']:
        return False, jsonify({"detail": "Not enough permissions"}), 403
    return True, user


@stats_bp.route('/api/stats/', methods=['GET'])
@jwt_required()
def get_statistics():
    """获取系统统计数据"""
    ok, result = check_report_user()
    if not ok:
        return result
    
    from app import models
    return jsonify({
        "user_count": db.session.query(func.count(models.User.id)).scalar() or 0,
        "worker_count": db.session.query(func.count(models.Worker.worker_code)).scalar() or 0,
        "process_cat1_count": db.session.query(func.count(models.ProcessCat1.cat1_code)).scalar() or 0,
        "process_cat2_count": db.session.query(func.count(models.ProcessCat2.cat2_code)).scalar() or 0,
        "model_count": db.session.query(func.count(models.MotorModel.name)).scalar() or 0,
        "process_count": db.session.query(func.count(models.Process.process_code)).scalar() or 0,
        "quota_count": db.session.query(func.count(models.Quota.id)).scalar() or 0,
        "salary_record_count": db.session.query(func.count(models.WorkRecord.id)).scalar() or 0,
        "report_count": 0  # Placeholder: no report table exists yet
    })
