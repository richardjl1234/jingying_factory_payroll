"""
Flask application factory
"""
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app(config_name='default'):
    """Application factory pattern for Flask"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    jwt = JWTManager(app)
    
    # Add health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "message": "Flask backend is running"})
    
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({"status": "running", "message": "Flask backend API"})
    
    # Register blueprints - import directly to avoid circular imports
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
    
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(worker_bp, url_prefix='/api')
    app.register_blueprint(process_bp, url_prefix='/api')
    app.register_blueprint(quota_bp, url_prefix='/api')
    app.register_blueprint(salary_bp, url_prefix='/api')
    app.register_blueprint(report_bp, url_prefix='/api')
    app.register_blueprint(stats_bp)  # No url_prefix, route includes full path /api/stats/
    app.register_blueprint(process_cat1_bp, url_prefix='/api')
    app.register_blueprint(process_cat2_bp, url_prefix='/api')
    app.register_blueprint(motor_model_bp, url_prefix='/api')
    
    # Print registered routes for debugging
    print("\n=== Registered Routes ===")
    for rule in app.url_map.iter_rules():
        print(f"{rule.rule} -> {rule.endpoint} [{', '.join(rule.methods)}")
    print("==========================\n")
    
    # Register error handlers
    register_error_handlers(app)
    
    # Initialize database
    from app.database import init_db
    init_db(app)
    
    logger.info("Flask application created successfully")
    return app


def register_error_handlers(app):
    """Register global error handlers"""
    from flask import jsonify
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"detail": "Bad request", "error_type": "BadRequest"}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({"detail": "Unauthorized", "error_type": "Unauthorized"}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({"detail": "Forbidden", "error_type": "Forbidden"}), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"detail": "Not found", "error_type": "NotFound"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"detail": "Internal server error", "error_type": "ServerError"}), 500
