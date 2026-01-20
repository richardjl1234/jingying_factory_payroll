import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Typography, Space, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { salaryAPI, workerAPI } from '../services/api';
import { QuotaOptionsResponse, QuotaOptionItem, CascadeOption } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

// 类型定义
interface Worker {
  worker_code: string;
  name?: string;
  full_name?: string;
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
  
  // 预加载的定额数据
  const [quotaOptionsData, setQuotaOptionsData] = useState<QuotaOptionsResponse | null>(null);
  const [quotaOptionsLoading, setQuotaOptionsLoading] = useState(false);
  
  // 定额选择状态
  const [quotaIdInput, setQuotaIdInput] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<QuotaCombination | null>(null);
  const [quotaResult, setQuotaResult] = useState<QuotaSearchResult | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  
  // 搜索结果
  const [processSearchResults, setProcessSearchResults] = useState<QuotaCombination[]>([]);
  
  // 搜索输入值
  const [processSearchValue, setProcessSearchValue] = useState('');
  
  // 键盘导航状态
  const [focusedProcessIndex, setFocusedProcessIndex] = useState<number>(-1);
  const processDropdownRef = useRef<HTMLDivElement>(null);

  // 级联下拉框状态
  const [selectedCascadeCat1, setSelectedCascadeCat1] = useState<string | null>(null);
  const [selectedCascadeCat2, setSelectedCascadeCat2] = useState<string | null>(null);
  const [selectedCascadeModel, setSelectedCascadeModel] = useState<string | null>(null);
  const [selectedCascadeProcesses, setSelectedCascadeProcesses] = useState<string[]>([]);
  
  // 多选确认状态
  const [multiSelectionConfirmed, setMultiSelectionConfirmed] = useState(false);
  
  // 下拉面板显示状态
  const [showCat1Dropdown, setShowCat1Dropdown] = useState(false);
  const [showCat2Dropdown, setShowCat2Dropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showProcessDropdown, setShowProcessDropdown] = useState(false);

  // 根据级联选择过滤的选项（前端内存中过滤）
  const filteredCat2Options = useMemo(() => {
    if (!quotaOptionsData || !selectedCascadeCat1) return [];
    return quotaOptionsData.cat2_options[selectedCascadeCat1] || [];
  }, [quotaOptionsData, selectedCascadeCat1]);

  const filteredModelOptions = useMemo(() => {
    if (!quotaOptionsData || !selectedCascadeCat1 || !selectedCascadeCat2) return [];
    return quotaOptionsData.model_options.filter((model: CascadeOption) => {
      const modelInfo = quotaOptionsData.model_options.find(m => m.value === model.value);
      if (modelInfo && (modelInfo as any).cat1_codes && (modelInfo as any).cat2_codes) {
        return (modelInfo as any).cat1_codes.includes(selectedCascadeCat1) && 
               (modelInfo as any).cat2_codes.includes(selectedCascadeCat2);
      }
      return false;
    });
  }, [quotaOptionsData, selectedCascadeCat1, selectedCascadeCat2]);

  const filteredProcessOptions = useMemo(() => {
    if (!quotaOptionsData || !selectedCascadeCat1 || !selectedCascadeCat2 || !selectedCascadeModel) return [];
    return quotaOptionsData.quota_options.filter((q: QuotaOptionItem) => 
      q.cat1_code === selectedCascadeCat1 && 
      q.cat2_code === selectedCascadeCat2 && 
      q.model_code === selectedCascadeModel
    );
  }, [quotaOptionsData, selectedCascadeCat1, selectedCascadeCat2, selectedCascadeModel]);

  // Get selected quota details (for multi-selection)
  const selectedQuotaDetails = useMemo(() => {
    if (selectedCascadeProcesses.length === 0) return [];
    return selectedCascadeProcesses.map(code => {
      const option = filteredProcessOptions.find((p: QuotaOptionItem) => p.process_code === code);
      return option ? {
        quota_id: option.quota_id,
        process_code: code,
        process_name: option.process_name,
        unit_price: option.unit_price
      } : null;
    }).filter(Boolean);
  }, [selectedCascadeProcesses, filteredProcessOptions]);

  // 构建定额组合列表用于搜索
  const quotaCombinations = useMemo(() => {
    if (!quotaOptionsData) return [];
    return quotaOptionsData.quota_options.map((q: QuotaOptionItem) => ({
      quota_id: q.quota_id,
      combined_code: `${q.model_code}${q.cat1_code}${q.cat2_code}${q.process_code}`,
      model_code: q.model_code,
      model_name: q.model_name,
      cat1_code: q.cat1_code,
      cat1_name: q.cat1_name,
      cat2_code: q.cat2_code,
      cat2_name: q.cat2_name,
      process_code: q.process_code,
      process_name: q.process_name,
      unit_price: q.unit_price
    }));
  }, [quotaOptionsData]);

  // 工人搜索状态
  const [workerSearchValue, setWorkerSearchValue] = useState('');
  const [workerSearchResults, setWorkerSearchResults] = useState<Worker[]>([]);
  const [focusedWorkerIndex, setFocusedWorkerIndex] = useState<number>(-1);
  const workerDropdownRef = useRef<HTMLDivElement>(null);

  // 获取工人列表
  const fetchWorkers = useCallback(async () => {
    try {
      const data = await workerAPI.getWorkers();
      const workerList = (data as any).items || data;
      setWorkers(workerList);
      // Select the first worker by default
      if (workerList.length > 0) {
        const firstWorker = workerList[0];
        setSelectedWorker(firstWorker.worker_code);
        setSelectedWorkerName(firstWorker.name || firstWorker.full_name || '');
      }
    } catch (error) {
      message.error('获取工人列表失败');
    }
  }, []);

  // 预加载定额数据
  const fetchQuotaOptions = useCallback(async () => {
    try {
      setQuotaOptionsLoading(true);
      const recordDate = `${selectedMonth.slice(0, 4)}-${selectedMonth.slice(4, 6)}-01`;
      const data = await salaryAPI.getQuotaOptions({ record_date: recordDate });
      setQuotaOptionsData(data);
    } catch (error) {
      message.error('获取定额选项失败');
    } finally {
      setQuotaOptionsLoading(false);
    }
  }, [selectedMonth]);

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
  }, [fetchWorkers]);

  // 工人或月份变化时加载数据
  useEffect(() => {
    fetchWorkerMonthRecords();
  }, [fetchWorkerMonthRecords]);

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
  const formatMonthDisplay = (month: string) => {
    if (!month || month.length !== 6) return month;
    return `${month.slice(0, 4)}-${month.slice(4, 6)}`;
  };

  // 工人搜索（顺序匹配算法）
  const handleWorkerSearch = (value: string) => {
    setWorkerSearchValue(value);
    if (!value) {
      setWorkerSearchResults([]);
      setFocusedWorkerIndex(-1);
      return;
    }
    
    // 顺序匹配算法：用户输入的字符必须按顺序出现在worker_code中
    const lowerValue = value.toLowerCase();
    
    const results = workers.filter((w: Worker) => {
      const workerCode = w.worker_code.toLowerCase();
      let charIndex = 0;
      
      for (const char of lowerValue) {
        charIndex = workerCode.indexOf(char, charIndex);
        if (charIndex === -1) return false;
        charIndex++;
      }
      return true;
    });
    
    setWorkerSearchResults(results);
    setFocusedWorkerIndex(-1);
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

  // 选择工人
  const handleWorkerSelect = (workerCode: string) => {
    const worker = workers.find((w: Worker) => w.worker_code === workerCode);
    if (worker) {
      setSelectedWorker(workerCode);
      setSelectedWorkerName(worker.name || worker.full_name || '');
      setWorkerSearchValue('');
      setWorkerSearchResults([]);
      setFocusedWorkerIndex(-1);
    }
  };

  // 工人下拉框键盘导航
  const handleWorkerDropdownKeyDown = (e: React.KeyboardEvent) => {
    const totalOptions = workerSearchResults.length;
    if (totalOptions === 0) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: 上一项
        setFocusedWorkerIndex(prev => {
          const newIndex = prev <= 0 ? totalOptions - 1 : prev - 1;
          setTimeout(() => {
            const elements = workerDropdownRef.current?.querySelectorAll('[data-worker-index]');
            const el = elements?.[newIndex] as HTMLElement;
            el?.focus();
          }, 0);
          return newIndex;
        });
      } else {
        // Tab: 下一项
        setFocusedWorkerIndex(prev => {
          const newIndex = prev >= totalOptions - 1 ? 0 : prev + 1;
          setTimeout(() => {
            const elements = workerDropdownRef.current?.querySelectorAll('[data-worker-index]');
            const el = elements?.[newIndex] as HTMLElement;
            el?.focus();
          }, 0);
          return newIndex;
        });
      }
    } else if (e.key === ' ') {
      // Space: 选择当前聚焦的选项
      e.preventDefault();
      if (focusedWorkerIndex >= 0 && focusedWorkerIndex < totalOptions) {
        const worker = workerSearchResults[focusedWorkerIndex];
        handleWorkerSelect(worker.worker_code);
      }
    }
  };

  // 上一位工人（循环）
  const handleWorkerPrev = () => {
    if (workers.length === 0) return;
    
    const currentIndex = selectedWorker 
      ? workers.findIndex((w: Worker) => w.worker_code === selectedWorker)
      : -1;
    
    // 如果没有选中工人，选择最后一个
    let newIndex = currentIndex <= 0 ? workers.length - 1 : currentIndex - 1;
    
    // 如果有搜索结果，在搜索结果中循环
    if (workerSearchResults.length > 0) {
      const currentResultIndex = workerSearchResults.findIndex((w: Worker) => w.worker_code === selectedWorker);
      if (currentResultIndex >= 0) {
        newIndex = currentResultIndex <= 0 ? workerSearchResults.length - 1 : currentResultIndex - 1;
        handleWorkerSelect(workerSearchResults[newIndex].worker_code);
      } else {
        handleWorkerSelect(workerSearchResults[workerSearchResults.length - 1].worker_code);
      }
    } else {
      // 没有搜索结果时在整个工人列表中循环
      handleWorkerSelect(workers[newIndex].worker_code);
    }
  };

  // 下一位工人（循环）
  const handleWorkerNext = () => {
    if (workers.length === 0) return;
    
    const currentIndex = selectedWorker 
      ? workers.findIndex((w: Worker) => w.worker_code === selectedWorker)
      : -1;
    
    // 如果没有选中工人，选择第一个
    let newIndex = currentIndex >= workers.length - 1 ? 0 : currentIndex + 1;
    
    // 如果有搜索结果，在搜索结果中循环
    if (workerSearchResults.length > 0) {
      const currentResultIndex = workerSearchResults.findIndex((w: Worker) => w.worker_code === selectedWorker);
      if (currentResultIndex >= 0) {
        newIndex = currentResultIndex >= workerSearchResults.length - 1 ? 0 : currentResultIndex + 1;
        handleWorkerSelect(workerSearchResults[newIndex].worker_code);
      } else {
        handleWorkerSelect(workerSearchResults[0].worker_code);
      }
    } else {
      // 没有搜索结果时在整个工人列表中循环
      handleWorkerSelect(workers[newIndex].worker_code);
    }
  };

  // 清除工人选择
  const handleWorkerClear = () => {
    setSelectedWorker(null);
    setSelectedWorkerName('');
    setWorkerSearchValue('');
    setWorkerSearchResults([]);
    setFocusedWorkerIndex(-1);
    setRecords([]);
    setSummary({ total_quantity: 0, total_amount: 0 });
  };

  // 月份输入变化
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 移除所有非数字字符用于验证
    const numericValue = value.replace(/\D/g, '');
    // 限制为最多6位数字
    if (numericValue.length <= 6) {
      setSelectedMonth(numericValue);
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
    
    // 搜索所有组合（combined_code 格式: model_code + cat1_code + cat2_code + process_code）
    const results = quotaCombinations.filter((q: QuotaCombination) => {
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
    const process = quotaCombinations.find((q: QuotaCombination) => q.quota_id === quotaId);
    if (process) {
      setSelectedProcess(process);
      setProcessSearchResults([]);
      setProcessSearchValue('');
      setFocusedProcessIndex(-1);
      // 尝试自动确定定额（从选中的工序组合中获取model_code）
      findQuotaByCombination(process.model_code, process);
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
      
      // 检查响应结果
      if ((result as any).found === true) {
        setQuotaResult(result as QuotaSearchResult);
        setSelectedProcess(null);
        message.success('定额查找成功');
      } else if ((result as any).found === false) {
        const errorType = (result as any).error_type;
        const messageText = (result as any).message;
        const replacement = (result as any).replacement;
        
        if (errorType === 'not_found') {
          message.warning(messageText);
        } else if (errorType === 'obsolete') {
          // 显示失效信息和建议
          let infoMessage = messageText;
          if (replacement) {
            infoMessage += `，建议使用定额ID ${replacement.quota_id}`;
            Modal.info({
              title: '定额已失效',
              content: (
                <div>
                  <p>{messageText}</p>
                  <p style={{ color: '#1890ff', fontWeight: 'bold' }}>
                    建议使用定额ID {replacement.quota_id}
                  </p>
                  <p style={{ color: '#999', fontSize: 12 }}>
                    该定额具有相同的型号、工段、工序类别和工序，且在有效期内
                  </p>
                  <p>
                    单价：¥{replacement.unit_price.toFixed(2)}<br />
                    有效期：{replacement.effective_date} ~ {replacement.obsolete_date}
                  </p>
                </div>
              ),
              okText: '确定',
              onOk: () => {
                // 自动填充建议的定额ID
                setQuotaIdInput(String(replacement.quota_id));
              }
            });
          } else {
            message.warning(messageText + '，暂无推荐定额');
          }
        } else if (errorType === 'not_yet_effective') {
          message.warning(messageText);
        }
        setQuotaResult(null);
      }
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

  // 处理级联下拉框选择
  const handleCascadeCat1Change = (value: string) => {
    setSelectedCascadeCat1(value);
    setSelectedCascadeCat2(null);
    setSelectedCascadeModel(null);
    setSelectedCascadeProcesses([]);
    setShowCat2Dropdown(true);
    setShowModelDropdown(false);
    setShowProcessDropdown(false);
    setQuotaResult(null);
  };

  const handleCascadeCat2Change = (value: string) => {
    setSelectedCascadeCat2(value);
    setSelectedCascadeModel(null);
    setSelectedCascadeProcesses([]);
    setShowModelDropdown(true);
    setShowProcessDropdown(false);
    setQuotaResult(null);
  };

  const handleCascadeModelChange = (value: string) => {
    setSelectedCascadeModel(value);
    setSelectedCascadeProcesses([]);
    setShowProcessDropdown(true);
    setQuotaResult(null);
  };

  const handleCascadeProcessChange = (value: string, e?: React.MouseEvent) => {
    const isCtrlPressed = e?.ctrlKey || e?.metaKey;
    
    // 重置确认状态，允许重新显示按钮
    setMultiSelectionConfirmed(false);
    
    if (isCtrlPressed) {
      // Multi-selection mode: toggle selection
      setSelectedCascadeProcesses(prev => {
        if (prev.includes(value)) {
          return prev.filter(v => v !== value);
        } else {
          return [...prev, value];
        }
      });
      // Keep dropdown open for multi-selection
    } else {
      // Single selection mode: select only this option and close all dropdowns
      setSelectedCascadeProcesses([value]);
      setShowCat1Dropdown(false);
      setShowCat2Dropdown(false);
      setShowModelDropdown(false);
      setShowProcessDropdown(false);
      
      if (value && selectedCascadeCat1 && selectedCascadeCat2 && selectedCascadeModel) {
        // Find the selected process info
        const processInfo = filteredProcessOptions.find((p: QuotaOptionItem) => p.process_code === value);
        if (processInfo) {
          // Set quota result
          setQuotaResult({
            quota_id: processInfo.quota_id,
            model_code: selectedCascadeModel,
            cat1_code: selectedCascadeCat1,
            cat1_name: processInfo.cat1_name,
            cat2_code: selectedCascadeCat2,
            cat2_name: processInfo.cat2_name,
            process_code: value,
            process_name: processInfo.process_name,
            unit_price: processInfo.unit_price,
            effective_date: processInfo.effective_date,
            obsolete_date: processInfo.obsolete_date
          });
          // Set quota ID input
          setQuotaIdInput(String(processInfo.quota_id));
        }
      }
    }
  };

  // 显示添加记录模态框
  const showAddModal = () => {
    setIsEditMode(false);
    setCurrentRecord(null);
    setQuotaIdInput('');
    setSelectedProcess(null);
    setQuotaResult(null);
    setProcessSearchResults([]);
    // Reset cascade dropdowns
    setSelectedCascadeCat1(null);
    setSelectedCascadeCat2(null);
    setSelectedCascadeModel(null);
    setSelectedCascadeProcesses([]);
    setMultiSelectionConfirmed(false);
    setShowCat1Dropdown(false);
    setShowCat2Dropdown(false);
    setShowModelDropdown(false);
    setShowProcessDropdown(false);
    form.resetFields();
    form.setFieldValue('quantity', 1);
    
    // 计算默认日期：最大现有记录日期的第二天，如果没有记录则默认为1号
    let defaultDay = '01';
    if (records.length > 0) {
      // 找到最大日期
      const maxDate = records.reduce((max, record) => {
        return dayjs(record.record_date).isAfter(dayjs(max)) ? record.record_date : max;
      }, records[0].record_date);
      
      const maxDayJs = dayjs(maxDate);
      const lastDayOfMonth = maxDayJs.endOf('month');
      
      // 如果最大日期已经是当月最后一天，则使用该日期；否则使用第二天
      if (maxDayJs.isSame(lastDayOfMonth, 'day')) {
        defaultDay = maxDayJs.format('DD');
      } else {
        defaultDay = maxDayJs.add(1, 'day').format('DD');
      }
      
      // 确保日期在有效范围内（1-31）
      const dayNum = parseInt(defaultDay);
      if (dayNum > 31) {
        defaultDay = '01';
      }
    }
    
    form.setFieldValue('day', defaultDay);
    setIsModalVisible(true);
    
    // 加载预定义额数据
    fetchQuotaOptions();
  };

  // 显示编辑记录模态框
  const showEditModal = (record: SalaryRecord) => {
    setIsEditMode(true);
    setCurrentRecord(record);
    setMultiSelectionConfirmed(false);
    
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
    
    // 加载预定义额数据
    fetchQuotaOptions();
  };

  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 日期增加
  const handleDayIncrement = () => {
    const currentDay = form.getFieldValue('day') || '01';
    const dayNum = parseInt(currentDay);
    if (isNaN(dayNum)) return;
    
    const maxDay = dayjs(`${selectedMonth.slice(0, 4)}-${selectedMonth.slice(4, 6)}-01`).endOf('month').date();
    const newDay = dayNum >= maxDay ? maxDay : dayNum + 1;
    form.setFieldValue('day', String(newDay).padStart(2, '0'));
  };

  // 日期减少
  const handleDayDecrement = () => {
    const currentDay = form.getFieldValue('day') || '01';
    const dayNum = parseInt(currentDay);
    if (isNaN(dayNum)) return;
    
    const newDay = dayNum <= 1 ? 1 : dayNum - 1;
    form.setFieldValue('day', String(newDay).padStart(2, '0'));
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    const recordDate = `${selectedMonth.slice(0, 4)}-${selectedMonth.slice(4, 6)}-${String(values.day).padStart(2, '0')}`;
    
    try {
      if (selectedCascadeProcesses.length > 1) {
        // Multi-selection mode: create batch records
        setQuotaLoading(true);
        const quotaIds = selectedQuotaDetails.map(d => d!.quota_id);
        
        const result = await salaryAPI.createBatchSalaryRecords({
          worker_code: selectedWorker || '',
          quota_ids: quotaIds,
          quantity: parseFloat(values.quantity),
          record_date: recordDate
        });
        
        message.success(result.message);
        setIsModalVisible(false);
        fetchWorkerMonthRecords();
      } else if (quotaResult) {
        // Single selection mode: create single record
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
      } else {
        message.error('请先确定定额');
      }
    } catch (error) {
      message.error(isEditMode ? '工作记录更新失败' : '工作记录添加失败');
    } finally {
      setQuotaLoading(false);
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
      title: '定额ID',
      dataIndex: 'quota_id',
      key: 'quota_id',
      width: 80,
      align: 'center' as const,
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
                {match[2].trim()}
                <br />
                <Text style={{ color: '#1890ff', fontSize: 12 }}>({match[1].trim()})</Text>
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
                {match[2].trim()}
                <br />
                <Text style={{ color: '#1890ff', fontSize: 12 }}>({match[1].trim()})</Text>
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
                {match[2].trim()}
                <br />
                <Text style={{ color: '#1890ff', fontSize: 12 }}>({match[1].trim()})</Text>
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
                {match[2].trim()}
                <br />
                <Text style={{ color: '#1890ff', fontSize: 12 }}>({match[1].trim()})</Text>
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
        <Col span={10}>
          <div style={{ position: 'relative' }}>
            <Input
              placeholder="搜索工人（输入工号进行模糊搜索）"
              value={selectedWorker ? `${selectedWorkerName} (${selectedWorker})` : workerSearchValue}
              onChange={(e) => handleWorkerSearch(e.target.value)}
              onClear={handleWorkerClear}
              allowClear
              onKeyDown={(e) => {
                if (e.key === 'Tab' && workerSearchResults.length > 0) {
                  e.preventDefault();
                  setFocusedWorkerIndex(0);
                  setTimeout(() => {
                    const firstOption = document.querySelector('[data-worker-index="0"]') as HTMLElement;
                    firstOption?.focus();
                  }, 10);
                }
              }}
              prefix={
                <Button 
                  type="text" 
                  size="small" 
                  onClick={handleWorkerPrev}
                  style={{ padding: '0 4px' }}
                  title="上一位工人"
                >
                  ◀
                </Button>
              }
              suffix={
                <Space size={0}>
                  <Button 
                    type="text" 
                    size="small" 
                    onClick={handleWorkerNext}
                    style={{ padding: '0 4px' }}
                    title="下一位工人"
                  >
                    ▶
                  </Button>
                </Space>
              }
            />
            {/* 工人下拉框 */}
            {workerSearchResults.length > 0 && (
              <div 
                ref={workerDropdownRef}
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
                onKeyDown={handleWorkerDropdownKeyDown}
              >
                {workerSearchResults.slice(0, 50).map((worker: Worker, index: number) => (
                  <div
                    key={worker.worker_code}
                    data-worker-index={index}
                    tabIndex={0}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      color: 'rgba(0, 0, 0, 0.85)',
                      backgroundColor: focusedWorkerIndex === index ? '#e6f7ff' : 'transparent',
                      outline: 'none'
                    }}
                    onClick={() => handleWorkerSelect(worker.worker_code)}
                    onFocus={() => setFocusedWorkerIndex(index)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = focusedWorkerIndex === index ? '#e6f7ff' : 'white';
                    }}
                  >
                    {worker.name || worker.full_name} ({highlightMatchedChars(worker.worker_code, workerSearchValue)})
                  </div>
                ))}
                {workerSearchResults.length > 50 && (
                  <div style={{ padding: 8, textAlign: 'center', color: '#999' }}>
                    还有 {workerSearchResults.length - 50} 条结果...
                  </div>
                )}
              </div>
            )}
            {workerSearchResults.length === 0 && workerSearchValue && !selectedWorker && (
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
                没有匹配的工人
              </div>
            )}
          </div>
        </Col>
        <Col span={4}>
          <Input 
            placeholder="YYYY-MM" 
            value={formatMonthDisplay(selectedMonth)}
            onChange={handleMonthChange}
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
        width={900}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* 工人、月份和日期 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="工人">
                <Input 
                  value={selectedWorker ? `${selectedWorkerName} (${selectedWorker})` : ''} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="月份">
                <Input value={formatMonthDisplay(selectedMonth)} disabled style={{ backgroundColor: '#f5f5f5' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
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
                <Input 
                  placeholder="请输入日期（两位数，如：15）" 
                  maxLength={2} 
                  prefix={
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={handleDayDecrement}
                      style={{ padding: '0 4px' }}
                    >
                      -
                    </Button>
                  }
                  suffix={
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={handleDayIncrement}
                      style={{ padding: '0 4px' }}
                    >
                      +
                    </Button>
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 定额选择区域 */}
          <div style={{ 
            border: '1px solid #d9d9d9', 
            borderRadius: 4, 
            padding: 16, 
            marginBottom: 16,
            backgroundColor: '#fafafa'
          }}>
            <Text strong style={{ display: 'block', marginBottom: 16 }}>定额选择 {selectedCascadeProcesses.length > 0 && <Text type="secondary">（已选择 {selectedCascadeProcesses.length} 项，按Ctrl可多选）</Text>}</Text>
            
            {/* 级联下拉框选择 - 带悬停自动展开下一级 */}
            <Row gutter={8} style={{ marginBottom: 16 }}>
              {/* 工段类别 */}
              <Col span={5}>
                <div style={{ position: 'relative' }}>
                  <Input
                    placeholder="工段类别"
                    value={selectedCascadeCat1 ? (quotaOptionsData?.cat1_options.find(o => o.value === selectedCascadeCat1)?.label || selectedCascadeCat1) : ''}
                    readOnly
                    onFocus={() => setShowCat1Dropdown(true)}
                    onBlur={() => setTimeout(() => setShowCat1Dropdown(false), 200)}
                    suffix={<span style={{ color: '#999' }}>▼</span>}
                    style={{ cursor: 'pointer' }}
                  />
                  {/* 下拉面板 - 工段类别 */}
                  {showCat1Dropdown && quotaOptionsData && quotaOptionsData.cat1_options.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: 450,
                        overflow: 'auto',
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        backgroundColor: 'white',
                        zIndex: 1000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      {quotaOptionsData.cat1_options.map((option) => (
                        <div
                          key={option.value}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: selectedCascadeCat1 === option.value ? '#e6f7ff' : 'white',
                            borderBottom: '1px solid #f0f0f0'
                          }}
                          onClick={() => handleCascadeCat1Change(option.value)}
                          onMouseEnter={() => {
                            // 悬停时自动选中并展开下一级
                            if (option.value !== selectedCascadeCat1) {
                              handleCascadeCat1Change(option.value);
                            }
                          }}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Col>
              
              {/* 工序类别 */}
              <Col span={6}>
                <div style={{ position: 'relative' }}>
                  <Input
                    placeholder="工序类别"
                    value={selectedCascadeCat2 ? (filteredCat2Options.find((o: CascadeOption) => o.value === selectedCascadeCat2)?.label || selectedCascadeCat2) : ''}
                    readOnly
                    disabled={!selectedCascadeCat1}
                    onFocus={() => selectedCascadeCat1 && setShowCat2Dropdown(true)}
                    onBlur={() => setTimeout(() => setShowCat2Dropdown(false), 200)}
                    suffix={<span style={{ color: '#999' }}>▼</span>}
                    style={{ cursor: !selectedCascadeCat1 ? 'not-allowed' : 'pointer' }}
                  />
                  {/* 下拉面板 - 工序类别 */}
                  {showCat2Dropdown && selectedCascadeCat1 && filteredCat2Options.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: 450,
                        overflow: 'auto',
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        backgroundColor: 'white',
                        zIndex: 1000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      {filteredCat2Options.map((option: CascadeOption) => (
                        <div
                          key={option.value}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: selectedCascadeCat2 === option.value ? '#e6f7ff' : 'white',
                            borderBottom: '1px solid #f0f0f0'
                          }}
                          onClick={() => handleCascadeCat2Change(option.value)}
                          onMouseEnter={() => {
                            if (option.value !== selectedCascadeCat2) {
                              handleCascadeCat2Change(option.value);
                            }
                          }}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Col>
              
              {/* 电机型号 */}
              <Col span={5}>
                <div style={{ position: 'relative' }}>
                  <Input
                    placeholder="电机型号"
                    value={selectedCascadeModel ? (filteredModelOptions.find((o: CascadeOption) => o.value === selectedCascadeModel)?.label || selectedCascadeModel) : ''}
                    readOnly
                    disabled={!selectedCascadeCat2}
                    onFocus={() => selectedCascadeCat1 && selectedCascadeCat2 && setShowModelDropdown(true)}
                    onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                    suffix={<span style={{ color: '#999' }}>▼</span>}
                    style={{ cursor: !selectedCascadeCat2 ? 'not-allowed' : 'pointer' }}
                  />
                  {/* 下拉面板 - 电机型号 */}
                  {showModelDropdown && selectedCascadeCat1 && selectedCascadeCat2 && filteredModelOptions.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: 450,
                        overflow: 'auto',
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        backgroundColor: 'white',
                        zIndex: 1000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      {filteredModelOptions.map((option: CascadeOption) => (
                        <div
                          key={option.value}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: selectedCascadeModel === option.value ? '#e6f7ff' : 'white',
                            borderBottom: '1px solid #f0f0f0'
                          }}
                          onClick={() => handleCascadeModelChange(option.value)}
                          onMouseEnter={() => {
                            if (option.value !== selectedCascadeModel) {
                              handleCascadeModelChange(option.value);
                            }
                          }}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Col>
              
              {/* 工序 */}
              <Col span={8}>
                <div style={{ position: 'relative' }}>
                  <Input
                    placeholder="工序"
                    value={selectedCascadeProcesses.length > 0 
                      ? selectedCascadeProcesses.map(code => 
                          filteredProcessOptions.find((p: QuotaOptionItem) => p.process_code === code)?.process_name
                        ).filter(Boolean).join(', ')
                      : ''}
                    readOnly
                    disabled={!selectedCascadeModel}
                    onFocus={() => selectedCascadeModel && setShowProcessDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProcessDropdown(false), 200)}
                    suffix={<span style={{ color: '#999' }}>▼</span>}
                    style={{ cursor: !selectedCascadeModel ? 'not-allowed' : 'pointer' }}
                  />
                  {/* 多选完成按钮 */}
                  {selectedCascadeProcesses.length > 1 && !multiSelectionConfirmed && (
                    <Button
                      type="primary"
                      size="small"
                      style={{ 
                        position: 'absolute',
                        right: 30,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1001
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCat1Dropdown(false);
                        setShowCat2Dropdown(false);
                        setShowModelDropdown(false);
                        setShowProcessDropdown(false);
                        setMultiSelectionConfirmed(true);
                      }}
                    >
                      工序选择完成
                    </Button>
                  )}
                  {/* 下拉面板 - 工序 */}
                  {showProcessDropdown && selectedCascadeModel && filteredProcessOptions.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: 450,
                        width: 280,
                        overflow: 'auto',
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        backgroundColor: 'white',
                        zIndex: 1000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      {filteredProcessOptions.map((option: QuotaOptionItem) => (
                        <div
                          key={option.process_code}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: selectedCascadeProcesses.includes(option.process_code) ? '#e6f7ff' : 'white',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}
                          onClick={(e) => handleCascadeProcessChange(option.process_code, e)}
                        >
                          <span style={{ 
                            display: 'inline-block', 
                            width: 16, 
                            height: 16, 
                            border: '1px solid #d9d9d9', 
                            borderRadius: 2,
                            backgroundColor: selectedCascadeProcesses.includes(option.process_code) ? '#1890ff' : 'white',
                            color: 'white',
                            textAlign: 'center',
                            lineHeight: '14px',
                            fontSize: 12,
                            marginRight: 4
                          }}>
                            {selectedCascadeProcesses.includes(option.process_code) && '✓'}
                          </span>
                          {option.process_name} - ¥{option.unit_price.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            {/* 定额组合搜索 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <div style={{ position: 'relative' }}>
                  <Input
                    placeholder="搜索定额组合（输入编码组合，如：型号+工段+工序类别+工序）"
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
                          <Text strong style={{ color: '#1890ff', marginRight: 8 }}>#{process.quota_id}</Text>
                          {process.cat1_name}-{process.cat2_name}-{process.process_name}
                          <Text style={{ color: '#999', marginLeft: 8 }}>({highlightMatchedChars(process.combined_code, processSearchValue)})</Text>
                        </div>
                      ))}
                      {processSearchResults.length > 50 && (
                        <div style={{ padding: 8, textAlign: 'center', color: '#999' }}>
                          还有 {processSearchResults.length - 50} 条结果...
                        </div>
                      )}
                    </div>
                  )}
                  {processSearchResults.length === 0 && processSearchValue && (
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

            {/* 定额ID直接输入 */}
            <Row gutter={16}>
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

            {/* 定额信息显示 - 单选 */}
            {quotaResult && selectedCascadeProcesses.length <= 1 && (
              <div style={{ 
                padding: 12, 
                backgroundColor: '#e6f7ff', 
                borderRadius: 4,
                border: '1px solid #91d5ff',
                marginTop: 16
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

            {/* 多选定额信息显示 */}
            {selectedQuotaDetails.length > 1 && (
              <div style={{ 
                padding: 12, 
                backgroundColor: '#fff7e6', 
                borderRadius: 4,
                border: '1px solid #ffd591',
                marginTop: 16
              }}>
                <Text strong style={{ color: '#fa8c16', display: 'block', marginBottom: 8 }}>
                  已选择 {selectedQuotaDetails.length} 个定额：
                </Text>
                {selectedQuotaDetails.map((detail, index) => (
                  <div key={index} style={{ marginBottom: 4 }}>
                    <Text>ID: {detail!.quota_id} - {detail!.process_name} - ¥{detail!.unit_price.toFixed(2)}</Text>
                  </div>
                ))}
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
