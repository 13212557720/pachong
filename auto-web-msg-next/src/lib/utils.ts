import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


/**
 * 合并 Tailwind CSS 类名，解决样式冲突
 * @param inputs - 类名数组或对象
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 获取当前时间的 ISO 8601 格式字符串
 * @returns 格式化时间字符串（如 "2024-05-18T12:00:00.000Z"）
 */
export function nowIso(): string {
  return new Date().toISOString();
}



/**
 * 创建一个串行执行队列
 * 用于确保异步任务按顺序一个接一个地执行，避免并发问题
 * @returns 一个接受 Promise 任务的运行函数
 */
export function createSerialQueue() {
  let queue: Promise<void> = Promise.resolve();
  return function runSerial<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}


