/**
 * 任务执行日志模块（PostgreSQL）。
 *
 * @module lib/browser/logging/taskLog
 */
import { randomUUID } from "node:crypto";
import { createSerialQueue } from "@/lib/utils";
import { appendTaskEvent, createTaskEventRun } from "@/app/_services/logging-query";

const withTaskLogLock = createSerialQueue();

/**
 * 创建任务运行日志文件
 *
 * @returns 包含运行 ID 和文件路径的对象
 * @note filePath 为 DB 标识（db://task_events/{runId}）
 */
export async function createTaskRunLogFile(): Promise<{ runId: string; filePath: string }> {
  return withTaskLogLock(async () => {
    const runId = randomUUID();
    const filePath = await createTaskEventRun(runId);
    return { runId, filePath };
  });
}

/**
 * 追加任务日志条目
 *
 * @param filePath - 日志文件路径
 * @param entry - 日志条目对象（会被序列化为 JSON 行）
 * @returns Promise<void>
 * @note 每条日志占一行，使用 JSONL 格式
 */
export async function appendTaskLogEntry(filePath: string, entry: Record<string, unknown>): Promise<void> {
  await withTaskLogLock(async () => {
    const runId = String(entry.run_id ?? filePath.replace("db://task_events/", "")).trim();
    await appendTaskEvent(runId, entry);
  });
}

