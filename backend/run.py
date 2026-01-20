import os
import sys
import logging
from logging.handlers import RotatingFileHandler
import uvicorn

# Configure logging FIRST - before any other imports
# Support both local and Docker environments
# Use the parent directory of backend (i.e., the project root)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_DIR = os.getenv("LOG_DIR", os.path.join(PROJECT_ROOT, "logs"))
os.makedirs(LOG_DIR, exist_ok=True)

log_file = os.path.join(LOG_DIR, "backend.log")
log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()

# Map log level string to logging constant
LOG_LEVEL_MAP = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR
}
log_level = LOG_LEVEL_MAP.get(log_level_str, logging.INFO)

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(log_level)
root_logger.handlers.clear()  # Clear any existing handlers

# File handler
file_handler = RotatingFileHandler(
    log_file,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5,
    encoding="utf-8"
)
file_handler.setLevel(log_level)
file_handler.setFormatter(
    logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
)
root_logger.addHandler(file_handler)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(log_level)
console_handler.setFormatter(
    logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
)
root_logger.addHandler(console_handler)

logger = logging.getLogger(__name__)

# Print startup message to confirm logging is working
print(f"[LOGGING INITIALIZED] log_file={log_file}, log_level={log_level_str}", flush=True)

if __name__ == "__main__":
    # Ensure PYTHONPATH includes backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    if "PYTHONPATH" not in os.environ:
        os.environ["PYTHONPATH"] = backend_dir
    elif backend_dir not in os.environ["PYTHONPATH"]:
        os.environ["PYTHONPATH"] = os.environ["PYTHONPATH"] + os.pathsep + backend_dir
    
    # Import app after PYTHONPATH is set and logging is configured
    from app.main import app
    
    logger.info("启动Uvicorn服务器...")
    logger.info(f"日志文件: {log_file}")
    logger.info(f"日志级别: {log_level_str}")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level=None  # Use our custom logging configuration from main.py
    )
