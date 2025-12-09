import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Typography, Space, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { quotaAPI, processAPI } from '../services/api';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const QuotaManagement = () => {
  const [quotas, setQuotas] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentQuota, setCurrentQuota] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [form] = Form.useForm();

  // 获取工序列表
  const fetchProcesses = async () => {
    try {
      const data = await processAPI.getProcesses();
      setProcesses(data);
    } catch (error) {
      message.error('获取工序列表失败');
    }
  };

  // 获取定额列表
  const fetchQuotas = async () => {
    try {
      setLoading(true);
      const params = selectedProcess ? { process_code: selectedProcess } : {};
      const data = await quotaAPI.getQuotas(params);
      setQuotas(data);
    } catch (error) {
      message.error('获取定额列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    fetchQuotas();
  }, [selectedProcess]);

  // 显示添加定额模态框
  const showAddModal = () => {
    setIsEditMode(false);
    setCurrentQuota(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 显示编辑定额模态框
  const showEditModal = (quota) => {
    setIsEditMode(true);
    setCurrentQuota(quota);
    form.setFieldsValue({
      process_code: quota.process_code,
      unit_price: quota.unit_price,
      effective_date: quota.effective_date
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
      // 格式化日期和转换数据类型
      const formattedValues = {
        ...values,
        effective_date: values.effective_date.format('YYYY-MM-DD'),
        unit_price: parseFloat(values.unit_price) // 将字符串转换为数字
      };
      
      if (isEditMode) {
        // 编辑定额
        await quotaAPI.updateQuota(currentQuota.id, formattedValues);
        message.success('定额更新成功');
      } else {
        // 添加定额
        await quotaAPI.createQuota(formattedValues);
        message.success('定额添加成功');
      }
      setIsModalVisible(false);
      fetchQuotas();
    } catch (error) {
      message.error(isEditMode ? '定额更新失败' : '定额添加失败');
    }
  };

  // 删除定额
  const handleDelete = async (quotaId) => {
    Modal.confirm({
      title: '确认删除定额',
      content: (
        <div>
          <p>删除定额将同时删除以下相关数据：</p>
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
          await quotaAPI.deleteQuota(quotaId);
          message.success('定额删除成功');
          fetchQuotas();
        } catch (error) {
          message.error('定额删除失败');
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
      dataIndex: 'process_code',
      key: 'process_name',
      render: (process_code) => {
        const process = processes.find(p => p.process_code === process_code);
        return process ? process.name : process_code;
      }
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price) => `¥${price}`
    },
    {
      title: '生效日期',
      dataIndex: 'effective_date',
      key: 'effective_date',
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
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} size="small">
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 筛选处理
  const handleProcessChange = (value) => {
    setSelectedProcess(value);
  };

  return (
    <div>
      <Title level={2}>定额管理</Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Select
            placeholder="按工序筛选"
            style={{ width: '100%' }}
            onChange={handleProcessChange}
            allowClear
          >
            {processes.map(process => (
              <Option key={process.process_code} value={process.process_code}>
                {process.name} ({process.process_code})
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={8}>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            添加定额
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={quotas}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 添加/编辑定额模态框 */}
      <Modal
        title={isEditMode ? '编辑定额' : '添加定额'}
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
            label="工序"
            rules={[{ required: true, message: '请选择工序!' }]}
          >
            <Select placeholder="请选择工序">
              {processes.map(process => (
                <Option key={process.process_code} value={process.process_code}>
                  {process.name} ({process.process_code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="unit_price"
            label="单价"
            rules={[
              { required: true, message: '请输入单价!' },
              {
                transform: (value) => parseFloat(value),
                type: 'number',
                min: 0,
                message: '单价必须大于等于0!'
              }
            ]}
          >
            <Input type="number" placeholder="单价" step="0.01" />
          </Form.Item>
          <Form.Item
            name="effective_date"
            label="生效日期"
            rules={[{ required: true, message: '请选择生效日期!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
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

export default QuotaManagement;
