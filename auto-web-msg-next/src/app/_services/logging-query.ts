/**
 * @file 日志记录查询模块（Python API 代理版）
 * @description 通过 Python 后端 API 记录 opened_urls 和 task_events 数据。
 * @module lib/db/queries/logging
 */

import { postOpenedUrlsCreateOpenedUrl, getOpenedUrlsExistsOpenedUrl } from "@/api/generated/opened_urls";
import { postTaskEventsCreateTaskEvent } from "@/api/generated/task_events";

/**
 * 插入一条页面打开记录
 */
export async function insertOpenedUrl(entry: Record<string, unknown>): Promise<void> {
  const canonicalUrl = String(entry.canonical_url ?? "").trim();
  const action = String(entry.action ?? "").trim();
  if (!canonicalUrl || !action) return;

  await postOpenedUrlsCreateOpenedUrl({
    body: {
      id: "",
      port: Number.isInteger(entry.port) ? (entry.port as number) : null,
      url: String(entry.url ?? "").trim() || null,
      canonical_url: canonicalUrl,
      forced: Boolean(entry.forced),
      action,
      automation_action: String(entry.automation_action ?? "").trim() || null,
    }
  });
}

/**
 * 检查某条 URL 是否已被打开过
 */
export async function existsOpenedUrl(canonicalUrl: string): Promise<boolean> {
  const normalized = String(canonicalUrl || "").trim();
  if (!normalized) return false;
  const result = await getOpenedUrlsExistsOpenedUrl({
    query: {
      canonical_url: normalized,
      action: "opened",
    }
  });
  return result?.exists ?? false;
}

/**
 * 创建任务事件运行（返回引用路径）
 */
export async function createTaskEventRun(runId: string): Promise<string> {
  const id = String(runId || "").trim();
  if (!id) throw new Error("runId 不能为空");
  return `db://task_events/${id}`;
}

/**
 * 追加任务事件日志
 */
export async function appendTaskEvent(runId: string, entry: Record<string, unknown>): Promise<void> {
  const id = String(runId || "").trim();
  if (!id) return;

  await postTaskEventsCreateTaskEvent({
    body: {
      id: "",
      run_id: id,
      event_json: JSON.stringify(entry),
    }
  });
}
