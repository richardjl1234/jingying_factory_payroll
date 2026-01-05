"""
Flask application configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration"""
    # Secret keys
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    JWT_SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30')) * 60
    
    # Database configuration - must be set for Flask-SQLAlchemy
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    if not SQLALCHEMY_DATABASE_URI:
        raise ValueError("DATABASE_URL environment variable is not set")
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Logging configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'DEBUG')


# Configuration dictionary for different environments
config = {
    'default': Config,
    'development': Config,
    'production': Config,
}
