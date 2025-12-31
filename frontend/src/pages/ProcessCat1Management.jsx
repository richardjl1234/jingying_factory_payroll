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
import { processCat1API } from '../services/api';

const { Title } = Typography;

const ProcessCat1Management = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  // 获取数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await processCat1API.getProcessCat1List();
      setData(response);
    } catch (error) {
      message.error('获取数据失败');
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
        await processCat1API.updateProcessCat1(editingRecord.cat1_code, values);
        message.success('更新成功');
      } else {
        await processCat1API.createProcessCat1(values);
        message.success('创建成功');
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
      name: record.name,
      description: record.description
    });
    setModalVisible(true);
  };

  // 删除记录
  const handleDelete = async (cat1Code) => {
    Modal.confirm({
      title: '确认删除工段类别',
      content: (
        <div>
          <p>删除工段类别将同时删除以下相关数据：</p>
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
          await processCat1API.deleteProcessCat1(cat1Code);
          message.success('删除成功');
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
      title: '工段类别编码',
      dataIndex: 'cat1_code',
      key: 'cat1_code',
      width: 120,
    },
    {
      title: '工段类别名称',
      dataIndex: 'name',
      key: 'name',
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
            onClick={() => handleDelete(record.cat1_code)}
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
          <Title level={3}>工段类别管理</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
            新增类别
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={data}
          rowKey="cat1_code"
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
        title={editingRecord ? '编辑工段类别' : '新增工段类别'}
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
              label="工段类别编码"
              name="cat1_code"
              rules={[
                { required: true, message: '请输入工段类别编码' },
                { min: 1, max: 4, message: '工段类别编码长度应为1-4个字符' }
              ]}
            >
              <Input placeholder="请输入工段类别编码" />
            </Form.Item>
          )}
          
          <Form.Item
              label="工段类别名称"
            name="name"
            rules={[
              { required: true, message: '请输入工段类别名称' },
              { min: 1, max: 50, message: '工段类别名称长度应为1-50个字符' }
            ]}
          >
            <Input placeholder="请输入工段类别名称" />
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

export default ProcessCat1Management;
