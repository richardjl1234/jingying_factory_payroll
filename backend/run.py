import os
import logging
from logging.handlers import RotatingFileHandler

# 从环境变量获取日志级别配置
LOG_LEVEL_MAP = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR
}

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
log_level = LOG_LEVEL_MAP.get(LOG_LEVEL, logging.INFO)

# 配置日志 - 使用单个日志文件
log_file = 'backend.log'
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,          # 保留5个备份文件
            encoding='utf-8'
        )
    ]
)
logger = logging.getLogger(__name__)

# 从app.database导入配置，不再直接检查当前目录的数据库文件
from app.main import app
from app.database import engine
from app import models

# 创建所有数据库表
logger.debug("开始创建数据库表...")
models.Base.metadata.create_all(bind=engine)
logger.debug("数据库表创建完成")

if __name__ == "__main__":
    import uvicorn
    logger.info("启动Uvicorn服务器...")
    logger.debug(f"主机: 0.0.0.0, 端口: 8000, 重载模式: True")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
