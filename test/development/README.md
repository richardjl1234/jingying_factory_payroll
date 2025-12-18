# 开发环境测试套件

这个测试套件用于测试开发环境中的应用程序，包括前端和后端。

## 测试套件结构

```
test/development/
├── config.js              # 测试配置文件
├── utils.js               # 测试工具函数
├── test_login.js          # 前端登录测试
├── test_api.py            # 后端API测试
├── run_tests.sh           # Unix测试运行脚本
├── run_tests.bat          # Windows测试运行脚本
└── README.md              # 本说明文件
```

## 配置说明

### config.js

测试配置文件包含以下配置项：

- **BASE_URLS**: 测试环境URL
  - `backend`: 后端服务URL，默认为 `http://localhost:8000`
  - `frontend`: 前端服务URL，默认为 `http://localhost:5173`（符合要求）

- **TEST_CREDENTIALS**: 测试用户凭证
  - `admin`: 管理员用户凭证
  - `report`: 报表用户凭证

- **TIMEOUTS**: 测试超时设置（毫秒）
  - `short`: 5000毫秒
  - `medium`: 15000毫秒
  - `long`: 30000毫秒

- **API_ENDPOINTS**: API端点路径

## 测试内容

### 1. 后端API测试 (test_api.py)

测试以下API端点：
- 健康检查（如果可用）
- 用户登录
- 获取用户列表
- 获取工人列表
- 获取工序列表

### 2. 前端登录测试 (test_login.js)

测试前端登录功能：
- 访问登录页面
- 输入凭证
- 点击登录按钮
- 验证登录结果

## 如何运行测试

### 在Windows上运行

1. 确保前端服务正在 `http://localhost:5173` 运行
2. 确保后端服务正在 `http://localhost:8000` 运行
3. 打开命令提示符（CMD）
4. 导航到测试目录：
   ```
   cd e:\jianglei\trae\new_payroll\test\development
   ```
5. 运行测试：
   ```
   run_tests.bat
   ```

### 运行特定测试

- 只运行API测试：
  ```
  run_tests.bat --api-only
  ```

- 只运行前端测试：
  ```
  run_tests.bat --frontend-only
  ```

### 在Unix/Linux上运行

1. 确保前端服务正在 `http://localhost:5173` 运行
2. 确保后端服务正在 `http://localhost:8000` 运行
3. 打开终端
4. 导航到测试目录：
   ```
   cd /path/to/new_payroll/test/development
   ```
5. 赋予脚本执行权限：
   ```
   chmod +x run_tests.sh
   ```
6. 运行测试：
   ```
   ./run_tests.sh
   ```

## 测试结果

- 测试结果会显示在控制台
- 截图会保存在 `screenshots` 目录（自动创建）
- 详细调试信息会保存在 `debug` 目录（失败时自动创建）

## 依赖

### 前端测试依赖
- Node.js
- Puppeteer（会自动安装）

### 后端测试依赖
- Python 3
- requests 库（会自动安装）

## 扩展测试套件

要添加新的测试：

1. 创建新的测试文件（如 `test_new_feature.js` 或 `test_new_api.py`）
2. 在测试文件中导入配置和工具函数
3. 添加新的测试逻辑
4. 更新 `run_tests.sh` 和 `run_tests.bat` 以包含新测试

## 注意事项

- 确保在运行测试前，前端和后端服务已经启动
- 测试使用默认的测试凭证，确保这些凭证在开发环境中有效
- 可以通过环境变量覆盖默认配置，例如：
  ```
  set TEST_BASE_URL=http://localhost:8001
  run_tests.bat
  ```
