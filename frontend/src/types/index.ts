/**
 * 用户类型定义
 */
export interface User {
  id: number;
  username: string;
  password?: string;
  full_name: string;
  role: 'admin' | 'statistician' | 'report' | 'worker';
  need_change_password: boolean;
}

/**
 * 工人类型定义
 */
export interface Worker {
  id: number;
  worker_code: string;
  full_name: string;
  department: string;
  position: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

/**
 * 工序类型定义
 */
export interface Process {
  process_code: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 定额类型定义
 */
export interface Quota {
  id: number;
  process_code: string;
  cat1_code: string;
  cat2_code: string;
  model_code: string;
  unit_price: number;
  effective_date: string;
  obsolete_date: string;
  created_by?: number;
  created_at?: string;
  process?: Process;
  creator?: User;
}

/**
 * 工作记录类型定义（用于创建/更新）
 */
export interface WorkRecord {
  id: number;
  worker_code: string;
  quota_id: number;
  quantity: number;
  record_date: string;
  created_by?: number;
  created_at?: string;
}

/**
 * 工资记录类型定义（从视图读取）
 */
export interface SalaryRecord {
  id: number;
  worker_code: string;
  quota_id: number;
  quantity: number;
  unit_price: number;
  amount: number;
  record_date: string;
  created_by?: number;
  created_at?: string;
  model_display?: string;
  cat1_display?: string;
  cat2_display?: string;
  process_display?: string;
}

/**
 * 工人月度工资记录响应
 */
export interface WorkerMonthRecordsResponse {
  worker_code: string;
  worker_name: string;
  month: string;
  records: SalaryRecord[];
  summary: {
    total_quantity: number;
    total_amount: number;
  };
}

/**
 * 字典数据类型
 */
export interface Dictionaries {
  motor_models: { model_code: string; name: string }[];
  quota_combinations: QuotaCombination[];
}

/**
 * 定额组合
 */
export interface QuotaCombination {
  quota_id: number;
  combined_code: string;
  model_code: string;
  model_name: string;
  cat1_code: string;
  cat1_name: string;
  cat2_code: string;
  cat2_name: string;
  process_code: string;
  process_name: string;
  unit_price: number;
}

/**
 * 定额搜索结果
 */
export interface QuotaSearchResult {
  quota_id: number;
  model_code: string;
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

/**
 * 登录响应类型定义
 */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/**
 * 分页响应类型定义
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * 定额过滤器组合类型定义
 */
export interface QuotaFilterCombination {
  cat1_code: string;
  cat1_name: string;
  cat2_code: string;
  cat2_name: string;
  effective_date: string;
}

/**
 * 定额矩阵行类型定义
 */
export interface QuotaMatrixRow {
  model_code: string;
  model_name: string;
  prices: Record<string, number>;  // process_code -> unit_price
}

/**
 * 定额矩阵列类型定义
 */
export interface QuotaMatrixColumn {
  process_code: string;
  process_name: string;
}

/**
 * 定额矩阵响应类型定义
 */
export interface QuotaMatrixResponse {
  cat1: { code: string; name: string };
  cat2: { code: string; name: string };
  effective_date: string;
  rows: QuotaMatrixRow[];
  columns: QuotaMatrixColumn[];
}
