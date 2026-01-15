import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Typography, Space, Row, Col, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { salaryAPI, workerAPI, quotaAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const SalaryRecord = () => {
  // 状态定义
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYYMM'));
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total_quantity: 0, total_amount: 0 });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [quotas, setQuotas] = useState([]);
  const [form] = Form.useForm();

  // 获取工人列表
  const fetchWorkers = useCallback(async () => {
    try {
      const data = await workerAPI.getWorkers();
      setWorkers(data.items || data);
    } catch (error) {
      message.error('获取工人列表失败');
    }
  }, []);

  // 获取定额列表（用于添加/编辑记录）
  const fetchQuotas = useCallback(async () => {
    try {
      const data = await quotaAPI.getQuotas({ limit: 1000 });
      setQuotas(data.items || data);
    } catch (error) {
      message.error('获取定额列表失败');
    }
  }, []);

  // 获取指定工人指定月份的工作记录
  const fetchWorkerMonthRecords = useCallback(async () => {
    if (!selectedWorker || !selectedMonth) {
      setRecords([]);
      setSummary({ total_quantity: 0, total_amount: 0 });
      return;
    }

    try {
      setDataLoading(true);
      const data = await salaryAPI.getWorkerMonthRecords({
        worker_code: selectedWorker,
        month: selectedMonth
      });
      setRecords(data.records || []);
      setSummary(data.summary || { total_quantity: 0, total_amount: 0 });
    } catch (error) {
      message.error('获取工作记录失败');
      setRecords([]);
      setSummary({ total_quantity: 0, total_amount: 0 });
    } finally {
      setDataLoading(false);
    }
  }, [selectedWorker, selectedMonth]);

  // 初始化加载
  useEffect(() => {
    fetchWorkers();
    fetchQuotas();
  }, [fetchWorkers, fetchQuotas]);

  // 工人或月份变化时加载数据
  useEffect(() => {
    fetchWorkerMonthRecords();
  }, [fetchWorkerMonthRecords]);

  // 设置当前月份
  const handleSetCurrentMonth = () => {
    setSelectedMonth(dayjs().format('YYYYMM'));
  };

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
      record_date: record.record_date ? dayjs(record.record_date) : null
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
      const formattedValues = {
        ...values,
        quantity: parseFloat(values.quantity),
        record_date: values.record_date.format('YYYY-MM-DD')
      };
      
      if (isEditMode) {
        await salaryAPI.updateSalaryRecord(currentRecord.id, formattedValues);
        message.success('工作记录更新成功');
      } else {
        await salaryAPI.createSalaryRecord(formattedValues);
        message.success('工作记录添加成功');
      }
      setIsModalVisible(false);
      fetchWorkerMonthRecords();
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
          fetchWorkerMonthRecords();
        } catch (error) {
          message.error('工作记录删除失败');
        }
      },
    });
  };

  // 格式化显示名称和代码（换行显示以缩小宽度）
  const formatDisplay = (name, code) => {
    if (!name && !code) return '-';
    if (!name) return code;
    if (!code) return name;
    return (
      <span>
        {name}
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>({code})</Text>
      </span>
    );
  };

  // 表格列配置
  const columns = [
    {
      title: '记录日期',
      dataIndex: 'record_date',
      key: 'record_date',
      width: 120,
    },
    {
      title: '电机型号',
      dataIndex: 'model_display',
      key: 'model_display',
      width: 120,
      render: (text) => {
        if (!text) return '-';
        // 解析 "name (code)" 格式
        const match = text.match(/^(.*?)\s*\((.*)\)$/);
        if (match) {
          return formatDisplay(match[1].trim(), match[2].trim());
        }
        return text;
      }
    },
    {
      title: '工段类别',
      dataIndex: 'cat1_display',
      key: 'cat1_display',
      width: 120,
      render: (text) => {
        if (!text) return '-';
        const match = text.match(/^(.*?)\s*\((.*)\)$/);
        if (match) {
          return formatDisplay(match[1].trim(), match[2].trim());
        }
        return text;
      }
    },
    {
      title: '工序类别',
      dataIndex: 'cat2_display',
      key: 'cat2_display',
      width: 120,
      render: (text) => {
        if (!text) return '-';
        const match = text.match(/^(.*?)\s*\((.*)\)$/);
        if (match) {
          return formatDisplay(match[1].trim(), match[2].trim());
        }
        return text;
      }
    },
    {
      title: '工序名称',
      dataIndex: 'process_display',
      key: 'process_display',
      width: 120,
      render: (text) => {
        if (!text) return '-';
        const match = text.match(/^(.*?)\s*\((.*)\)$/);
        if (match) {
          return formatDisplay(match[1].trim(), match[2].trim());
        }
        return text;
      }
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      align: 'right',
      render: (price) => `¥${price?.toFixed(2) || '0.00'}`
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (qty) => qty?.toFixed(2) || '0.00'
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'right',
      render: (amount) => `¥${amount?.toFixed(2) || '0.00'}`
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)} 
            size="small"
          >
            编辑
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)} 
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 工人选择变化处理
  const handleWorkerChange = (value) => {
    setSelectedWorker(value);
  };

  // 月份输入变化处理
  const handleMonthChange = (e) => {
    const value = e.target.value;
    // 验证格式：6位数字
    if (/^\d{0,6}$/.test(value)) {
      setSelectedMonth(value);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>工资记录管理</Title>
      
      {/* 过滤器区域 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select
            placeholder="选择工人"
            style={{ width: '100%' }}
            onChange={handleWorkerChange}
            allowClear
            value={selectedWorker}
          >
            {workers.map(worker => (
              <Option key={worker.worker_code} value={worker.worker_code}>
                {worker.name} ({worker.worker_code})
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Input 
            placeholder="YYYYMM" 
            value={selectedMonth}
            onChange={handleMonthChange}
            maxLength={6}
          />
        </Col>
        <Col span={2}>
          <Button onClick={handleSetCurrentMonth}>
            当前月份
          </Button>
        </Col>
        <Col span={12}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showAddModal}
            disabled={!selectedWorker || !selectedMonth}
          >
            添加工作记录
          </Button>
        </Col>
      </Row>
      
      {/* 工作记录表格 */}
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={dataLoading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
        size="small"
      />

      {/* Summary 区域 */}
      {records.length > 0 && (
        <div style={{ 
          marginTop: 16, 
          padding: 16, 
          backgroundColor: '#f5f5f5', 
          borderRadius: 4,
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <Text strong>本月汇总：</Text>
          <Space size="large">
            <Text>记录数：<Text strong>{records.length}</Text></Text>
            <Text>总金额：<Text strong style={{ color: '#1890ff', fontSize: 16 }}>¥{summary.total_amount?.toFixed(2) || '0.00'}</Text></Text>
          </Space>
        </div>
      )}

      {/* 空状态提示 */}
      {!dataLoading && records.length === 0 && selectedWorker && selectedMonth && (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <Text type="secondary">暂无工作记录</Text>
        </div>
      )}

      {/* 添加/编辑工作记录模态框 */}
      <Modal
        title={isEditMode ? '编辑工作记录' : '添加工作记录'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
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
            <Select placeholder="请选择定额编号">
              {quotas.map(quota => (
                <Option key={quota.id} value={quota.id}>
                  {`${quota.process_code} - ${quota.model_code} - ¥${quota.unit_price}`}
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
