/**
 * 浏览器配置模块
 *
 * 管理运行时配置，包括：
 * - Chrome 可执行文件路径
 * - 数据根目录
 * - 默认调试端口
 * - 调试模式开关
 *
 * 所有配置优先从环境变量读取，支持默认值回退。
 *
 * @module lib/browser/core/config
 */
import path from "node:path";

import { DEFAULT_PORT } from "@/constants";



/**
 * 解析默认端口号
 *
 * @param raw - 环境变量原始字符串
 * @returns 有效的端口号，若解析失败则返回默认值 DEFAULT_PORT
 * @note 有效端口范围为 1-65535
 */
function parseDefaultPort(raw: string | undefined): number {
  const parsed = Number.parseInt((raw || "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

/**
 * 浏览器运行时配置对象
 *
 * @property chromePath - Chrome 可执行文件路径（来自 CHROME_PATH 环境变量，未设置则为空字符串）
 * @property dataRoot - 数据根目录（默认 AUTO_WEB_MSG_DATA_DIR 环境变量或当前工作目录）
 * @property defaultPort - 默认调试端口（默认 AUTO_WEB_MSG_DEFAULT_PORT 环境变量或 2234）
 * @property debugEnabled - 是否启用调试模式（生产环境默认为 false，开发环境默认为 true）
 */
export const browserConfig = {
  chromePath: process.env.CHROME_PATH?.trim() || "",
  dataRoot: process.env.AUTO_WEB_MSG_DATA_DIR?.trim() || process.cwd(),
  defaultPort: parseDefaultPort(process.env.AUTO_WEB_MSG_DEFAULT_PORT),
  debugEnabled: process.env.AUTO_WEB_MSG_DEBUG === "1" || process.env.NODE_ENV !== "production",
};

/**
 * 将相对路径拼接到 dataRoot 下（避免使用 path.join(dynamic, dynamic)）。
 *
 * @param relativePath - 相对路径
 * @returns 拼接后的规范化路径
 */
function appendToDataRoot(relativePath: string): string {
  const base = path.normalize(browserConfig.dataRoot);
  if (!relativePath) return base;
  const suffix = base.endsWith(path.sep) ? relativePath : `${path.sep}${relativePath}`;
  return path.normalize(`${base}${suffix}`);
}

/**
 * 解析数据路径为绝对路径
 *
 * @param data - 原始数据路径字符串（可以是相对路径或绝对路径）
 * @returns 规范化后的绝对路径
 * @note 若是绝对路径则直接规范化，若是相对路径则拼接到 dataRoot
 * @example resolveDataPath("my-data") // "C:/project/my-data"
 * @example resolveDataPath("C:/absolute/path") // "C:/absolute/path"
 */
export function resolveDataPath(data: string): string {
  const trimmed = data.trim();
  if (path.isAbsolute(trimmed)) return path.normalize(trimmed);
  return appendToDataRoot(trimmed);
}

/**
 * 获取日志文件路径
 *
 * @returns opened_urls.jsonl 日志文件的绝对路径
 * @note 路径格式：{dataRoot}/logs/opened_urls.jsonl
 */
export function resolveLogsPath(): string {
  return path.join(browserConfig.dataRoot, "logs", "opened_urls.jsonl");
}

/**
 * 获取任务日志目录路径
 *
 * @returns 任务日志目录的绝对路径
 * @note 路径格式：{dataRoot}/logs/tasks/
 * @see createTaskRunLogFile
 */
export function resolveTaskLogsDir(): string {
  return path.join(browserConfig.dataRoot, "logs", "tasks");
}
