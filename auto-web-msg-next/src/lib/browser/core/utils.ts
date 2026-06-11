/**
 * 工具函数模块
 *
 * 提供数据处理的各种工具函数：
 * - 时间格式化
 * - 路径规范化
 * - 名称清理
 * - 实例信息构建
 * - BrowserContext 存活检测
 *
 * @module lib/browser/core/utils
 */
import type { BrowserContext } from "playwright";
import { resolveDataPath } from "./config";
import { AppError } from "./errors";
import type { BrowserInstance } from "@/types/browser";
import { nowIso } from "@/lib/utils";


/**
 * 规范化数据路径
 *
 * @param data - 原始数据路径字符串
 * @returns 规范化后的绝对路径
 * @throws {AppError} 当 data 为空时抛出 400 错误
 * @example normalizeDataPath("my-data") // "C:/project/my-data"
 */
export function normalizeDataPath(data: string): string {
  const trimmed = data.trim();
  if (!trimmed) {
    throw new AppError(400, "data 不能为空");
  }
  return resolveDataPath(trimmed);
}

/**
 * 清理实例名称
 *
 * @param id - 实例ID或端口号，作为默认值
 * @param name - 待清理的名称
 * @returns 清理后的名称，若名称为空则返回ID的前8位
 * @example cleanName(2234, "  我的浏览器  ") // "我的浏览器"
 * @example cleanName("abc-123", null) // "abc-123"
 */
export function cleanName(id: string | number, name?: string | null): string {
  if (!name || name.trim() === "") {
    return String(id).substring(0, 8);
  }
  return name.trim();
}


/**
 * 清理自动关闭秒数配置
 *
 * @param value - 待清理的秒数值
 * @returns 清理后的有效秒数
 * @throws {AppError} 当值小于 0 时抛出 400 错误
 * @example cleanCloseAfterSeconds(5) // 5
 * @example cleanCloseAfterSeconds(null) // 5 (默认值)
 */
export function cleanCloseAfterSeconds(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 5;
  if (!Number.isFinite(value) || value < 0) {
    throw new AppError(400, "close_after_seconds 不能小于 0");
  }
  return Math.trunc(value);
}



/**
 * 构建浏览器实例信息对象
 *
 * @param args - 实例参数
 * @param args.port - 端口号（必填）
 * @param args.data - 数据目录路径（必填）
 * @param args.status - 实例状态，默认 "running"
 * @param args.name - 实例名称，默认使用端口号
 * @param args.closeAfterSeconds - 自动关闭秒数，默认 5
 * @returns 完整的浏览器实例信息对象
 */
export function buildInstanceInfo(args: {
  id: string;
  port?: number;
  wsEndpoint?: string;
  data: string;
  status?: "running" | "disconnected";
  name?: string | null;
  closeAfterSeconds?: number | null;
  browser_path?: string;
  headless?: boolean;
}): BrowserInstance {
  const { id, port, wsEndpoint, data, status = "running", name, closeAfterSeconds, browser_path, headless } = args;
  return {
    id,
    ...(port !== undefined ? { port } : {}),
    ...(wsEndpoint ? { wsEndpoint } : {}),
    data,
    debug_url: wsEndpoint || (port ? `http://127.0.0.1:${port}` : ''),
    status,
    last_connected_at: nowIso(),
    name: name ? name.trim() : id.substring(0, 8),
    close_after_seconds: cleanCloseAfterSeconds(closeAfterSeconds),
    ...(browser_path ? { browser_path } : {}),
    ...(headless !== undefined ? { headless } : {}),
  };
}

/**
 * 检测 BrowserContext 是否仍然存活
 *
 * @param context - Playwright BrowserContext 实例
 * @returns 是否存活（可正常操作）
 * @note 该函数会尝试调用 context.pages()，若抛出异常则表示已不可用
 */
export function contextAlive(context: BrowserContext): boolean {
  try {
    void context.pages();
    return true;
  } catch {
    return false;
  }
}
