"""
API blueprints module
"""
# Import blueprints for registration in app factory
from app.api.auth import auth_bp
from app.api.user import user_bp
from app.api.worker import worker_bp
from app.api.process import process_bp
from app.api.quota import quota_bp
from app.api.salary import salary_bp
from app.api.report import report_bp
from app.api.stats import stats_bp
from app.api.process_cat1 import process_cat1_bp
from app.api.process_cat2 import process_cat2_bp
from app.api.motor_model import motor_model_bp

__all__ = [
    'auth_bp',
    'user_bp', 
    'worker_bp',
    'process_bp',
    'quota_bp',
    'salary_bp',
    'report_bp',
    'stats_bp',
    'process_cat1_bp',
    'process_cat2_bp',
    'motor_model_bp',
]
