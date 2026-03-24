-- ============================================================
-- 无固定额工作记录功能 — 数据库初始化脚本
-- 数据库: payroll (本地 MySQL)
-- ============================================================

-- Step 1: 删除旧的 work_records_nonfixed（如存在）
DROP TABLE IF EXISTS work_records_nonfixed;

-- Step 2: 创建 work_records_nonfixed（最终定义，存储 unit_price）
CREATE TABLE work_records_nonfixed (
    id                  VARCHAR(10) NOT NULL PRIMARY KEY COMMENT '无定额工资记录ID（WN+序号，如WN00001）',
    worker_code         VARCHAR(20) NOT NULL COMMENT '工人编码',
    nonfixed_quota_id  VARCHAR(10) NOT NULL COMMENT '无定额ID（关联quotas_nonfixed.id，格式N001）',
    quantity            DECIMAL(10,2) NOT NULL DEFAULT 1.00 COMMENT '数量',
    unit_price         DECIMAL(10,2) NOT NULL COMMENT '单价（须介于quotas_nonfixed.min_quota和max_quota之间）',
    record_date        DATE NOT NULL COMMENT '记录日期',
    created_by         INT COMMENT '创建人',
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CONSTRAINT fk_nonfixed_quota FOREIGN KEY (nonfixed_quota_id) REFERENCES quotas_nonfixed(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='无定额工资记录表';

-- Step 3: 重建 v_salary_records 视图
DROP VIEW IF EXISTS v_salary_records;

CREATE VIEW v_salary_records AS

-- Part A: 有定额工资记录
SELECT
    CAST(wr.id AS CHAR) AS id,
    CAST(wr.quota_id AS CHAR) AS quota_id,
    wr.worker_code,
    wr.quantity,
    q.unit_price,
    (wr.quantity * q.unit_price) AS amount,
    wr.record_date,
    wr.created_by,
    wr.created_at,
    CONCAT(mm.model_code, ' (', mm.name, ')') AS model_display,
    CONCAT(pc1.cat1_code, ' (', pc1.name, ')') AS cat1_display,
    CONCAT(pc2.cat2_code, ' (', pc2.name, ')') AS cat2_display,
    CONCAT(p.process_code, ' (', p.name, ')') AS process_display,
    FALSE AS is_nonfixed
FROM work_records wr
JOIN quotas q ON wr.quota_id = q.id
JOIN processes p ON q.process_code = p.process_code
JOIN process_cat1 pc1 ON q.cat1_code = pc1.cat1_code
JOIN process_cat2 pc2 ON q.cat2_code = pc2.cat2_code
JOIN motor_models mm ON q.model_code = mm.model_code

UNION ALL

-- Part B: 无定额工资记录
SELECT
    wn.id AS id,
    wn.nonfixed_quota_id AS quota_id,
    wn.worker_code,
    wn.quantity,
    wn.unit_price,
    (wn.quantity * wn.unit_price) AS amount,
    wn.record_date,
    wn.created_by,
    wn.created_at,
    NULL AS model_display,
    NULL AS cat1_display,
    NULL AS cat2_display,
    CONCAT(wn.nonfixed_quota_id, ' (', qn.process_name, ')') AS process_display,
    TRUE AS is_nonfixed
FROM work_records_nonfixed wn
JOIN quotas_nonfixed qn ON wn.nonfixed_quota_id = qn.id;
