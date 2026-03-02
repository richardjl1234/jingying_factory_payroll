import React, { useState, useEffect } from 'react';
import { Tabs, Card, Select, Input, Table, Button, message, Typography, Row, Col, Statistic } from 'antd';
import { BarChartOutlined, UserOutlined, AppstoreOutlined, DollarOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { reportAPI, workerAPI } from '../services/api';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Report = () => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // 默认当前月份，格式：YYYYMM
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [workerSalaryReport, setWorkerSalaryReport] = useState(null);
  const [processWorkloadReport, setProcessWorkloadReport] = useState([]);
  const [salarySummaryReport, setSalarySummaryReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // 获取工人列表
  const fetchWorkers = async () => {
    try {
      const data = await workerAPI.getWorkers();
      setWorkers(data);
    } catch (error) {
      message.error('获取工人列表失败');
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  // 月份增加
  const handleMonthIncrement = () => {
    const currentMonth = selectedMonth;
    const year = parseInt(currentMonth.slice(0, 4));
    const month = parseInt(currentMonth.slice(4, 6));
    
    let newYear = year;
    let newMonth = month + 1;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear = year + 1;
    }
    
    const newMonthStr = `${newYear}${String(newMonth).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  // 月份减少
  const handleMonthDecrement = () => {
    const currentMonth = selectedMonth;
    const year = parseInt(currentMonth.slice(0, 4));
    const month = parseInt(currentMonth.slice(4, 6));
    
    let newYear = year;
    let newMonth = month - 1;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear = year - 1;
    }
    
    const newMonthStr = `${newYear}${String(newMonth).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  // 格式化月份显示（从 yyyymm 转换为 yyyy-mm 格式）
  const formatMonthDisplay = (month) => {
    if (!month || month.length !== 6) return month;
    return `${month.slice(0, 4)}-${month.slice(4, 6)}`;
  };

  // 月份输入变化
  const handleMonthInputChange = (e) => {
    const value = e.target.value;
    // 移除所有非数字字符用于验证
    const numericValue = value.replace(/\D/g, '');
    // 限制为最多6位数字
    if (numericValue.length <= 6) {
      setSelectedMonth(numericValue);
    }
  };

  // 获取工人月度工资报表
  const fetchWorkerSalaryReport = async () => {
    if (!selectedMonth) {
      message.warning('请选择月份');
      return;
    }

    // 如果没有选择工人，但选择了"所有工人"以外的选项，提示选择
    if (!selectedWorker) {
      message.warning('请选择工人');
      return;
    }

    try {
      setLoading(true);
      // 转换月份格式从 YYYYMM 到 YYYY-MM
      const monthFormatted = selectedMonth.length === 6 
        ? `${selectedMonth.slice(0, 4)}-${selectedMonth.slice(4, 6)}`
        : selectedMonth;
      const data = await reportAPI.getWorkerSalaryReport(selectedWorker, monthFormatted);
      setWorkerSalaryReport(data);
      message.success('工人月度工资报表获取成功');
    } catch (error) {
      message.error('获取工人月度工资报表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取工序工作量报表
  const fetchProcessWorkloadReport = async () => {
    if (!selectedMonth) {
      message.warning('请选择月份');
      return;
    }
    
    try {
      setLoading(true);
      // 转换月份格式从 YYYYMM 到 YYYY-MM
      const monthFormatted = selectedMonth.length === 6 
        ? `${selectedMonth.slice(0, 4)}-${selectedMonth.slice(4, 6)}`
        : selectedMonth;
      const data = await reportAPI.getProcessWorkloadReport(monthFormatted);
      setProcessWorkloadReport(data);
      message.success('工序工作量报表获取成功');
    } catch (error) {
      message.error('获取工序工作量报表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取工资汇总报表
  const fetchSalarySummaryReport = async () => {
    if (!selectedMonth) {
      message.warning('请选择月份');
      return;
    }
    
    try {
      setLoading(true);
      // 转换月份格式从 YYYYMM 到 YYYY-MM
      const monthFormatted = selectedMonth.length === 6 
        ? `${selectedMonth.slice(0, 4)}-${selectedMonth.slice(4, 6)}`
        : selectedMonth;
      const data = await reportAPI.getSalarySummaryReport(monthFormatted);
      setSalarySummaryReport(data);
      message.success('工资汇总报表获取成功');
    } catch (error) {
      message.error('获取工资汇总报表失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出工人工资报表到Excel
  const exportWorkerSalaryReport = () => {
    if (!workerSalaryReport || !workerSalaryReport.details || workerSalaryReport.details.length === 0) {
      message.warning('没有可导出的数据');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      
      // 格式化月份为 YYYY-MM
      const monthFormatted = selectedMonth.length === 6 
        ? `${selectedMonth.slice(0, 4)}-${selectedMonth.slice(4, 6)}`
        : selectedMonth;
      
      // 如果是所有工人，按工人分组
      if (workerSalaryReport.worker_code === 'all') {
        // 按工人分组
        const workerGroups = {};
        workerSalaryReport.details.forEach(record => {
          const workerName = record.worker_name;
          if (!workerGroups[workerName]) {
            workerGroups[workerName] = [];
          }
          workerGroups[workerName].push(record);
        });
        
        // 为每个工人创建一个sheet
        Object.keys(workerGroups).forEach(workerName => {
          const records = workerGroups[workerName];
          // 添加表头
          const data = [
            ['职工姓名', '定额编号', '型号', '工序类别', '工序名', '数量', '单价', '金额', '记录日期']
          ];
          // 添加数据行
          records.forEach(record => {
            data.push([
              record.worker_name,
              record.quota_id,
              record.model_name,
              record.process_category,
              record.process_name,
              record.quantity,
              record.unit_price,
              record.amount,
              record.record_date
            ]);
          });
          // 添加汇总行
          const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
          data.push(['合计', '', '', '', '', '', '', totalAmount, '']);
          
          const worksheet = XLSX.utils.aoa_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, worksheet, workerName);
        });
        
        // 文件名：月份_所有工人_工资.xlsx
        const fileName = `${monthFormatted}_所有工人_工资.xlsx`;
        XLSX.writeFile(workbook, fileName);
      } else {
        // 单个工人
        const workerName = workerSalaryReport.worker_name;
        const workerCode = workerSalaryReport.worker_code;
        
        // 添加表头
        const data = [
          ['职工姓名', '定额编号', '型号', '工序类别', '工序名', '数量', '单价', '金额', '记录日期']
        ];
        // 添加数据行
        workerSalaryReport.details.forEach(record => {
          data.push([
            record.worker_name,
            record.quota_id,
            record.model_name,
            record.process_category,
            record.process_name,
            record.quantity,
            record.unit_price,
            record.amount,
            record.record_date
          ]);
        });
        // 添加汇总行
        const totalAmount = workerSalaryReport.details.reduce((sum, r) => sum + r.amount, 0);
        data.push(['合计', '', '', '', '', '', '', totalAmount, '']);
        
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, workerName);
        
        // 文件名：月份_工人编号_工资.xlsx
        const fileName = `${monthFormatted}_${workerCode}_工资.xlsx`;
        XLSX.writeFile(workbook, fileName);
      }
      
      message.success('导出成功');
    } catch (error) {
      console.error('导出Excel失败:', error);
      message.error('导出失败');
    }
  };

  // 工人月度工资报表列配置
  const workerSalaryColumns = [
    {
      title: '职工姓名',
      dataIndex: 'worker_name',
      key: 'worker_name',
    },
    {
      title: '定额编号',
      dataIndex: 'quota_id',
      key: 'quota_id',
    },
    {
      title: '型号',
      dataIndex: 'model_name',
      key: 'model_name',
    },
    {
      title: '工序类别',
      dataIndex: 'process_category',
      key: 'process_category',
    },
    {
      title: '工序名',
      dataIndex: 'process_name',
      key: 'process_name',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price) => `¥${price?.toFixed(2)}`
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${amount?.toFixed(2)}`
    },
    {
      title: '记录日期',
      dataIndex: 'record_date',
      key: 'record_date',
    },
  ];

  // 工序工作量报表列配置
  const processWorkloadColumns = [
    {
      title: '工序编码',
      dataIndex: 'process_code',
      key: 'process_code',
    },
    {
      title: '工序名称',
      dataIndex: 'process_name',
      key: 'process_name',
    },
    {
      title: '工序类别',
      dataIndex: 'process_category',
      key: 'process_category',
    },
    {
      title: '总数量',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `¥${amount}`
    },
  ];

  // 工序类别工资汇总列配置
  const categorySummaryColumns = [
    {
      title: '工序类别',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `¥${amount}`
    },
  ];

  // 处理工人选择变化
  const handleWorkerChange = (value) => {
    setSelectedWorker(value);
  };

  return (
    <div>
      <Title level={2}>工资统计报表</Title>
      <Tabs defaultActiveKey="worker-salary" type="card">
        {/* 工人月度工资报表 */}
        <Tabs.TabPane 
          tab={<><UserOutlined /> 工人月度工资报表</>} 
          key="worker-salary"
        >
          <Card>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Select
                  placeholder="选择工人"
                  style={{ width: '100%' }}
                  onChange={handleWorkerChange}
                  allowClear
                  defaultValue={null}
                >
                  <Option key="all" value="all">所有工人</Option>
                  {workers.map(worker => (
                    <Option key={worker.worker_code} value={worker.worker_code}>
                      {worker.name} ({worker.worker_code})
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <Input 
                  placeholder="YYYY-MM" 
                  value={formatMonthDisplay(selectedMonth)}
                  onChange={handleMonthInputChange}
                  maxLength={7}
                  prefix={
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={handleMonthDecrement}
                      style={{ padding: '0 4px' }}
                    >
                      -
                    </Button>
                  }
                  suffix={
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={handleMonthIncrement}
                      style={{ padding: '0 4px' }}
                    >
                      +
                    </Button>
                  }
                />
              </Col>
              <Col span={8}>
                <Button 
                  type="primary" 
                  icon={<BarChartOutlined />} 
                  onClick={fetchWorkerSalaryReport}
                  loading={loading}
                >
                  生成报表
                </Button>
                {workerSalaryReport && workerSalaryReport.details && workerSalaryReport.details.length > 0 && (
                  <Button 
                    icon={<DownloadOutlined />} 
                    onClick={exportWorkerSalaryReport}
                    style={{ marginLeft: 8 }}
                  >
                    导出Excel
                  </Button>
                )}
              </Col>
            </Row>
            
            {workerSalaryReport && (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic title="工人姓名" value={workerSalaryReport.worker_name} />
                    </Col>
                    {workerSalaryReport.worker_code !== 'all' && (
                      <Col span={8}>
                        <Statistic title="工号" value={workerSalaryReport.worker_code} />
                      </Col>
                    )}

                    <Col span={8}>
                      <Statistic
                        title="月度总工资"
                        value={workerSalaryReport.total_amount}
                        prefix="¥"
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Col>
                  </Row>
                </Card>
                <Table
                  columns={workerSalaryColumns}
                  dataSource={workerSalaryReport.details}
                  rowKey={(record) => `${record.quota_id}-${record.record_date}-${record.worker_name}`}
                  pagination={{ pageSize: 20 }}
                />
              </>
            )}
          </Card>
        </Tabs.TabPane>
        
        {/* 工序工作量报表 - 已禁用 */}
        <Tabs.TabPane 
          disabled
          tab={<><AppstoreOutlined /> 工序工作量报表</>} 
          key="process-workload"
        >
          <Card>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Input 
                  placeholder="YYYY-MM" 
                  value={formatMonthDisplay(selectedMonth)}
                  onChange={handleMonthInputChange}
                  maxLength={7}
                  prefix={
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={handleMonthDecrement}
                      style={{ padding: '0 4px' }}
                    >
                      -
                    </Button>
                  }
                  suffix={
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={handleMonthIncrement}
                      style={{ padding: '0 4px' }}
                    >
                      +
                    </Button>
                  }
                />
              </Col>
              <Col span={12}>
                <Button 
                  type="primary" 
                  icon={<BarChartOutlined />} 
                  onClick={fetchProcessWorkloadReport}
                  loading={loading}
                >
                  生成报表
                </Button>
              </Col>
            </Row>
            
            {processWorkloadReport.length > 0 && (
              <Table
                columns={processWorkloadColumns}
                dataSource={processWorkloadReport}
                rowKey="process_code"
                pagination={false}
              />
            )}
          </Card>
        </Tabs.TabPane>
        
        {/* 工资汇总报表 - 已禁用 */}
        <Tabs.TabPane 
          disabled
          tab={<><DollarOutlined /> 工资汇总报表</>} 
          key="salary-summary"
        >
          <Card>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Input 
                  placeholder="YYYY-MM" 
                  value={formatMonthDisplay(selectedMonth)}
                  onChange={handleMonthInputChange}
                  maxLength={7}
                  prefix={
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={handleMonthDecrement}
                      style={{ padding: '0 4px' }}
                    >
                      -
                    </Button>
                  }
                  suffix={
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={handleMonthIncrement}
                      style={{ padding: '0 4px' }}
                    >
                      +
                    </Button>
                  }
                />
              </Col>
              <Col span={12}>
                <Button 
                  type="primary" 
                  icon={<BarChartOutlined />} 
                  onClick={fetchSalarySummaryReport}
                  loading={loading}
                >
                  生成报表
                </Button>
              </Col>
            </Row>
            
            {salarySummaryReport && (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic 
                        title="总工人数量" 
                        value={salarySummaryReport.total_workers} 
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="总工资" 
                        value={salarySummaryReport.total_amount} 
                        prefix="¥" 
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic title="统计月份" value={salarySummaryReport.month} />
                    </Col>
                  </Row>
                </Card>
                <Card title="工序类别工资汇总">
                  <Table
                    columns={categorySummaryColumns}
                    dataSource={salarySummaryReport.category_summary}
                    rowKey="category"
                    pagination={false}
                  />
                </Card>
              </>
            )}
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default Report;
