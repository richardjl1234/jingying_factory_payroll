import axios from 'axios';
import { User, Worker, Process, Quota, SalaryRecord, LoginResponse, PaginatedResponse } from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器，添加token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器，处理错误
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    if (error.response && error.response.status === 401) {
      // 清除token并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  login: (data: { username: string; password: string }): Promise<LoginResponse> => 
    api.post('/auth/login', data),
  getCurrentUser: (): Promise<User> => 
    api.get('/auth/me'),
  changePassword: (data: { old_password: string; new_password: string; confirm_password: string }): Promise<void> => 
    api.post('/auth/change-password', data)
};

// 用户管理API
export const userAPI = {
  getUsers: (params?: any): Promise<PaginatedResponse<User>> => 
    api.get('/users/', { params }),
  getUser: (id: number): Promise<User> => 
    api.get(`/users/${id}`),
  createUser: (data: Omit<User, 'id'>): Promise<User> => 
    api.post('/users/', data),
  updateUser: (id: number, data: Partial<User>): Promise<User> => 
    api.put(`/users/${id}`, data),
  deleteUser: (id: number): Promise<void> => 
    api.delete(`/users/${id}`)
};

// 工人管理API
export const workerAPI = {
  getWorkers: (params?: any): Promise<PaginatedResponse<Worker>> => 
    api.get('/workers/', { params }),
  getWorker: (code: string): Promise<Worker> => 
    api.get(`/workers/${code}`),
  createWorker: (data: Omit<Worker, 'id'>): Promise<Worker> => 
    api.post('/workers/', data),
  updateWorker: (code: string, data: Partial<Worker>): Promise<Worker> => 
    api.put(`/workers/${code}`, data),
  deleteWorker: (code: string): Promise<void> => 
    api.delete(`/workers/${code}`)
};

// 工序管理API
export const processAPI = {
  getProcesses: (params?: any): Promise<PaginatedResponse<Process>> => 
    api.get('/processes/', { params }),
  getProcess: (code: string): Promise<Process> => 
    api.get(`/processes/${code}`),
  createProcess: (data: Omit<Process, 'id'>): Promise<Process> => 
    api.post('/processes/', data),
  updateProcess: (code: string, data: Partial<Process>): Promise<Process> => 
    api.put(`/processes/${code}`, data),
  deleteProcess: (code: string): Promise<void> => 
    api.delete(`/processes/${code}`)
};

// 定额管理API
export const quotaAPI = {
  getQuotas: (params?: any): Promise<PaginatedResponse<Quota>> => 
    api.get('/quotas/', { params }),
  getQuota: (id: number): Promise<Quota> => 
    api.get(`/quotas/${id}`),
  getLatestQuota: (processCode: string): Promise<Quota> => 
    api.get(`/quotas/latest/${processCode}`),
  createQuota: (data: Omit<Quota, 'id'>): Promise<Quota> => 
    api.post('/quotas/', data),
  updateQuota: (id: number, data: Partial<Quota>): Promise<Quota> => 
    api.put(`/quotas/${id}`, data),
  deleteQuota: (id: number): Promise<void> => 
    api.delete(`/quotas/${id}`)
};

// 工资记录管理API
export const salaryAPI = {
  getSalaryRecords: (params?: any): Promise<PaginatedResponse<SalaryRecord>> => 
    api.get('/salary-records/', { params }),
  getSalaryRecord: (id: number): Promise<SalaryRecord> => 
    api.get(`/salary-records/${id}`),
  createSalaryRecord: (data: Omit<SalaryRecord, 'id'>): Promise<SalaryRecord> => 
    api.post('/salary-records/', data),
  updateSalaryRecord: (id: number, data: Partial<SalaryRecord>): Promise<SalaryRecord> => 
    api.put(`/salary-records/${id}`, data),
  deleteSalaryRecord: (id: number): Promise<void> => 
    api.delete(`/salary-records/${id}`)
};

// 报表API
export const reportAPI = {
  getWorkerSalaryReport: (workerCode: string, month: string): Promise<any> => 
    api.get(`/reports/worker-salary/${workerCode}/${month}/`),
  getProcessWorkloadReport: (month: string): Promise<any> => 
    api.get(`/reports/process-workload/${month}/`),
  getSalarySummaryReport: (month: string): Promise<any> => 
    api.get(`/reports/salary-summary/${month}/`)
};

// 统计API
export const statsAPI = {
  getStatistics: (): Promise<{
    user_count: number;
    worker_count: number;
    process_cat1_count: number;
    process_cat2_count: number;
    model_count: number;
    process_count: number;
    quota_count: number;
    salary_record_count: number;
  }> => api.get('/stats/')
};

// 工序类别一管理API
export const processCat1API = {
  getProcessCat1List: (): Promise<any[]> => api.get('/process-cat1/'),
  getProcessCat1: (code: string): Promise<any> => api.get(`/process-cat1/${code}`),
  createProcessCat1: (data: any): Promise<any> => api.post('/process-cat1/', data),
  updateProcessCat1: (code: string, data: any): Promise<any> => api.put(`/process-cat1/${code}`, data),
  deleteProcessCat1: (code: string): Promise<void> => api.delete(`/process-cat1/${code}`)
};

// 工序类别二管理API
export const processCat2API = {
  getProcessCat2List: (): Promise<any[]> => api.get('/process-cat2/'),
  getProcessCat2: (code: string): Promise<any> => api.get(`/process-cat2/${code}`),
  createProcessCat2: (data: any): Promise<any> => api.post('/process-cat2/', data),
  updateProcessCat2: (code: string, data: any): Promise<any> => api.put(`/process-cat2/${code}`, data),
  deleteProcessCat2: (code: string): Promise<void> => api.delete(`/process-cat2/${code}`)
};

// 电机型号管理API
export const motorModelAPI = {
  getMotorModelList: (): Promise<any[]> => api.get('/motor-models/'),
  getMotorModel: (name: string): Promise<any> => api.get(`/motor-models/${name}`),
  createMotorModel: (data: any): Promise<any> => api.post('/motor-models/', data),
  updateMotorModel: (name: string, data: any): Promise<any> => api.put(`/motor-models/${name}`, data),
  deleteMotorModel: (name: string): Promise<void> => api.delete(`/motor-models/${name}`)
};

export default api;
