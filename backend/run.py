import os
print(f"当前工作目录: {os.getcwd()}")
print(f"数据库文件路径: {os.path.abspath('payroll.db')}")
print(f"是否存在数据库文件: {os.path.exists('payroll.db')}")

from app.main import app
from app.database import engine
from app import models

# 创建所有数据库表
models.Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
