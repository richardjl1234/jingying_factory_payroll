import logging
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

logger = logging.getLogger(__name__)

# 加载环境变量
logger.debug("加载环境变量...")
load_dotenv()

# 获取项目根目录 - 从环境变量读取
PROJECT_ROOT = os.getenv("PROJECT_ROOT")
if not PROJECT_ROOT:
    raise ValueError("PROJECT_ROOT environment variable is not set")
logger.debug(f"项目根目录: {PROJECT_ROOT}")

# 获取数据库URL - 必须从环境变量设置，无默认值
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# 替换DATABASE_URL中的${PROJECT_ROOT}为实际值
if "${PROJECT_ROOT}" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("${PROJECT_ROOT}", PROJECT_ROOT)
    
logger.debug(f"数据库URL: {DATABASE_URL}")

# 创建数据库引擎
logger.debug("创建数据库引擎...")
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
logger.debug(f"数据库引擎创建完成: {engine}")

# 为SQLite启用外键约束
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        logger.debug("启用SQLite外键约束")
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

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
