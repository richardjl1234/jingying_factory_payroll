# 使用Python 3.10作为基础镜像（已缓存本地）
FROM python:3.10

# 设置工作目录
WORKDIR /app

# 注意：由于网络问题，无法安装sqlite3包
# 如果需要sqlite3命令行工具，请在网络恢复后取消注释以下行：
RUN apt-get update -y && apt-get install -y --no-install-recommends sqlite3 && rm -rf /var/lib/apt/lists/*

# 复制后端依赖文件
COPY backend/requirements.txt /app/

# 更新pip并设置国内镜像源
RUN pip install --upgrade pip -i https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set global.trusted-host mirrors.aliyun.com

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
