import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Typography, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { processAPI } from '../services/api';

const { Title } = Typography;

const ProcessManagement = () => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProcess, setCurrentProcess] = useState(null);
  const [form] = Form.useForm();

  // 获取工序列表
  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const data = await processAPI.getProcesses();
      setProcesses(data);
    } catch (error) {
      message.error('获取工序列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  // 显示添加工序模态框
  const showAddModal = () => {
    setIsEditMode(false);
    setCurrentProcess(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 显示编辑工序模态框
  const showEditModal = (process) => {
    setIsEditMode(true);
    setCurrentProcess(process);
    form.setFieldsValue({
      process_code: process.process_code,
      name: process.name,
      category: process.category,
      description: process.description
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
      if (isEditMode) {
        // 编辑工序
        await processAPI.updateProcess(currentProcess.process_code, values);
        message.success('工序更新成功');
      } else {
        // 添加工序
        await processAPI.createProcess(values);
        message.success('工序添加成功');
      }
      setIsModalVisible(false);
      fetchProcesses();
    } catch (error) {
      message.error(isEditMode ? '工序更新失败' : '工序添加失败');
    }
  };

  // 删除工序
  const handleDelete = async (processCode) => {
    Modal.confirm({
      title: '确认删除工序',
      content: (
        <div>
          <p>删除工序将同时删除以下相关数据：</p>
          <ul>
            <li>所有相关的定额记录</li>
            <li>所有相关的工资记录</li>
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
          await processAPI.deleteProcess(processCode);
          message.success('工序删除成功');
          fetchProcesses();
        } catch (error) {
          message.error('工序删除失败');
        }
      },
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '工序编码',
      dataIndex: 'process_code',
      key: 'process_code',
    },
    {
      title: '工序名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '工序类别',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '工序描述',
      dataIndex: 'description',
      key: 'description',
    },
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
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.process_code)} size="small">
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>工序管理</Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal} style={{ marginBottom: 16 }}>
        添加工序
      </Button>
      <Table
        columns={columns}
        dataSource={processes}
        rowKey="process_code"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 添加/编辑工序模态框 */}
      <Modal
        title={isEditMode ? '编辑工序' : '添加工序'}
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
            name="process_code"
            label="工序编码"
            rules={[{ required: true, message: '请输入工序编码!' }]}
          >
            <Input placeholder="工序编码" disabled={isEditMode} />
          </Form.Item>
          <Form.Item
            name="name"
            label="工序名称"
            rules={[{ required: true, message: '请输入工序名称!' }]}
          >
            <Input placeholder="工序名称" />
          </Form.Item>
          <Form.Item
            name="category"
            label="工序类别"
            rules={[{ required: true, message: '请选择工序类别!' }]}
          >
            <Select placeholder="请选择工序类别">
              <Select.Option value="精加工">精加工</Select.Option>
              <Select.Option value="装配喷漆">装配喷漆</Select.Option>
              <Select.Option value="绕嵌排">绕嵌排</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="工序描述"
          >
            <Input.TextArea placeholder="工序描述" rows={4} />
          </Form.Item>
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

export default ProcessManagement;
