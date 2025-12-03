import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Modal } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authAPI } from '../services/api';

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [isChangePwdModalVisible, setIsChangePwdModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [changePwdForm] = Form.useForm();

  // 登录处理
  const handleLogin = async (values) => {
    try {
      setLoading(true);
      const data = await authAPI.login(values);
      
      // 保存token
      localStorage.setItem('token', data.access_token);
      
      // 保存用户信息
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // 检查是否需要修改密码
      if (data.user.need_change_password) {
        message.info('首次登录，请修改密码');
        setIsChangePwdModalVisible(true);
      } else {
        message.success('登录成功');
        window.location.href = '/';
      }
    } catch (error) {
      message.error(error.response?.data?.detail || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码处理
  const handleChangePassword = async (values) => {
    try {
      setChangePwdLoading(true);
      await authAPI.changePassword(values);
      message.success('密码修改成功');
      setIsChangePwdModalVisible(false);
      window.location.href = '/';
    } catch (error) {
      message.error(error.response?.data?.detail || '密码修改失败');
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
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={isChangePwdModalVisible}
        footer={null}
        closable={false}
        maskClosable={false}
      >
        <Form
          form={changePwdForm}
          name="changePassword"
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="old_password"
            label="旧密码"
            rules={[{ required: true, message: '请输入旧密码!' }]}
          >
            <Input.Password placeholder="旧密码" prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码!' },
              { min: 6, message: '密码长度不能少于6个字符!' }
            ]}
          >
            <Input.Password placeholder="新密码" prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认密码"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码!' },
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
            <Input.Password placeholder="确认密码" prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={changePwdLoading} block>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;
