"""
Flask application entry point
"""
import os
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler

# Configure logging
log_file = f'backend_debug_{datetime.now().strftime("%Y%m%d")}.log'
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,          # Keep 5 backup files
            encoding='utf-8'
        )
    ]
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    from app import create_app
    
    app = create_app('default')
    
    logger.info("Starting Flask server...")
    logger.debug(f"Host: 0.0.0.0, Port: 8000, Debug: True")
    
    # Run Flask development server
    app.run(host="0.0.0.0", port=8000, debug=True, use_reloader=True)
