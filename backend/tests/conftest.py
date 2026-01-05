"""
Test configuration for Flask application
"""
import pytest
from flask import Flask
from app import create_app
from app.database import db
from app.models import User
from app.utils.auth import get_password_hash


@pytest.fixture(scope="function")
def app():
    """Create application for testing"""
    app = create_app('default')
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture(scope="function")
def test_user(app):
    """Create test user"""
    with app.app_context():
        user = User(
            username="testuser",
            name="Test User",
            role="admin",
            password=get_password_hash("testpass123"),
            need_change_password=False
        )
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        return user


@pytest.fixture(scope="function")
def auth_headers(test_user):
    """Create authorization headers for test user"""
    from flask_jwt_extended import create_access_token
    from datetime import timedelta
    
    app = create_app('default')
    with app.app_context():
        access_token = create_access_token(
            identity=test_user.id,
            expires_delta=timedelta(minutes=30)
        )
        return {"Authorization": f"Bearer {access_token}"}
