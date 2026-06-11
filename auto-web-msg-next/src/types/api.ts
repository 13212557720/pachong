/**
 * API 公共类型定义
 *
 * 原则：
 * - 数据实体类型直接从 generated/schemas.ts 引用，不重复定义
 * - 仅保留业务层专有类型（过滤器、进度、参数结构等）
 * - 通用分页用 PagedResult<T> 统一表达
 *
 * @module types/api
 */

import type { components } from "@/api/generated/schemas";

// ─── 基础 ──────────────────────────────────────────────────────────

/** 
 * 统一的 Server Action 返回结果格式
 * 成功时包含 data，失败时包含 error
 */
export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

// ─── Generated 实体类型直接导出（不重命名，不包装）─────────────────

/** Instagram 用户实体模型 */
export type InstagramUser  = components["schemas"]["InstagramUser"];
/** PG 数据库状态结果 */
export type PgStatusBody = components["schemas"]["PgStatusBody"];
/** PG 数据表列信息 */
export type PgColumnInfo  = components["schemas"]["PgColumnInfo"];

// ─── 通用分页（取代原 ListGetDataUsersResult + ExtraDataPageResult）──

/**
 * 通用分页返回结果
 * @template T - 列表项的数据类型
 */
export interface PagedResult<T> {
  /** 当前页的数据列表 */
  items:       T[];
  /** 当前页码（从 1 开始） */
  page:        number;
  /** 每页大小 */
  page_size:   number;
  /** 总记录数 */
  total:       number;
  /** 总页数 */
  total_pages: number;
}

// ─── getdata 模块 ─────────────────────────────────────────────────

/** 爬虫任务的基础参数配置 */
export interface GetDataActionParams {
  /** 目标用户的唯一标识 */
  userid:  string;
  /** 用于请求的 Headers 字典 */
  headers: Record<string, string>;
}

/** 爬虫任务返回的精简版用户预览数据 */
export type GetDataPreviewUser = Pick<
  InstagramUser,
  "id" | "username" | "full_name" | "is_private" | "is_verified"
>;

/** 爬虫任务单次执行的结果摘要 */
export interface GetDataActionResult {
  /** 目标用户的唯一标识 */
  userid:      string;
  /** 本次抓取的总数 */
  total:       number;
  /** 本次抓取的页数 */
  pages:       number;
  /** 本地保存的日志文件路径 */
  log_file:    string;
  /** 是否还有下一页 */
  has_more:    false;
  /** 下一页的游标（由于结束，必定为 undefined） */
  next_max_id: undefined;
  /** 抓取到的前几个用户的预览数据 */
  preview:     GetDataPreviewUser[];
}

/** 内存中维护的爬虫任务进度结构 */
export interface GetDataTaskProgress {
  /** 任务的唯一运行 ID */
  run_id:          string;
  /** 当前状态：运行中、已完成、失败 */
  status:          "running" | "completed" | "failed";
  /** 目标用户的唯一标识 */
  userid:          string;
  /** 任务开始的 ISO 时间字符串 */
  started_at:      string;
  /** 任务结束的 ISO 时间字符串 */
  ended_at?:       string;
  /** 已抓取的页数 */
  pages_fetched:   number;
  /** 已抓取的总记录数 */
  records_fetched: number;
  /** 当前分页游标 */
  current_max_id?: string;
  /** 任务运行过程中的日志列表 */
  logs:            string[];
  /** 任务完成后的结果摘要 */
  result?:         GetDataActionResult;
  /** 任务失败时的错误信息 */
  error?:          string;
}

/** Instagram API 返回的单条粉丝数据结构 */
export interface InstagramFollowingUser {
  /** 字符串格式的用户 ID */
  id?:          string;
  /** 数字格式的用户 ID（部分接口提供 pk 而非 id） */
  pk?:          string;
  /** 用户名 */
  username?:    string;
  /** 全名 */
  full_name?:   string;
  /** 是否为私密账号 */
  is_private?:  boolean;
  /** 是否已认证（蓝V） */
  is_verified?: boolean;
  /** 兜底处理其它未声明的字段 */
  [key: string]: unknown;
}

/** Instagram API 的列表响应结构 */
export interface InstagramFollowingResponse {
  /** 用户数组 */
  users?:       unknown;
  /** 下一页的游标 */
  next_max_id?: unknown;
  /** 响应状态字面量，通常是 "ok" */
  status?:      unknown;
}

/** 统一的 Instagram 用户列表过滤参数 */
export interface InstagramUserFilters {
  /** 用户 ID 精确匹配 */
  id?:                          string;
  /** 用户名模糊匹配 */
  username?:                    string;
  /** 全名模糊匹配 */
  full_name?:                   string;
  /** 是否已完成信息富集 */
  is_completed?:                boolean | null;
  /** 是否为私密账号 */
  is_private?:                  boolean | null;
  /** 是否为私密账号的多选状态 */
  is_private_in?:               boolean[];
  /** 出现次数的范围过滤 */
  repeat_count?:                NumberRangeFilter;
  /** 粉丝数范围下限 */
  followers_count_min?:         number | null;
  /** 粉丝数范围上限 */
  followers_count_max?:         number | null;
  /** IP 归属地模糊匹配 */
  ip_location?:                 string;
  /** IP 归属地在指定列表中（IN） */
  ip_location_in?:              string[];
  /** IP 归属地不在指定列表中（NOT IN） */
  ip_location_not_in?:          string[];
  /** 是否排除 IP 归属地为空的记录 */
  ip_location_not_include_null?: boolean;
  /** 创建时间（抓取时间）的最小值 (ISO) */
  created_at_min?:              string;
  /** 创建时间（抓取时间）的最大值 (ISO) */
  created_at_max?:              string;
}

// ─── extra-data 模块 ──────────────────────────────────────────────



export interface ExtraDataRunParams {
  /** 当前要处理的页码 */
  page:      number;
  /** 当前要处理的每页大小 */
  page_size: number;
  /** 数据筛选条件（决定富集范围） */
  filters?:  InstagramUserFilters;
}

/** 批量富集任务中单条处理的结果 */
export interface ExtraDataRunItemResult {
  /** 目标用户的唯一标识 */
  id:              string;
  /** 用户名 */
  username:        string;
  /** 是否处理成功 */
  success:         boolean;
  /** 提取到的粉丝数（字符串格式，可能包含单位或逗号） */
  followers_count: string;
  /** 提取到的 IP 归属地 */
  ip_location:     string;
  /** 提取到的简介 */
  biography?:      string;
  /** 处理失败时的错误信息 */
  error?:          string;
}

/** 批量富集任务的完整统计结果 */
export interface ExtraDataRunResult {
  /** 总处理数 */
  processed:   number;
  /** 成功数 */
  success:     number;
  /** 失败数 */
  failed:      number;
  /** 最终保存的 CSV 结果文件路径 */
  output_file: string;
  /** 本次处理的所有单条结果数组 */
  items:       ExtraDataRunItemResult[];
}

// ─── PG 模块 ──────────────────────────────────────────────────────

/** 数值范围过滤配置 */
export interface NumberRangeFilter {
  /** 范围最小值（含） */
  min?: number | null;
  /** 范围最大值（含） */
  max?: number | null;
}

/** 动态数据表的分页返回结果 */
export interface PgTableDataResult {
  /** 表名 */
  table:       string;
  /** 列信息配置列表 */
  columns:     PgColumnInfo[];
  /** 数据行数组，字段动态 */
  rows:        Record<string, unknown>[];
  /** 总记录数 */
  total:       number;
  /** 当前页码 */
  page:        number;
  /** 每页大小 */
  page_size:   number;
  /** 总页数 */
  total_pages: number;
}

/** 通用数据列级别的过滤配置 */
export interface PgColumnFilter {
  /** 关键字模糊匹配（用于字符串） */
  keyword?:       string;
  /** 包含在指定列表中（用于枚举或固定值） */
  in_values?:     string[];
  /** 不在指定列表中 */
  not_in_values?: string[];
  /** 布尔类型匹配列表（如 [true, false] 或单独的一个） */
  bool_in?:       boolean[];
  /** 数值范围匹配 */
  range?:         NumberRangeFilter;
  /** 是否单独查询 NULL 值 */
  include_null?:  boolean;
}

/** 表级别的组合过滤条件字典，Key 为字段名 */
export interface PgTableFilters {
  [columnName: string]: PgColumnFilter;
}

/** 动态数据表查询请求参数 */
export interface PgTableQueryParams {
  /** 目标表名 */
  table:      string;
  /** 目标页码，默认 1 */
  page?:      number;
  /** 目标每页大小，默认 20 */
  page_size?: number;
  /** 各字段的过滤条件 */
  filters?:   PgTableFilters;
}