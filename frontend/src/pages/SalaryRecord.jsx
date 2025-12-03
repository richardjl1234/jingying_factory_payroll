import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Typography, Space, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { salaryAPI, workerAPI, processAPI, quotaAPI } from '../services/api';

const { Title } = Typography;
const { Option } = Select;
const { MonthPicker } = DatePicker;

const SalaryRecord = () => {
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [quotas, setQuotas] = useState({});
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

  // 获取工序列表
  const fetchProcesses = async () => {
    try {
      const data = await processAPI.getProcesses();
      setProcesses(data);
      
      // 获取每个工序的最新定额
      const quotaMap = {};
      for (const process of data) {
        try {
          const quota = await quotaAPI.getLatestQuota(process.process_code);
          if (quota) {
            quotaMap[process.process_code] = quota;
          }
        } catch (error) {
          console.error(`获取工序 ${process.process_code} 定额失败:`, error);
        }
      }
      setQuotas(quotaMap);
    } catch (error) {
      message.error('获取工序列表失败');
    }
  };

  // 获取工资记录列表
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
      message.error('获取工资记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchProcesses();
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
        record_date: values.record_date.format('YYYY-MM') // 格式化日期为YYYY-MM格式
      };
      
      if (isEditMode) {
        // 编辑记录
        await salaryAPI.updateSalaryRecord(currentRecord.id, formattedValues);
        message.success('工资记录更新成功');
      } else {
        // 添加记录
        await salaryAPI.createSalaryRecord(formattedValues);
        message.success('工资记录添加成功');
      }
      setIsModalVisible(false);
      fetchSalaryRecords();
    } catch (error) {
      message.error(isEditMode ? '工资记录更新失败' : '工资记录添加失败');
    }
  };

  // 删除记录
  const handleDelete = async (recordId) => {
    try {
      await salaryAPI.deleteSalaryRecord(recordId);
      message.success('工资记录删除成功');
      fetchSalaryRecords();
    } catch (error) {
      message.error('工资记录删除失败');
    }
  };

  // 表格列配置
  const columns = [
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
      title: '工序',
      dataIndex: 'quota',
      key: 'process_name',
      render: (quota) => {
        if (!quota) return '未知工序';
        const process = processes.find(p => p.process_code === quota.process_code);
        return process ? `${process.name} (${quota.process_code})` : quota.process_code;
      }
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
      title: '记录月份',
      dataIndex: 'record_date',
      key: 'record_date',
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

  // 工序选择变化处理
  const handleProcessChange = (value, option) => {
    // 自动获取最新定额
    const processCode = option.key;
    const quota = quotas[processCode];
    if (quota) {
      form.setFieldsValue({ quota_id: quota.id });
    }
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
          <MonthPicker
            placeholder="按月份筛选"
            style={{ width: '100%' }}
            onChange={handleMonthChange}
            allowClear
          />
        </Col>
        <Col span={8}>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            添加工资记录
          </Button>
        </Col>
      </Row>
      
      {/* 工资记录列表 */}
      <Table
        columns={columns}
        dataSource={salaryRecords}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 添加/编辑工资记录模态框 */}
      <Modal
        title={isEditMode ? '编辑工资记录' : '添加工资记录'}
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
            label="工序"
            rules={[{ required: true, message: '请选择工序!' }]}
          >
            <Select placeholder="请选择工序" onChange={handleProcessChange}>
              {Object.entries(quotas).map(([processCode, quota]) => {
                const process = processes.find(p => p.process_code === processCode);
                return (
                  <Option key={processCode} value={quota.id}>
                    {process ? `${process.name} (¥${quota.unit_price})` : `${processCode} (¥${quota.unit_price})`}
                  </Option>
                );
              })}
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
            label="记录月份"
            rules={[{ required: true, message: '请选择记录月份!' }]}
          >
            <MonthPicker style={{ width: '100%' }} />
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
