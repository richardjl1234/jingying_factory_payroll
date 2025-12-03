from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from . import models
from .database import engine
from .api import auth, user, worker, process, quota, salary, report, stats

# 加载环境变量
load_dotenv()

# 创建数据库表
models.Base.metadata.create_all(bind=engine)

# 创建FastAPI应用
app = FastAPI(
    title="工厂定额和计件工资管理系统",
    description="用于工厂定额和计件工资管理的API服务",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由
app.include_router(auth.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(worker.router, prefix="/api")
app.include_router(process.router, prefix="/api")
app.include_router(quota.router, prefix="/api")
app.include_router(salary.router, prefix="/api")
app.include_router(report.router, prefix="/api")
app.include_router(stats.router, prefix="/api")

import os

# 获取当前文件的绝对路径，然后构建静态文件目录的绝对路径
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")
ASSETS_DIR = os.path.join(FRONTEND_DIST_DIR, "assets")
INDEX_HTML_PATH = os.path.join(FRONTEND_DIST_DIR, "index.html")

# 挂载前端静态文件
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

# 处理所有其他路径，返回前端HTML，支持React Router
@app.get("/{path:path}")
def catch_all(path: str):
    """处理所有其他路径，返回前端HTML"""
    # 确保API路由不被通配符路由匹配
    if path.startswith("api/"):
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    return FileResponse(INDEX_HTML_PATH)

# 根路径返回前端HTML
@app.get("/")
def read_root():
    """根路径，返回前端HTML"""
    return FileResponse(INDEX_HTML_PATH)
