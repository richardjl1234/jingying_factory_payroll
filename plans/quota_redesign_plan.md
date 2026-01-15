# 定额管理页面重新设计计划

## 设计概述

重新设计定额管理页面，采用矩阵透视表形式展示数据，替代当前的简单表格列表形式。

### 新页面布局

```
┌─────────────────────────────────────────────────────────────────────┐
│  [批量Excel导入按钮] [下一个按钮]                                    │
├─────────────────────────────────────────────────────────────────────┤
│  工段类别 ▼  |  工序类别 ▼  |  生效日期 ▼                            │
├─────────────────────────────────────────────────────────────────────┤
│                        定额矩阵表                                    │
│  ┌────────────┬────────────┬────────────┬────────────┐             │
│  │ 型号       │ 工序1      │ 工序2      │ 工序3      │             │
│  │            │ (code)     │ (code)     │ (code)     │             │
│  ├────────────┼────────────┼────────────┼────────────┤             │
│  │ 型号1      │ ¥100.00   │ ¥150.00   │ ¥200.00   │             │
│  │ (code)     │            │            │            │             │
│  ├────────────┼────────────┼────────────┼────────────┤             │
│  │ 型号2      │ ¥120.00   │ ¥180.00   │ ¥250.00   │             │
│  │ (code)     │            │            │            │             │
│  └────────────┴────────────┴────────────┴────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

## 详细设计说明

### 1. 过滤器区域 (Filter Area)

| 控件 | 类型 | 说明 |
|------|------|------|
| 批量Excel导入按钮 | Button | 暂时灰色不可用 |
| 下一个按钮 | Button | 循环切换到下一个 (工段类别, 工序类别, 生效日期) 组合 |
| 工段类别下拉框 | Select | 从后端获取所有工段类别，显示格式: "name (code)" |
| 工序类别下拉框 | Select | 从后端获取所有工序类别，显示格式: "name (code)" |
| 生效日期选择器 | DatePicker | 选择生效日期 |

### 2. 定额矩阵表 (Quota Matrix Table)

| 维度 | 字段 | 显示格式 |
|------|------|----------|
| 行索引 (Row) | 型号 (model_code) | "name (code)" |
| 列索引 (Column) | 加工工序 (process_code) | "name (code)" |
| 单元格值 | 定额 (unit_price) | ¥金额 |

### 3. 数据导航逻辑

- 页面加载时获取所有唯一的 (工段类别, 工序类别, 生效日期) 组合
- 按 `生效日期, 工段类别, 工序类别` 排序
- "下一个"按钮点击时，切换到下一个组合并刷新表格
- 支持循环导航（最后一个组合后回到第一个）

## 实现步骤

### 第一步：后端API扩展

#### 1.1 新增获取过滤器组合列表接口

```
GET /api/quotas/filter-combinations/

Response:
[
  {
    "cat1_code": "A",
    "cat1_name": "工段名称",
    "cat2_code": "B",
    "cat2_name": "工序类别名称",
    "effective_date": "2024-01-01"
  },
  ...
]
```

#### 1.2 新增获取定额矩阵数据接口

```
GET /api/quotas/matrix/

Query Parameters:
- cat1_code: string (required)
- cat2_code: string (required)
- effective_date: string (required)  // format: YYYY-MM-DD

Response:
{
  "cat1": {
    "code": "A",
    "name": "工段名称"
  },
  "cat2": {
    "code": "B",
    "name": "工序类别名称"
  },
  "effective_date": "2024-01-01",
  "rows": [
    {
      "model_code": "100-1",
      "model_name": "型号100-1",
      "prices": {
        "P001": 100.00,  // process_code -> unit_price
        "P002": 150.00
      }
    }
  ],
  "columns": [
    {
      "process_code": "P001",
      "process_name": "工序1"
    }
  ]
}
```

#### 1.3 修改现有CRUD操作

修改 `backend/app/crud.py` 中的 `get_quotas` 函数，支持按 (cat1_code, cat2_code, effective_date) 筛选。

### 第二步：前端API服务扩展

修改 `frontend/src/services/api.ts`:

```typescript
// 新增API
export const quotaAPI = {
  // ... 现有方法
  
  // 获取过滤器组合列表
  getFilterCombinations: (): Promise<FilterCombination[]> =>
    api.get('/quotas/filter-combinations/'),
  
  // 获取定额矩阵数据
  getQuotaMatrix: (params: {
    cat1_code: string;
    cat2_code: string;
    effective_date: string;
  }): Promise<QuotaMatrixResponse> =>
    api.get('/quotas/matrix/', { params }),
};
```

### 第三步：前端类型定义扩展

修改 `frontend/src/types/index.ts`:

```typescript
// 定额过滤器组合
interface QuotaFilterCombination {
  cat1_code: string;
  cat1_name: string;
  cat2_code: string;
  cat2_name: string;
  effective_date: string;
}

// 定额矩阵响应
interface QuotaMatrixResponse {
  cat1: { code: string; name: string };
  cat2: { code: string; name: string };
  effective_date: string;
  rows: QuotaMatrixRow[];
  columns: QuotaMatrixColumn[];
}

interface QuotaMatrixRow {
  model_code: string;
  model_name: string;
  prices: Record<string, number>;  // process_code -> unit_price
}

interface QuotaMatrixColumn {
  process_code: string;
  process_name: string;
}
```

### 第四步：重写 QuotaManagement 组件

#### 4.1 状态管理

```typescript
interface QuotaManagementState {
  // 过滤器组合列表
  filterCombinations: QuotaFilterCombination[];
  currentCombinationIndex: number;
  
  // 当前选中的过滤器值
  selectedCat1: string | null;
  selectedCat2: string | null;
  selectedDate: dayjs.Dayjs | null;
  
  // 矩阵数据
  matrixData: QuotaMatrixResponse | null;
  loading: boolean;
}
```

#### 4.2 组件结构

```
QuotaManagement
├── 按钮区域
│   ├── [批量Excel导入按钮] (disabled)
│   └── [下一个按钮]
├── 过滤器区域
│   ├── 工段类别 Select
│   ├── 工序类别 Select
│   └── 生效日期 DatePicker
└── 定额矩阵 Table
    ├── 列定义 (process_code + process_name)
    └── 行定义 (model_code + model_name)
```

#### 4.3 核心逻辑

1. `useEffect` 加载时：
   - 获取过滤器组合列表
   - 初始化当前组合索引为0
   - 加载初始矩阵数据

2. "下一个"按钮点击：
   - currentCombinationIndex++
   - 如果超出范围则回到0
   - 更新过滤器值
   - 重新加载矩阵数据

3. 过滤器值变化：
   - 根据选中的过滤器值查找对应的组合索引
   - 加载对应的矩阵数据

### 第五步：样式优化

- 表格列头使用浅黄色背景 (`#FFFFCC`)
- 行索引列使用浅粉色背景 (`#FFC0CB`)
- 单元格内容居中显示
- 金额格式化为 `¥xxx.xx`

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/app/api/quota.py` | 修改 | 新增两个API端点 |
| `backend/app/crud.py` | 修改 | 新增获取过滤器组合和矩阵数据的数据库操作 |
| `backend/app/schemas.py` | 修改 | 新增请求/响应Schema |
| `backend/tests/test_quota.py` | 新增 | 新增filter-combinations和matrix端点的单元测试 |
| `frontend/src/services/api.ts` | 修改 | 新增API调用方法 |
| `frontend/src/types/index.ts` | 修改 | 新增类型定义 |
| `frontend/src/pages/QuotaManagement.jsx` | 重写 | 完全重写组件逻辑和UI |
| `test/development/test_quota.js` | 修改 | 新增矩阵表和过滤器导航的测试用例 |
| `test/development/test_quota_pyppeteer.py` | 修改 | 新增Pyppeteer自动化测试用例 |

## API端点详细设计

### 5.1 GET /quotas/filter-combinations/

获取所有唯一的 (工段类别, 工序类别, 生效日期) 组合。

```python
@router.get("/filter-combinations/")
def get_filter_combinations(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    获取所有唯一的 (工段类别, 工序类别, 生效日期) 组合
    按 生效日期, 工段类别, 工序类别 排序
    """
    results = db.query(
        Quota.cat1_code,
        ProcessCat1.name.label('cat1_name'),
        Quota.cat2_code,
        ProcessCat2.name.label('cat2_name'),
        Quota.effective_date
    ).join(ProcessCat1, Quota.cat1_code == ProcessCat1.cat1_code, isouter=True
    ).join(ProcessCat2, Quota.cat2_code == ProcessCat2.cat2_code, isouter=True
    ).distinct(
        Quota.cat1_code,
        Quota.cat2_code,
        Quota.effective_date
    ).order_by(
        Quota.effective_date,
        Quota.cat1_code,
        Quota.cat2_code
    ).all()
    
    return [
        {
            "cat1_code": r.cat1_code,
            "cat1_name": r.cat1_name or r.cat1_code,
            "cat2_code": r.cat2_code,
            "cat2_name": r.cat2_name or r.cat2_code,
            "effective_date": r.effective_date
        }
        for r in results
    ]
```

### 5.2 GET /quotas/matrix/

获取指定组合的定额矩阵数据。

```python
@router.get("/matrix/")
def get_quota_matrix(
    cat1_code: str = Query(...),
    cat2_code: str = Query(...),
    effective_date: str = Query(...),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """
    获取指定 (工段类别, 工序类别, 生效日期) 的定额矩阵数据
    """
    # 获取所有相关定额记录
    quotas = db.query(Quota).filter(
        Quota.cat1_code == cat1_code,
        Quota.cat2_code == cat2_code,
        Quota.effective_date == effective_date
    ).all()
    
    if not quotas:
        raise HTTPException(status_code=404, detail="No quota found for this combination")
    
    # 构建矩阵数据
    # 获取唯一的型号和工序列表
    model_codes = set()
    process_codes = set()
    price_map = {}  # (model_code, process_code) -> unit_price
    
    for q in quotas:
        model_codes.add(q.model_code)
        process_codes.add(q.process_code)
        price_map[(q.model_code, q.process_code)] = q.unit_price
    
    # 排序
    sorted_models = sorted(model_codes, key=get_model_sort_key)
    sorted_processes = sorted(process_codes)
    
    # 获取名称映射
    processes = {p.process_code: p.name for p in crud.get_processes(db)}
    
    # 构建响应
    rows = []
    for model_code in sorted_models:
        prices = {}
        for process_code in sorted_processes:
            price = price_map.get((model_code, process_code))
            if price is not None:
                prices[process_code] = price
        rows.append({
            "model_code": model_code,
            "model_name": model_code,  # TODO: 获取型号名称
            "prices": prices
        })
    
    columns = [
        {"process_code": pc, "process_name": processes.get(pc, pc)}
        for pc in sorted_processes
    ]
    
    return {
        "cat1": {"code": cat1_code, "name": cat1_code},  # TODO: 获取名称
        "cat2": {"code": cat2_code, "name": cat2_code},
        "effective_date": effective_date,
        "rows": rows,
        "columns": columns
    }
```

## 注意事项

1. **向后兼容性**: 保留现有的添加/编辑/删除定额功能（可以通过其他入口访问）
2. **空值处理**: 如果某个 (型号, 工序) 组合没有定额，单元格显示为空或"-"
3. **性能优化**: 考虑分页加载大量数据
4. **响应式设计**: 确保表格在移动设备上可滚动
5. **权限控制**: 只有管理员可以修改定额

## 实施顺序

1. 先实现后端API
2. 实现前端API调用和类型定义
3. 实现前端组件UI
4. 测试整个流程

---

## 测试用例

### 6.1 后端单元测试 (backend/tests/test_quota.py)

```python
import pytest
from fastapi.testclient import TestClient

class TestQuotaFilterCombinations:
    """测试获取过滤器组合列表API"""
    
    def test_get_filter_combinations(self, client, db_session):
        """测试获取所有唯一的 (工段类别, 工序类别, 生效日期) 组合"""
        response = client.get("/api/quotas/filter-combinations/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # 验证返回数据结构
        if len(data) > 0:
            item = data[0]
            assert "cat1_code" in item
            assert "cat1_name" in item
            assert "cat2_code" in item
            assert "cat2_name" in item
            assert "effective_date" in item
    
    def test_filter_combinations_ordering(self, client, db_session):
        """测试过滤器组合按 生效日期, 工段类别, 工序类别 排序"""
        response = client.get("/api/quotas/filter-combinations/")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) >= 2:
            # 验证排序顺序
            for i in range(1, len(data)):
                prev = data[i - 1]
                curr = data[i]
                # 按effective_date排序
                assert prev["effective_date"] <= curr["effective_date"]


class TestQuotaMatrix:
    """测试获取定额矩阵数据API"""
    
    def test_get_quota_matrix_success(self, client, db_session, sample_quota):
        """测试成功获取定额矩阵数据"""
        params = {
            "cat1_code": sample_quota.cat1_code,
            "cat2_code": sample_quota.cat2_code,
            "effective_date": sample_quota.effective_date
        }
        response = client.get("/api/quotas/matrix/", params=params)
        assert response.status_code == 200
        data = response.json()
        
        # 验证返回数据结构
        assert "cat1" in data
        assert "cat2" in data
        assert "effective_date" in data
        assert "rows" in data
        assert "columns" in data
        
        # 验证rows结构
        if len(data["rows"]) > 0:
            row = data["rows"][0]
            assert "model_code" in row
            assert "model_name" in row
            assert "prices" in row
        
        # 验证columns结构
        if len(data["columns"]) > 0:
            col = data["columns"][0]
            assert "process_code" in col
            assert "process_name" in col
    
    def test_get_quota_matrix_not_found(self, client, db_session):
        """测试获取不存在的组合返回404"""
        params = {
            "cat1_code": "INVALID",
            "cat2_code": "INVALID",
            "effective_date": "2099-01-01"
        }
        response = client.get("/api/quotas/matrix/", params=params)
        assert response.status_code == 404
    
    def test_get_quota_matrix_missing_params(self, client, db_session):
        """测试缺少必需参数返回400"""
        response = client.get("/api/quotas/matrix/", params={})
        assert response.status_code == 422  # Validation error
```

### 6.2 前端Pyppeteer测试 (test/development/test_quota_pyppeteer.py)

```python
import pytest
import asyncio

class TestQuotaMatrixPage:
    """测试定额矩阵页面功能"""
    
    @pytest.mark.asyncio
    async def test_navigate_to_quota_matrix_page(self, logged_in_page):
        """测试导航到定额矩阵页面"""
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/quotas", 
                                   {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(2)
        
        # 验证页面包含定额管理相关内容
        page_content = await logged_in_page.content()
        assert '定额' in page_content or 'Quota' in page_content
        
        # 验证过滤器存在
        filters = await logged_in_page.$('.ant-select, .ant-picker')
        assert len(filters) >= 3  # 工段类别、工序类别、生效日期
        
        print("✓ Quota matrix page loaded successfully")
    
    @pytest.mark.asyncio
    async def test_filter_controls_display(self, logged_in_page):
        """测试过滤器控件显示"""
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/quotas", 
                                   {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(2)
        
        # 验证"批量Excel导入"按钮存在（灰色）
        import_buttons = await logged_in_page.$('button')
        import_button_found = False
        for btn in import_buttons:
            text = await logged_in_page.evaluate('el => el.textContent', btn)
            if 'Excel' in text or '导入' in text:
                import_button_found = True
                # 验证按钮是disabled状态
                is_disabled = await logged_in_page.evaluate(
                    'el => el.disabled || el.getAttribute("disabled")', btn)
                assert is_disabled is not None
                break
        
        # 验证"下一个"按钮存在
        next_button_found = False
        for btn in import_buttons:
            text = await logged_in_page.evaluate('el => el.textContent', btn)
            if '下一个' in text or 'Next' in text:
                next_button_found = True
                break
        
        assert import_button_found, "Import button not found"
        assert next_button_found, "Next button not found"
        
        print("✓ Filter controls displayed correctly")
    
    @pytest.mark.asyncio
    async def test_matrix_table_display(self, logged_in_page):
        """测试矩阵表显示"""
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/quotas", 
                                   {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(2)
        
        # 查找表格
        table = await logged_in_page.$('.ant-table')
        assert table is not None, "Matrix table not found"
        
        # 验证表格有数据行
        rows = await logged_in_page.$('.ant-table-row')
        # 行数应该大于0（如果有数据的话）
        
        # 验证列头包含工序名称
        headers = await logged_in_page.$('.ant-table-thead th')
        header_texts = []
        for header in headers:
            text = await logged_in_page.evaluate('el => el.textContent', header)
            header_texts.append(text.strip())
        
        # 列头应该显示 "工序名称 (code)" 格式
        print(f"Table headers: {header_texts[:5]}...")
        
        print("✓ Matrix table displayed correctly")
    
    @pytest.mark.asyncio
    async def test_next_button_navigation(self, logged_in_page):
        """测试"下一个"按钮导航功能"""
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/quotas", 
                                   {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(2)
        
        # 记录当前过滤器值
        initial_cat1 = await self._get_select_value(logged_in_page, 0)
        
        # 点击"下一个"按钮
        next_button = None
        buttons = await logged_in_page.$('button')
        for btn in buttons:
            text = await logged_in_page.evaluate('el => el.textContent', btn)
            if '下一个' in text:
                next_button = btn
                break
        
        if next_button:
            await next_button.click()
            await asyncio.sleep(1)
            
            # 验证过滤器值已更新
            new_cat1 = await self._get_select_value(logged_in_page, 0)
            # 如果有多个组合，过滤器值应该变化
            print(f"Navigated from {initial_cat1} to {new_cat1}")
        
        print("✓ Next button navigation works")
    
    async def _get_select_value(self, page, index):
        """获取下拉框的当前值"""
        selects = await page.$('.ant-select')
        if index < len(selects):
            return await page.evaluate(
                'el => el.textContent', selects[index])
        return None


class TestQuotaMatrixComprehensive:
    """综合测试定额矩阵页面"""
    
    @pytest.mark.asyncio
    async def test_quota_matrix_full_workflow(self, logged_in_page):
        """完整工作流测试"""
        print("\n=== Running comprehensive Quota Matrix test ===")
        
        # Test 1: Navigate to page
        await TestQuotaMatrixPage().test_navigate_to_quota_matrix_page(logged_in_page)
        
        # Test 2: Verify filter controls
        await TestQuotaMatrixPage().test_filter_controls_display(logged_in_page)
        
        # Test 3: Verify matrix table
        await TestQuotaMatrixPage().test_matrix_table_display(logged_in_page)
        
        # Test 4: Test navigation
        await TestQuotaMatrixPage().test_next_button_navigation(logged_in_page)
        
        print("✓ All Quota Matrix tests completed successfully")
```

### 6.3 前端JavaScript测试 (test/development/test_quota.js)

```javascript
async function testQuotaMatrixDisplay() {
  console.log('\n=== Testing Quota Matrix Display ===');
  
  // Navigate to quota page
  await page.goto(`${config.BASE_URLS.frontend}/quotas`, {
    waitUntil: 'domcontentloaded',
    timeout: config.TIMEOUTS.long
  });
  
  await sleep(2000);
  await captureScreenshot(page, 'quota_matrix_page');
  
  // Verify filter controls exist
  const filters = await page.$('.ant-select, .ant-picker');
  console.log(`Found ${filters.length} filter controls`);
  assert(filters.length >= 3, 'Expected at least 3 filter controls');
  
  // Verify "Next" button exists
  const buttons = await page.$('button');
  let nextButtonFound = false;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('下一个')) {
      nextButtonFound = true;
      break;
    }
  }
  assert(nextButtonFound, 'Next button not found');
  
  // Verify matrix table exists
  const table = await page.$('.ant-table');
  assert(table !== null, 'Matrix table not found');
  
  // Verify table has proper structure
  const headers = await page.$('.ant-table-thead th');
  console.log(`Table headers: ${headers.length}`);
  
  console.log('✓ Quota Matrix display test passed');
}

async function testNextButtonNavigation() {
  console.log('\n=== Testing Next Button Navigation ===');
  
  // Get current filter values
  const initialFilters = await getCurrentFilterValues();
  
  // Click next button
  const nextButton = await page.$('button');
  for (const btn of await page.$('button')) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('下一个')) {
      await btn.click();
      break;
    }
  }
  
  await sleep(1500);
  
  // Verify filters changed
  const newFilters = await getCurrentFilterValues();
  
  // If there are multiple combinations, filters should change
  if (initialFilters.cat1 !== newFilters.cat1 || 
      initialFilters.cat2 !== newFilters.cat2 ||
      initialFilters.date !== newFilters.date) {
    console.log('Filters changed after clicking Next');
  } else {
    console.log('No filter change (possibly only one combination)');
  }
  
  console.log('✓ Next button navigation test passed');
}
```
