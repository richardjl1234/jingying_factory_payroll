import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import UserManagement from './pages/UserManagement.jsx';
import WorkerManagement from './pages/WorkerManagement.jsx';
import ProcessManagement from './pages/ProcessManagement.jsx';
import ProcessCat1Management from './pages/ProcessCat1Management.jsx';
import ProcessCat2Management from './pages/ProcessCat2Management.jsx';
import MotorModelManagement from './pages/MotorModelManagement.jsx';
import QuotaManagement from './pages/QuotaManagement.jsx';
import SalaryRecord from './pages/SalaryRecord.jsx';
import Report from './pages/Report.jsx';
import AppLayout from './components/Layout.jsx';
import './App.css';

// 私有路由组件
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
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
          
          {/* 工序类别一管理页面 */}
          <Route path="/process-cat1" element={
            <PrivateRoute>
              <AppLayout>
                <ProcessCat1Management />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* 工序类别二管理页面 */}
          <Route path="/process-cat2" element={
            <PrivateRoute>
              <AppLayout>
                <ProcessCat2Management />
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
          
          {/* 定额管理页面 */}
          <Route path="/quotas" element={
            <PrivateRoute>
              <AppLayout>
                <QuotaManagement />
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
}

export default App;
