import type { ActionResult } from "@/types/api";

/** 构造成功响应 */
export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/** 构造失败响应 */
export function fail(error: unknown): { success: false; error: string } {
  if (error instanceof Error) return { success: false, error: error.message };
  return { success: false, error: String(error) };
}
