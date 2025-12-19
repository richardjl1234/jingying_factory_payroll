import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, message } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  AppstoreOutlined, 
  DollarOutlined, 
  FileTextOutlined,
  LogoutOutlined,
  HomeOutlined,
  TagsOutlined,
  CodeOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';

const { Header, Content, Sider } = Layout;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 获取当前用户信息
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('退出成功');
    // 使用window.location.href进行跳转，确保能够正确退出并跳转到登录页
    window.location.href = '/login';
  };

  // 根据用户角色生成菜单项
  const getMenuItems = () => {
    const baseItems = [
      {
        key: 'home',
        icon: <HomeOutlined />,
        label: <Link to="/">首页</Link>
      }
    ];
    
    if (!user) {
      return baseItems;
    }
    
    const role = user.role;
    
    // 报表用户只能看到报表统计
    if (role === 'report') {
      return [
        ...baseItems,
        {
          key: 'reports',
          icon: <FileTextOutlined />,
          label: <Link to="/reports">报表统计</Link>
        }
      ];
    }
    
    // 管理员和统计员可以看到更多菜单
    const commonItems = [
      {
        key: 'workers',
        icon: <TeamOutlined />,
        label: <Link to="/workers">工人管理</Link>
      },
      {
        key: 'processes',
        icon: <AppstoreOutlined />,
        label: <Link to="/processes">工序管理</Link>
      },
      {
        key: 'process-cat1',
        icon: <TagsOutlined />,
        label: <Link to="/process-cat1">工序类别一</Link>
      },
      {
        key: 'process-cat2',
        icon: <TagsOutlined />,
        label: <Link to="/process-cat2">工序类别二</Link>
      },
      {
        key: 'motor-models',
        icon: <CodeOutlined />,
        label: <Link to="/motor-models">型号管理</Link>
      },
      {
        key: 'quotas',
        icon: <DollarOutlined />,
        label: <Link to="/quotas">定额管理</Link>
      },
      {
        key: 'salary-records',
        icon: <FileTextOutlined />,
        label: <Link to="/salary-records">工资记录</Link>
      },
      {
        key: 'reports',
        icon: <FileTextOutlined />,
        label: <Link to="/reports">报表统计</Link>
      }
    ];
    
    // 管理员额外添加用户管理菜单
    if (role === 'admin') {
      const adminItems = [
        {
          key: 'users',
          icon: <UserOutlined />,
          label: <Link to="/users">用户管理</Link>
        },
        ...commonItems
      ];
      return [...baseItems, ...adminItems];
    }
    
    // 统计员（statistician）或其他角色
    return [...baseItems, ...commonItems];
  };

  const menuItems = getMenuItems();

  

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
        <Menu theme="dark" mode="inline" items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', background: '#fff', padding: '0 24px' }}>
          <Dropdown menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }] }} trigger={['click']}>
            <Button type="text" style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar icon={<UserOutlined />} />
              <span style={{ marginLeft: 8 }}>{user?.name || '未知用户'}</span>
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px', background: '#fff', padding: 24, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
