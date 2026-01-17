import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Select, Typography, Space, message, Spin } from 'antd';
import { RightOutlined, LeftOutlined, ImportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { quotaAPI, processCat1API } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const QuotaManagement = () => {
  // 状态定义
  const [filterCombinations, setFilterCombinations] = useState([]);
  const [currentCombinationIndex, setCurrentCombinationIndex] = useState(0);
  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matrixLoading, setMatrixLoading] = useState(false);
  
  // 筛选器状态
  const [cat1Options, setCat1Options] = useState([]);
  const [cat2Options, setCat2Options] = useState([]);
  const [dateOptions, setDateOptions] = useState([]);
  const [selectedCat1, setSelectedCat1] = useState(null);
  const [selectedCat2, setSelectedCat2] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // 加载工段类别列表
  const fetchCat1Options = useCallback(async () => {
    try {
      const data = await processCat1API.getProcessCat1List();
      const options = data.map((item) => ({
        value: item.cat1_code,
        label: `${item.name} (${item.cat1_code})`
      }));
      setCat1Options(options);
    } catch (error) {
      message.error('获取工段类别列表失败');
    }
  }, []);

  // 加载生效日期列表
  const fetchDateOptions = useCallback(async () => {
    try {
      const data = await quotaAPI.getEffectiveDates();
      const options = data.map((date) => ({
        value: date,
        label: date
      }));
      setDateOptions(options);
    } catch (error) {
      message.error('获取生效日期列表失败');
    }
  }, []);

  // 加载工序类别列表（根据工段类别和生效日期动态获取）
  const fetchCat2Options = useCallback(async (cat1, date) => {
    try {
      const params = {};
      if (cat1) params.cat1_code = cat1;
      if (date) params.effective_date = date;
      
      const data = await quotaAPI.getCat2Options(params);
      setCat2Options(data);
    } catch (error) {
      message.error('获取工序类别列表失败');
    }
  }, []);

  // 加载过滤器组合列表
  const fetchFilterCombinations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await quotaAPI.getFilterCombinations();
      setFilterCombinations(data);
      
      if (data.length > 0) {
        // 初始化为第一个组合
        setCurrentCombinationIndex(0);
        applyCombination(data[0]);
      }
    } catch (error) {
      message.error('获取过滤器组合列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 应用过滤器组合
  const applyCombination = (combination) => {
    setSelectedCat1(combination.cat1_code);
    setSelectedCat2(combination.cat2_code);
    setSelectedDate(combination.effective_date);
    // 更新工序类别选项
    fetchCat2Options(combination.cat1_code, combination.effective_date);
    loadMatrixData(combination);
  };

  // 加载矩阵数据
  const loadMatrixData = async (combination) => {
    try {
      setMatrixLoading(true);
      const data = await quotaAPI.getQuotaMatrix({
        cat1_code: combination.cat1_code,
        cat2_code: combination.cat2_code,
        effective_date: combination.effective_date
      });
      setMatrixData(data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setMatrixData(null);
      } else {
        message.error('获取定额矩阵数据失败');
      }
    } finally {
      setMatrixLoading(false);
    }
  };

  // 加载矩阵数据（根据当前选择）
  const loadMatrixByCurrentSelection = async () => {
    if (!selectedCat1 || !selectedCat2 || !selectedDate) {
      return;
    }
    
    try {
      setMatrixLoading(true);
      const data = await quotaAPI.getQuotaMatrix({
        cat1_code: selectedCat1,
        cat2_code: selectedCat2,
        effective_date: selectedDate
      });
      setMatrixData(data);
      
      // 更新当前组合索引
      const index = filterCombinations.findIndex(
        c => c.cat1_code === selectedCat1 && 
             c.cat2_code === selectedCat2 && 
             c.effective_date === selectedDate
      );
      if (index >= 0) {
        setCurrentCombinationIndex(index);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setMatrixData(null);
      } else {
        message.error('获取定额矩阵数据失败');
      }
    } finally {
      setMatrixLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchCat1Options();
    fetchDateOptions();
    fetchFilterCombinations();
  }, [fetchCat1Options, fetchDateOptions, fetchFilterCombinations]);

  // 工段类别或生效日期变化时，重新获取工序类别选项
  useEffect(() => {
    if (selectedCat1 || selectedDate) {
      fetchCat2Options(selectedCat1, selectedDate);
    }
  }, [selectedCat1, selectedDate, fetchCat2Options]);

  // 监听筛选器变化
  useEffect(() => {
    if (selectedCat1 && selectedCat2 && selectedDate) {
      loadMatrixByCurrentSelection();
    }
  }, [selectedCat1, selectedCat2, selectedDate]);

  // 工段类别变化时，清空工序类别选择
  const handleCat1Change = (value) => {
    setSelectedCat1(value);
    setSelectedCat2(null);
    setMatrixData(null);
  };

  // 生效日期变化时，清空工序类别选择
  const handleDateChange = (value) => {
    setSelectedDate(value);
    setSelectedCat2(null);
    setMatrixData(null);
  };

  // "下一个"按钮点击
  const handleNext = () => {
    if (filterCombinations.length === 0) return;
    
    const nextIndex = (currentCombinationIndex + 1) % filterCombinations.length;
    setCurrentCombinationIndex(nextIndex);
    applyCombination(filterCombinations[nextIndex]);
  };

  // "上一个"按钮点击
  const handlePrev = () => {
    if (filterCombinations.length === 0) return;
    
    const prevIndex = currentCombinationIndex === 0 
      ? filterCombinations.length - 1  // 循环到最后一个
      : currentCombinationIndex - 1;
    setCurrentCombinationIndex(prevIndex);
    applyCombination(filterCombinations[prevIndex]);
  };

  // 构建表格列定义
  const getTableColumns = () => {
    if (!matrixData || !matrixData.columns || matrixData.columns.length === 0) {
      return [];
    }

    const columns = [
      {
        title: '型号',
        dataIndex: 'model_display',
        key: 'model_display',
        fixed: 'left',
        width: 180,
        onCell: () => ({
          style: { backgroundColor: '#FFC0CB', fontWeight: 'bold' }
        }),
        render: (text, record) => (
          <span>{text || `${record.model_name} (${record.model_code})`}</span>
        )
      }
    ];

    // 添加工序列 - 列索引背景色为淡黄色
    matrixData.columns.forEach((col) => {
      columns.push({
        title: (
          <div style={{ 
            textAlign: 'center', 
            backgroundColor: '#FFFFCC', 
            padding: '4px',
            borderBottom: col.seq === undefined ? '2px solid orange' : 'none'
          }}>
            <div>{col.process_name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>({col.process_code})</div>
            {col.seq === undefined && (
              <div style={{ fontSize: '10px', color: 'orange' }}>未配置顺序</div>
            )}
          </div>
        ),
        dataIndex: `price_${col.process_code}`,
        key: `price_${col.process_code}`,
        width: 120,
        align: 'right',
        onCell: () => ({
          style: { backgroundColor: '#FFFFFF', textAlign: 'right' }  // 无色/白色背景
        }),
        render: (price) => {
          if (price === undefined || price === null) {
            return '-';
          }
          return `¥${price.toFixed(2)}`;
        }
      });
    });

    return columns;
  };

  // 构建表格数据
  const getTableData = () => {
    if (!matrixData || !matrixData.rows || matrixData.rows.length === 0) {
      return [];
    }

    return matrixData.rows.map((row) => {
      const rowData = {
        key: row.model_code,
        model_code: row.model_code,
        model_name: row.model_name,
        model_display: `${row.model_name} (${row.model_code})`
      };

      // 添加每个工序的价格
      matrixData.columns.forEach((col) => {
        rowData[`price_${col.process_code}`] = row.prices[col.process_code];
      });

      return rowData;
    });
  };

  // 获取当前组合信息显示
  const getCurrentCombinationDisplay = () => {
    if (!matrixData) return '';
    return `${matrixData.cat1.name} (${matrixData.cat1.code}) / ${matrixData.cat2.name} (${matrixData.cat2.code}) / ${matrixData.effective_date}`;
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>定额管理</Title>
      
      {/* 按钮区域 */}
      <Space style={{ marginBottom: 16 }}>
        <Button 
          icon={<ImportOutlined />} 
          disabled
          title="批量Excel导入功能待实现"
        >
          批量Excel导入
        </Button>
        <Button 
          icon={<LeftOutlined />} 
          onClick={handlePrev}
          disabled={filterCombinations.length <= 1}
        >
          上一个 ({currentCombinationIndex + 1}/{filterCombinations.length})
        </Button>
        <Button 
          type="primary" 
          icon={<RightOutlined />} 
          onClick={handleNext}
          disabled={filterCombinations.length <= 1}
        >
          下一个 ({currentCombinationIndex + 1}/{filterCombinations.length})
        </Button>
      </Space>

      {/* 过滤器区域 */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="工段类别"
          style={{ width: 200 }}
          value={selectedCat1}
          onChange={handleCat1Change}
          options={cat1Options}
          allowClear
        />
        <Select
          placeholder="工序类别"
          style={{ width: 200 }}
          value={selectedCat2}
          onChange={setSelectedCat2}
          options={cat2Options}
          allowClear
          disabled={!selectedCat1 && !selectedDate}
        />
        <Select
          placeholder="生效日期"
          style={{ width: 150 }}
          value={selectedDate}
          onChange={handleDateChange}
          options={dateOptions}
          allowClear
        />
      </Space>

      {/* 当前组合信息 */}
      {matrixData && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            当前组合: {getCurrentCombinationDisplay()}
          </Text>
        </div>
      )}

      {/* 加载状态 */}
      {matrixLoading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" tip="加载中..." />
        </div>
      )}

      {/* 矩阵表格 */}
      {!matrixLoading && matrixData && (
        <Table
          columns={getTableColumns()}
          dataSource={getTableData()}
          rowKey="model_code"
          pagination={false}
          scroll={{ x: 'max-content', y: 500 }}
          size="small"
        />
      )}

      {/* 无数据状态 */}
      {!matrixLoading && !matrixData && (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <Text type="secondary">暂无定额数据，请选择有效的过滤器组合</Text>
        </div>
      )}

      {/* 初始加载状态 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" tip="加载中..." />
        </div>
      )}
    </div>
  );
};

export default QuotaManagement;
