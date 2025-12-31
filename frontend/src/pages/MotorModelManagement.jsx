import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Space, 
  Popconfirm,
  Card,
  Typography 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { motorModelAPI } from '../services/api';

const { Title } = Typography;

const MotorModelManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  // 获取数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await motorModelAPI.getMotorModelList();
      setData(response);
    } catch (error) {
      message.error('获取电机型号数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 处理表单提交
  const handleSubmit = async (values) => {
    try {
      if (editingRecord) {
        await motorModelAPI.updateMotorModel(editingRecord.name, values);
        message.success('电机型号更新成功');
      } else {
        await motorModelAPI.createMotorModel(values);
        message.success('电机型号创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.detail || '操作失败');
    }
  };

  // 编辑记录
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      aliases: record.aliases,
      description: record.description
    });
    setModalVisible(true);
  };

  // 删除记录
  const handleDelete = async (motorModelName) => {
    Modal.confirm({
      title: '确认删除电机型号',
      content: (
        <div>
          <p>删除电机型号将同时删除以下相关数据：</p>
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
          await motorModelAPI.deleteMotorModel(motorModelName);
          message.success('电机型号删除成功');
          fetchData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 打开新建模态框
  const showModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const columns = [
    {
      title: '电机型号名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '电机型号别名',
      dataIndex: 'aliases',
      key: 'aliases',
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.name)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3}>电机型号管理</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
            新增电机型号
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={data}
          rowKey="name"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑电机型号' : '新增电机型号'}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {!editingRecord && (
            <Form.Item
              label="电机型号名称"
              name="name"
              rules={[
                { required: true, message: '请输入电机型号名称' },
                { min: 1, max: 20, message: '电机型号名称长度应为1-20个字符' }
              ]}
            >
              <Input placeholder="请输入电机型号名称" />
            </Form.Item>
          )}
          
          <Form.Item
            label="电机型号别名"
            name="aliases"
            rules={[{ max: 100, message: '电机型号别名长度不能超过100个字符' }]}
          >
            <Input placeholder="请输入电机型号别名（可选）" />
          </Form.Item>
          
          <Form.Item
            label="描述"
            name="description"
            rules={[{ max: 100, message: '描述长度不能超过100个字符' }]}
          >
            <Input.TextArea 
              placeholder="请输入描述（可选）" 
              rows={3}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingRecord ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MotorModelManagement;
