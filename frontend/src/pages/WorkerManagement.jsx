import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Typography, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { workerAPI } from '../services/api';

const { Title } = Typography;

const WorkerManagement = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null);
  const [form] = Form.useForm();

  // 获取工人列表
  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const data = await workerAPI.getWorkers();
      setWorkers(data);
    } catch (error) {
      message.error('获取工人列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  // 显示添加工人模态框
  const showAddModal = () => {
    setIsEditMode(false);
    setCurrentWorker(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 显示编辑工人模态框
  const showEditModal = (worker) => {
    setIsEditMode(true);
    setCurrentWorker(worker);
    form.setFieldsValue({
      worker_code: worker.worker_code,
      name: worker.name
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
        // 编辑工人
        await workerAPI.updateWorker(currentWorker.worker_code, values);
        message.success('工人更新成功');
      } else {
        // 添加工人
        await workerAPI.createWorker(values);
        message.success('工人添加成功');
      }
      setIsModalVisible(false);
      fetchWorkers();
    } catch (error) {
      message.error(isEditMode ? '工人更新失败' : '工人添加失败');
    }
  };

  // 删除工人
  const handleDelete = async (workerCode) => {
    Modal.confirm({
      title: '确认删除工人',
      content: (
        <div>
          <p>删除工人将同时删除以下相关数据：</p>
          <ul>
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
          await workerAPI.deleteWorker(workerCode);
          message.success('工人删除成功');
          fetchWorkers();
        } catch (error) {
          message.error('工人删除失败');
        }
      },
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '工号',
      dataIndex: 'worker_code',
      key: 'worker_code',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
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
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.worker_code)} size="small">
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>工人管理</Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal} style={{ marginBottom: 16 }}>
        添加工人
      </Button>
      <Table
        columns={columns}
        dataSource={workers}
        rowKey="worker_code"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 添加/编辑工人模态框 */}
      <Modal
        title={isEditMode ? '编辑工人' : '添加工人'}
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
            name="worker_code"
            label="工号"
            rules={[{ required: true, message: '请输入工号!' }]}
          >
            <Input placeholder="工号" disabled={isEditMode} />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名!' }]}
          >
            <Input placeholder="姓名" />
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

export default WorkerManagement;
