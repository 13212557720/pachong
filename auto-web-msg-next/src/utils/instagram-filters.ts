import type { InstagramUser } from "@/types/api";
import { safeParseJson } from "@/utils";

/** raw_json 展开到对象顶层（让前端可读取扩展字段） */
export function withRaw(user: InstagramUser): InstagramUser & Record<string, unknown> {
  return { ...safeParseJson(user.raw_json), ...user };
}

export interface BaseQueryFilters {
  ip_location?: string;
  ip_location_in?: string[];
  ip_location_not_in?: string[];
  ip_location_not_include_null?: boolean;
  created_at_min?: string;
  created_at_max?: string;
}

/** 
 * 提取过滤参数中的共用部分（无类型限制，接受任意包含这些字段的 filters 对象）
 * 包含字段：ip_location*, created_at*
 */
export function getBaseQueryFilters(filters?: Partial<BaseQueryFilters> | undefined): Record<string, string | number | boolean | string[] | boolean[] | undefined> {
  if (!filters) return {};
  const q: Record<string, string | number | boolean | string[] | boolean[] | undefined> = {};

  if (filters.ip_location) q.ip_location = filters.ip_location;
  if (filters.ip_location_in?.length) q.ip_location_in = filters.ip_location_in;
  if (filters.ip_location_not_in?.length) q.ip_location_not_in = filters.ip_location_not_in;
  if (filters.ip_location_not_include_null) q.ip_location_not_include_null = "true";

  if (filters.created_at_min) {
    // 补足零点 (RFC3339)
    q.created_at_min = `${filters.created_at_min}T00:00:00Z`;
  }
  if (filters.created_at_max) {
    // 补足午夜 (RFC3339)
    q.created_at_max = `${filters.created_at_max}T23:59:59Z`;
  }

  return q;
}

/**
 * 将 InstagramUserFilters 转换为 Python API 查询字符串兼容的键值对
 * 整合了原来的 getDataFiltersToQuery 和 extraDataFiltersToQuery
 * @param filters - 前端传递的通用筛选条件对象
 * @returns 扁平化且满足 API 要求的查询参数字典
 */
export function instagramUserFiltersToQuery(
  filters?: import("@/types/api").InstagramUserFilters,
): Record<string, string | number | boolean | string[] | boolean[] | undefined> {
  const q = getBaseQueryFilters(filters);
  if (!filters) return q;

  const keyword = filters.id || filters.username || filters.full_name;
  if (keyword) q.keyword = keyword;

  if (filters.is_completed != null) q.is_completed = String(filters.is_completed);
  if (filters.is_private != null) q.is_private = String(filters.is_private);
  if (filters.is_private_in?.length) q.is_private_in = filters.is_private_in;

  if (filters.repeat_count) {
    if (filters.repeat_count.min != null) q.repeat_count_min = filters.repeat_count.min;
    if (filters.repeat_count.max != null) q.repeat_count_max = filters.repeat_count.max;
  }

  if (filters.followers_count_min != null) q.followers_count_min = filters.followers_count_min;
  if (filters.followers_count_max != null) q.followers_count_max = filters.followers_count_max;

  return q;
}
