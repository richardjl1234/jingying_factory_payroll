# 使用Python 3.10作为基础镜像
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制后端依赖文件
COPY backend/requirements.txt /app/

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend/ /app/backend/

# 复制前端构建好的静态资源
COPY frontend/dist/ /app/frontend/dist/

# 复制根目录的文件
COPY .env /app/

# 设置环境变量
ENV PYTHONPATH=/app
ENV DATABASE_URL=sqlite:///./payroll.db

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["python", "backend/run.py"]