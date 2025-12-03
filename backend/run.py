import os
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f'backend_debug_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    ]
)
logger = logging.getLogger(__name__)

logger.debug(f"当前工作目录: {os.getcwd()}")
logger.debug(f"数据库文件路径: {os.path.abspath('payroll.db')}")
logger.debug(f"是否存在数据库文件: {os.path.exists('payroll.db')}")

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
