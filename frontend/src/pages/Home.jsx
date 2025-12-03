import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Typography, Spin } from 'antd';
import {
  TeamOutlined,
  AppstoreOutlined,
  DollarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { statsAPI } from '../services/api';

const { Title } = Typography;

const Home = () => {
  const [statistics, setStatistics] = useState({
    worker_count: 0,
    process_count: 0,
    quota_count: 0,
    salary_record_count: 0
  });
  const [loading, setLoading] = useState(true);

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await statsAPI.getStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return (
    <div>
      <Title level={2}>欢迎使用工厂定额和计件工资管理系统</Title>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card hoverable>
              <Statistic
                title="工人管理"
                value={statistics.worker_count}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
              <p style={{ marginTop: 16 }}>管理工厂工人信息</p>
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable>
              <Statistic
                title="工序管理"
                value={statistics.process_count}
                prefix={<AppstoreOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <p style={{ marginTop: 16 }}>管理生产工序信息</p>
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable>
              <Statistic
                title="定额管理"
                value={statistics.quota_count}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
              <p style={{ marginTop: 16 }}>管理工序单价定额</p>
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable>
              <Statistic
                title="工资记录"
                value={statistics.salary_record_count}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <p style={{ marginTop: 16 }}>管理工人工资记录</p>
            </Card>
          </Col>
        </Row>
      </Spin>
      <Card style={{ marginTop: 16 }}>
        <Title level={4}>系统功能</Title>
        <ul>
          <li>工人信息管理：添加、编辑、删除工人信息</li>
          <li>工序管理：定义生产工序，维护工序信息</li>
          <li>定额管理：设置各工序的单价，支持历史记录查询</li>
          <li>工资记录：录入工人工作量，自动计算工资</li>
          <li>报表统计：生成工人工资报表、工序工作量报表等</li>
        </ul>
      </Card>
    </div>
  );
};

export default Home;
