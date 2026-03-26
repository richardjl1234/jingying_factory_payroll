import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
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

// Environment-based theme configuration
// ENV is set at build time via VITE_APP_ENV (local / test / prod)
const APP_ENV = (import.meta as any).env?.VITE_APP_ENV || 'prod';

const THEME_CONFIG = {
  prod: {
    colorPrimary: '#1677ff',       // Default Ant Design blue
    colorBgContainer: '#ffffff',
    label: '生产环境',
    bannerBg: '#1677ff',
  },
  test: {
    colorPrimary: '#eb5757',        // Light red
    colorBgContainer: '#fff5f5',
    label: '测试环境',
    bannerBg: '#eb5757',
  },
  local: {
    colorPrimary: '#52c41a',       // Green
    colorBgContainer: '#f6ffed',
    label: '本地环境',
    bannerBg: '#52c41a',
  },
};

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
 * 根据 VITE_APP_ENV 显示不同颜色（local=绿色, test=红色, prod=蓝色）
 */
const App: React.FC = () => {
  const currentTheme = THEME_CONFIG[APP_ENV as keyof typeof THEME_CONFIG] || THEME_CONFIG.prod;

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: currentTheme.colorPrimary,
          colorBgContainer: currentTheme.colorBgContainer,
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      {APP_ENV !== 'prod' && (
        <div style={{
          background: currentTheme.bannerBg,
          color: '#fff',
          textAlign: 'center',
          padding: '4px 16px',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: 1,
          position: 'sticky',
          top: 0,
          zIndex: 9999,
        }}>
          ⚠️ {currentTheme.label} — 请勿用于正式业务
        </div>
      )}
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
          
          {/* 工段类别管理页面 */}
          <Route path="/process-cat1" element={
            <PrivateRoute>
              <AppLayout>
                <ProcessCat1Management />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* 工序类别管理页面 */}
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
