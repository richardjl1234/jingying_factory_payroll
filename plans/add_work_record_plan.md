# 添加工作记录功能实现计划

## 功能概述

实现复杂的添加/编辑工作记录对话框，包含智能定额选择功能。

## 对话框字段设计

```
┌─────────────────────────────────────────────────────────────┐
│ 添加工作记录                                      [X]      │
├─────────────────────────────────────────────────────────────┤
│ 工人：    张三 (W001)                                        │
│ 月份：    202601                                             │
│ 日期：    [15]  (两位数输入，与月份组合成 2026-01-15)        │
├─────────────────────────────────────────────────────────────┤
│ 定额选择：                                                    │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 定额ID：  [123]  (直接输入 quotas.id)                    ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ 型号搜索：[输入部分型号编码     ▼]                       ││
│ │          [下拉菜单显示匹配结果]                          ││
│ │ 已选：   [A系列电机 (A100)                   ]          ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ 工序搜索：[输入部分工序编码     ▼]                       ││
│ │          [下拉菜单显示匹配结果]                          ││
│ │ 已选：   [定子工序 A-01-P001               ]          ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ 定额信息：                                               ││
│ │   ID: 123  |  单价: ¥10.50  |  有效期: 2024-01-01~2024-12-31││
│ └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ 数量：    [100.00]                                          │
├─────────────────────────────────────────────────────────────┤
│                        [取消]  [确定]                        │
└─────────────────────────────────────────────────────────────┘
```

**定额选择优先级**：
1. **直接输入定额ID**：用户可直接输入 `quotas.id`，最快捷
2. **型号+工序搜索**：通过选择型号和工序组合确定定额

## 后端API设计

### 1. 获取字典数据接口

```
GET /api/salary-records/dictionaries/

Response:
{
  "motor_models": [
    {"model_code": "A100", "name": "A系列电机"},
    {"model_code": "B200", "name": "B系列电机"}
  ],
  "quota_combinations": [
    {
      "quota_id": 123,
      "combined_code": "abcefg036",
      "cat1_code": "abc",
      "cat1_name": "定子工段",
      "cat2_code": "efg",
      "cat2_name": "绕线工序",
      "process_code": "036",
      "process_name": "绕线",
      "unit_price": 10.50
    },
    {
      "quota_id": 124,
      "combined_code": "cccyxx090",
      "cat1_code": "ccc",
      "cat1_name": "转子工段",
      "cat2_code": "yxx",
      "cat2_name": "嵌线工序",
      "process_code": "090",
      "process_name": "嵌线",
      "unit_price": 12.00
    }
  ]
}
```

**说明**：
- `motor_models`: 所有电机型号列表
- `quota_combinations`: 所有定额组合列表（从 quotas 表去重获取），包含组合编码和各个字段的名称

### 2. 根据条件查询定额接口

```
GET /api/salary-records/find-quota/

Query Parameters:
- model_code: string (required)
- cat1_code: string (required)
- cat2_code: string (required)
- process_code: string (required)
- record_date: string (required, YYYY-MM-DD)

Response:
{
  "quota_id": 123,
  "unit_price": 10.50,
  "effective_date": "2024-01-01",
  "obsolete_date": "2024-12-31"
}
```

## 前端组件设计

### 1. 新增类型定义

```typescript
// 字典数据类型
interface Dictionaries {
  motor_models: { model_code: string; name: string }[];
  process_cat1: { cat1_code: string; name: string }[];
  process_cat2: { cat2_code: string; name: string }[];
  processes: { process_code: string; name: string }[];
  quota_combinations: QuotaCombination[];
}

interface QuotaCombination {
  quota_id: number;
  model_code: string;
  cat1_code: string;
  cat2_code: string;
  process_code: string;
  unit_price: number;
}

// 定额搜索结果
interface QuotaSearchResult {
  quota_id: number;
  model_code: string;
  model_name: string;
  cat1_code: string;
  cat1_name: string;
  cat2_code: string;
  cat2_name: string;
  process_code: string;
  process_name: string;
  unit_price: number;
  effective_date: string;
  obsolete_date: string;
}
```

### 2. 前端API服务扩展

```typescript
// 新增API
export const salaryAPI = {
  // ... 现有方法
  
  // 获取字典数据
  getDictionaries: (): Promise<Dictionaries> =>
    api.get('/salary-records/dictionaries/'),
  
  // 查询定额
  findQuota: (params: {
    model_code: string;
    cat1_code: string;
    cat2_code: string;
    process_code: string;
    record_date: string;
  }): Promise<QuotaSearchResult> =>
    api.get('/salary-records/find-quota/', { params }),
};
```

### 3. 组件结构

```
AddWorkRecordDialog
├── 工人显示 (只读)
├── 月份显示 (只读)
├── 日期输入 (两位数)
├── 定额选择区域
│   ├── 定额ID输入 (直接输入 quotas.id)
│   ├── 型号搜索 (AutoComplete) - 当定额ID为空时使用
│   ├── 工序搜索 (AutoComplete) - 当定额ID为空时使用
│   └── 定额信息显示 (ID、单价值、有效期)
└── 数量输入
```

### 4. 定额选择

提供两种方式选择定额：

#### 方式1：直接输入定额ID (推荐)
- 输入框：定额ID (整数)
- 用户输入 `quotas.id` 后，直接获取定额数据
- 适合快速输入场景
- 前端字典中包含所有 `quota_id`，方便搜索

#### 方式2：型号+工序搜索
- **型号搜索**：输入部分型号编码，显示匹配结果
- **工序搜索**：输入部分工序编码组合，显示匹配结果
- 自动组合确定定额

**优先级**：如果用户输入了定额ID，则优先使用该方式；否则使用型号+工序搜索

### 2. 工序搜索

**搜索规则**：
1. 从数据库 `quotas` 表中获取所有唯一的 `cat1_code + cat2_code + process_code` 组合
2. 组合显示格式：`concat(工段类别编码, 工序类别编码, 工序编码)` 例如：`abcefg036`
3. 用户输入搜索关键词时，在组合列表中进行顺序匹配
4. **匹配规则**：用户输入的字符必须按顺序出现在组合中（但不必连续）

**示例**：
```
数据库中的组合：
  - abcefg036
  - cccyxx090
  - xxxccc091

用户输入 "c"：
  三个选项都显示（都包含c）

用户输入 "cx"：
  只有 "cccyxx090" 显示（c后面有x）

用户输入 "01"：
  只有 "xxxccc091" 显示（0后面有1，abcefg036中0后面没有1，cccyxx090中0后面是9和0）
```

**前端实现**：
```typescript
function searchProcessCombinations(combinations: string[], keyword: string): string[] {
  if (!keyword) return combinations;
  
  const lowerKeyword = keyword.toLowerCase();
  let charIndex = 0;
  
  return combinations.filter(comb => {
    const lowerComb = comb.toLowerCase();
    charIndex = 0;
    
    // 检查每个字符是否按顺序出现
    for (const char of lowerKeyword) {
      charIndex = lowerComb.indexOf(char, charIndex);
      if (charIndex === -1) return false;
      charIndex++;
    }
    return true;
  });
}
```

#### 定额自动确定
当型号和工序都选择后：
1. 构建组合键：`{model_code, cat1_code, cat2_code, process_code}`
2. 从 `quota_combinations` 中查找匹配
3. 如果找到匹配，获取 `quota_id`
4. 根据 `record_date` 验证定额是否在有效期内

## 实现步骤

### 第一步：后端API扩展

1. 新增 `GET /salary-records/dictionaries/` 端点
2. 新增 `GET /salary-records/find-quota/` 端点
3. 在 `crud.py` 中新增相关数据库操作函数

### 第二步：前端类型定义

1. 新增 `Dictionaries` 接口
2. 新增 `QuotaSearchResult` 接口

### 第三步：前端API服务

1. 新增 `getDictionaries` 方法
2. 新增 `findQuota` 方法

### 第四步：前端组件实现

1. 修改 `SalaryRecord.jsx` 中的添加/编辑对话框
2. 实现 `ModelSearch` 组件
3. 实现 `ProcessSearch` 组件
4. 实现定额自动确定逻辑
5. 修改表单验证逻辑

### 第五步：测试验证

1. 测试各种搜索场景
2. 测试定额确定逻辑
3. 测试日期验证

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/app/api/salary.py` | 修改 | 新增两个API端点 |
| `backend/app/crud.py` | 修改 | 新增字典查询和定额查找函数 |
| `frontend/src/types/index.ts` | 修改 | 新增类型定义 |
| `frontend/src/services/api.ts` | 修改 | 新增API方法 |
| `frontend/src/pages/SalaryRecord.jsx` | 修改 | 重写添加/编辑对话框 |

## 注意事项

1. **性能优化**：字典数据在前端初始化时加载一次，后续搜索在内存中进行
2. **搜索算法**：工序搜索需要支持多字段组合匹配
3. **日期验证**：确保选择的定额在记录日期有效期内
4. **用户体验**：支持键盘操作（空格键确认，TAB键导航）
