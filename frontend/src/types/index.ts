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
  id: number;
  process_code: string;
  process_name: string;
  unit: string;
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
  process_name: string;
  unit: string;
  quota_value: number;
  wage_per_unit: number;
  effective_date: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 工资记录类型定义
 */
export interface SalaryRecord {
  id: number;
  worker_code: string;
  worker_name: string;
  process_code: string;
  process_name: string;
  unit: string;
  completed_quantity: number;
  quota_value: number;
  wage_per_unit: number;
  total_wage: number;
  record_date: string;
  created_at?: string;
  updated_at?: string;
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
