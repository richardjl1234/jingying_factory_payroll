"""
Report routes for Flask application
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import db
from app.models import User
from app.utils.report_helpers import get_worker_by_code, get_salary_records_by_worker_and_month, calculate_total_amount, get_process_by_code, get_process_workload_summary, get_salary_summary

report_bp = Blueprint('report', __name__, url_prefix='/reports')


def check_report_user():
    user = User.query.get(get_jwt_identity())
    if not user or user.role not in ['admin', 'report', 'statistician']:
        return False, jsonify({"detail": "Not enough permissions"}), 403
    return True, user


@report_bp.route('/worker-salary/<worker_code>/<month>', methods=['GET'])
@jwt_required()
def get_worker_salary_report(worker_code, month):
    ok, result = check_report_user()
    if not ok:
        return result
    
    worker = get_worker_by_code(db.session, worker_code)
    if not worker:
        return jsonify({"detail": "Worker not found"}), 404
    
    records = get_salary_records_by_worker_and_month(db.session, worker_code, month)
    total_amount = calculate_total_amount(records)
    
    details = []
    for record in records:
        process = get_process_by_code(db.session, record.quota.process_code)
        details.append({
            "process_code": record.quota.process_code,
            "process_name": process.name if process else "未知工序",
            "process_category": "",
            "quantity": float(record.quantity) if record.quantity else 0,
            "unit_price": float(record.unit_price) if record.unit_price else 0,
            "amount": float(record.amount) if record.amount else 0
        })
    
    return jsonify({
        "worker_code": worker.worker_code,
        "worker_name": worker.name,
        "month": month,
        "total_amount": float(total_amount) if total_amount else 0,
        "details": details
    })


@report_bp.route('/process-workload/<month>', methods=['GET'])
@jwt_required()
def get_process_workload_report(month):
    ok, result = check_report_user()
    if not ok:
        return result
    
    reports = get_process_workload_summary(db.session, month)
    result = []
    for report in reports:
        result.append({
            "process_code": report.get('process_code'),
            "process_name": report.get('process_name'),
            "process_category": "",
            "month": month,
            "total_quantity": float(report.get('total_quantity', 0)) if report.get('total_quantity') else 0,
            "total_amount": float(report.get('total_amount', 0)) if report.get('total_amount') else 0
        })
    return jsonify(result)


@report_bp.route('/salary-summary/<month>', methods=['GET'])
@jwt_required()
def get_salary_summary_report(month):
    ok, result = check_report_user()
    if not ok:
        return result
    
    summary = get_salary_summary(db.session, month)
    return jsonify({
        "month": summary.get('month'),
        "total_workers": summary.get('total_workers', 0),
        "total_amount": float(summary.get('total_amount', 0)) if summary.get('total_amount') else 0,
        "category_summary": summary.get('category_summary', [])
    })
