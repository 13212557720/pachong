/**
 * 批量任务自动化模块
 *
 * 从 Excel 文件读取任务列表并串行执行：
 * - 支持 Instagram/Facebook 自动化动作
 * - 任务状态跟踪（success/failed/duplicate）
 * - 完整的 JSONL 日志记录
 *
 * 任务格式（Excel 列）：
 * - port: 浏览器端口
 * - url: 目标 URL
 * - message: 消息内容
 * - action: 动作类型
 *
 * @module lib/browser/batch/batchAutomation
 */
import { nowIso } from "@/lib/utils";
import { toErrorMessage } from "../core/errors";
import { createTaskRunLogFile, appendTaskLogEntry } from "../logging/taskLog";
import { normalizeOpenPageAction, openPage } from "../managers/pageManager";
import type { OpenPageAutomationAction } from "@/types/browser";
import { createLogger } from "@/lib/logger";
import type {
  TaskExecutionStatus,
  BatchTaskInput,
  BatchTaskResult,
} from "./types";

const logger = createLogger("batchAutomation");

// 默认任务间隔已移至参数配置中

/**
 * 任务消息预览字符数上限
 * 超出此长度的消息将被截断并添加省略号
 */
const TASK_MESSAGE_PREVIEW_LIMIT = 120;

/**
 * 生成消息预览文本
 *
 * @param message - 原始消息内容
 * @returns 截断后的预览文本
 * @note 若消息长度超过限制则在末尾添加省略号
 */
function previewMessage(message: string): string {
  const trimmed = String(message || "").trim();
  if (trimmed.length <= TASK_MESSAGE_PREVIEW_LIMIT) return trimmed;
  return `${trimmed.slice(0, TASK_MESSAGE_PREVIEW_LIMIT)}...`;
}

/**
 * 异步延迟函数
 *
 * @param ms - 延迟时间（毫秒）
 * @returns Promise - 在指定时间后 resolve
 * @example await sleep(1000); // 等待 1 秒
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 执行单个任务（单次尝试）
 *
 * @param task - 批处理任务输入（包含端口、URL、消息等）
 * @param normalizedAction - 规范化的自动化动作类型
 * @returns 最终状态
 * @example await runTaskAttempt(task, "runInstagramAction"); // { status: "success" }
 */
async function runTaskAttempt(
  task: BatchTaskInput,
  normalizedAction: OpenPageAutomationAction
): Promise<{ status: TaskExecutionStatus; error?: string }> {
  try {
    const result = await openPage({
      port: task.port,
      url: task.url,
      forced: false,
      message: task.message,
      action: normalizedAction,
      isBatch: true,
      maxTabs: 3,
    });
    if (result.status === "duplicate") {
      return { status: "duplicate" };
    }
    return { status: "success" };
  } catch (err) {
    return { status: "failed", error: toErrorMessage(err) };
  }
}

import { createBatchTask, getBatchTask, updateBatchTask } from "./taskStore";

/**
 * 后台批量处理循环
 * @param runId 任务 ID
 * @param indices 该循环负责执行的任务索引列表
 */
async function processBatchTaskLoop(runId: string, indices: number[]) {
  const taskState = getBatchTask(runId);
  if (!taskState || taskState.status !== "running") return;

  const { log_file: filePath, tasks, interval_ms } = taskState;

  for (const taskIndex of indices) {
    // 每次派发前检查整体状态
    const currentState = getBatchTask(runId);
    if (!currentState || currentState.status !== "running") {
      logger.info(`[processBatchTaskLoop] 任务暂停或取消，停止执行 (runId=${runId}, status=${currentState?.status})`);
      break;
    }

    const task = tasks[taskIndex];
    const startedAt = Date.now();
    const normalizedAction = normalizeOpenPageAction(task.action);

    let status: TaskExecutionStatus = "failed";
    let error: string | undefined;

    if (task.validation_error) {
      status = "failed";
      error = task.validation_error;
      logger.warn(`[processBatchTaskLoop] 任务 ${task.row} 验证失败: ${error}`);
    } else {
      const runResult = await runTaskAttempt(task, normalizedAction);
      status = runResult.status;
      error = runResult.error;
      if (status === "failed") {
        logger.warn(`[processBatchTaskLoop] 任务 ${task.row} 执行失败: ${error}`);
      } else {
        logger.info(`[processBatchTaskLoop] 任务 ${task.row} 执行完成: ${status}`);
      }
    }

    const item: BatchTaskResult = {
      row: task.row,
      port: task.port,
      url: task.url,
      action: normalizedAction,
      status,
      ...(error ? { error } : {}),
      duration_ms: Date.now() - startedAt,
    };

    // 原子更新共享状态
    const latest = getBatchTask(runId);
    if (latest) {
      updateBatchTask(runId, {
        current_index: latest.current_index + 1,
        success: latest.success + (item.status === "success" ? 1 : 0),
        duplicate: latest.duplicate + (item.status === "duplicate" ? 1 : 0),
        failed: latest.failed + (item.status === "failed" ? 1 : 0),
        results: [...latest.results, item],
      });
    }

    await appendTaskLogEntry(filePath, {
      timestamp: nowIso(),
      run_id: runId,
      row: task.row,
      port: task.port,
      url: task.url,
      action: normalizedAction,
      message_preview: previewMessage(task.message),
      status,
      ...(error ? { error } : {}),
      duration_ms: item.duration_ms,
    });
    
    // 任务结束后，再执行第二个任务，中间间隔可自定义修改
    if (taskIndex !== indices[indices.length - 1]) {
      await sleep(interval_ms);
    }
  }
}

/**
 * 启动批量自动化任务 (异步背景任务)
 *
 * 任务按 port 分组，每个 port 启动一个独立的执行循环，多浏览器并行执行。
 *
 * @param args - 批量任务参数
 * @returns { run_id } 立刻返回 run_id 给前端
 */
export async function startBatchAutomation(args: {
  tasks: BatchTaskInput[];
  interval_ms?: number;
}): Promise<{ run_id: string }> {
  const { runId, filePath } = await createTaskRunLogFile();

  logger.info(`[startBatchAutomation] 启动批量任务 (runId=${runId}, count=${args.tasks.length})`);

  await appendTaskLogEntry(filePath, {
    timestamp: nowIso(),
    run_id: runId,
    kind: "run_start",
    total: args.tasks.length,
  });

  createBatchTask({
    run_id: runId,
    status: "running",
    total: args.tasks.length,
    success: 0,
    failed: 0,
    duplicate: 0,
    current_index: 0,
    log_file: filePath,
    tasks: args.tasks,
    results: [],
    interval_ms: args.interval_ms ?? 1000,
  });

  // 按 port 分组，获取每个 port 对应的任务索引列表
  const portGroups = new Map<number, number[]>();
  for (let i = 0; i < args.tasks.length; i++) {
    const port = args.tasks[i].port;
    const group = portGroups.get(port);
    if (group) {
      group.push(i);
    } else {
      portGroups.set(port, [i]);
    }
  }

  // 为每个 port 启动一个独立的执行循环，并行运行
  const loops = Array.from(portGroups.values()).map((indices) =>
    processBatchTaskLoop(runId, indices).catch((err) => {
      logger.error(`[processBatchTaskLoop] 后台执行崩溃 (runId=${runId})`, err);
      updateBatchTask(runId, { status: "error", error: toErrorMessage(err) });
    })
  );

  // 不 await，让其在后台独立运行
  void Promise.allSettled(loops).then(() => {
    const finalState = getBatchTask(runId);
    if (finalState && finalState.status === "running") {
      logger.info(`[startBatchAutomation] 所有并行循环执行完成 (runId=${runId})`, {
        total: finalState.total,
        success: finalState.success,
        failed: finalState.failed,
        duplicate: finalState.duplicate,
      });
      updateBatchTask(runId, { status: "completed" });
      void appendTaskLogEntry(filePath, {
        timestamp: nowIso(),
        run_id: runId,
        kind: "run_end",
        total: finalState.total,
        success: finalState.success,
        failed: finalState.failed,
        duplicate: finalState.duplicate,
      });
    }
  });

  return { run_id: runId };
}

/**
 * 触发继续执行（恢复暂停的任务）
 * 从 current_index 开始，重新按 port 分组并行执行剩余任务
 */
export function resumeBatchTaskLoop(runId: string) {
  logger.info(`[resumeBatchTaskLoop] 尝试继续执行任务 (runId=${runId})`);
  const taskState = getBatchTask(runId);
  if (!taskState) return;

  const { tasks, log_file: filePath } = taskState;

  // 收集尚未执行的任务索引，按已完成数量过滤
  // 由于并行模式中 current_index 代表全局完成数，需要从 results 中获取已完成的行号
  const completedRows = new Set(taskState.results.map((r) => r.row));
  const remainingIndices: number[] = [];
  for (let i = 0; i < tasks.length; i++) {
    if (!completedRows.has(tasks[i].row)) {
      remainingIndices.push(i);
    }
  }

  if (remainingIndices.length === 0) {
    updateBatchTask(runId, { status: "completed" });
    return;
  }

  // 按 port 分组
  const portGroups = new Map<number, number[]>();
  for (const idx of remainingIndices) {
    const port = tasks[idx].port;
    const group = portGroups.get(port);
    if (group) {
      group.push(idx);
    } else {
      portGroups.set(port, [idx]);
    }
  }

  const loops = Array.from(portGroups.values()).map((indices) =>
    processBatchTaskLoop(runId, indices).catch((err) => {
      logger.error(`[resumeBatchTaskLoop] 恢复执行时崩溃 (runId=${runId})`, err);
      updateBatchTask(runId, { status: "error", error: toErrorMessage(err) });
    })
  );

  void Promise.allSettled(loops).then(() => {
    const finalState = getBatchTask(runId);
    if (finalState && finalState.status === "running") {
      updateBatchTask(runId, { status: "completed" });
      void appendTaskLogEntry(filePath, {
        timestamp: nowIso(),
        run_id: runId,
        kind: "run_end",
        total: finalState.total,
        success: finalState.success,
        failed: finalState.failed,
        duplicate: finalState.duplicate,
      });
    }
  });
}
