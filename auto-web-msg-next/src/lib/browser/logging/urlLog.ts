/**
 * URL 访问日志模块（PostgreSQL）。
 *
 * @module lib/browser/logging/urlLog
 */
import { createSerialQueue } from "@/lib/utils";
import { insertOpenedUrl, existsOpenedUrl } from "@/app/_services/logging-query";

const withLogLock = createSerialQueue();

/**
 * 规范化 URL 为统一格式
 *
 * @param url - 原始 URL 字符串
 * @returns 规范化后的 URL
 * @note 统一协议小写、移除尾部斜杠、统一 path
 * @example canonicalizeUrl("HTTP://EXAMPLE.COM/path/") // "http://example.com/path"
 */
export function canonicalizeUrl(url: string): string {
  const parsed = new URL(url);
  const pathname = parsed.pathname !== "/" && parsed.pathname.endsWith("/") ? parsed.pathname.slice(0, -1) : parsed.pathname || "/";
  return `${parsed.protocol.toLowerCase()}//${parsed.host.toLowerCase()}${pathname}${parsed.search}`;
}

/**
 * 追加页面打开日志
 *
 * @param entry - 日志条目对象（包含 timestamp、port、url 等）
 * @returns Promise<void>
 * @note 每条日志占一行，使用 JSONL 格式
 */
export async function appendOpenPageLog(entry: Record<string, unknown>): Promise<void> {
  await withLogLock(async () => insertOpenedUrl(entry));
}

/**
 * 检测是否为重复打开的 URL
 *
 * @param canonicalUrl - 规范化后的 URL
 * @returns 是否为重复 URL（已在日志中存在且 action 为 "opened"）
 * @note 读取日志文件遍历检测，忽略无效行
 */
export async function isDuplicateOpenUrl(canonicalUrl: string): Promise<boolean> {
  return withLogLock(async () => existsOpenedUrl(canonicalUrl));
}

