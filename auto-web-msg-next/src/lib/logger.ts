import { emitLog } from "./log-events";

/** 是否开启调试模式（通过环境变量 AUTO_WEB_MSG_DEBUG=1 控制） */
const DEBUG_ENABLED = process.env.AUTO_WEB_MSG_DEBUG === "1";

/**
 * 内部日志写入函数
 * @param level - 日志级别
 * @param scope - 日志作用域（如：组件名或模块名）
 * @param message - 日志消息内容
 * @param meta - 附加的元数据对象（可选）
 */
function write(level: "debug" | "info" | "warn" | "error", scope: string, message: string, meta?: unknown) {
  if (level === "debug" && !DEBUG_ENABLED) return;
  const prefix = `[${scope}] ${message}`;
  if (meta === undefined) {
    console[level](prefix);
  } else {
    console[level](prefix, meta);
  }

  if (level !== "debug") {
    emitLog({
      timestamp: new Date().toISOString(),
      level,
      scope,
      message: meta !== undefined ? `${message} ${JSON.stringify(meta)}` : message,
    });
  }
}

/**
 * 创建一个带作用域的日志记录器
 * @param scope - 标识日志来源的作用域字符串
 * @returns 包含 debug, info, warn, error 四个级别日志方法的对象
 */
export function createLogger(scope: string) {
  return {
    /**
     * 写入调试级别日志（仅在 DEBUG 模式下输出）
     * @param message - 日志消息
     * @param meta - 附加数据
     */
    debug: (message: string, meta?: unknown) => write("debug", scope, message, meta),
    /**
     * 写入信息级别日志
     * @param message - 日志消息
     * @param meta - 附加数据
     */
    info: (message: string, meta?: unknown) => write("info", scope, message, meta),
    /**
     * 写入警告级别日志
     * @param message - 日志消息
     * @param meta - 附加数据
     */
    warn: (message: string, meta?: unknown) => write("warn", scope, message, meta),
    /**
     * 写入错误级别日志
     * @param message - 日志消息
     * @param meta - 附加数据
     */
    error: (message: string, meta?: unknown) => write("error", scope, message, meta),
  };
}
