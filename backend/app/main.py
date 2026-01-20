import os
import logging

# Get logger - logging should already be configured in run.py
logger = logging.getLogger(__name__)

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import time
from jose import jwt
from sqlalchemy.exc import SQLAlchemyError

from . import models
from .database import engine
from .api import auth, user, worker, process, quota, salary, report, stats, process_cat1, process_cat2, motor_model, column_seq

# 创建数据库表
logger.debug("开始创建数据库表...")
models.Base.metadata.create_all(bind=engine)
logger.debug("数据库表创建完成")

# 创建FastAPI应用
logger.debug("创建FastAPI应用...")
app = FastAPI(
    title="工厂定额和计件工资管理系统",
    description="用于工厂定额和计件工资管理的API服务",
    version="1.0.0"
)
logger.debug("FastAPI应用创建完成")

# 配置CORS
logger.debug("配置CORS中间件...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.debug("CORS中间件配置完成")

# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"收到请求: {request.method} {request.url.path}")
    logger.debug(f"请求头: {dict(request.headers)}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"请求处理完成: {request.method} {request.url.path} 状态码: {response.status_code} 耗时: {process_time:.3f}s")
    return response

# 全局异常处理器
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理器，统一处理所有未捕获的异常"""
    status_code = getattr(exc, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
    detail = getattr(exc, "detail", "服务器内部错误")
    
    if isinstance(exc, HTTPException):
        logger.warning(f"HTTP异常: {exc.status_code} - {exc.detail}, 请求: {request.method} {request.url}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "error_type": "HTTPException"}
        )
    elif isinstance(exc, jwt.JWTError):
        logger.warning(f"JWT令牌错误: {str(exc)}, 请求: {request.method} {request.url}")
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "无效的认证令牌", "error_type": "JWTError"}
        )
    elif isinstance(exc, SQLAlchemyError):
        logger.error(f"数据库错误: {str(exc)}, 请求: {request.method} {request.url}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "数据库操作失败", "error_type": "DatabaseError"}
        )
    else:
        logger.error(f"未处理的异常: {type(exc).__name__} - {str(exc)}, 请求: {request.method} {request.url}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "服务器内部错误", "error_type": "ServerError"}
        )

# 包含路由
logger.debug("包含API路由...")
app.include_router(auth.router, prefix="/api")
logger.debug("包含auth路由完成")
app.include_router(user.router, prefix="/api")
logger.debug("包含user路由完成")
app.include_router(worker.router, prefix="/api")
logger.debug("包含worker路由完成")
app.include_router(process.router, prefix="/api")
logger.debug("包含process路由完成")
app.include_router(quota.router, prefix="/api")
logger.debug("包含quota路由完成")
app.include_router(salary.router, prefix="/api")
logger.debug("包含salary路由完成")
app.include_router(report.router, prefix="/api")
logger.debug("包含report路由完成")
app.include_router(stats.router, prefix="/api")
logger.debug("包含stats路由完成")
app.include_router(process_cat1.router, prefix="/api")
logger.debug("包含process_cat1路由完成")
app.include_router(process_cat2.router, prefix="/api")
logger.debug("包含process_cat2路由完成")
app.include_router(motor_model.router, prefix="/api")
logger.debug("包含motor_model路由完成")
app.include_router(column_seq.router, prefix="/api")
logger.debug("包含column_seq路由完成")
logger.debug("所有API路由包含完成")

# 健康检查端点
@app.get("/api/health")
def health_check():
    """健康检查端点，用于Docker健康检查"""
    logger.debug("健康检查请求")
    return {"status": "healthy", "timestamp": time.time()}

# 测试motor-models路由是否工作
@app.get("/api/test-motor-models")
def test_motor_models():
    """测试motor-models路由是否工作"""
    logger.debug("测试motor-models路由请求")
    return {"message": "motor-models路由测试成功", "timestamp": time.time()}

# 获取当前文件的绝对路径，然后构建静态文件目录的绝对路径
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")
ASSETS_DIR = os.path.join(FRONTEND_DIST_DIR, "assets")
INDEX_HTML_PATH = os.path.join(FRONTEND_DIST_DIR, "index.html")

logger.debug(f"BASE_DIR: {BASE_DIR}")
logger.debug(f"FRONTEND_DIST_DIR: {FRONTEND_DIST_DIR}")
logger.debug(f"ASSETS_DIR: {ASSETS_DIR}")
logger.debug(f"INDEX_HTML_PATH: {INDEX_HTML_PATH}")

# 检查前端静态文件是否存在，如果不存在则跳过挂载（用于本地开发模式）
if os.path.exists(ASSETS_DIR):
    # 挂载前端静态文件
    logger.debug("挂载前端静态文件...")
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
    logger.debug("前端静态文件挂载完成")
else:
    logger.debug("前端静态文件目录不存在，跳过挂载（本地开发模式）")

# 处理所有其他路径，返回前端HTML，支持React Router
@app.get("/{path:path}")
def catch_all(path: str):
    """处理所有其他路径，返回前端HTML"""
    logger.debug(f"捕获路径: {path}")
    # 确保API路由不被通配符路由匹配
    if path.startswith("api/"):
        logger.debug(f"路径 {path} 以api/开头，返回404")
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    
    # 如果前端静态文件不存在，返回错误信息
    if not os.path.exists(INDEX_HTML_PATH):
        logger.debug(f"前端HTML不存在: {INDEX_HTML_PATH}")
        return JSONResponse(
            status_code=503,
            content={
                "detail": "前端静态文件不存在，请先构建前端项目或使用Docker运行",
                "frontend_dist_exists": False,
                "frontend_dist_path": FRONTEND_DIST_DIR
            }
        )
    
    logger.debug(f"返回前端HTML: {INDEX_HTML_PATH}")
    return FileResponse(INDEX_HTML_PATH)

# 根路径返回前端HTML
@app.get("/")
def read_root():
    """根路径，返回前端HTML"""
    logger.debug("根路径请求，返回前端HTML")
    
    # 如果前端静态文件不存在，返回错误信息
    if not os.path.exists(INDEX_HTML_PATH):
        logger.debug(f"前端HTML不存在: {INDEX_HTML_PATH}")
        return JSONResponse(
            status_code=503,
            content={
                "detail": "前端静态文件不存在，请先构建前端项目或使用Docker运行",
                "frontend_dist_exists": False,
                "frontend_dist_path": FRONTEND_DIST_DIR
            }
        )
    
    return FileResponse(INDEX_HTML_PATH)

logger.info("应用启动完成")
