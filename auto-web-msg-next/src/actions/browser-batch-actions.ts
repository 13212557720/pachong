"use server";

import { startBatchAutomation, resumeBatchTaskLoop } from "@/lib/browser/batch/batchAutomation";
import { getBatchTask, updateBatchTask } from "@/lib/browser/batch/taskStore";
import type { BatchTaskInput, BatchTaskState } from "@/lib/browser/batch/types";
import { ok, fail } from "@/actions/internal/action-result";
import { parseBatchTasksFromFormData } from "@/actions/internal/xlsx-task-parser";
import { createLogger } from "@/lib/logger";

const logger = createLogger("batch-actions");

/**
 * 解析上传的 Excel 文件并异步启动批量自动化任务
 * @param formData - 包含 Excel 文件、端口列表、默认动作以及映射配置的表单数据
 * @returns 包含 run_id 的结果
 */
export async function startXlsxAutomationAction(formData: FormData) {
  try {
    // 支持多端口：优先从 "ports" 字段（逗号分隔）解析，兼容旧的 "default_port" 单端口
    const portsRaw = String(formData.get("ports") ?? "").trim();
    const defaultPorts: number[] = portsRaw
      ? portsRaw.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isInteger(n) && n > 0)
      : [];

    if (defaultPorts.length === 0) {
      const singlePort = parseInt(String(formData.get("default_port") ?? "").trim(), 10);
      if (Number.isInteger(singlePort) && singlePort > 0) {
        defaultPorts.push(singlePort);
      }
    }

    const defaultActionRaw = String(formData.get("default_action") ?? "").trim();
    const mappingLink = String(formData.get("mapping_link") ?? "").trim();
    const mappingMessage = String(formData.get("mapping_message") ?? "").trim();
    const intervalMsRaw = String(formData.get("interval_ms") ?? "").trim();
    const intervalMs = intervalMsRaw ? parseInt(intervalMsRaw, 10) : 1000;

    const tasks: BatchTaskInput[] = await parseBatchTasksFromFormData(formData, {
      defaultPorts: defaultPorts.length > 0 ? defaultPorts : undefined,
      defaultAction: defaultActionRaw,
      mappingLink: mappingLink || undefined,
      mappingMessage: mappingMessage || undefined,
    });
    logger.info(`[startXlsxAutomationAction] 解析出 ${tasks.length} 条任务，分配到 ${defaultPorts.length} 个浏览器，准备启动 (间隔: ${intervalMs}ms)`);
    return ok(await startBatchAutomation({ tasks, interval_ms: Number.isNaN(intervalMs) ? 1000 : intervalMs }));
  } catch (e) {
    logger.error(`[startXlsxAutomationAction] 解析或启动失败`, e);
    return fail(e);
  }
}

/**
 * 获取批量任务的最新进度
 * @param runId 任务 ID
 */
export async function getBatchTaskProgressAction(runId: string) {
  try {
    const state = getBatchTask(runId);
    if (!state) {
      return fail(new Error("找不到该任务或任务已过期"));
    }
    // 返回前端安全的状态（省略复杂的 tasks/results 内容，按需精简）
    const safeState: Omit<BatchTaskState, "tasks" | "results"> = {
      run_id: state.run_id,
      status: state.status,
      total: state.total,
      success: state.success,
      failed: state.failed,
      duplicate: state.duplicate,
      current_index: state.current_index,
      log_file: state.log_file,
      error: state.error,
      interval_ms: state.interval_ms,
    };
    return ok(safeState);
  } catch (e) {
    logger.error(`[getBatchTaskProgressAction] 获取任务进度失败 (runId=${runId})`, e);
    return fail(e);
  }
}

/**
 * 暂停批量任务
 */
export async function pauseBatchTaskAction(runId: string) {
  try {
    const state = getBatchTask(runId);
    if (!state || (state.status !== "running" && state.status !== "error")) {
      return fail(new Error("任务当前状态无法暂停"));
    }
    logger.info(`[pauseBatchTaskAction] 暂停任务 (runId=${runId})`);
    updateBatchTask(runId, { status: "paused" });
    return ok({ status: "paused" });
  } catch (e) {
    logger.error(`[pauseBatchTaskAction] 暂停任务失败 (runId=${runId})`, e);
    return fail(e);
  }
}

/**
 * 继续执行批量任务
 */
export async function resumeBatchTaskAction(runId: string) {
  try {
    const state = getBatchTask(runId);
    if (!state || (state.status !== "paused" && state.status !== "error")) {
      return fail(new Error("任务当前状态无法继续"));
    }
    logger.info(`[resumeBatchTaskAction] 继续任务 (runId=${runId})`);
    updateBatchTask(runId, { status: "running" });
    resumeBatchTaskLoop(runId);
    return ok({ status: "running" });
  } catch (e) {
    logger.error(`[resumeBatchTaskAction] 继续任务失败 (runId=${runId})`, e);
    return fail(e);
  }
}

/**
 * 取消批量任务
 */
export async function cancelBatchTaskAction(runId: string) {
  try {
    const state = getBatchTask(runId);
    if (!state || state.status === "completed" || state.status === "cancelled") {
      return fail(new Error("任务已结束，无需取消"));
    }
    logger.info(`[cancelBatchTaskAction] 取消任务 (runId=${runId})`);
    updateBatchTask(runId, { status: "cancelled" });
    return ok({ status: "cancelled" });
  } catch (e) {
    logger.error(`[cancelBatchTaskAction] 取消任务失败 (runId=${runId})`, e);
    return fail(e);
  }
}

/**
 * 动态更新任务执行间隔
 */
export async function updateBatchTaskIntervalAction(runId: string, intervalMs: number) {
  try {
    const state = getBatchTask(runId);
    if (!state) {
      return fail(new Error("找不到该任务或任务已过期"));
    }
    logger.info(`[updateBatchTaskIntervalAction] 更新任务间隔 (runId=${runId}, interval=${intervalMs}ms)`);
    updateBatchTask(runId, { interval_ms: intervalMs });
    return ok({ status: state.status, interval_ms: intervalMs });
  } catch (e) {
    logger.error(`[updateBatchTaskIntervalAction] 更新任务间隔失败 (runId=${runId})`, e);
    return fail(e);
  }
}
