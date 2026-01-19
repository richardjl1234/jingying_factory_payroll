import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Typography, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { userAPI } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('开始获取用户列表...');
      const data = await userAPI.getUsers();
      console.log('获取到用户列表:', data);
      setUsers(data);
      console.log('设置users状态成功');
    } catch (error) {
      console.error('获取用户列表失败:', error);
      console.error('错误详情:', error.response);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 显示添加用户模态框
  const showAddModal = () => {
    setIsEditMode(false);
    setCurrentUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 显示编辑用户模态框
  const showEditModal = (user) => {
    setIsEditMode(true);
    setCurrentUser(user);
    form.setFieldsValue({
      username: user.username,
      name: user.name,
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setIsModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      // 准备提交数据，移除不必要的字段
      const submitData = { ...values };
      
      // 删除确认密码字段，后端不需要
      delete submitData.confirmPassword;
      
      // 如果是编辑模式且密码为空，则不传递密码字段
      if (isEditMode && !submitData.password) {
        delete submitData.password;
      }
      
      if (isEditMode) {
        // 编辑用户
        await userAPI.updateUser(currentUser.id, submitData);
        message.success('用户更新成功');
      } else {
        // 添加用户
        await userAPI.createUser(submitData);
        message.success('用户添加成功');
      }
      setIsModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error(isEditMode ? '用户更新失败' : '用户添加失败');
    }
  };

  // 删除用户
  const handleDelete = async (userId) => {
    Modal.confirm({
      title: '确认删除用户',
      content: (
        <div>
          <p>删除用户将同时删除以下相关数据：</p>
          <ul>
            <li>用户创建的所有定额记录</li>
            <li>用户创建的所有工资记录</li>
          </ul>
          <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
            此操作不可恢复，确定要继续吗？
          </p>
        </div>
      ),
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await userAPI.deleteUser(userId);
          message.success('用户删除成功');
          fetchUsers();
        } catch (error) {
          message.error('用户删除失败');
        }
      },
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    { title: '角色', dataIndex: 'role', key: 'role', render: (role) => { switch(role) { case 'admin': return '管理员'; case 'statistician': return '统计员'; case 'report': return '报表用户'; default: return role; } }, },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => showEditModal(record)} size="small">
            编辑
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} size="small">
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>用户管理</Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal} style={{ marginBottom: 16 }}>
        添加用户
      </Button>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 添加/编辑用户模态框 */}
      <Modal
        title={isEditMode ? '编辑用户' : '添加用户'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名!' }, { min: 3, message: '用户名长度不能少于3个字符!' }]}
          >
            <Input placeholder="用户名" disabled={isEditMode} />
          </Form.Item>
          <Form.Item
            name="name"
            label="中文全名"
            rules={[{ required: true, message: '请输入中文全名!' }]}
          >
            <Input placeholder="请输入中文全名" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色!' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="statistician">统计员</Option>
              <Option value="report">报表用户</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: !isEditMode, message: '请输入密码!' },
              { min: 6, message: '密码长度不能少于6个字符!' }
            ]}
          >
            {isEditMode ? (
              <Input.Password placeholder="留空则不修改密码" />
            ) : (
              <Input placeholder="密码" />
            )}
          </Form.Item>
          {isEditMode && (
            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!getFieldValue('password')) {
                      return Promise.resolve();
                    }
                    if (!value) {
                      return Promise.reject(new Error('请确认密码!'));
                    }
                    if (getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致!'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="确认密码" />
            </Form.Item>
          )}
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>取消</Button>
              <Button type="primary" htmlType="submit">
                {isEditMode ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
