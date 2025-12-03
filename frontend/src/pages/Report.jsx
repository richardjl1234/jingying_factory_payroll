import React, { useState, useEffect } from 'react';
import { Tabs, Card, Select, DatePicker, Table, Button, message, Typography, Row, Col, Statistic } from 'antd';
import { DownloadOutlined, BarChartOutlined, UserOutlined, AppstoreOutlined, DollarOutlined } from '@ant-design/icons';
import { reportAPI, workerAPI } from '../services/api';

const { Title } = Typography;
const { Option } = Select;
const { MonthPicker } = DatePicker;
const { TabPane } = Tabs;

const Report = () => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
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
    // 默认选择当前月份
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
  }, []);

  // 获取工人月度工资报表
  const fetchWorkerSalaryReport = async () => {
    if (!selectedWorker || !selectedMonth) {
      message.warning('请选择工人和月份');
      return;
    }
    
    try {
      setLoading(true);
      const data = await reportAPI.getWorkerSalaryReport(selectedWorker, selectedMonth);
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
      const data = await reportAPI.getProcessWorkloadReport(selectedMonth);
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
      const data = await reportAPI.getSalarySummaryReport(selectedMonth);
      setSalarySummaryReport(data);
      message.success('工资汇总报表获取成功');
    } catch (error) {
      message.error('获取工资汇总报表失败');
    } finally {
      setLoading(false);
    }
  };

  // 工人月度工资报表列配置
  const workerSalaryColumns = [
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
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price) => `¥${price}`
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${amount}`
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

  // 处理月份选择变化
  const handleMonthChange = (date, dateString) => {
    setSelectedMonth(dateString);
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
                  placeholder="选择月份"
                  style={{ width: '100%' }}
                  onChange={handleMonthChange}
                  allowClear
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
              </Col>
            </Row>
            
            {workerSalaryReport && (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic title="工人姓名" value={workerSalaryReport.worker_name} />
                    </Col>
                    <Col span={6}>
                      <Statistic title="工号" value={workerSalaryReport.worker_code} />
                    </Col>
                    
                    <Col span={6}>
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
                  rowKey="process_code"
                  pagination={false}
                />
              </>
            )}
          </Card>
        </Tabs.TabPane>
        
        {/* 工序工作量报表 */}
        <Tabs.TabPane 
          tab={<><AppstoreOutlined /> 工序工作量报表</>} 
          key="process-workload"
        >
          <Card>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <MonthPicker
                  placeholder="选择月份"
                  style={{ width: '100%' }}
                  onChange={handleMonthChange}
                  allowClear
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
        
        {/* 工资汇总报表 */}
        <Tabs.TabPane 
          tab={<><DollarOutlined /> 工资汇总报表</>} 
          key="salary-summary"
        >
          <Card>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <MonthPicker
                  placeholder="选择月份"
                  style={{ width: '100%' }}
                  onChange={handleMonthChange}
                  allowClear
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
