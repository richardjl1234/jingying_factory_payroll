import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Typography, Space, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { salaryAPI, workerAPI, quotaAPI } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const SalaryRecord = () => {
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [quotas, setQuotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [form] = Form.useForm();

  // 获取工人列表
  const fetchWorkers = async () => {
    try {
      const data = await workerAPI.getWorkers();
      setWorkers(data);
    } catch (error) {
      message.error('获取工人列表失败');
    }
  };

  // 获取定额列表
  const fetchQuotas = async () => {
    try {
      const data = await quotaAPI.getQuotas();
      setQuotas(data);
    } catch (error) {
      message.error('获取定额列表失败');
    }
  };

  // 获取工作记录列表
  const fetchSalaryRecords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedWorker) {
        params.worker_code = selectedWorker;
      }
      if (selectedMonth) {
        params.record_date = selectedMonth;
      }
      const data = await salaryAPI.getSalaryRecords(params);
      setSalaryRecords(data);
    } catch (error) {
      message.error('获取工作记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchQuotas();
  }, []);

  useEffect(() => {
    fetchSalaryRecords();
  }, [selectedWorker, selectedMonth]);

  // 显示添加记录模态框
  const showAddModal = () => {
    setIsEditMode(false);
    setCurrentRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 显示编辑记录模态框
  const showEditModal = (record) => {
    setIsEditMode(true);
    setCurrentRecord(record);
    form.setFieldsValue({
      worker_code: record.worker_code,
      quota_id: record.quota_id,
      quantity: record.quantity,
      record_date: record.record_date
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
      // 格式化数据
      const formattedValues = {
        ...values,
        quantity: parseFloat(values.quantity), // 将字符串转换为数字
        record_date: values.record_date.format('YYYY-MM-DD') // 格式化日期为YYYY-MM-DD格式
      };
      
      if (isEditMode) {
        // 编辑记录
        await salaryAPI.updateSalaryRecord(currentRecord.id, formattedValues);
        message.success('工作记录更新成功');
      } else {
        // 添加记录
        await salaryAPI.createSalaryRecord(formattedValues);
        message.success('工作记录添加成功');
      }
      setIsModalVisible(false);
      fetchSalaryRecords();
    } catch (error) {
      message.error(isEditMode ? '工作记录更新失败' : '工作记录添加失败');
    }
  };

  // 删除记录
  const handleDelete = async (recordId) => {
    Modal.confirm({
      title: '确认删除工作记录',
      content: (
        <div>
          <p>确定要删除这条工作记录吗？</p>
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
          await salaryAPI.deleteSalaryRecord(recordId);
          message.success('工作记录删除成功');
          fetchSalaryRecords();
        } catch (error) {
          message.error('工作记录删除失败');
        }
      },
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '记录日期',
      dataIndex: 'record_date',
      key: 'record_date',
    },
    {
      title: '工人',
      dataIndex: 'worker_code',
      key: 'worker_code',
      render: (worker_code) => {
        const worker = workers.find(w => w.worker_code === worker_code);
        return worker ? `${worker.name} (${worker.worker_code})` : worker_code;
      }
    },
    {
      title: '定额编号',
      dataIndex: 'quota_id',
      key: 'quota_id',
    },
    {
      title: '电机型号',
      dataIndex: 'model_display',
      key: 'model_display',
      render: (model_display) => model_display || '未知型号'
    },
    {
      title: '工段类别',
      dataIndex: 'cat1_display',
      key: 'cat1_display',
      render: (cat1_display) => cat1_display || '未知工段'
    },
    {
      title: '工序类别',
      dataIndex: 'cat2_display',
      key: 'cat2_display',
      render: (cat2_display) => cat2_display || '未知工序类别'
    },
    {
      title: '工序名称',
      dataIndex: 'process_display',
      key: 'process_display',
      render: (process_display) => process_display || '未知工序'
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price) => `¥${price}`
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${amount}`
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
  const handleWorkerChange = (value) => {
    setSelectedWorker(value);
  };

  const handleMonthChange = (date, dateString) => {
    setSelectedMonth(dateString);
  };

  // 定额选择变化处理
  const handleQuotaChange = (value) => {
    // 可以在这里添加额外的处理逻辑
    console.log('Selected quota id:', value);
  };

  return (
    <div>
      <Title level={2}>工资记录管理</Title>
      
      {/* 筛选区域 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Select
            placeholder="按工人筛选"
            style={{ width: '100%' }}
            onChange={handleWorkerChange}
            allowClear
          >
            {workers.map(worker => (
              <Option key={worker.worker_code} value={worker.worker_code}>
                {worker.name} ({worker.worker_code})
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={8}>
          <DatePicker
            placeholder="按日期筛选"
            style={{ width: '100%' }}
            onChange={handleMonthChange}
            allowClear
          />
        </Col>
        <Col span={8}>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            添加工作记录
          </Button>
        </Col>
      </Row>
      
      {/* 工作记录列表 */}
      <Table
        columns={columns}
        dataSource={salaryRecords}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 添加/编辑工作记录模态框 */}
      <Modal
        title={isEditMode ? '编辑工作记录' : '添加工作记录'}
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
            label="工人"
            rules={[{ required: true, message: '请选择工人!' }]}
          >
            <Select placeholder="请选择工人">
              {workers.map(worker => (
                <Option key={worker.worker_code} value={worker.worker_code}>
                  {worker.name} ({worker.worker_code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quota_id"
            label="定额编号"
            rules={[{ required: true, message: '请选择定额编号!' }]}
          >
            <Select placeholder="请选择定额编号" onChange={handleQuotaChange}>
              {quotas.map(quota => (
                <Option key={quota.id} value={quota.id}>
                  {`定额${quota.id} (${quota.process_code} - ¥${quota.unit_price})`}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="数量"
            rules={[
              { required: true, message: '请输入数量!' },
              {
                transform: (value) => parseFloat(value),
                type: 'number',
                min: 0,
                message: '数量必须大于等于0!'
              }
            ]}
          >
            <Input type="number" placeholder="数量" step="0.01" />
          </Form.Item>
          <Form.Item
            name="record_date"
            label="日期"
            rules={[{ required: true, message: '请选择日期!' }]}
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

export default SalaryRecord;
