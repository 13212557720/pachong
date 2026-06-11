/**
 * 错误处理模块
 *
 * 提供统一的错误类和错误消息转换：
 * - AppError: 应用级错误，携带 HTTP 状态码
 * - toErrorMessage: 将任意错误转换为字符串消息
 *
 * @module lib/browser/core/errors
 */

/**
 * 应用级错误类
 *
 * 用于表示业务逻辑错误，携带 HTTP 状态码便于 API 层处理
 *
 * @extends Error
 * @property statusCode - HTTP 状态码（如 400 表示参数错误，404 表示资源不存在，500 表示服务器错误）
 * @property detail - 错误详情的可选描述，用于调试
 * @example throw new AppError(400, "端口号无效", "port 必须为 1-65535 的整数")
 */
export class AppError extends Error {
  statusCode: number;
  detail?: string;

  /**
   * 创建应用错误实例
   *
   * @param statusCode - HTTP 状态码
   * @param message - 错误信息的简短描述
   * @param detail - 错误详情的可选描述，用于调试
   */
  constructor(statusCode: number, message: string, detail?: string) {
    super(message);
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

/**
 * 将任意错误转换为字符串消息
 *
 * @param err - 任意类型的错误对象
 * @returns 错误消息字符串。若 err 是 Error 实例则返回其 message，否则返回 String(err)
 * @example toErrorMessage(new Error("文件不存在")) // "文件不存在"
 * @example toErrorMessage("网络错误") // "网络错误"
 * @example toErrorMessage(null) // "null"
 */
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}