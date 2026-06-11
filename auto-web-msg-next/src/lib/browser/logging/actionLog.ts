import { browserConfig } from "../core/config";
import { createLogger } from "@/lib/logger";

const logger = createLogger("browser-action");

/**
 * 带有调试开关和标准格式的日志记录器
 */
export function debugLog(prefix: string, step: string, detail = "", url = "") {
  if (!browserConfig.debugEnabled) return;
  const now = new Date().toISOString();
  const suffix = [detail, url ? `url=${url}` : ""].filter(Boolean).join(" | ");
  logger.debug(`[${prefix}][${now}] ${step}${suffix ? ` | ${suffix}` : ""}`);
}

/**
 * 创建特定域的高级快捷日志发生器
 * @param prefix 日志记录前缀标识（如 "IG", "FB"）
 */
export function createActionLogger(prefix: string) {
  return function log(step: string, detail = "", url = "") {
    debugLog(prefix, step, detail, url);
  };
}
