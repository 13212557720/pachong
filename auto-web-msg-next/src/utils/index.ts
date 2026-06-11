export * from "./table-export";

/**
 * 规范化分页参数，确保为正整数，并在参数无效时回退到默认值
 * @param page - 当前页码
 * @param pageSize - 每页条数
 * @returns 包含有效 page 和 pageSize 的对象
 */
export function normalizePaging(page: number, pageSize: number) {
  return {
    page:     Math.max(1, Math.trunc(page)     || 1),
    pageSize: Math.max(1, Math.trunc(pageSize) || 20),
  };
}

/**
 * 安全地解析 JSON 字符串
 * @param raw - 原始 JSON 字符串
 * @returns 解析后的对象，若失败或为空则返回空对象 {}
 */
export function safeParseJson(raw: string | null | undefined): Record<string, unknown> {
  if (!raw?.trim()) return {};
  try { return JSON.parse(raw) as Record<string, unknown>; }
  catch { return {}; }
}
