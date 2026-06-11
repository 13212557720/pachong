import type { BatchTaskState } from "./types";

/** 全局内存存储，保存所有的批量任务状态 */
const store = new Map<string, BatchTaskState>();

/**
 * 获取批量任务状态
 * @param runId 任务 ID
 */
export function getBatchTask(runId: string): BatchTaskState | undefined {
  return store.get(runId);
}

/**
 * 创建并保存批量任务状态
 */
export function createBatchTask(task: BatchTaskState): void {
  store.set(task.run_id, task);
}

/**
 * 更新批量任务状态
 */
export function updateBatchTask(runId: string, updates: Partial<BatchTaskState>): void {
  const task = store.get(runId);
  if (task) {
    store.set(runId, { ...task, ...updates });
  }
}

/**
 * 删除批量任务
 */
export function deleteBatchTask(runId: string): void {
  store.delete(runId);
}
