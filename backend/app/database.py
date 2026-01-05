"""
Database configuration for Flask application
"""
import logging
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import Config
from dotenv import load_dotenv
import os

load_dotenv()

logger = logging.getLogger(__name__)

# Create SQLAlchemy instance
db = SQLAlchemy()

# Create declarative base for models
Base = declarative_base()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Create engine for model creation
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db(app):
    """Initialize database with Flask app"""
    db.init_app(app)
    
    with app.app_context():
        # Create all tables
        from app import models
        models.Base.metadata.create_all(bind=engine)
        logger.debug("Database tables created successfully")


def get_db():
    """Get database session for use in route handlers"""
    return db.session


def close_db(exception=None):
    """Close database session"""
    db.session.remove()
