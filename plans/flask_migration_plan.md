# Flask Migration Plan

## Overview

This document outlines the comprehensive plan to migrate the existing FastAPI backend to Flask while maintaining all functionality, API endpoints, and behavior.

## Current Architecture Analysis

### FastAPI Application Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI app initialization, CORS, routes
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic request/response models
│   ├── crud.py              # Database operations
│   ├── database.py          # Database connection and session management
│   ├── dependencies.py      # Auth dependencies (OAuth2, JWT)
│   ├── api/                 # API route modules
│   │   ├── auth.py          # /api/auth/* endpoints
│   │   ├── user.py          # /api/users/* endpoints
│   │   ├── worker.py        # /api/workers/* endpoints
│   │   ├── process.py       # /api/processes/* endpoints
│   │   ├── quota.py         # /api/quotas/* endpoints
│   │   ├── salary.py        # /api/salary-records/* endpoints
│   │   ├── report.py        # /api/reports/* endpoints
│   │   ├── stats.py         # /api/stats/* endpoints
│   │   ├── process_cat1.py  # /api/process-cat1/* endpoints
│   │   ├── process_cat2.py  # /api/process-cat2/* endpoints
│   │   └── motor_model.py   # /api/motor-models/* endpoints
│   └── utils/
│       ├── auth.py          # JWT and password handling
│       └── report_helpers.py # Report generation utilities
├── run.py                   # Application entry point with uvicorn
├── requirements.txt         # Dependencies
└── tests/                   # Test suite
```

### Key FastAPI Features Used
- **Decorators**: `@app.get()`, `@app.post()`, `@app.put()`, `@app.delete()`
- **Dependency Injection**: `Depends()` for auth and database sessions
- **Response Models**: `response_model` for automatic validation
- **HTTP Exceptions**: `HTTPException` for error handling
- **CORS Middleware**: `CORSMiddleware` for frontend access
- **Static Files**: `StaticFiles` for serving frontend build
- **Request Validation**: Pydantic models with Field validators

### API Endpoints (12 groups, ~50 endpoints)
1. **Auth**: `/api/auth/login`, `/api/auth/change-password`, `/api/auth/me`
2. **Users**: CRUD operations on `/api/users/`
3. **Workers**: CRUD operations on `/api/workers/`
4. **Processes**: CRUD operations on `/api/processes/`
5. **Quotas**: CRUD + special endpoints on `/api/quotas/`
6. **Salary Records**: CRUD operations on `/api/salary-records/`
7. **Reports**: `/api/reports/worker-salary/{code}/{month}`, etc.
8. **Stats**: `/api/stats/` (GET)
9. **Process Categories**: CRUD on `/api/process-cat1/` and `/api/process-cat2/`
10. **Motor Models**: CRUD on `/api/motor-models/`
11. **Health**: `/api/health`, `/api/test-motor-models`
12. **Frontend**: Catch-all route for React Router

---

## Migration Strategy

### Phase 1: Foundation Setup
1. **Replace FastAPI with Flask**
2. **Add Flask extensions**: Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS
3. **Add request validation**: Flask-WTF or marshmallow
4. **Keep existing**: SQLAlchemy models, JWT auth logic, utility functions

### Phase 2: Core Application Structure
1. **Create Flask app factory** pattern for better organization
2. **Reimplement database session management** (no more Depends())
3. **Implement JWT authentication** decorator
4. **Configure CORS** for frontend access

### Phase 3: API Endpoint Migration
1. **Convert each router module** from FastAPI to Flask
2. **Replace decorators** and function signatures
3. **Handle request parsing** from JSON body
4. **Return JSON responses** consistently

### Phase 4: Frontend Integration
1. **Serve static files** from Flask
2. **Implement catch-all route** for React Router
3. **Maintain all API paths** for frontend compatibility

### Phase 5: Testing & Validation
1. **Update test suite** for Flask TestClient
2. **Verify all endpoints** work identically
3. **Run integration tests** with frontend

---

## Detailed Implementation Plan

### Step 1: Create New Flask Application Structure

#### File: `backend/app/__init__.py`
```python
from flask import Flask
from flask_cors import CORS
from config import config

def create_app(config_name='default'):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app)
    
    # Register blueprints
    from app.api import auth, user, worker, process, quota, salary, report, stats, process_cat1, process_cat2, motor_model
    app.register_blueprint(auth.bp, url_prefix='/api')
    app.register_blueprint(user.bp, url_prefix='/api')
    # ... register all other blueprints
    
    # Register error handlers
    from app.errors import register_error_handlers
    register_error_handlers(app)
    
    return app
```

#### File: `backend/config.py`
```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    JWT_SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30')) * 60
    SQLALCHEMY_DATABASE_URL = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

config = {
    'default': Config
}
```

### Step 2: Replace Database Session Management

#### Current FastAPI Pattern (database.py):
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### New Flask Pattern (database.py):
```python
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine

db = SQLAlchemy()

def get_db():
    """Get database session for use in route handlers"""
    return db.session

def init_db(app):
    """Initialize database with Flask app"""
    db.init_app(app)
    with app.app_context():
        db.create_all()
```

### Step 3: Create JWT Authentication Decorator

#### New File: `backend/app/api/decorators.py`
```python
from functools import wraps
from flask import jsonify, request, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import User

def jwt_required(f):
    """Decorator to require JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        g.current_user = User.query.get(current_user_id)
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        g.current_user = User.query.get(current_user_id)
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
        if g.current_user.role not in ['admin', 'report', 'statistician']:
            return jsonify({"detail": "Not enough permissions"}), 403
        return f(*args, **kwargs)
    return decorated
```

### Step 4: Migrate Auth Routes

#### File: `backend/app/api/auth.py`
```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
from app import db, crud, schemas
from app.models import User
from app.utils.auth import verify_password

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = crud.get_user_by_username(db.session, username=username)
    if not user or not verify_password(password, user.password):
        return jsonify({"detail": "Incorrect username or password"}), 401
    
    access_token = create_access_token(
        identity=user.id,
        expires_delta=timedelta(minutes=30)
    )
    
    user_data = schemas.UserInDB.model_validate(user)
    return jsonify({
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data.model_dump()
    })

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required
def change_password():
    """Change password endpoint"""
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    
    current_user_id = get_jwt_identity()
    user = crud.get_user_by_id(db.session, user_id=current_user_id)
    
    if not verify_password(old_password, user.password):
        return jsonify({"detail": "Incorrect old password"}), 400
    
    if new_password != confirm_password:
        return jsonify({"detail": "New password and confirm password do not match"}), 400
    
    updated_user = crud.update_user(
        db.session,
        user_id=current_user_id,
        user_update=schemas.UserUpdate(password=new_password)
    )
    updated_user.need_change_password = False
    db.session.commit()
    
    return jsonify({"message": "Password changed successfully"})

@auth_bp.route('/me', methods=['GET'])
@jwt_required
def get_current_user():
    """Get current user info"""
    current_user_id = get_jwt_identity()
    user = crud.get_user_by_id(db.session, user_id=current_user_id)
    return jsonify(schemas.User.model_validate(user).model_dump())
```

### Step 5: Migrate User Routes

#### File: `backend/app/api/user.py`
```python
from flask import Blueprint, request, jsonify
from app import db, crud, schemas
from app.api.decorators import jwt_required, admin_required

user_bp = Blueprint('user', __name__, url_prefix='/users')

@user_bp.route('/', methods=['GET'])
@jwt_required
@admin_required
def get_users():
    """Get user list"""
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    users = crud.get_users(db.session, skip=skip, limit=limit)
    return jsonify([schemas.User.model_validate(u).model_dump() for u in users])

@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required
@admin_required
def get_user(user_id):
    """Get user by ID"""
    user = crud.get_user_by_id(db.session, user_id=user_id)
    if not user:
        return jsonify({"detail": "User not found"}), 404
    return jsonify(schemas.User.model_validate(user).model_dump())

@user_bp.route('/', methods=['POST'])
@jwt_required
@admin_required
def create_user():
    """Create new user"""
    data = request.get_json()
    user_data = schemas.UserCreate(**data)
    
    if crud.get_user_by_username(db.session, username=user_data.username):
        return jsonify({"detail": "Username already registered"}), 400
    
    user = crud.create_user(db.session, user=user_data)
    return jsonify(schemas.User.model_validate(user).model_dump()), 201

@user_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required
@admin_required
def update_user(user_id):
    """Update user info"""
    data = request.get_json()
    user_update = schemas.UserUpdate(**data)
    
    user = crud.update_user(db.session, user_id=user_id, user_update=user_update)
    if not user:
        return jsonify({"detail": "User not found"}), 404
    return jsonify(schemas.User.model_validate(user).model_dump())

@user_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required
@admin_required
def delete_user(user_id):
    """Delete user"""
    result = crud.delete_user(db.session, user_id=user_id)
    if not result:
        return jsonify({"detail": "User not found"}), 404
    return jsonify({"message": "用户删除成功", "user_id": user_id})
```

### Step 6: Migrate All Other Route Modules

Following the same pattern, migrate:
- `worker.py` → Flask blueprint with `@jwt_required` decorator
- `process.py` → Flask blueprint with CRUD operations
- `quota.py` → Flask blueprint with special endpoints
- `salary.py` → Flask blueprint for work records
- `report.py` → Flask blueprint with `@report_user_required`
- `stats.py` → Flask blueprint with statistics
- `process_cat1.py` → Flask blueprint
- `process_cat2.py` → Flask blueprint
- `motor_model.py` → Flask blueprint

### Step 7: Update Entry Point

#### File: `backend/run.py`
```python
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler
from app import create_app
from app.database import init_db

# Configure logging
log_file = f'backend_debug_{datetime.now().strftime("%Y%m%d")}.log'
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,
            backupCount=5,
            encoding='utf-8'
        )
    ]
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    app = create_app('default')
    init_db(app)
    
    logger.info("Starting Flask server...")
    logger.debug(f"Host: 0.0.0.0, Port: 8000, Debug: True")
    app.run(host="0.0.0.0", port=8000, debug=True)
```

### Step 8: Update Requirements

#### File: `backend/requirements.txt`
```
# Remove FastAPI dependencies
# fastapi==0.123.0
# uvicorn==0.38.0

# Add Flask dependencies
flask==3.0.0
flask-cors==4.0.0
flask-sqlalchemy==3.1.1
flask-jwt-extended==4.6.0

# Keep existing dependencies
sqlalchemy==2.0.44
pymysql==1.1.0
pydantic==2.12.5
python-jose[cryptography]==3.5.0
python-dotenv==1.2.1
passlib[bcrypt]==1.7.4
```

---

## Key Implementation Differences

| Aspect | FastAPI | Flask |
|--------|---------|-------|
| App Instance | `app = FastAPI()` | `app = Flask(__name__)` |
| Routes | `@app.get()` | `@bp.route()` or `@app.route()` |
| Database Session | `Depends(get_db)` | `db.session` global |
| Auth | `Depends(get_current_user)` | `@jwt_required` decorator |
| Request Body | Function parameter | `request.get_json()` |
| Response | Return dict/list | `jsonify(dict)` |
| Validation | Pydantic models | marshmallow or manual |
| OpenAPI | Auto-generated | flask-smorest |

---

## Migration Priority

1. **Critical Path** (Must work):
   - User authentication (login, JWT token)
   - All CRUD operations
   - Report generation

2. **Important** (Should work):
   - Statistics endpoint
   - Health check endpoints
   - Frontend static file serving

3. **Nice to Have** (Can be deferred):
   - API documentation (Swagger UI)
   - Advanced error handling
   - Performance optimization

---

## Testing Strategy

1. **Unit Tests**: Test CRUD operations directly on models
2. **API Tests**: Use Flask TestClient to test all endpoints
3. **Integration Tests**: Test full workflow with frontend
4. **Regression Tests**: Ensure existing functionality works

---

## Rollback Plan

If migration encounters issues:
1. Keep FastAPI code in separate branch
2. Deploy FastAPI version if critical issues arise
3. Gradually migrate endpoint groups with feature flags

---

## Estimated Complexity

- **Low Complexity**: Routes without auth (stats, health)
- **Medium Complexity**: Routes with basic CRUD and auth
- **High Complexity**: Reports with complex joins and aggregations
- **Highest Complexity**: Auth system with JWT and password handling
