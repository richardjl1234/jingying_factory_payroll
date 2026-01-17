# 工资记录管理页面重新设计计划

## 设计概述

重新设计 QuotaManagement 页面，从**定额矩阵查看页面**转变为**工人工作记录管理页面**。

### 新页面布局

```
┌─────────────────────────────────────────────────────────────────────────┐
│  工人选择 ▼                          记录月份 [当前月份按钮]             │
├─────────────────────────────────────────────────────────────────────────┤
│  [添加工作记录按钮] (暂时灰色，逻辑待定)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  工作记录表格                                                        │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐        │
│  │ 记录日期 │ 电机型号 │ 工段类别 │ 工序类别 │ 工序名称 │ 数量    │        │
│  ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤        │
│  │         │         │         │         │         │         │        │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘        │
├─────────────────────────────────────────────────────────────────────────┤
│  Summary: 总数量: xxx   总金额: ¥xxx.xx                                │
└─────────────────────────────────────────────────────────────────────────┘
```

## 详细设计说明

### 1. 过滤器区域 (Filter Area)

| 控件 | 类型 | 说明 |
|------|------|------|
| 工人选择 | Select | 从 `workers` 表获取工人列表，显示格式: "name (worker_code)" |
| 记录月份 | Input | 用户手动输入 YYYYMM 格式（如：202601） |
| 当前月份 | Button | 点击自动获取并填入当前月份（如：202601） |
| 添加工作记录 | Button | 暂时灰色不可用，逻辑待后续确定 |

### 2. 工作记录表格 (Work Records Table)

从 `v_salary_records` 视图查询数据，筛选条件：
- `worker_code = selected_worker`
- `record_date LIKE 'selected_month-%'` 或 `LEFT(record_date, 7) = selected_month`

| 列 | 字段 | 显示格式 |
|----|------|----------|
| 记录日期 | record_date | YYYY-MM-DD |
| 电机型号 | model_display | "name\n(code)" 换行显示 |
| 工段类别 | cat1_display | "name\n(code)" 换行显示 |
| 工序类别 | cat2_display | "name\n(code)" 换行显示 |
| 工序名称 | process_display | "name\n(code)" 换行显示 |
| 单价 | unit_price | ¥金额 |
| 数量 | quantity | 数字，保留2位小数 |
| 金额 | amount | ¥金额 |
| 操作 | action | 编辑/删除按钮 |

显示当月汇总信息：
- 总数量 (sum of quantity)
- 总金额 (sum of amount)

## 实现步骤

### 第一步：后端API扩展

#### 1.1 新增获取工人工作记录列表接口

```
GET /api/salary-records/worker-month/

Query Parameters:
- worker_code: string (required)
- month: string (required)  // format: YYYYMM

Response:
{
  "worker_code": "W001",
  "worker_name": "张三",
  "month": "202601",
  "records": [
    {
      "id": 1,
      "record_date": "2026-01-15",
      "model_display": "型号100-1 (100-1)",
      "cat1_display": "工段A (A)",
      "cat2_display": "工序类别B (B)",
      "process_display": "工序1 (P001)",
      "unit_price": 10.50,
      "quantity": 100.00,
      "amount": 1050.00
    }
  ],
  "summary": {
    "total_quantity": 1000.00,
    "total_amount": 10500.00
  }
}
```

#### 1.2 新增获取工人列表接口（可选，已有）

检查 `workerAPI.getWorkers()` 是否满足需求，如果需要分页获取则无需修改。

### 第二步：前端类型定义扩展

修改 `frontend/src/types/index.ts`：

```typescript
// 工人工作记录响应
interface WorkerSalaryRecordsResponse {
  worker_code: string;
  worker_name: string;
  month: string;
  records: SalaryRecord[];
  summary: {
    total_quantity: number;
    total_amount: number;
  };
}
```

### 第三步：前端API服务扩展

修改 `frontend/src/services/api.ts`：

```typescript
// 扩展 salaryAPI
export const salaryAPI = {
  // ... 现有方法
  
  // 获取指定工人指定月份的工作记录
  getWorkerMonthRecords: (params: {
    worker_code: string;
    month: string;
  }): Promise<WorkerSalaryRecordsResponse> =>
    api.get('/salary-records/worker-month/', { params }),
};
```

### 第四步：重写 QuotaManagement 组件

#### 4.1 状态管理

```typescript
interface QuotaManagementState {
  // 过滤器
  workers: Worker[];
  selectedWorker: string | null;
  selectedMonth: string;  // format: YYYYMM
  
  // 数据
  records: SalaryRecord[];
  summary: {
    total_quantity: number;
    total_amount: number;
  };
  loading: boolean;
}
```

#### 4.2 组件结构

```
QuotaManagement
├── 过滤器区域
│   ├── 工人 Select
│   ├── 月份 Input + Button
│   └── 添加工作记录 Button (disabled)
├── 工作记录 Table
│   ├── record_date
│   ├── model_display
│   ├── cat1_display
│   ├── cat2_display
│   ├── process_display
│   ├── unit_price
│   ├── quantity
│   └── amount
└── Summary 区域
    ├── total_quantity
    └── total_amount
```

#### 4.3 核心逻辑

1. **初始化加载**：
   - 获取工人列表

2. **月份选择**：
   - 点击"当前月份"按钮时，使用 `dayjs().format('YYYYMM')` 设置月份

3. **工人或月份变化**：
   - 如果两者都已选择，触发数据加载
   - 调用 `salaryAPI.getWorkerMonthRecords()` 获取数据和汇总

4. **数据展示**：
   - 将汇总信息显示在表格下方

### 第五步：样式优化

- 表格列头使用统一的背景色
- 金额列右对齐并使用货币格式
- Summary 区域使用明显的样式突出显示

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/app/api/salary.py` | 新增 | 新增 worker-month 端点 |
| `backend/app/crud.py` | 修改 | 新增获取工人月份工资记录的数据库操作 |
| `frontend/src/types/index.ts` | 修改 | 新增 WorkerSalaryRecordsResponse 类型 |
| `frontend/src/services/api.ts` | 修改 | 新增 salaryAPI.getWorkerMonthRecords 方法 |
| `frontend/src/pages/QuotaManagement.jsx` | 重写 | 完全重写组件逻辑和UI |
| `frontend/src/pages/SalaryRecord.jsx` | 修改 | 可能需要调整（如果使用相同的API） |

## API端点详细设计

### GET /salary-records/worker-month/

```python
@router.get("/worker-month/")
def get_worker_month_records(
    worker_code: str = Query(..., description="工人编码"),
    month: str = Query(..., description="月份 (YYYYMM格式)"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    获取指定工人指定月份的所有工资记录
    返回工作记录列表和汇总信息
    """
    # 解析月份，获取起始日期和结束日期
    year = int(month[:4])
    month_num = int(month[4:])
    start_date = date(year, month_num, 1)
    
    # 计算月末日期
    if month_num == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month_num + 1, 1) - timedelta(days=1)
    
    # 查询工资记录
    query = db.query(models.VSalaryRecord).filter(
        models.VSalaryRecord.worker_code == worker_code,
        models.VSalaryRecord.record_date >= start_date,
        models.VSalaryRecord.record_date <= end_date
    )
    
    records = query.order_by(models.VSalaryRecord.record_date).all()
    
    # 计算汇总
    total_quantity = sum(r.quantity for r in records)
    total_amount = sum(r.amount for r in records)
    
    # 获取工人名称
    worker = db.query(models.Worker).filter(
        models.Worker.worker_code == worker_code
    ).first()
    
    return {
        "worker_code": worker_code,
        "worker_name": worker.name if worker else worker_code,
        "month": month,
        "records": records,
        "summary": {
            "total_quantity": total_quantity,
            "total_amount": total_amount
        }
    }
```

## 注意事项

1. **向后兼容性**: 保留现有的 `SalaryRecord.jsx` 页面用于其他用途
2. **空值处理**: 如果没有记录，显示空状态提示
3. **月份格式**: 统一使用 YYYYMM 格式（如 202601）
4. **金额格式**: 保留两位小数，使用 ¥ 符号
5. **数量格式**: 保留两位小数

## 待确认问题

1. "添加工作记录"按钮的逻辑是什么？何时启用？
2. 是否需要在表格中显示操作列（编辑/删除按钮）？
3. 是否需要支持按日期范围筛选，而不仅仅是月份？
4. 工人列表是否需要分页加载？
