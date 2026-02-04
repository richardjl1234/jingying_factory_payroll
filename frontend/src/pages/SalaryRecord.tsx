import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Typography, Space, Row, Col, Card, Tag, Divider } from 'antd';
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
  
  // 排序状态
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 排序后的记录
  const sortedRecords = useMemo(() => {
    const sorted = [...records].sort((a, b) => {
      const dateA = new Date(a.record_date).getTime();
      const dateB = new Date(b.record_date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return sorted;
  }, [records, sortOrder]);
  
  // 切换排序顺序
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
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
  
  // ========== Way 0 状态变量 ==========
  const [way0Cat1SearchValue, setWay0Cat1SearchValue] = useState('');
  const [way0SelectedCat1, setWay0SelectedCat1] = useState<string | null>(null);
  const [way0QuotaDialogVisible, setWay0QuotaDialogVisible] = useState(false);
  const [way0SelectedQuotas, setWay0SelectedQuotas] = useState<Set<number>>(new Set());
  const [way0SelectedQuotaItems, setWay0SelectedQuotaItems] = useState<QuotaOptionItem[]>([]);
  const [showWay0Cat1Dropdown, setShowWay0Cat1Dropdown] = useState(false);
  // ==================================
  
  // 下拉面板显示状态
  const [showCat1Dropdown, setShowCat1Dropdown] = useState(false);
  const [showCat2Dropdown, setShowCat2Dropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showProcessDropdown, setShowProcessDropdown] = useState(false);

  // 级联下拉框键盘导航状态
  const [focusedCat1Index, setFocusedCat1Index] = useState<number>(-1);
  const [focusedCat2Index, setFocusedCat2Index] = useState<number>(-1);
  const [focusedModelIndex, setFocusedModelIndex] = useState<number>(-1);
  const [focusedCascadeProcessIndex, setFocusedCascadeProcessIndex] = useState<number>(-1);
  const cat1DropdownRef = useRef<HTMLDivElement>(null);
  const cat2DropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const cascadeProcessDropdownRef = useRef<HTMLDivElement>(null);

  // 根据级联选择过滤的选项（前端内存中过滤）
  const filteredCat2Options = useMemo(() => {
    if (!quotaOptionsData || !selectedCascadeCat1) return [];
    return quotaOptionsData.cat2_options[selectedCascadeCat1] || [];
  }, [quotaOptionsData, selectedCascadeCat1]);

  const filteredModelOptions = useMemo(() => {
    if (!quotaOptionsData || !selectedCascadeCat1 || !selectedCascadeCat2) return [];
    return quotaOptionsData.model_options.filter((model: CascadeOption) => {
      const modelInfo = model; // Each model already has its own cat1_cat2_pairs
      if (modelInfo && (modelInfo as any).cat1_cat2_pairs) {
        // 检查是否存在至少一个(cat1, cat2)组合与当前选择完全匹配
        const pairs = (modelInfo as any).cat1_cat2_pairs;
        return pairs.some((pair: { cat1: string; cat2: string }) => 
          pair.cat1 === selectedCascadeCat1 && pair.cat2 === selectedCascadeCat2
        );
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
    // 如果有Way 0选择的定额，返回这些定额
    if (way0SelectedQuotaItems.length > 0) {
      return way0SelectedQuotaItems.map(q => ({
        quota_id: q.quota_id,
        process_code: q.process_code,
        process_name: q.process_name,
        unit_price: q.unit_price
      }));
    }
    
    // 否则使用级联下拉框的选项
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
  }, [way0SelectedQuotaItems, selectedCascadeProcesses, filteredProcessOptions]);

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

  // ========== Way 0 矩阵数据结构 ==========
  interface MatrixRow {
    model_code: string;
    model_name: string;
    prices: Record<string, { quota_id: number; unit_price: number }>;
  }
  
  interface MatrixColumn {
    process_code: string;
    process_name: string;
  }
  
  interface MatrixSection {
    cat2_code: string;
    cat2_name: string;
    rows: MatrixRow[];
    columns: MatrixColumn[];
  }
  
  // 构建矩阵行数据
  const buildMatrixRows = (quotas: QuotaOptionItem[]): MatrixRow[] => {
    const modelMap = new Map<string, Record<string, { quota_id: number; unit_price: number }>>();
    const modelNames: Record<string, string> = {};
    
    quotas.forEach(q => {
      if (!modelMap.has(q.model_code)) {
        modelMap.set(q.model_code, {});
      }
      modelMap.get(q.model_code)![q.process_code] = {
        quota_id: q.quota_id,
        unit_price: q.unit_price
      };
      modelNames[q.model_code] = q.model_name;
    });
    
    // 排序型号（按数字前缀排序）
    const sortedModels = Array.from(modelMap.keys()).sort((a, b) => {
      try {
        const partA = a.split('-')[0];
        const partB = b.split('-')[0];
        return parseInt(partA) - parseInt(partB);
      } catch {
        return a.localeCompare(b);
      }
    });
    
    return sortedModels.map(model_code => ({
      model_code,
      model_name: modelNames[model_code] || model_code,
      prices: modelMap.get(model_code) || {}
    }));
  };
  
  // 构建矩阵列数据
  const buildMatrixColumns = (quotas: QuotaOptionItem[]): MatrixColumn[] => {
    const processSet = new Set<string>();
    quotas.forEach(q => processSet.add(q.process_code));
    
    // 排序工序
    const sortedProcesses = Array.from(processSet).sort((a, b) => a.localeCompare(b));
    
    return sortedProcesses.map(process_code => ({
      process_code,
      process_name: quotas.find(q => q.process_code === process_code)?.process_name || process_code
    }));
  };
  
  // Way 0 矩阵数据转换
  const way0MatrixData = useMemo((): MatrixSection[] => {
    if (!quotaOptionsData || !way0SelectedCat1) return [];
    
    const currentDate = dayjs(`${selectedMonth.slice(0, 4)}-${selectedMonth.slice(4, 6)}-01`);
    
    // 过滤：工段类别匹配 + 当前月份在有效期内
    const filteredQuotas = quotaOptionsData.quota_options.filter(q => {
      const effective = dayjs(q.effective_date);
      const obsolete = dayjs(q.obsolete_date);
      return (
        q.cat1_code === way0SelectedCat1 &&
        (currentDate.isAfter(effective) || currentDate.isSame(effective, 'day')) &&
        (currentDate.isBefore(obsolete) || currentDate.isSame(obsolete, 'day'))
      );
    });
    
    // 按工序类别分组
    const groups: Record<string, QuotaOptionItem[]> = {};
    filteredQuotas.forEach(q => {
      if (!groups[q.cat2_code]) {
        groups[q.cat2_code] = [];
      }
      groups[q.cat2_code].push(q);
    });
    
    // 构建矩阵结构
    return Object.entries(groups).map(([cat2_code, quotas]) => ({
      cat2_code,
      cat2_name: quotas[0]?.cat2_name || cat2_code,
      rows: buildMatrixRows(quotas),
      columns: buildMatrixColumns(quotas)
    }));
  }, [quotaOptionsData, way0SelectedCat1, selectedMonth]);
  // =====================================

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
      console.log('[QuotaOptions] Fetching quota options for date:', recordDate);
      const data = await salaryAPI.getQuotaOptions({ record_date: recordDate });
      console.log('[QuotaOptions] Received data:', data);
      console.log('[QuotaOptions] cat1_options:', data?.cat1_options?.length || 0, 'options');
      setQuotaOptionsData(data);
    } catch (error) {
      console.error('[QuotaOptions] Error fetching quota options:', error);
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

  // 级联下拉框键盘导航处理函数
  const handleCat1KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!quotaOptionsData) return;
    
    const options = quotaOptionsData.cat1_options;
    if (options.length === 0) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      setShowCat1Dropdown(true);
      setFocusedCat1Index(0);
      setTimeout(() => {
        const firstOption = cat1DropdownRef.current?.querySelector('[data-cat1-index="0"]') as HTMLElement;
        firstOption?.focus();
      }, 0);
    }
  };

  const handleCat1DropdownKeyDown = (e: React.KeyboardEvent) => {
    const options = quotaOptionsData?.cat1_options || [];
    if (options.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedCat1Index(prev => {
        const newIndex = prev >= options.length - 1 ? 0 : prev + 1;
        setTimeout(() => {
          const element = cat1DropdownRef.current?.querySelector(`[data-cat1-index="${newIndex}"]`) as HTMLElement;
          element?.focus();
        }, 0);
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedCat1Index(prev => {
        const newIndex = prev <= 0 ? options.length - 1 : prev - 1;
        setTimeout(() => {
          const element = cat1DropdownRef.current?.querySelector(`[data-cat1-index="${newIndex}"]`) as HTMLElement;
          element?.focus();
        }, 0);
        return newIndex;
      });
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      if (focusedCat1Index >= 0 && focusedCat1Index < options.length) {
        const option = options[focusedCat1Index];
        handleCascadeCat1Change(option.value);
        setFocusedCat2Index(0);
        setTimeout(() => {
          const firstOption = cat2DropdownRef.current?.querySelector('[data-cat2-index="0"]') as HTMLElement;
          firstOption?.focus();
        }, 0);
      }
    } else if (e.key === 'ArrowLeft') {
      // In 工段类别 (first level), do nothing - no previous level to go back to
      e.preventDefault();
      // No action needed - already at the first level
    } else if (e.key === 'Escape') {
      setShowCat1Dropdown(false);
    }
  };

  const handleCat2KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!selectedCascadeCat1 || filteredCat2Options.length === 0) return;
    
    if (e.key === 'Tab') {
      e.preventDefault();
      setShowCat2Dropdown(true);
      setFocusedCat2Index(0);
      setTimeout(() => {
        const firstOption = cat2DropdownRef.current?.querySelector('[data-cat2-index="0"]') as HTMLElement;
        firstOption?.focus();
      }, 0);
    }
  };

  const handleCat2DropdownKeyDown = (e: React.KeyboardEvent) => {
    const options = filteredCat2Options;
    if (options.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedCat2Index(prev => {
        const newIndex = prev >= options.length - 1 ? 0 : prev + 1;
        setTimeout(() => {
          const element = cat2DropdownRef.current?.querySelector(`[data-cat2-index="${newIndex}"]`) as HTMLElement;
          element?.focus();
        }, 0);
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedCat2Index(prev => {
        const newIndex = prev <= 0 ? options.length - 1 : prev - 1;
        setTimeout(() => {
          const element = cat2DropdownRef.current?.querySelector(`[data-cat2-index="${newIndex}"]`) as HTMLElement;
          element?.focus();
        }, 0);
        return newIndex;
      });
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      if (focusedCat2Index >= 0 && focusedCat2Index < options.length) {
        const option = options[focusedCat2Index];
        handleCascadeCat2Change(option.value);
        setFocusedModelIndex(0);
        setTimeout(() => {
          const firstOption = modelDropdownRef.current?.querySelector('[data-model-index="0"]') as HTMLElement;
          firstOption?.focus();
        }, 0);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setShowCat2Dropdown(false);
      setFocusedCat1Index(0);
      setTimeout(() => {
        const firstOption = cat1DropdownRef.current?.querySelector('[data-cat1-index="0"]') as HTMLElement;
        firstOption?.focus();
      }, 0);
    } else if (e.key === 'Escape') {
      setShowCat2Dropdown(false);
    }
  };

  const handleModelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!selectedCascadeCat2 || filteredModelOptions.length === 0) return;
    
    if (e.key === 'Tab') {
      e.preventDefault();
      setShowModelDropdown(true);
      setFocusedModelIndex(0);
      setTimeout(() => {
        const firstOption = modelDropdownRef.current?.querySelector('[data-model-index="0"]') as HTMLElement;
        firstOption?.focus();
      }, 0);
    }
  };

  const handleModelDropdownKeyDown = (e: React.KeyboardEvent) => {
    const options = filteredModelOptions;
    if (options.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedModelIndex(prev => {
        const newIndex = prev >= options.length - 1 ? 0 : prev + 1;
        setTimeout(() => {
          const element = modelDropdownRef.current?.querySelector(`[data-model-index="${newIndex}"]`) as HTMLElement;
          element?.focus();
        }, 0);
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedModelIndex(prev => {
        const newIndex = prev <= 0 ? options.length - 1 : prev - 1;
        setTimeout(() => {
          const element = modelDropdownRef.current?.querySelector(`[data-model-index="${newIndex}"]`) as HTMLElement;
          element?.focus();
        }, 0);
        return newIndex;
      });
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      if (focusedModelIndex >= 0 && focusedModelIndex < options.length) {
        const option = options[focusedModelIndex];
        handleCascadeModelChange(option.value);
        setFocusedCascadeProcessIndex(0);
        setTimeout(() => {
          const firstOption = cascadeProcessDropdownRef.current?.querySelector('[data-cascade-process-index="0"]') as HTMLElement;
          firstOption?.focus();
        }, 0);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setShowModelDropdown(false);
      setFocusedCat2Index(0);
      setTimeout(() => {
        const firstOption = cat2DropdownRef.current?.querySelector('[data-cat2-index="0"]') as HTMLElement;
        firstOption?.focus();
      }, 0);
    } else if (e.key === 'Escape') {
      setShowModelDropdown(false);
    }
  };

  const handleCascadeProcessKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!selectedCascadeModel || filteredProcessOptions.length === 0) return;
    
    if (e.key === 'Tab') {
      e.preventDefault();
      setShowProcessDropdown(true);
      setFocusedCascadeProcessIndex(0);
      setTimeout(() => {
        const firstOption = cascadeProcessDropdownRef.current?.querySelector('[data-cascade-process-index="0"]') as HTMLElement;
        firstOption?.focus();
      }, 0);
    }
  };

  const handleCascadeProcessDropdownKeyDown = (e: React.KeyboardEvent) => {
    const options = filteredProcessOptions;
    if (options.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedCascadeProcessIndex(prev => {
        const newIndex = prev >= options.length - 1 ? 0 : prev + 1;
        setTimeout(() => {
          const element = cascadeProcessDropdownRef.current?.querySelector(`[data-cascade-process-index="${newIndex}"]`) as HTMLElement;
          element?.focus();
        }, 0);
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedCascadeProcessIndex(prev => {
        const newIndex = prev <= 0 ? options.length - 1 : prev - 1;
        setTimeout(() => {
          const element = cascadeProcessDropdownRef.current?.querySelector(`[data-cascade-process-index="${newIndex}"]`) as HTMLElement;
          element?.focus();
        }, 0);
        return newIndex;
      });
    } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
      // Right arrow or Tab completes selection - same as clicking "工序选择完成" button
      e.preventDefault();
      completeProcessSelection();
    } else if (e.key === ' ') {
      // Space: Toggle selection but keep dropdown open (multi-selection mode)
      e.preventDefault();
      if (focusedCascadeProcessIndex >= 0 && focusedCascadeProcessIndex < options.length) {
        const option = options[focusedCascadeProcessIndex];
        setSelectedCascadeProcesses(prev => {
          if (prev.includes(option.process_code)) {
            return prev.filter(v => v !== option.process_code);
          } else {
            return [...prev, option.process_code];
          }
        });
        // Keep dropdown open and move focus to next option
        setFocusedCascadeProcessIndex(prev => {
          const newIndex = prev >= options.length - 1 ? 0 : prev + 1;
          setTimeout(() => {
            const element = cascadeProcessDropdownRef.current?.querySelector(`[data-cascade-process-index="${newIndex}"]`) as HTMLElement;
            element?.focus();
          }, 0);
          return newIndex;
        });
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setShowProcessDropdown(false);
      setFocusedModelIndex(0);
      setTimeout(() => {
        const firstOption = modelDropdownRef.current?.querySelector('[data-model-index="0"]') as HTMLElement;
        firstOption?.focus();
      }, 0);
    } else if (e.key === 'Escape') {
      setShowProcessDropdown(false);
    }
  };

  // Complete the process selection (used by button and keyboard)
  const completeProcessSelection = () => {
    // Close all dropdowns
    setShowCat1Dropdown(false);
    setShowCat2Dropdown(false);
    setShowModelDropdown(false);
    setShowProcessDropdown(false);
    setMultiSelectionConfirmed(true);
    
    // If only one selection, set the quota result
    if (selectedCascadeProcesses.length === 1 && selectedCascadeCat1 && selectedCascadeCat2 && selectedCascadeModel) {
      const selectedCode = selectedCascadeProcesses[0];
      const processInfo = filteredProcessOptions.find((p: QuotaOptionItem) => p.process_code === selectedCode);
      if (processInfo) {
        setQuotaResult({
          quota_id: processInfo.quota_id,
          model_code: selectedCascadeModel,
          cat1_code: selectedCascadeCat1,
          cat1_name: processInfo.cat1_name,
          cat2_code: selectedCascadeCat2,
          cat2_name: processInfo.cat2_name,
          process_code: selectedCode,
          process_name: processInfo.process_name,
          unit_price: processInfo.unit_price,
          effective_date: processInfo.effective_date,
          obsolete_date: processInfo.obsolete_date
        });
        setQuotaIdInput(String(processInfo.quota_id));
      }
    }
    
    // Focus on 数量 input after completing selection
    setTimeout(() => {
      const quantityInput = document.querySelector('#quantity') as HTMLInputElement;
      quantityInput?.focus();
    }, 100);
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

  // ==============================

  // 切换定额单元格选择
  const handleQuotaCellToggle = (quotaId: number) => {
    setWay0SelectedQuotas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quotaId)) {
        newSet.delete(quotaId);
      } else {
        newSet.add(quotaId);
      }
      return newSet;
    });
  };
  
  // 确认选择
  const handleWay0Confirm = () => {
    // 将选中的定额ID转换为定额对象
    const selectedQuotaObjects = Array.from(way0SelectedQuotas).map(id => {
      const quota = quotaOptionsData?.quota_options.find(q => q.quota_id === id);
      return quota;
    }).filter(Boolean) as QuotaOptionItem[];
    
    // 保存选中的定额项（用于批量创建）
    setWay0SelectedQuotaItems(selectedQuotaObjects);
    
    // 设置级联下拉框状态
    if (selectedQuotaObjects.length > 0) {
      // 使用第一个选中项设置级联下拉框
      const firstQuota = selectedQuotaObjects[0];
      setSelectedCascadeCat1(firstQuota.cat1_code);
      setSelectedCascadeCat2(firstQuota.cat2_code);
      setSelectedCascadeModel(firstQuota.model_code);
      setSelectedCascadeProcesses(selectedQuotaObjects.map(q => q.process_code));
      
      // 如果只有一个选择，设置详细的定额结果
      if (selectedQuotaObjects.length === 1) {
        setQuotaResult({
          quota_id: firstQuota.quota_id,
          model_code: firstQuota.model_code,
          cat1_code: firstQuota.cat1_code,
          cat1_name: firstQuota.cat1_name,
          cat2_code: firstQuota.cat2_code,
          cat2_name: firstQuota.cat2_name,
          process_code: firstQuota.process_code,
          process_name: firstQuota.process_name,
          unit_price: firstQuota.unit_price,
          effective_date: firstQuota.effective_date,
          obsolete_date: firstQuota.obsolete_date
        });
        setQuotaIdInput(String(firstQuota.quota_id));
      } else {
        // 多选时清空详细结果显示，使用多选显示
        setQuotaResult(null);
        setQuotaIdInput('');
      }
    }
    
    setMultiSelectionConfirmed(true);
    
    // 关闭对话框，折叠所有下拉菜单
    setWay0QuotaDialogVisible(false);
    setWay0Cat1SearchValue('');
    setWay0SelectedCat1(null);
    setWay0SelectedQuotas(new Set());
    setShowWay0Cat1Dropdown(false);
    setShowCat1Dropdown(false);
    
    // 聚焦到数量输入框
    setTimeout(() => {
      const quantityInput = document.querySelector('#quantity') as HTMLInputElement;
      quantityInput?.focus();
    }, 100);
  };
  // ==============================

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
    // Reset Way 0 states
    setWay0Cat1SearchValue('');
    setWay0SelectedCat1(null);
    setWay0SelectedQuotas(new Set());
    setWay0SelectedQuotaItems([]);
    setWay0QuotaDialogVisible(false);
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
      // Way 0 multi-selection mode
      if (way0SelectedQuotaItems.length > 1) {
        setQuotaLoading(true);
        const quotaIds = way0SelectedQuotaItems.map(q => q.quota_id);
        
        const result = await salaryAPI.createBatchSalaryRecords({
          worker_code: selectedWorker || '',
          quota_ids: quotaIds,
          quantity: parseFloat(values.quantity),
          record_date: recordDate
        });
        
        message.success(result.message);
        setIsModalVisible(false);
        fetchWorkerMonthRecords();
      } else if (selectedCascadeProcesses.length > 1) {
        // Cascade dropdown multi-selection mode: create batch records
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
      } else if (quotaResult || way0SelectedQuotaItems.length === 1) {
        // Single selection mode: create single record
        let quotaId: number;
        let unitPrice: number;
        
        if (way0SelectedQuotaItems.length === 1) {
          quotaId = way0SelectedQuotaItems[0].quota_id;
          unitPrice = way0SelectedQuotaItems[0].unit_price;
        } else {
          quotaId = (quotaResult as QuotaSearchResult).quota_id;
          unitPrice = (quotaResult as QuotaSearchResult).unit_price;
        }
        
        const formattedValues = {
          worker_code: selectedWorker || '',
          quota_id: quotaId,
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
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          size="small"
          onClick={toggleSortOrder}
          id="sort-toggle-button"
        >
          排序: {sortOrder === 'asc' ? '升序' : '降序'}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={sortedRecords}
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
            
            {/* ========== Way 0: 工段类别快速选择 ========== */}
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16, 
                backgroundColor: '#f0f5ff',
                border: '1px solid #91d5ff'
              }}
            >
              <Row gutter={8} align="middle">
                <Col flex="auto">
                  <div style={{ position: 'relative' }}>
                    <Input
                      placeholder="请输入工段类别代码（如A、B、C）"
                      value={way0Cat1SearchValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        setWay0Cat1SearchValue(value);
                        // 立即触发：如果输入匹配工段类别代码
                        if (value && quotaOptionsData) {
                          const matchedOption = quotaOptionsData.cat1_options.find(
                            o => o.value.toLowerCase() === value.toLowerCase()
                          );
                          if (matchedOption) {
                            setWay0SelectedCat1(matchedOption.value);
                            setWay0Cat1SearchValue(matchedOption.label);
                            setWay0QuotaDialogVisible(true);
                            setWay0SelectedQuotas(new Set());
                          }
                        }
                      }}
                      onFocus={() => {
                        // 折叠方式1的下拉菜单
                        setShowCat1Dropdown(false);
                        // 显示Way 0下拉菜单
                        if (quotaOptionsData && quotaOptionsData.cat1_options.length > 0) {
                          setShowWay0Cat1Dropdown(true);
                        }
                      }}
                      onBlur={() => {
                        // 延迟隐藏下拉菜单，以便点击可以触发
                        setTimeout(() => setShowWay0Cat1Dropdown(false), 200);
                      }}
                      size="small"
                      allowClear
                    />
                    {/* 下拉面板 - 显示所有工段类别选项 */}
                    {showWay0Cat1Dropdown && quotaOptionsData && quotaOptionsData.cat1_options.length > 0 && (
                      <div
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
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          marginTop: 2
                        }}
                      >
                        {quotaOptionsData.cat1_options.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => {
                              setWay0SelectedCat1(option.value);
                              setWay0Cat1SearchValue(option.label);
                              setWay0QuotaDialogVisible(true);
                              setWay0SelectedQuotas(new Set());
                              setShowWay0Cat1Dropdown(false);
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e6f7ff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                            }}
                          >
                            <Text strong style={{ color: '#1890ff', marginRight: 8 }}>{option.value}</Text>
                            <Text>{option.label.replace(/\s*\(.*\)$/, '')}</Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Col>
                <Col>
                  {way0SelectedQuotas.size > 0 && (
                    <Tag color="blue">已选择 {way0SelectedQuotas.size} 项</Tag>
                  )}
                </Col>
              </Row>
            </Card>
            {/* ========================================= */}
            
            {/* 级联下拉框选择 - 带悬停自动展开下一级 */}
            <Row gutter={8} style={{ marginBottom: 16 }}>
              {/* 工段类别 */}
              <Col span={5}>
                <div style={{ position: 'relative' }}>
              <Input
                placeholder="工段类别"
                value={selectedCascadeCat1 ? (quotaOptionsData?.cat1_options.find(o => o.value === selectedCascadeCat1)?.label || selectedCascadeCat1) : ''}
                readOnly
                onFocus={() => {
                  setShowCat1Dropdown(true);
                  setFocusedCat1Index(0);
                  setTimeout(() => {
                    const firstOption = cat1DropdownRef.current?.querySelector('[data-cat1-index="0"]') as HTMLElement;
                    firstOption?.focus();
                  }, 0);
                }}
                onMouseEnter={() => setShowCat1Dropdown(true)}
                onKeyDown={handleCat1KeyDown}
                suffix={<span style={{ color: '#999' }}>▼</span>}
                style={{ cursor: 'pointer' }}
              />
                  {/* 下拉面板 - 工段类别 */}
                  {showCat1Dropdown && quotaOptionsData && quotaOptionsData.cat1_options.length > 0 && (
                    <div
                      ref={cat1DropdownRef}
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
                      onKeyDown={handleCat1DropdownKeyDown}
                    >
                      {quotaOptionsData.cat1_options.map((option, index) => (
                        <div
                          key={option.value}
                          data-cat1-index={index}
                          tabIndex={0}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: selectedCascadeCat1 === option.value ? '#e6f7ff' : (focusedCat1Index === index ? '#f5f5f5' : 'white'),
                            borderBottom: '1px solid #f0f0f0',
                            outline: 'none'
                          }}
                          onClick={() => handleCascadeCat1Change(option.value)}
                          onFocus={() => {
                            setFocusedCat1Index(index);
                            setShowCat1Dropdown(true);
                          }}
                          onMouseEnter={() => {
                            setFocusedCat1Index(index);
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            handleCat1DropdownKeyDown(e);
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
                    onFocus={() => {
                      if (selectedCascadeCat1) {
                        setShowCat2Dropdown(true);
                        setFocusedCat2Index(0);
                      }
                    }}
                    onMouseEnter={() => selectedCascadeCat1 && setShowCat2Dropdown(true)}
                    suffix={<span style={{ color: '#999' }}>▼</span>}
                    style={{ cursor: !selectedCascadeCat1 ? 'not-allowed' : 'pointer' }}
                  />
                  {/* 下拉面板 - 工序类别 */}
                  {showCat2Dropdown && selectedCascadeCat1 && filteredCat2Options.length > 0 && (
                    <div
                      ref={cat2DropdownRef}
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
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        handleCat2DropdownKeyDown(e);
                      }}
                    >
                      {filteredCat2Options.map((option: CascadeOption, index: number) => (
                        <div
                          key={option.value}
                          data-cat2-index={index}
                          tabIndex={0}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: selectedCascadeCat2 === option.value ? '#e6f7ff' : (focusedCat2Index === index ? '#f5f5f5' : 'white'),
                            borderBottom: '1px solid #f0f0f0',
                            outline: 'none'
                          }}
                          onClick={() => handleCascadeCat2Change(option.value)}
                          onFocus={() => {
                            setFocusedCat2Index(index);
                            setShowCat2Dropdown(true);
                          }}
                          onMouseEnter={() => {
                            setFocusedCat2Index(index);
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            handleCat2DropdownKeyDown(e);
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
                    onFocus={() => {
                      if (selectedCascadeCat1 && selectedCascadeCat2) {
                        setShowModelDropdown(true);
                        setFocusedModelIndex(0);
                      }
                    }}
                    onMouseEnter={() => selectedCascadeCat1 && selectedCascadeCat2 && setShowModelDropdown(true)}
                    suffix={<span style={{ color: '#999' }}>▼</span>}
                    style={{ cursor: !selectedCascadeCat2 ? 'not-allowed' : 'pointer' }}
                  />
                  {/* 下拉面板 - 电机型号 */}
                  {showModelDropdown && selectedCascadeCat1 && selectedCascadeCat2 && filteredModelOptions.length > 0 && (
                    <div
                      ref={modelDropdownRef}
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
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        handleModelDropdownKeyDown(e);
                      }}
                    >
                      {filteredModelOptions.map((option: CascadeOption, index: number) => (
                        <div
                          key={option.value}
                          data-model-index={index}
                          tabIndex={0}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: selectedCascadeModel === option.value ? '#e6f7ff' : (focusedModelIndex === index ? '#f5f5f5' : 'white'),
                            borderBottom: '1px solid #f0f0f0',
                            outline: 'none'
                          }}
                          onClick={() => handleCascadeModelChange(option.value)}
                          onFocus={() => {
                            setFocusedModelIndex(index);
                            setShowModelDropdown(true);
                          }}
                          onMouseEnter={() => {
                            setFocusedModelIndex(index);
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            handleModelDropdownKeyDown(e);
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
                    onFocus={() => {
                      if (selectedCascadeModel) {
                        setShowProcessDropdown(true);
                        setFocusedCascadeProcessIndex(0);
                      }
                    }}
                    onMouseEnter={() => selectedCascadeModel && setShowProcessDropdown(true)}
                    suffix={<span style={{ color: '#999' }}>▼</span>}
                    style={{ cursor: !selectedCascadeModel ? 'not-allowed' : 'pointer' }}
                  />
                  {/* 多选完成按钮 */}
                  {selectedCascadeProcesses.length > 0 && !multiSelectionConfirmed && (
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
                        completeProcessSelection();
                      }}
                    >
                      工序选择完成
                    </Button>
                  )}
                  {/* 下拉面板 - 工序 */}
                  {showProcessDropdown && selectedCascadeModel && filteredProcessOptions.length > 0 && (
                    <div
                      ref={cascadeProcessDropdownRef}
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
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        handleCascadeProcessDropdownKeyDown(e);
                      }}
                    >
                      {filteredProcessOptions.map((option: QuotaOptionItem, index: number) => (
                        <div
                          key={option.process_code}
                          data-cascade-process-index={index}
                          tabIndex={0}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: selectedCascadeProcesses.includes(option.process_code) ? '#e6f7ff' : (focusedCascadeProcessIndex === index ? '#f5f5f5' : 'white'),
                            borderBottom: '1px solid #f0f0f0',
                            outline: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}
                          onClick={(e) => handleCascadeProcessChange(option.process_code, e)}
                          onFocus={() => {
                            setFocusedCascadeProcessIndex(index);
                            setShowProcessDropdown(true);
                          }}
                          onMouseEnter={() => {
                            setFocusedCascadeProcessIndex(index);
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            handleCascadeProcessDropdownKeyDown(e);
                          }}
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

      {/* ========== Way 0 定额矩阵选择对话框 ========== */}
      <Modal
        title={`定额选择 - ${way0SelectedCat1 ? 
          (quotaOptionsData?.cat1_options.find(o => o.value === way0SelectedCat1)?.label || way0SelectedCat1) 
          : ''}`}
        open={way0QuotaDialogVisible}
        onCancel={() => setWay0QuotaDialogVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setWay0QuotaDialogVisible(false)}>
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={handleWay0Confirm}
            disabled={way0SelectedQuotas.size === 0}
          >
            确认选择 ({way0SelectedQuotas.size})
          </Button>
        ]}
        width={1000}
        style={{ top: 20 }}
      >
        <div 
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && way0SelectedQuotas.size > 0) {
              e.preventDefault();
              handleWay0Confirm();
            }
            if (e.key === 'Escape') {
              setWay0QuotaDialogVisible(false);
            }
          }}
          tabIndex={0}
        >
          {way0MatrixData.map((cat2Section) => (
            <div key={cat2Section.cat2_code} style={{ marginBottom: 24 }}>
              <Divider>
                <Text strong style={{ fontSize: 13 }}>
                  {cat2Section.cat2_name}
                </Text>
              </Divider>
              
              {/* 矩阵表格 */}
              <Table
                size="small"
                pagination={false}
                bordered
                columns={[
                  {
                    title: '型号',
                    dataIndex: 'model_name',
                    key: 'model_name',
                    width: 100,
                    fixed: 'left',
                    render: (text: string) => (
                      <Text style={{ fontSize: 11, fontWeight: 500 }}>{text}</Text>
                    )
                  },
                  ...cat2Section.columns.map(col => ({
                    title: (
                      <Text style={{ fontSize: 11 }}>{col.process_name}</Text>
                    ),
                    dataIndex: ['prices', col.process_code],
                    key: col.process_code,
                    width: 65,
                    align: 'center' as const,
                    render: (priceInfo: { quota_id: number; unit_price: number } | undefined) => {
                      if (!priceInfo) {
                        return <Text style={{ color: '#f5f5f5', fontSize: 12 }}>-</Text>;
                      }
                      const isSelected = way0SelectedQuotas.has(priceInfo.quota_id);
                      return (
                        <div
                          onClick={() => handleQuotaCellToggle(priceInfo.quota_id)}
                          style={{
                            padding: '2px 4px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#1890ff' : 'transparent',
                            color: isSelected ? 'white' : '#1890ff',
                            borderRadius: 2,
                            fontSize: 12,
                            fontWeight: 'bold',
                            border: isSelected ? 'none' : '1px solid #f0f0f0',
                            transition: 'all 0.15s',
                            minWidth: 45
                          }}
                        >
                          {priceInfo.unit_price.toFixed(2)}
                        </div>
                      );
                    }
                  }))
                ]}
                dataSource={cat2Section.rows}
                rowKey="model_name"
                scroll={{ x: cat2Section.columns.length * 65 + 100 }}
              />
            </div>
          ))}
          
          {way0MatrixData.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <Text type="secondary">没有找到有效的定额数据</Text>
            </div>
          )}
        </div>
      </Modal>
      {/* ========================================== */}
    </div>
  );
};

export default SalaryRecord;
