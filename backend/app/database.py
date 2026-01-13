import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

logger = logging.getLogger(__name__)

# 获取数据库URL - 必须从环境变量设置，无默认值
MYSQL_DB_URL = os.getenv("MYSQL_DB_URL")
if not MYSQL_DB_URL:
    raise ValueError("MYSQL_DB_URL environment variable is not set")
    
logger.debug(f"数据库URL: {MYSQL_DB_URL}")

# 创建数据库引擎
logger.debug("创建数据库引擎...")
engine = create_engine(MYSQL_DB_URL)
logger.debug(f"数据库引擎创建完成: {engine}")

# 创建会话本地类
logger.debug("创建会话本地类...")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
logger.debug("会话本地类创建完成")

# 创建基础类
Base = declarative_base()
logger.debug("基础类创建完成")

# 依赖项：获取数据库会话
def get_db():
    """获取数据库会话"""
    logger.debug("获取数据库会话...")
    db = SessionLocal()
    try:
        logger.debug("数据库会话已创建，准备yield")
        yield db
        logger.debug("数据库会话使用完成")
    except Exception as e:
        logger.error(f"数据库会话发生错误: {e}", exc_info=True)
        raise
    finally:
        logger.debug("关闭数据库会话")
        db.close()
