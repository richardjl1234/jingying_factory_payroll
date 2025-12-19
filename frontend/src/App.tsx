import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import Home from './pages/Home';
import UserManagement from './pages/UserManagement';
import WorkerManagement from './pages/WorkerManagement';
import ProcessManagement from './pages/ProcessManagement';
import ProcessCat1Management from './pages/ProcessCat1Management';
import ProcessCat2Management from './pages/ProcessCat2Management';
import MotorModelManagement from './pages/MotorModelManagement';
import QuotaManagement from './pages/QuotaManagement';
import SalaryRecord from './pages/SalaryRecord';
import Report from './pages/Report';
import AppLayout from './components/Layout';
import './App.css';

// 私有路由组件的Props类型
type PrivateRouteProps = {
  children: React.ReactNode;
};

/**
 * 私有路由组件
 * 验证用户是否已登录（检查localStorage中的token）
 * 如果已登录，则渲染子组件；否则重定向到登录页面
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

/**
 * 应用主组件
 * 配置路由和全局Ant Design主题
 */
const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          {/* 登录页 */}
          <Route path="/login" element={<Login />} />
          
          {/* 首页 */}
          <Route path="/" element={
            <PrivateRoute>
              <AppLayout>
                <Home />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* 用户管理页面 */}
          <Route path="/users" element={
            <PrivateRoute>
              <AppLayout>
                <UserManagement />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* 工人管理页面 */}
          <Route path="/workers" element={
            <PrivateRoute>
              <AppLayout>
                <WorkerManagement />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* 工序管理页面 */}
          <Route path="/processes" element={
            <PrivateRoute>
              <AppLayout>
                <ProcessManagement />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* 定额管理页面 */}
          <Route path="/quotas" element={
            <PrivateRoute>
              <AppLayout>
                <QuotaManagement />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* 电机型号管理页面 */}
          <Route path="/motor-models" element={
            <PrivateRoute>
              <AppLayout>
                <MotorModelManagement />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* 类别一管理页面 */}
          <Route path="/process-cat1" element={
            <PrivateRoute>
              <AppLayout>
                <ProcessCat1Management />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* 类别二管理页面 */}
          <Route path="/process-cat2" element={
            <PrivateRoute>
              <AppLayout>
                <ProcessCat2Management />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* 工资记录页面 */}
          <Route path="/salary-records" element={
            <PrivateRoute>
              <AppLayout>
                <SalaryRecord />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* 报表统计页面 */}
          <Route path="/reports" element={
            <PrivateRoute>
              <AppLayout>
                <Report />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* 其他页面将在后续实现 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;