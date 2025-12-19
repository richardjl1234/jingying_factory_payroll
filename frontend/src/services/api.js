import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
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
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data)
};

// 用户管理API
export const userAPI = {
  getUsers: (params) => api.get('/users/', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users/', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

// 工人管理API
export const workerAPI = {
  getWorkers: (params) => api.get('/workers/', { params }),
  getWorker: (code) => api.get(`/workers/${code}`),
  createWorker: (data) => api.post('/workers/', data),
  updateWorker: (code, data) => api.put(`/workers/${code}`, data),
  deleteWorker: (code) => api.delete(`/workers/${code}`)
};

// 工序管理API
export const processAPI = {
  getProcesses: (params) => api.get('/processes/', { params }),
  getProcess: (code) => api.get(`/processes/${code}`),
  createProcess: (data) => api.post('/processes/', data),
  updateProcess: (code, data) => api.put(`/processes/${code}`, data),
  deleteProcess: (code) => api.delete(`/processes/${code}`)
};

// 定额管理API
export const quotaAPI = {
  getQuotas: (params) => api.get('/quotas/', { params }),
  getQuota: (id) => api.get(`/quotas/${id}`),
  getLatestQuota: (processCode) => api.get(`/quotas/latest/${processCode}`),
  createQuota: (data) => api.post('/quotas/', data),
  updateQuota: (id, data) => api.put(`/quotas/${id}`, data),
  deleteQuota: (id) => api.delete(`/quotas/${id}`)
};

// 工资记录管理API
export const salaryAPI = {
  getSalaryRecords: (params) => api.get('/salary-records/', { params }),
  getSalaryRecord: (id) => api.get(`/salary-records/${id}`),
  createSalaryRecord: (data) => api.post('/salary-records/', data),
  updateSalaryRecord: (id, data) => api.put(`/salary-records/${id}`, data),
  deleteSalaryRecord: (id) => api.delete(`/salary-records/${id}`)
};

// 报表API
export const reportAPI = {
  getWorkerSalaryReport: (workerCode, month) => api.get(`/reports/worker-salary/${workerCode}/${month}/`),
  getProcessWorkloadReport: (month) => api.get(`/reports/process-workload/${month}/`),
  getSalarySummaryReport: (month) => api.get(`/reports/salary-summary/${month}/`)
};

// 统计API
export const statsAPI = {
  getStatistics: () => api.get('/stats/')
};

// 工序类别一管理API
export const processCat1API = {
  getProcessCat1List: () => api.get('/process-cat1/'),
  getProcessCat1: (code) => api.get(`/process-cat1/${code}`),
  createProcessCat1: (data) => api.post('/process-cat1/', data),
  updateProcessCat1: (code, data) => api.put(`/process-cat1/${code}`, data),
  deleteProcessCat1: (code) => api.delete(`/process-cat1/${code}`)
};

// 工序类别二管理API
export const processCat2API = {
  getProcessCat2List: () => api.get('/process-cat2/'),
  getProcessCat2: (code) => api.get(`/process-cat2/${code}`),
  createProcessCat2: (data) => api.post('/process-cat2/', data),
  updateProcessCat2: (code, data) => api.put(`/process-cat2/${code}`, data),
  deleteProcessCat2: (code) => api.delete(`/process-cat2/${code}`)
};

// 电机型号管理API
export const motorModelAPI = {
  getMotorModelList: () => api.get('/motor-models/'),
  getMotorModel: (name) => api.get(`/motor-models/${name}`),
  createMotorModel: (data) => api.post('/motor-models/', data),
  updateMotorModel: (name, data) => api.put(`/motor-models/${name}`, data),
  deleteMotorModel: (name) => api.delete(`/motor-models/${name}`)
};

export default api;
