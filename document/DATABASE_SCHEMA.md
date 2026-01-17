# 工资管理系统数据库架构文档

## 概述

本文档详细描述了工资管理系统（Payroll System）的数据库架构。系统使用SQLite数据库，包含8个核心表和1个视图，用于管理用户、工人、工序、定额和工资记录。

## 数据库表列表

1. **users** - 用户表
2. **workers** - 工人表  
3. **processes** - 工序表
4. **process_cat1** - 工段类别表
5. **process_cat2** - 工序类别表
6. **motor_models** - 电机型号表
7. **quotas** - 定额表
8. **work_records** - 工作记录表
9. **v_salary_records** - 工资记录视图
10. **column_seq** - 定额表列顺序表

## 表结构详情

### 1. users - 用户表

**描述**：存储系统用户信息，包括管理员、统计员和报表员。

**表结构**：
```sql
CREATE TABLE users (
    id INTEGER NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    wechat_openid VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    need_change_password BOOLEAN NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (wechat_openid)
);
```

**字段说明**：
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 用户ID，主键 |
| username | VARCHAR(50) | NOT NULL, UNIQUE | 用户名，唯一 |
| password | VARCHAR(255) | NOT NULL | 密码（加密存储） |
| name | VARCHAR(50) | NOT NULL | 用户真实姓名 |
| role | VARCHAR(20) | NOT NULL | 用户角色：admin/statistician/report |
| wechat_openid | VARCHAR(100) | UNIQUE, NULLABLE | 微信OpenID（二期功能预留） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NULLABLE | 更新时间 |
| need_change_password | BOOLEAN | NOT NULL, DEFAULT TRUE | 是否需要修改密码 |

**索引**：
- `ix_users_id` (id)
- `ix_users_username` (username) - 唯一索引

**关系**：
- 一对多关系：一个用户可以创建多个定额（quotas）
- 一对多关系：一个用户可以创建多个工作记录（work_records）

### 2. workers - 工人表

**描述**：存储工人基本信息。

**表结构**：
```sql
CREATE TABLE workers (
    worker_code VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    PRIMARY KEY (worker_code)
);
```

**字段说明**：
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| worker_code | VARCHAR(20) | PRIMARY KEY | 工号，主键 |
| name | VARCHAR(50) | NOT NULL | 工人姓名 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NULLABLE | 更新时间 |

**索引**：
- `ix_workers_worker_code` (worker_code)

**关系**：
- 一对多关系：一个工人可以有多个工作记录（work_records）

### 3. processes - 工序表

**描述**：存储工序信息，包括工序编码、名称和描述。

**表结构**：
```sql
CREATE TABLE processes (
    process_code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    PRIMARY KEY (process_code),
    UNIQUE (name)
);
```

**字段说明**：
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| process_code | VARCHAR(20) | PRIMARY KEY | 工序编码，主键 |
| name | VARCHAR(100) | NOT NULL, UNIQUE | 工序名称，唯一 |
| description | VARCHAR(500) | NULLABLE | 工序描述 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NULLABLE | 更新时间 |

**索引**：
- `ix_processes_process_code` (process_code)

**关系**：
- 一对多关系：一个工序可以有多个定额（quotas）

### 4. process_cat1 - 工段类别表

**描述**：存储工段分类信息。

**表结构**：
```sql
CREATE TABLE process_cat1 (
    cat1_code VARCHAR(4) NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    PRIMARY KEY (cat1_code)
);
```

**字段说明**：
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| cat1_code | VARCHAR(4) | PRIMARY KEY | 工段编码，主键 |
| name | VARCHAR(50) | NOT NULL | 工段名称 |
| description | VARCHAR(100) | NULLABLE | 工段描述 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NULLABLE | 更新时间 |

**索引**：
- `ix_process_cat1_cat1_code` (cat1_code)
- `ix_process_cat1_name` (name)

**关系**：
- 一对多关系：一个工段可以有多个定额（quotas）

### 5. process_cat2 - 工序类别表

**描述**：存储工序分类信息。

**表结构**：
```sql
CREATE TABLE process_cat2 (
    cat2_code VARCHAR(30) NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    PRIMARY KEY (cat2_code)
);
```

**字段说明**：
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| cat2_code | VARCHAR(30) | PRIMARY KEY | 工序编码，主键 |
| name | VARCHAR(50) | NOT NULL | 工序名称 |
| description | VARCHAR(100) | NULLABLE | 工序描述 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NULLABLE | 更新时间 |

**索引**：
- `ix_process_cat2_cat2_code` (cat2_code)
- `ix_process_cat2_name` (name)

**关系**：
- 一对多关系：一个工序类别可以有多个定额（quotas）

### 6. motor_models - 电机型号表

**描述**：存储电机型号信息。

**表结构**：
```sql
CREATE TABLE motor_models (
    model_code VARCHAR(10) NOT NULL,
    name VARCHAR(40) NOT NULL,
    description VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    PRIMARY KEY (model_code)
);
```

**字段说明**：
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| model_code | VARCHAR(10) | PRIMARY KEY | 电机型号编码，主键 |
| name | VARCHAR(40) | NOT NULL | 电机型号名称 |
| description | VARCHAR(100) | NULLABLE | 电机型号描述 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NULLABLE | 更新时间 |

**索引**：
- `ix_motor_models_model_code` (model_code)
- `ix_motor_models_name` (name)

**关系**：
- 一对多关系：一个电机型号可以有多个定额（quotas）

### 7. quotas - 定额表

**描述**：存储工序的单价定额信息，包括生效日期和作废日期。

**表结构**：
```sql
CREATE TABLE quotas (
    id INTEGER NOT NULL,
    process_code VARCHAR(20) NOT NULL,
    cat1_code VARCHAR(4) NOT NULL,
    cat2_code VARCHAR(30) NOT NULL,
    model_code VARCHAR(10) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    effective_date DATE NOT NULL,
    obsolete_date DATE NOT NULL DEFAULT '9999-12-31',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT _process_effective_date_uc UNIQUE (process_code, cat1_code, cat2_code, model_code, effective_date),
    FOREIGN KEY(process_code) REFERENCES processes (process_code),
    FOREIGN KEY(cat1_code) REFERENCES process_cat1 (cat1_code) ON DELETE CASCADE,
    FOREIGN KEY(cat2_code) REFERENCES process_cat2 (cat2_code) ON DELETE CASCADE,
    FOREIGN KEY(model_code) REFERENCES motor_models (model_code) ON DELETE CASCADE,
    FOREIGN KEY(created_by) REFERENCES users (id) ON DELETE SET NULL
);
```

**字段说明**：
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 定额ID，主键 |
| process_code | VARCHAR(20) | NOT NULL, FOREIGN KEY | 工序编码，外键引用processes表 |
| cat1_code | VARCHAR(4) | NOT NULL, FOREIGN KEY | 工段编码，外键引用process_cat1表 |
| cat2_code | VARCHAR(30) | NOT NULL, FOREIGN KEY | 工序类别编码，外键引用process_cat2表 |
| model_code | VARCHAR(10) | NOT NULL, FOREIGN KEY | 电机型号编码，外键引用motor_models表 |
| unit_price | NUMERIC(10, 2) | NOT NULL | 单价，保留两位小数 |
| effective_date | DATE | NOT NULL | 生效日期 |
| obsolete_date | DATE | NOT NULL DEFAULT '9999-12-31' | 作废日期，默认值'9999-12-31'表示永久有效 |
| created_by | INTEGER | NULLABLE, FOREIGN KEY | 创建者ID，外键引用users表（用户删除时设为NULL） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**约束**：
- `_process_effective_date_uc`：唯一约束，确保同一工序、工段、工序类别、电机型号在同一日期只能有一个生效定额

**索引**：
- `ix_quotas_id` (id)

**关系**：
- 多对一关系：定额属于一个工序（processes）
- 多对一关系：定额属于一个工段（process_cat1）
- 多对一关系：定额属于一个工序类别（process_cat2）
- 多对一关系：定额属于一个电机型号（motor_models）
- 多对一关系：定额由一个用户创建（users）
- 一对多关系：一个定额可以有多个工作记录（work_records）

### 8. work_records - 工作记录表

**描述**：存储工人的工作记录，包括工作数量和记录日期。金额通过视图计算。

**表结构**：
```sql
CREATE TABLE work_records (
    id INTEGER NOT NULL,
    worker_code VARCHAR(20) NOT NULL,
    quota_id INTEGER NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    record_date DATE NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY(worker_code) REFERENCES workers (worker_code),
    FOREIGN KEY(quota_id) REFERENCES quotas (id),
    FOREIGN KEY(created_by) REFERENCES users (id) ON DELETE SET NULL
);
```

**字段说明**：
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 记录ID，主键 |
| worker_code | VARCHAR(20) | NOT NULL, FOREIGN KEY | 工号，外键引用workers表 |
| quota_id | INTEGER | NOT NULL, FOREIGN KEY | 定额ID，外键引用quotas表 |
| quantity | NUMERIC(10, 2) | NOT NULL | 数量，保留两位小数 |
| record_date | DATE | NOT NULL | 记录日期 |
| created_by | INTEGER | NULLABLE, FOREIGN KEY | 创建者ID，外键引用users表（用户删除时设为NULL） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**：
- `ix_work_records_id` (id)

**关系**：
- 多对一关系：工作记录属于一个工人（workers）
- 多对一关系：工作记录使用一个定额（quotas）
- 多对一关系：工作记录由一个用户创建（users）

### 9. v_salary_records - 工资记录视图

**描述**：基于work_records、quotas及相关表的视图，计算工资金额并包含显示信息。

**视图结构**：
```sql
CREATE VIEW v_salary_records AS
SELECT 
    wr.id,
    wr.worker_code,
    wr.quota_id,
    wr.quantity,
    q.unit_price,
    (wr.quantity * q.unit_price) AS amount,
    wr.record_date,
    wr.created_by,
    wr.created_at,
    -- 电机型号: 编码 (名称)
    mm.model_code || ' (' || mm.name || ')' AS model_display,
    -- 工段类别: 编码 (名称)
    pc1.cat1_code || ' (' || pc1.name || ')' AS cat1_display,
    -- 工序类别: 编码 (名称)
    pc2.cat2_code || ' (' || pc2.name || ')' AS cat2_display,
    -- 工序名称: 编码 (名称)
    p.process_code || ' (' || p.name || ')' AS process_display
FROM work_records wr
JOIN quotas q ON wr.quota_id = q.id
JOIN processes p ON q.process_code = p.process_code
JOIN process_cat1 pc1 ON q.cat1_code = pc1.cat1_code
JOIN process_cat2 pc2 ON q.cat2_code = pc2.cat2_code
JOIN motor_models mm ON q.model_code = mm.model_code;
```

**字段说明**：
| 字段名 | 数据类型 | 说明 |
|--------|----------|------|
| id | INTEGER | 记录ID |
| worker_code | VARCHAR(20) | 工号 |
| quota_id | INTEGER | 定额ID |
| quantity | NUMERIC(10, 2) | 数量 |
| unit_price | NUMERIC(10, 2) | 单价（来自quotas表） |
| amount | NUMERIC(10, 2) | 金额（quantity × unit_price） |
| record_date | DATE | 记录日期 |
| created_by | INTEGER | 创建者ID |
| created_at | DATETIME | 创建时间 |
| model_display | VARCHAR(150) | 电机型号显示: 型号名称 (别名) |
| cat1_display | VARCHAR(100) | 工段类别显示: 编码 (名称) |
| cat2_display | VARCHAR(100) | 工序类别显示: 编码 (名称) |
| process_display | VARCHAR(150) | 工序显示: 编码 (名称) |

**关系**：
- 基于work_records、quotas、processes、process_cat1、process_cat2、motor_models表的连接视图
- 提供工资计算功能，金额自动计算
- 包含格式化显示字段便于前端展示

### 10. column_seq - 定额表列顺序表

**描述**：存储定额表列的顺序配置，用于控制定额管理页面中工序列的显示顺序。

**表结构**：
```sql
CREATE TABLE column_seq (
    id INTEGER NOT NULL AUTO_INCREMENT,
    cat1_code VARCHAR(4) NOT NULL,
    cat2_code VARCHAR(30) NOT NULL,
    process_code VARCHAR(20) NOT NULL,
    seq INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY _cat1_cat2_process_uc (cat1_code, cat2_code, process_code),
    INDEX ix_column_seq_cat1 (cat1_code),
    INDEX ix_column_seq_cat2 (cat2_code),
    INDEX ix_column_seq_process (process_code)
);
```

**字段说明**：
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 记录ID，主键 |
| cat1_code | VARCHAR(4) | NOT NULL, INDEX | 工段编码 |
| cat2_code | VARCHAR(30) | NOT NULL, INDEX | 工序类别编码 |
| process_code | VARCHAR(20) | NOT NULL, INDEX | 工序编码 |
| seq | INTEGER | NOT NULL | 列顺序号（数值越小越靠前） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**约束**：
- `_cat1_cat2_process_uc`：唯一约束，确保同一工段类别、工序类别、工序组合只能有一条记录

**索引**：
- `ix_column_seq_cat1` (cat1_code)
- `ix_column_seq_cat2` (cat2_code)
- `ix_column_seq_process` (process_code)

**关系**：
- 用于配置定额矩阵中工序列的显示顺序
- 与quotas表的(cat1_code, cat2_code)组合关联

**用途**：
- 在定额管理页面中，按seq值从小到大排序显示工序列
- 如果某个工序未配置seq值，则排在已配置seq值的工序之后

**数据示例**：
```sql
-- 为 C11 工段类别和 Y2YPEJ2Z 工序类别配置工序顺序
INSERT INTO column_seq (cat1_code, cat2_code, process_code, seq) VALUES
('C11', 'Y2YPEJ2Z', 'QZZDZXK', 0),
('C11', 'Y2YPEJ2Z', 'CJCZTPT', 1),
('C11', 'Y2YPEJ2Z', 'CJCZTWJ', 2);
```

## 实体关系图（ERD）

```
┌─────────┐       ┌──────────┐       ┌───────────┐
│  users  │       │ workers  │       │ processes │
├─────────┤       ├──────────┤       ├───────────┤
│ id (PK) │       │worker_code│      │process_code│
│ username│       │   name    │      │   name    │
│   ...   │       │    ...    │      │   ...     │
└────┬────┘       └─────┬─────┘      └─────┬─────┘
     │                  │                   │
     │                  │                   │
     │           ┌──────┴──────┐            │
     │           │ work_records │           │
     │           ├──────────────┤           │
     └──────────►│  worker_code │◄──────────┘
                 │   quota_id   │
                 │     ...      │
                 └──────┬───────┘
                        │
                        │
                 ┌──────┴──────┐
                 │   quotas    │
                 ├─────────────┤
                 │process_code │
                 │  cat1_code  │
                 │  cat2_code  │
                 │ model_name  │
                 │     ...     │
                 └──────┬──────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
    │process_cat1│ │process_cat2│ │motor_models│
    ├───────────┤ ├───────────┤ ├───────────┤
    │cat1_code  │ │cat2_code  │ │ name      │
    │   name    │ │   name    │ │ aliases   │
    │   ...     │ │   ...     │ │   ...     │
    └───────────┘ └───────────┘ └───────────┘
```

**关系说明**：
1. **users → quotas**：一对多关系，一个用户可以创建多个定额
2. **users → work_records**：一对多关系，一个用户可以创建多个工作记录
3. **workers → work_records**：一对多关系，一个工人可以有多个工作记录
4. **processes → quotas**：一对多关系，一个工序可以有多个定额
5. **process_cat1 → quotas**：一对多关系，一个工段可以有多个定额
6. **process_cat2 → quotas**：一对多关系，一个工序类别可以有多个定额
7. **motor_models → quotas**：一对多关系，一个电机型号可以有多个定额
8. **quotas → work_records**：一对多关系，一个定额可以有多个工作记录
9. **work_records → v_salary_records**：工作记录表通过视图提供工资计算和格式化显示

## 数据完整性规则

1. **参照完整性**：所有外键约束确保数据一致性
2. **唯一性约束**：
   - 用户名（username）必须唯一
   - 工序名称（processes.name）必须唯一
   - 同一工序、工段、工序类别、电机型号在同一日期只能有一个生效定额
3. **检查约束**：
   - 无（原工序类别检查约束已移除）
4. **业务规则**：
   - 工资记录金额 = 数量 × 单价
   - 记录日期为DATE类型

## 索引策略

1. **主键索引**：所有表的主键自动创建索引
2. **外键索引**：外键字段自动创建索引以提高查询性能
3. **唯一索引**：
   - users.username
   - processes.name
   - quotas(process_code, cat1_code, cat2_code, model_name, effective_date)

## 数据示例

### 用户数据示例
```sql
INSERT INTO users (username, password, name, role, need_change_password) 
VALUES ('root', '加密密码', '系统管理员', 'admin', FALSE);
```

### 工序数据示例
```sql
INSERT INTO processes (process_code, name, description)
VALUES ('P001', '车床加工', '使用车床进行精密加工');
```

### 定额数据示例
```sql
INSERT INTO quotas (process_code, cat1_code, cat2_code, model_code, unit_price, effective_date, created_by)
VALUES ('P001', 'C101', 'C201', 'M001', 25.50, '2024-01-01', 1);
```

### 工作记录数据示例
```sql
INSERT INTO work_records (worker_code, quota_id, quantity, record_date, created_by)
VALUES ('W001', 1, 100.00, '2024-01-01', 1);
```

### 工资记录视图数据示例
```sql
-- 通过视图查询工资记录（金额自动计算）
SELECT * FROM v_salary_records WHERE worker_code = 'W001';
```

## 维护说明

1. **数据库备份**：定期备份payroll.db文件
2. **数据清理**：历史数据可根据业务需求进行归档
3. **性能优化**：随着数据量增长，可考虑添加复合索引
4. **扩展性**：当前架构支持未来添加新表（如考勤表、绩效表等）

---
*文档生成时间：2025年12月9日*
*数据库版本：SQLite 3*
*应用版本：工资管理系统 v1.0*
