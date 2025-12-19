import os
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler

# 配置日志
log_file = f'backend_debug_{datetime.now().strftime("%Y%m%d")}.log'
logging.basicConfig(
    level=logging.DEBUG,
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
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, log_level="debug")
