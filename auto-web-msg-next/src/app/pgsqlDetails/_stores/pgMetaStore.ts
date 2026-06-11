/**
 * PG Meta Zustand Store
 *
 * 管理 PostgreSQL 元数据查询页面的状态，
 * 替代原有的 Props Drilling 模式，提供统一的状态管理。
 */

import { create } from "zustand";
import type {
  PgMetaState,
  PgMetaActions,
} from "../types";
import { calculateColumnWidths } from "../_utils/format";
import { createPgFilterForm } from "../_utils/filter";

/**
 * 默认状态
 *
 * 定义 PG Meta Store 的初始状态值，
 * 包含数据库连接、表格数据、分页、筛选和导出等核心状态。
 */
const defaultState: Omit<PgMetaState, keyof PgMetaActions> = {
  /** 数据库连接状态信息，包含版本、连接数等元数据 */
  status: null,
  /** 数据库中可用的表名列表 */
  tables: [],
  /** 当前选中的表名 */
  selectedTable: "",
  /** 当前选中表的数据内容，包含行数据和列信息 */
  tableData: null,
  /** 当前表的列定义信息 */
  columns: [],
  /** 数据加载状态标识 */
  loading: false,
  /** 错误信息，操作失败时存储错误描述 */
  error: null,

  /** 当前页码，从 1 开始 */
  page: 1,
  /** 每页显示的数据条数 */
  pageSize: 20,
  /** 总页数，根据总数据量和每页条数计算 */
  totalPages: 0,
  /** 数据总条数 */
  totalCount: 0,

  /** 当前应用的筛选条件列表 */
  filters: [],
  /** 筛选表单的临时状态，用于构建新的筛选条件 */
  filterForm: createPgFilterForm(),

  /** 各列的显示宽度映射，key 为列名，value 为像素宽度 */
  columnWidths: {},

  /** 数据导出进行中标识 */
  exporting: false,
  /** 导出数据的最大条数限制 */
  exportLimit: 10000,

  /** 页码跳转输入框的临时值 */
  jumpPageInput: "",
  /** 每页条数输入框的临时值 */
  pageSizeInput: "",
};

/**
 * PG Meta Store
 *
 * 使用 Zustand 创建的状态管理 Store，
 * 包含所有 PG Meta 相关的状态和操作方法。
 * 提供数据库元数据查询、表格数据展示、分页、筛选和导出等功能的状态管理。
 */
export const usePgMetaStore = create<PgMetaState & PgMetaActions>((set, get) => ({
  ...defaultState,

  /**
   * 设置数据库连接状态
   * @param status - 数据库状态信息对象
   */
  setStatus: (status) => set({ status }),

  /**
   * 设置可用表名列表
   * @param tables - 表名字符串数组
   */
  setTables: (tables) => set({ tables }),

  /**
   * 设置当前选中的表名
   * 同时重置页码、筛选条件和筛选表单为初始状态
   * @param selectedTable - 选中的表名
   */
  setSelectedTable: (selectedTable) => set({ selectedTable, page: 1, filters: [], filterForm: createPgFilterForm() }),

  /**
   * 设置表格数据
   * 当数据存在时，自动计算各列的显示宽度
   * 当数据为 null 时，清空列信息和列宽映射
   * @param tableData - 表格数据对象或 null
   */
  setTableData: (tableData) => {
    if (tableData) {
      const columnWidths = calculateColumnWidths(tableData.columns, tableData.rows);
      set({ tableData, columns: tableData.columns, columnWidths });
    } else {
      set({ tableData, columns: [], columnWidths: {} });
    }
  },

  /**
   * 设置列定义信息
   * @param columns - 列定义数组
   */
  setColumns: (columns) => set({ columns }),

  /**
   * 设置加载状态
   * @param loading - 是否正在加载
   */
  setLoading: (loading) => set({ loading }),

  /**
   * 设置错误信息
   * @param error - 错误信息字符串或 null
   */
  setError: (error) => set({ error }),

  /**
   * 设置当前页码
   * @param page - 页码数值
   */
  setPage: (page) => set({ page }),

  /**
   * 设置每页显示条数
   * 同时将页码重置为第一页
   * @param pageSize - 每页条数
   */
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),

  /**
   * 设置总页数
   * @param totalPages - 总页数
   */
  setTotalPages: (totalPages) => set({ totalPages }),

  /**
   * 设置数据总条数
   * @param totalCount - 总数据条数
   */
  setTotalCount: (totalCount) => set({ totalCount }),

  /**
   * 设置筛选条件列表
   * @param filters - 筛选条件数组
   */
  setFilters: (filters) => set({ filters }),

  /**
   * 添加或更新筛选条件
   * 如果同名列的筛选条件已存在，则更新；否则添加新条件
   * @param filter - 筛选条件对象
   */
  addFilter: (filter) => {
    const { filters } = get();
    const existingIndex = filters.findIndex((f) => f.column === filter.column);
    if (existingIndex >= 0) {
      const newFilters = [...filters];
      newFilters[existingIndex] = filter;
      set({ filters: newFilters });
    } else {
      set({ filters: [...filters, filter] });
    }
  },

  /**
   * 移除指定列的筛选条件
   * @param column - 要移除筛选条件的列名
   */
  removeFilter: (column) => {
    const { filters } = get();
    set({ filters: filters.filter((f) => f.column !== column) });
  },

  /**
   * 清空所有筛选条件
   * 同时重置筛选表单为初始状态
   */
  clearFilters: () => set({ filters: [], filterForm: createPgFilterForm() }),

  /**
   * 更新筛选表单状态
   * 使用浅合并方式更新表单字段
   * @param form - 要更新的表单字段对象
   */
  updateFilterForm: (form) => {
    const { filterForm } = get();
    set({ filterForm: { ...filterForm, ...form } });
  },

  /**
   * 设置列宽映射
   * @param columnWidths - 列名到宽度的映射对象
   */
  setColumnWidths: (columnWidths) => set({ columnWidths }),

  /**
   * 设置导出进行中状态
   * @param exporting - 是否正在导出
   */
  setExporting: (exporting) => set({ exporting }),

  /**
   * 设置导出数据条数限制
   * @param exportLimit - 最大导出条数
   */
  setExportLimit: (exportLimit) => set({ exportLimit }),

  /**
   * 设置页码跳转输入框的值
   * @param jumpPageInput - 输入的页码字符串
   */
  setJumpPageInput: (jumpPageInput) => set({ jumpPageInput }),

  /**
   * 设置每页条数输入框的值
   * @param pageSizeInput - 输入的每页条数字符串
   */
  setPageSizeInput: (pageSizeInput) => set({ pageSizeInput }),

  /**
   * 重置 Store 为初始状态
   * 将所有状态恢复为默认值
   */
  reset: () => set(defaultState),
}));

/**
 * 选择器 Hook：获取当前选中列的数据类型
 *
 * 用于筛选表单中根据选中的列名获取其数据类型，
 * 以便动态显示合适的筛选操作符选项。
 *
 * @returns 返回选中列的数据类型字符串，如 'text'、'integer' 等；未选中时返回 undefined
 *
 * @example
 * const dataType = useSelectedColumnType();
 * // 根据 dataType 显示不同的筛选操作符
 */
export const useSelectedColumnType = () => {
  const filterColumn = usePgMetaStore((s) => s.filterForm.filterColumn);
  const columns = usePgMetaStore((s) => s.columns);
  const col = columns.find((c) => c.column_name === filterColumn);
  return col?.data_type;
};

/**
 * 选择器 Hook：获取分页状态
 *
 * 聚合获取分页相关的所有状态值，用于分页组件的渲染和控制。
 * 使用选择器模式避免不必要的组件重渲染。
 *
 * @returns 包含 page、pageSize、totalPages、totalCount 的分页状态对象
 *
 * @example
 * const { page, totalPages } = usePagination();
 * // 用于渲染分页导航
 */
export const usePagination = () => {
  const page = usePgMetaStore((s) => s.page);
  const pageSize = usePgMetaStore((s) => s.pageSize);
  const totalPages = usePgMetaStore((s) => s.totalPages);
  const totalCount = usePgMetaStore((s) => s.totalCount);
  return { page, pageSize, totalPages, totalCount };
};

/**
 * 选择器 Hook：获取表格数据状态
 *
 * 聚合获取表格渲染所需的所有数据状态，
 * 包括表格数据、列定义、列宽映射和加载状态。
 *
 * @returns 包含 tableData、columns、columnWidths、loading 的表格数据状态对象
 *
 * @example
 * const { tableData, loading } = useTableData();
 * // 用于表格组件的数据绑定和加载状态显示
 */
export const useTableData = () => {
  const tableData = usePgMetaStore((s) => s.tableData);
  const columns = usePgMetaStore((s) => s.columns);
  const columnWidths = usePgMetaStore((s) => s.columnWidths);
  const loading = usePgMetaStore((s) => s.loading);
  return { tableData, columns, columnWidths, loading };
};

/**
 * 选择器 Hook：获取筛选状态
 *
 * 聚合获取筛选功能相关的所有状态，
 * 包括已应用的筛选条件列表、筛选表单状态和可用列信息。
 *
 * @returns 包含 filters、filterForm、columns 的筛选状态对象
 *
 * @example
 * const { filters, columns } = useFilters();
 * // 用于筛选面板的渲染和条件管理
 */
export const useFilters = () => {
  const filters = usePgMetaStore((s) => s.filters);
  const filterForm = usePgMetaStore((s) => s.filterForm);
  const columns = usePgMetaStore((s) => s.columns);
  return { filters, filterForm, columns };
};

/**
 * 选择器 Hook：获取导出状态
 *
 * 聚合获取数据导出功能相关的状态，
 * 包括导出进行中标识和导出条数限制。
 *
 * @returns 包含 exporting、exportLimit 的导出状态对象
 *
 * @example
 * const { exporting, exportLimit } = useExport();
 * // 用于导出按钮的状态显示和导出配置
 */
export const useExport = () => {
  const exporting = usePgMetaStore((s) => s.exporting);
  const exportLimit = usePgMetaStore((s) => s.exportLimit);
  return { exporting, exportLimit };
};
