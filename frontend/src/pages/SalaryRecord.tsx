import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Typography, Space, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { salaryAPI, workerAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

// 类型定义
interface Worker {
  worker_code: string;
  name?: string;
  full_name?: string;
}

interface MotorModel {
  model_code: string;
  name: string;
}

interface QuotaCombination {
  quota_id: number;
  combined_code: string;
  model_code: string;
  model_name: string;
  cat1_code: string;
  cat1_name: string;
  cat2_code: string;
  cat2_name: string;
  process_code: string;
  process_name: string;
  unit_price: number;
}

interface QuotaSearchResult {
  quota_id: number;
  model_code: string;
  cat1_code: string;
  cat1_name: string;
  cat2_code: string;
  cat2_name: string;
  process_code: string;
  process_name: string;
  unit_price: number;
  effective_date: string;
  obsolete_date: string;
}

interface SalaryRecord {
  id: number;
  worker_code: string;
  quota_id: number;
  quantity: number;
  unit_price: number;
  amount: number;
  record_date: string;
  created_by?: number;
  created_at?: string;
  model_display?: string;
  cat1_display?: string;
  cat2_display?: string;
  process_display?: string;
}

interface Summary {
  total_quantity: number;
  total_amount: number;
}

const SalaryRecord = () => {
  // 状态定义
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [selectedWorkerName, setSelectedWorkerName] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format('YYYYMM'));
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_quantity: 0, total_amount: 0 });
  const [dataLoading, setDataLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SalaryRecord | null>(null);
  const [form] = Form.useForm();
  
  // 字典数据
  const [dictionaries, setDictionaries] = useState<{
    motor_models: MotorModel[];
    quota_combinations: QuotaCombination[];
  }>({ motor_models: [], quota_combinations: [] });
  const [dictLoading, setDictLoading] = useState(false);
  
  // 定额选择状态
  const [quotaIdInput, setQuotaIdInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<MotorModel | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<QuotaCombination | null>(null);
  const [quotaResult, setQuotaResult] = useState<QuotaSearchResult | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  
  // 搜索结果
  const [modelSearchResults, setModelSearchResults] = useState<MotorModel[]>([]);
  const [processSearchResults, setProcessSearchResults] = useState<QuotaCombination[]>([]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showProcessDropdown, setShowProcessDropdown] = useState(false);
  
  // 搜索输入值
  const [processSearchValue, setProcessSearchValue] = useState('');
  
  // 键盘导航状态
  const [focusedProcessIndex, setFocusedProcessIndex] = useState<number>(-1);
  const processDropdownRef = useRef<HTMLDivElement>(null);

  // 获取工人列表
  const fetchWorkers = useCallback(async () => {
    try {
      const data = await workerAPI.getWorkers();
      const workerList = (data as any).items || data;
      setWorkers(workerList);
    } catch (error) {
      message.error('获取工人列表失败');
    }
  }, []);

  // 获取字典数据
  const fetchDictionaries = useCallback(async () => {
    try {
      setDictLoading(true);
      const data = await salaryAPI.getDictionaries();
      setDictionaries(data);
    } catch (error) {
      message.error('获取字典数据失败');
    } finally {
      setDictLoading(false);
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
      setRecords((data as any).records || []);
      setSummary((data as any).summary || { total_quantity: 0, total_amount: 0 });
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
    fetchDictionaries();
  }, [fetchWorkers, fetchDictionaries]);

  // 工人或月份变化时加载数据
  useEffect(() => {
    fetchWorkerMonthRecords();
  }, [fetchWorkerMonthRecords]);

  // 设置当前月份
  const handleSetCurrentMonth = () => {
    setSelectedMonth(dayjs().format('YYYYMM'));
  };

  // 工人选择变化
  const handleWorkerChange = (value: string) => {
    setSelectedWorker(value);
    const worker = workers.find((w: Worker) => w.worker_code === value);
    if (worker) {
      setSelectedWorkerName(worker.name || worker.full_name || '');
    }
  };

  // 月份输入变化
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      setSelectedMonth(value);
    }
  };

  // 型号搜索
  const handleModelSearch = (value: string) => {
    if (!value) {
      setModelSearchResults([]);
      setShowModelDropdown(false);
      return;
    }
    
    const lowerValue = value.toLowerCase();
    const results = dictionaries.motor_models.filter((m: MotorModel) => 
      m.model_code.toLowerCase().includes(lowerValue) || 
      (m.name && m.name.toLowerCase().includes(lowerValue))
    );
    setModelSearchResults(results);
    setShowModelDropdown(results.length > 0);
  };

  // 选择型号
  const handleModelSelect = (modelCode: string) => {
    const model = dictionaries.motor_models.find((m: MotorModel) => m.model_code === modelCode);
    if (model) {
      setSelectedModel(model);
      setShowModelDropdown(false);
      // 尝试自动确定定额
      if (selectedProcess) {
        findQuotaByCombination(model.model_code, selectedProcess);
      }
    }
  };

  // 工序搜索
  const handleProcessSearch = (value: string) => {
    setProcessSearchValue(value);
    if (!value) {
      setProcessSearchResults([]);
      setFocusedProcessIndex(-1);
      return;
    }
    
    // 顺序匹配算法：用户输入的字符必须按顺序出现在组合中
    const lowerValue = value.toLowerCase();
    
    // 如果已选型号，先按型号过滤
    let baseCombinations = dictionaries.quota_combinations;
    if (selectedModel) {
      baseCombinations = baseCombinations.filter(
        (q: QuotaCombination) => q.model_code === selectedModel.model_code
      );
    }
    
    const results = baseCombinations.filter((q: QuotaCombination) => {
      const combinedCode = q.combined_code.toLowerCase();
      let charIndex = 0;
      
      for (const char of lowerValue) {
        charIndex = combinedCode.indexOf(char, charIndex);
        if (charIndex === -1) return false;
        charIndex++;
      }
      return true;
    });
    
    setProcessSearchResults(results);
    setFocusedProcessIndex(-1);
  };

  // 高亮显示匹配的字符
  const highlightMatchedChars = (text: string, searchValue: string): React.ReactNode => {
    if (!searchValue) return text;
    
    const searchLower = searchValue.toLowerCase();
    const textLower = text.toLowerCase();
    
    // 找到所有匹配字符的位置
    const matches: { start: number; end: number }[] = [];
    let charIndex = 0;
    for (const char of searchLower) {
      const pos = textLower.indexOf(char, charIndex);
      if (pos === -1) break;
      matches.push({ start: pos, end: pos + 1 });
      charIndex = pos + 1;
    }
    
    if (matches.length === 0) return text;
    
    // 构建带高亮的文本
    const parts: { text: string; highlighted: boolean }[] = [];
    let lastEnd = 0;
    for (const match of matches) {
      if (match.start > lastEnd) {
        parts.push({ text: text.slice(lastEnd, match.start), highlighted: false });
      }
      parts.push({ text: text.slice(match.start, match.end), highlighted: true });
      lastEnd = match.end;
    }
    if (lastEnd < text.length) {
      parts.push({ text: text.slice(lastEnd), highlighted: false });
    }
    
    return (
      <span>
        {parts.map((part, i) => (
          <span key={i} style={part.highlighted ? { backgroundColor: '#ffe58f', fontWeight: 'bold' } : {}}>
            {part.text}
          </span>
        ))}
      </span>
    );
  };

  // 工序下拉框键盘导航
  const handleProcessDropdownKeyDown = (e: React.KeyboardEvent) => {
    const totalOptions = processSearchResults.length;
    if (totalOptions === 0) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: 上一项
        setFocusedProcessIndex(prev => {
          const newIndex = prev <= 0 ? totalOptions - 1 : prev - 1;
          // 聚焦到对应元素
          setTimeout(() => {
            const elements = processDropdownRef.current?.querySelectorAll('[data-process-index]');
            const el = elements?.[newIndex] as HTMLElement;
            el?.focus();
          }, 0);
          return newIndex;
        });
      } else {
        // Tab: 下一项
        setFocusedProcessIndex(prev => {
          const newIndex = prev >= totalOptions - 1 ? 0 : prev + 1;
          // 聚焦到对应元素
          setTimeout(() => {
            const elements = processDropdownRef.current?.querySelectorAll('[data-process-index]');
            const el = elements?.[newIndex] as HTMLElement;
            el?.focus();
          }, 0);
          return newIndex;
        });
      }
    } else if (e.key === ' ') {
      // Space: 选择当前聚焦的选项
      e.preventDefault();
      if (focusedProcessIndex >= 0 && focusedProcessIndex < totalOptions) {
        const process = processSearchResults[focusedProcessIndex];
        handleProcessSelect(process.quota_id);
      }
    }
  };

  // 选择工序
  const handleProcessSelect = (quotaId: string | number) => {
    const process = dictionaries.quota_combinations.find((q: QuotaCombination) => q.quota_id === quotaId);
    if (process) {
      setSelectedProcess(process);
      setProcessSearchResults([]);
      setProcessSearchValue('');
      setFocusedProcessIndex(-1);
      // 尝试自动确定定额
      if (selectedModel) {
        findQuotaByCombination(selectedModel.model_code, process);
      } else if (quotaResult) {
        // 如果之前有定额信息，保留但更新
        findQuotaByCombination(quotaResult.model_code, process);
      }
    }
  };

  // 根据组合查找定额
  const findQuotaByCombination = async (modelCode: string, process: QuotaCombination) => {
    if (!selectedMonth || !selectedWorker) return;
    
    const recordDate = `${selectedMonth.slice(0, 4)}-${selectedMonth.slice(4, 6)}-01`;
    
    try {
      setQuotaLoading(true);
      const result = await salaryAPI.findQuota({
        model_code: modelCode,
        cat1_code: process.cat1_code,
        cat2_code: process.cat2_code,
        process_code: process.process_code,
        record_date: recordDate
      });
      setQuotaResult(result);
    } catch (error: any) {
      if (error.response?.status === 404) {
        message.warning('未找到符合条件的定额');
        setQuotaResult(null);
      } else {
        message.error('查询定额失败');
      }
    } finally {
      setQuotaLoading(false);
    }
  };

  // 直接输入定额ID查找
  const handleQuotaIdSearch = async () => {
    if (!quotaIdInput || !selectedMonth || !selectedWorker) return;
    
    const quotaId = parseInt(quotaIdInput) as number;
    if (isNaN(quotaId) || quotaId <= 0) {
      message.warning('请输入有效的定额ID');
      return;
    }
    
    const recordDate = `${selectedMonth.slice(0, 4)}-${selectedMonth.slice(4, 6)}-01`;
    
    try {
      setQuotaLoading(true);
      const result = await salaryAPI.findQuota({
        quota_id: quotaId,
        record_date: recordDate
      });
      setQuotaResult(result);
      setSelectedModel({ model_code: (result as QuotaSearchResult).model_code, name: '' });
      setSelectedProcess(null);
      message.success('定额查找成功');
    } catch (error: any) {
      if (error.response?.status === 404) {
        message.warning('定额不存在');
      } else {
        message.error('查询定额失败');
      }
      setQuotaResult(null);
    } finally {
      setQuotaLoading(false);
    }
  };

  // 显示添加记录模态框
  const showAddModal = () => {
    setIsEditMode(false);
    setCurrentRecord(null);
    setQuotaIdInput('');
    setSelectedModel(null);
    setSelectedProcess(null);
    setQuotaResult(null);
    setModelSearchResults([]);
    setProcessSearchResults([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 显示编辑记录模态框
  const showEditModal = (record: SalaryRecord) => {
    setIsEditMode(true);
    setCurrentRecord(record);
    
    // 预填充表单
    form.setFieldsValue({
      worker_code: record.worker_code,
      quota_id: record.quota_id,
      quantity: record.quantity,
      record_date: record.record_date ? dayjs(record.record_date) : null
    });
    
    // 设置日期（从record_date中提取天数）
    const recordDate = dayjs(record.record_date);
    const day = recordDate.format('DD');
    form.setFieldValue('day', day);
    
    // 设置月份
    const month = recordDate.format('YYYYMM');
    setSelectedMonth(month);
    
    // 设置定额ID
    setQuotaIdInput(String(record.quota_id));
    
    // 加载定额信息
    handleQuotaIdSearch();
    
    setIsModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    if (!quotaResult) {
      message.error('请先确定定额');
      return;
    }
    
    try {
      const recordDate = `${selectedMonth.slice(0, 4)}-${selectedMonth.slice(4, 6)}-${String(values.day).padStart(2, '0')}`;
      
      const formattedValues = {
        worker_code: selectedWorker || '',
        quota_id: (quotaResult as QuotaSearchResult).quota_id,
        quantity: parseFloat(values.quantity),
        record_date: recordDate
      };
      
      if (isEditMode && currentRecord) {
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
  const handleDelete = async (recordId: number) => {
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

  // 表格列配置
  const columns = [
    {
      title: '记录日期',
      dataIndex: 'record_date',
      key: 'record_date',
      width: 100,
    },
    {
      title: '电机型号',
      dataIndex: 'model_code',
      key: 'model_code',
      width: 100,
      render: (text: string, record: SalaryRecord) => {
        if (!text && record.model_display) {
          const match = record.model_display.match(/^(.*?)\s*\((.*)\)$/);
          if (match) {
            return (
              <span>
                {match[1].trim()}
                <br />
                <Text type="secondary" style={{ fontSize: 10 }}>({match[2].trim()})</Text>
              </span>
            );
          }
          return record.model_display;
        }
        return text || '-';
      }
    },
    {
      title: '工段',
      dataIndex: 'cat1_code',
      key: 'cat1_code',
      width: 100,
      render: (text: string, record: SalaryRecord) => {
        if (record.cat1_display) {
          const match = record.cat1_display.match(/^(.*?)\s*\((.*)\)$/);
          if (match) {
            return (
              <span>
                {match[1].trim()}
                <br />
                <Text type="secondary" style={{ fontSize: 10 }}>({match[2].trim()})</Text>
              </span>
            );
          }
          return record.cat1_display;
        }
        return text ? `${text}` : '-';
      }
    },
    {
      title: '工序类别',
      dataIndex: 'cat2_code',
      key: 'cat2_code',
      width: 100,
      render: (text: string, record: SalaryRecord) => {
        if (record.cat2_display) {
          const match = record.cat2_display.match(/^(.*?)\s*\((.*)\)$/);
          if (match) {
            return (
              <span>
                {match[1].trim()}
                <br />
                <Text type="secondary" style={{ fontSize: 10 }}>({match[2].trim()})</Text>
              </span>
            );
          }
          return record.cat2_display;
        }
        return text ? `${text}` : '-';
      }
    },
    {
      title: '工序',
      dataIndex: 'process_code',
      key: 'process_code',
      width: 100,
      render: (text: string, record: SalaryRecord) => {
        if (record.process_display) {
          const match = record.process_display.match(/^(.*?)\s*\((.*)\)$/);
          if (match) {
            return (
              <span>
                {match[1].trim()}
                <br />
                <Text type="secondary" style={{ fontSize: 10 }}>({match[2].trim()})</Text>
              </span>
            );
          }
          return record.process_display;
        }
        return text || '-';
      }
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 80,
      align: 'right' as const,
      render: (price: number) => `¥${price?.toFixed(2) || '0.00'}`
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'right' as const,
      render: (qty: number) => qty?.toFixed(2) || '0.00'
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 80,
      align: 'right' as const,
      render: (amount: number) => `¥${amount?.toFixed(2) || '0.00'}`
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: SalaryRecord) => (
        <Space size="small">
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
            {workers.map((worker: Worker) => (
              <Option key={worker.worker_code} value={worker.worker_code}>
                {worker.name || worker.full_name} ({worker.worker_code})
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
        scroll={{ x: 1100 }}
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
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* 工人和月份（只读） */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="工人">
                <Input 
                  value={selectedWorker ? `${selectedWorkerName} (${selectedWorker})` : ''} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="月份">
                <Input value={selectedMonth} disabled style={{ backgroundColor: '#f5f5f5' }} />
              </Form.Item>
            </Col>
          </Row>

          {/* 日期 */}
          <Form.Item
            name="day"
            label="日期"
            rules={[
              { required: true, message: '请输入日期!' },
              { 
                transform: (value) => parseInt(value),
                type: 'number',
                min: 1,
                max: 31,
                message: '日期必须是1-31之间的数字!'
              }
            ]}
          >
            <Input placeholder="请输入日期（两位数，如：15）" maxLength={2} />
          </Form.Item>

          {/* 定额选择区域 */}
          <div style={{ 
            border: '1px solid #d9d9d9', 
            borderRadius: 4, 
            padding: 16, 
            marginBottom: 16,
            backgroundColor: '#fafafa'
          }}>
            <Text strong style={{ display: 'block', marginBottom: 16 }}>定额选择</Text>
            
            {/* 定额ID直接输入 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Input
                  placeholder="直接输入定额ID"
                  value={quotaIdInput}
                  onChange={(e) => setQuotaIdInput(e.target.value)}
                  onPressEnter={handleQuotaIdSearch}
                  suffix={
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={handleQuotaIdSearch}
                      loading={quotaLoading}
                    >
                      查找
                    </Button>
                  }
                />
              </Col>
            </Row>

            {/* 型号搜索 */}
            <Row gutter={16} style={{ marginBottom: 8 }}>
              <Col span={12}>
                <Select
                  showSearch
                  placeholder="搜索型号（输入部分型号编码）"
                  style={{ width: '100%' }}
                  onSearch={handleModelSearch}
                  onSelect={handleModelSelect}
                  onBlur={() => setShowModelDropdown(false)}
                  open={showModelDropdown}
                  dropdownMatchSelectWidth={false}
                  value={selectedModel ? `${selectedModel.name} (${selectedModel.model_code})` : undefined}
                  allowClear
                >
                  {modelSearchResults.map((model: MotorModel) => (
                    <Option key={model.model_code} value={model.model_code}>
                      {model.name} ({model.model_code})
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>

            {/* 工序搜索 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <div style={{ position: 'relative' }}>
                  <Input
                    placeholder={
                      selectedModel 
                        ? `已选型号 ${selectedModel.model_code}，搜索工序组合`
                        : "搜索工序（输入编码组合，如：abcefg036）"
                    }
                    value={selectedProcess ? selectedProcess.combined_code : processSearchValue}
                    onChange={(e) => handleProcessSearch(e.target.value)}
                    onClear={() => {
                      setSelectedProcess(null);
                      setQuotaResult(null);
                      setProcessSearchValue('');
                    }}
                    allowClear
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && processSearchResults.length > 0) {
                        e.preventDefault();
                        setFocusedProcessIndex(0);
                        setTimeout(() => {
                          const firstOption = document.querySelector('[data-process-index="0"]') as HTMLElement;
                          firstOption?.focus();
                        }, 10);
                      }
                    }}
                  />
                  {/* 下拉框 */}
                  {processSearchResults.length > 0 && (
                    <div 
                      ref={processDropdownRef}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: 200,
                        overflow: 'auto',
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        backgroundColor: 'white',
                        zIndex: 1000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          if (e.shiftKey) {
                            setFocusedProcessIndex(prev => {
                              const newIndex = prev <= 0 ? processSearchResults.length - 1 : prev - 1;
                              setTimeout(() => {
                                const el = document.querySelector(`[data-process-index="${newIndex}"]`) as HTMLElement;
                                el?.focus();
                              }, 10);
                              return newIndex;
                            });
                          } else {
                            setFocusedProcessIndex(prev => {
                              const newIndex = prev >= processSearchResults.length - 1 ? 0 : prev + 1;
                              setTimeout(() => {
                                const el = document.querySelector(`[data-process-index="${newIndex}"]`) as HTMLElement;
                                el?.focus();
                              }, 10);
                              return newIndex;
                            });
                          }
                        } else if (e.key === ' ') {
                          e.preventDefault();
                          if (focusedProcessIndex >= 0) {
                            const process = processSearchResults[focusedProcessIndex];
                            handleProcessSelect(process.quota_id);
                          }
                        } else if (e.key === 'Escape') {
                          setProcessSearchResults([]);
                          setProcessSearchValue('');
                        }
                      }}
                    >
                      {processSearchResults.slice(0, 50).map((process: QuotaCombination, index: number) => (
                        <div
                          key={process.quota_id}
                          data-process-index={index}
                          tabIndex={0}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            color: 'rgba(0, 0, 0, 0.85)',
                            backgroundColor: focusedProcessIndex === index ? '#e6f7ff' : 'transparent',
                            outline: 'none'
                          }}
                          onClick={() => handleProcessSelect(process.quota_id)}
                          onFocus={() => setFocusedProcessIndex(index)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = focusedProcessIndex === index ? '#e6f7ff' : 'white';
                          }}
                        >
                          {process.cat1_name}-{process.cat2_name}-{process.process_name} 
                          ({highlightMatchedChars(process.combined_code, processSearchValue)})
                        </div>
                      ))}
                      {processSearchResults.length > 50 && (
                        <div style={{ padding: 8, textAlign: 'center', color: '#999' }}>
                          还有 {processSearchResults.length - 50} 条结果...
                        </div>
                      )}
                    </div>
                  )}
                  {processSearchResults.length === 0 && processSearchValue && selectedModel && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      padding: '8px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      backgroundColor: 'white',
                      color: '#999',
                      zIndex: 1000
                    }}>
                      没有匹配的工序组合
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            {/* 定额信息显示 */}
            {quotaResult && (
              <div style={{ 
                padding: 12, 
                backgroundColor: '#e6f7ff', 
                borderRadius: 4,
                border: '1px solid #91d5ff'
              }}>
                <Row gutter={16}>
                  <Col span={4}>
                    <Text type="secondary">定额ID：</Text>
                    <Text strong>{(quotaResult as QuotaSearchResult).quota_id}</Text>
                  </Col>
                  <Col span={4}>
                    <Text type="secondary">单价：</Text>
                    <Text strong style={{ color: '#1890ff' }}>¥{(quotaResult as QuotaSearchResult).unit_price.toFixed(2)}</Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">有效期：</Text>
                    <Text>{(quotaResult as QuotaSearchResult).effective_date} ~ {(quotaResult as QuotaSearchResult).obsolete_date}</Text>
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col span={6}>
                    <Text type="secondary">型号：</Text>
                    <Text>{(quotaResult as QuotaSearchResult).model_code}</Text>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary">工段类别：</Text>
                    <Text>{(quotaResult as QuotaSearchResult).cat1_name} ({(quotaResult as QuotaSearchResult).cat1_code})</Text>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary">工序类别：</Text>
                    <Text>{(quotaResult as QuotaSearchResult).cat2_name} ({(quotaResult as QuotaSearchResult).cat2_code})</Text>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary">工序：</Text>
                    <Text>{(quotaResult as QuotaSearchResult).process_name} ({(quotaResult as QuotaSearchResult).process_code})</Text>
                  </Col>
                </Row>
              </div>
            )}
          </div>

          {/* 数量 */}
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

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>取消</Button>
              <Button type="primary" htmlType="submit" loading={quotaLoading}>
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
