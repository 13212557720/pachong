/**
 * PG Meta 共享类型定义
 *
 * 本文件定义了 PostgreSQL 元数据查询相关的共享类型，
 * 供 getdata 和 pgsqlDetails 页面共用。
 */

import type { PgStatusBody, PgTableDataResult, PgColumnInfo } from "@/types/api";

/**
 * 列筛选条件接口
 *
 * 用于定义对数据库表某一列的筛选条件，支持多种筛选方式：
 * - 关键词匹配
 * - 值列表包含/排除
 * - 数值范围
 * - 布尔值筛选
 * - 空值处理
 */
export interface ColumnFilter {
  /** 要筛选的列名 */
  column: string;
  /** 关键词筛选，用于模糊匹配 */
  keyword?: string;
  /** 包含值列表，筛选列值在指定列表中的记录 */
  inValues?: string[];
  /** 排除值列表，筛选列值不在指定列表中的记录 */
  notInValues?: string[];
  /** 数值范围下限（包含） */
  rangeMin?: number;
  /** 数值范围上限（包含） */
  rangeMax?: number;
  /** 布尔值筛选：筛选为 true 的记录 */
  boolTrue?: boolean;
  /** 布尔值筛选：筛选为 false 的记录 */
  boolFalse?: boolean;
  /** 是否包含空值记录 */
  includeNull?: boolean;
}

/**
 * 筛选表单状态接口
 *
 * 用于管理筛选表单的输入状态，所有输入字段均为字符串类型，
 * 便于表单控件直接绑定使用，提交时再转换为对应的筛选条件。
 */
export interface FilterFormState {
  /** 当前选中的筛选列名 */
  filterColumn: string;
  /** 关键词输入框内容 */
  keywordInput: string;
  /** 包含值列表输入（逗号分隔的字符串） */
  inValuesInput: string;
  /** 排除值列表输入（逗号分隔的字符串） */
  notInValuesInput: string;
  /** 数值范围下限输入 */
  rangeMinInput: string;
  /** 数值范围上限输入 */
  rangeMaxInput: string;
  /** 布尔值筛选：是否筛选 true 值 */
  boolTrue: boolean;
  /** 布尔值筛选：是否筛选 false 值 */
  boolFalse: boolean;
  /** 是否包含空值记录 */
  includeNull: boolean;
}

/**
 * PG Meta Store 状态接口
 *
 * 定义 PostgreSQL 元数据查询页面的完整状态结构，
 * 包含数据库连接状态、表数据、分页信息、筛选条件等。
 */
export interface PgMetaState {
  /** 数据库连接状态信息 */
  status: PgStatusBody | null;
  /** 数据库中可用的表名列表 */
  tables: string[];
  /** 当前选中的表名 */
  selectedTable: string;
  /** 当前表的数据查询结果 */
  tableData: PgTableDataResult | null;
  /** 当前表的列信息列表 */
  columns: PgColumnInfo[];
  /** 数据加载中状态 */
  loading: boolean;
  /** 错误信息，无错误时为 null */
  error: string | null;

  /** 当前页码（从 1 开始） */
  page: number;
  /** 每页显示条数 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 总记录数 */
  totalCount: number;

  /** 当前应用的筛选条件列表 */
  filters: ColumnFilter[];
  /** 筛选表单输入状态 */
  filterForm: FilterFormState;

  /** 各列的宽度配置，键为列名，值为像素宽度 */
  columnWidths: Record<string, number>;

  /** 数据导出中状态 */
  exporting: boolean;
  /** 导出记录数上限 */
  exportLimit: number;

  /** 跳转页码输入框内容 */
  jumpPageInput: string;
  /** 每页条数输入框内容 */
  pageSizeInput: string;
}

/**
 * PG Meta Store 操作方法接口
 *
 * 定义用于更新 PostgreSQL 元数据查询状态的所有操作方法，
 * 包括状态设置、分页控制、筛选管理等功能。
 */
export interface PgMetaActions {
  /** 设置数据库连接状态 */
  setStatus: (status: PgStatusBody | null) => void;
  /** 设置可用表名列表 */
  setTables: (tables: string[]) => void;
  /** 设置当前选中的表 */
  setSelectedTable: (table: string) => void;
  /** 设置表数据查询结果 */
  setTableData: (data: PgTableDataResult | null) => void;
  /** 设置表的列信息 */
  setColumns: (columns: PgColumnInfo[]) => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 设置错误信息 */
  setError: (error: string | null) => void;

  /** 设置当前页码 */
  setPage: (page: number) => void;
  /** 设置每页显示条数 */
  setPageSize: (size: number) => void;
  /** 设置总页数 */
  setTotalPages: (pages: number) => void;
  /** 设置总记录数 */
  setTotalCount: (count: number) => void;

  /** 设置筛选条件列表 */
  setFilters: (filters: ColumnFilter[]) => void;
  /** 添加单个筛选条件 */
  addFilter: (filter: ColumnFilter) => void;
  /** 移除指定列的筛选条件 */
  removeFilter: (column: string) => void;
  /** 清空所有筛选条件 */
  clearFilters: () => void;

  /** 更新筛选表单状态（部分更新） */
  updateFilterForm: (form: Partial<FilterFormState>) => void;

  /** 设置列宽度配置 */
  setColumnWidths: (widths: Record<string, number>) => void;

  /** 设置导出状态 */
  setExporting: (exporting: boolean) => void;
  /** 设置导出记录数上限 */
  setExportLimit: (limit: number) => void;

  /** 设置跳转页码输入内容 */
  setJumpPageInput: (input: string) => void;
  /** 设置每页条数输入内容 */
  setPageSizeInput: (input: string) => void;

  /** 重置 Store 到初始状态 */
  reset: () => void;
}



/**
 * 默认筛选表单状态
 *
 * 用于初始化筛选表单或重置表单时使用。
 */
export const DEFAULT_FILTER_FORM: FilterFormState = {
  /** 默认不选中任何列 */
  filterColumn: "",
  /** 关键词输入默认为空 */
  keywordInput: "",
  /** 包含值列表输入默认为空 */
  inValuesInput: "",
  /** 排除值列表输入默认为空 */
  notInValuesInput: "",
  /** 数值范围下限默认为空 */
  rangeMinInput: "",
  /** 数值范围上限默认为空 */
  rangeMaxInput: "",
  /** 布尔值 true 筛选默认关闭 */
  boolTrue: false,
  /** 布尔值 false 筛选默认关闭 */
  boolFalse: false,
  /** 默认不包含空值 */
  includeNull: false,
};
