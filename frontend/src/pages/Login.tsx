import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Modal } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authAPI, salaryAPI } from '../services/api';

const { Title } = Typography;
const { Item, useForm } = Form;

/**
 * 登录页面组件
 * 提供用户登录和首次登录密码修改功能
 */
const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [isChangePwdModalVisible, setIsChangePwdModalVisible] = useState(false);
  const [form] = useForm();
  const [changePwdForm] = useForm();

  /**
   * 登录处理
   * @param values 登录表单值
   */
  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const data = await authAPI.login(values);
      
      // 保存token
      localStorage.setItem('token', data.access_token);
      
      // 保存用户信息
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // 保存登录密码用于首次登录修改密码
      localStorage.setItem('login_password', values.password);
      
      // 检查是否需要修改密码
      if (data.user.need_change_password) {
        message.info('首次登录，请修改密码');
        setIsChangePwdModalVisible(true);
        // Pre-populate the old password field with the login password
        changePwdForm.setFieldsValue({ old_password: values.password });
      } else {
        message.success('登录成功');
        
        // 预加载定额字典数据（异步，不阻塞跳转）
        console.log('[Login] Starting quota dictionary preload after login...');
        const preloadQuotaData = async () => {
          try {
            // 使用当前月份作为记录日期
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const recordDate = `${year}-${month}-01`;
            
            console.log(`[Login] Fetching quota options for date: ${recordDate}`);
            const quotaData = await salaryAPI.getQuotaOptions({ record_date: recordDate });
            
            console.log('[Login] Quota data received:', {
              quota_options_count: quotaData?.quota_options?.length || 0,
              cat1_options_count: quotaData?.cat1_options?.length || 0,
              model_options_count: quotaData?.model_options?.length || 0
            });
            
            // 保存到localStorage
            localStorage.setItem('quota_options_data', JSON.stringify(quotaData));
            localStorage.setItem('quota_options_timestamp', new Date().toISOString());
            console.log('[Login] Quota data saved to localStorage');
          } catch (error) {
            console.error('[Login] Failed to preload quota data:', error);
            // 静默失败，不影响用户体验
          }
        };
        
        // 启动预加载
        preloadQuotaData();
        
        // 跳转首页
        window.location.href = '/';
      }
    } catch (error) {
      console.error('登录错误详情:', error);
      let errorMessage = '登录失败，请检查用户名和密码';
      
      // @ts-ignore
      if (error.response?.data?.detail) {
        // @ts-ignore
        errorMessage = `登录失败: ${error.response.data.detail}`;
      } else if (error instanceof Error) {
        errorMessage = `登录失败: ${error.message}`;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 修改密码处理
   * @param values 密码修改表单值
   */
  const handleChangePassword = async (values: { old_password: string; new_password: string; confirm_password: string }) => {
    try {
      setChangePwdLoading(true);
      await authAPI.changePassword(values);
      message.success('密码修改成功');
      setIsChangePwdModalVisible(false);
      window.location.href = '/';
    } catch (error) {
      let errorMessage = '密码修改失败';
      
      // @ts-ignore
      if (error.response?.data?.detail) {
        // @ts-ignore
        errorMessage = `密码修改失败: ${error.response.data.detail}`;
      } else if (error instanceof Error) {
        errorMessage = `密码修改失败: ${error.message}`;
      }
      
      message.error(errorMessage);
    } finally {
      setChangePwdLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: '#f0f2f5' 
    }}>
      <Card title={<Title level={3} style={{ margin: 0 }}>工厂定额和计件工资管理系统</Title>} style={{ width: 400 }}>
        <Form
          form={form}
          name="login"
          initialValues={{ remember: true }}
          onFinish={handleLogin}
        >
          <Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Item>
          <Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Item>
          <Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Item>
        </Form>
      </Card>

      <Modal
        title="修改密码"
        open={isChangePwdModalVisible}
        footer={null}
        destroyOnClose
      >
        <Form
          form={changePwdForm}
          name="change_password"
          initialValues={{ remember: true }}
          onFinish={handleChangePassword}
        >
          <Item
            name="old_password"
            rules={[{ required: true, message: '请输入旧密码!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="旧密码" />
          </Item>
          <Item
            name="new_password"
            rules={[{ required: true, message: '请输入新密码!' }, { min: 6, message: '密码长度不能少于6位!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
          </Item>
          <Item
            name="confirm_password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认密码!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Item>
          <Item>
            <Button type="primary" htmlType="submit" loading={changePwdLoading} block>
              修改密码
            </Button>
          </Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;
