/**
 * Instagram Following 抓取逻辑
 *
 * 在 Node.js 端直接调用 Instagram API 抓取 following 数据，
 * 通过 Python 后端 API 写入用户数据，使用内存 Map 跟踪任务进度。
 *
 * @module app/getdata/services/getdata-crawl
 */

import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/browser";
import { postInstagramUsersBulkUpsertInstagramUsers, PostInstagramUsersBulkUpsertInstagramUsersBody, postInstagramUsersUpdateInstagramUserCompletion } from "@/api/generated/instagram_users";
import type { GetDataActionParams, GetDataActionResult, GetDataPreviewUser, InstagramFollowingResponse, InstagramFollowingUser } from "@/types/api";

const INSTAGRAM_BASE_URL = "https://www.instagram.com";
const FOLLOWING_PAGE_SIZE = 100;

export interface CrawlTaskState {
  runId: string;
  userid: string;
  status: "running" | "completed" | "failed";
  startedAt: Date;
  endedAt?: Date;
  pagesFetched: number;
  recordsFetched: number;
  currentMaxId?: string;
  logs: string[];
  result?: GetDataActionResult;
  error?: string;
}

const taskStore = new Map<string, CrawlTaskState>();

/** 任务完成/失败后 30 分钟自动清理，防止内存持续增长 */
const TASK_TTL_MS = 30 * 60 * 1000;
const scheduleCleanup = (runId: string) => setTimeout(() => taskStore.delete(runId), TASK_TTL_MS);

/**
 * 规范化并校验传入的 Headers，确保格式安全
 * @param input - 原始 Headers 对象
 * @returns 经过清洗且必须包含 cookie 的 Headers 对象
 */
function normalizeHeaders(input: Record<string, string> | undefined): Record<string, string> {
  if (!input || typeof input !== "object") {
    throw new AppError(400, "headers 不能为空，且必须是对象");
  }
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    const headerKey = String(key || "").trim().toLowerCase();
    if (!headerKey) continue;
    normalized[headerKey] = String(value ?? "").trim();
  }
  if (!normalized.cookie) {
    throw new AppError(400, "headers.cookie 不能为空");
  }
  return normalized;
}

/**
 * 安全地将响应数据转换为 Instagram 关注者列表数组
 * @param value - 原始响应中的 users 字段
 * @returns 类型安全的 InstagramFollowingUser 数组
 */
function asFollowingUsers(value: unknown): InstagramFollowingUser[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object") as InstagramFollowingUser[];
}

/**
 * 从用户对象中提取唯一标识符，用于去重
 * @param user - 用户对象
 * @returns 作为唯一主键的字符串
 */
function resolveUserKey(user: InstagramFollowingUser): string {
  const rawId = String(user.id ?? user.pk ?? "").trim();
  return rawId || JSON.stringify(user);
}

/**
 * 生成用于前端展示的简略用户信息预览列表（最多20个）
 * @param users - 完整用户列表
 * @returns 提取关键字段后的精简预览列表
 */
function toPreviewUsers(users: InstagramFollowingUser[]): GetDataPreviewUser[] {
  return users.slice(0, 20).map((user) => ({
    id: String(user.id ?? user.pk ?? ""),
    username: String(user.username ?? ""),
    full_name: String(user.full_name ?? ""),
    is_private: Boolean(user.is_private),
    is_verified: Boolean(user.is_verified),
  }));
}

/**
 * 请求 Instagram API 获取单页关注者数据
 * @param userid - 目标用户 ID
 * @param nextMaxId - 下一页的分页游标
 * @param headers - 包含认证信息的请求头
 * @returns 包含用户数据和下一页游标的响应体
 */
async function fetchFollowingPage(userid: string, nextMaxId: string | undefined, headers: HeadersInit): Promise<InstagramFollowingResponse> {
  const url = new URL(`/api/v1/friendships/${userid}/following/`, INSTAGRAM_BASE_URL);
  url.searchParams.set("count", String(FOLLOWING_PAGE_SIZE));
  if (nextMaxId) {
    url.searchParams.set("max_id", nextMaxId);
  }
  const response = await fetch(url.toString(), { method: "GET", headers }).catch((err) => {
    throw new AppError(502, "Instagram 请求失败", err instanceof Error ? err.message : String(err));
  });

  try {
    return (await response.json()) as InstagramFollowingResponse;
  } catch (error) {
    throw new AppError(502, "Instagram 响应解析失败", error instanceof Error ? error.message : String(error));
  }
}

/**
 * 执行关注者抓取的核心循环任务，支持分页、去重并持久化到数据库
 * @param params - 抓取参数
 * @param options - 附加配置（如任务 ID）
 * @returns 抓取结果摘要对象
 */
async function runFollowingCrawl(params: GetDataActionParams, options?: { runId?: string }): Promise<GetDataActionResult> {
  const userid = String(params.userid || "").trim();
  if (!userid) {
    throw new AppError(400, "userid 不能为空");
  }
  const normalizedHeaders = normalizeHeaders(params.headers);
  const headers: HeadersInit = { accept: "*/*", ...normalizedHeaders };

  const runId = options?.runId ?? randomUUID();
  const task: CrawlTaskState = {
    runId,
    userid,
    status: "running",
    startedAt: new Date(),
    pagesFetched: 0,
    recordsFetched: 0,
    logs: [],
  };
  taskStore.set(runId, task);

  try {
    let nextMaxId: string | undefined;
    let pageCount = 0;
    const uniqueUsersMap = new Map<string, InstagramFollowingUser>();

    while (true) {
      const payload = await fetchFollowingPage(userid, nextMaxId, headers)
        .catch((err) => {
          throw new AppError(502, "Instagram 请求失败", err instanceof Error ? err.message : String(err));
        });
      if (typeof payload.status === "string" && payload.status !== "ok") {
        throw new AppError(502, `Instagram 返回异常状态: ${JSON.stringify(payload, null, 2)}`, payload.toString());
      }

      const pageUsers = asFollowingUsers(payload.users);
      const newUsersBatch: NonNullable<PostInstagramUsersBulkUpsertInstagramUsersBody["items"]> = [];

      for (const user of pageUsers) {
        const key = resolveUserKey(user);
        if (!uniqueUsersMap.has(key)) {
          uniqueUsersMap.set(key, user);
          newUsersBatch.push({
            id: String(user.id ?? user.pk ?? ""),
            username: user.username ?? null,
            full_name: user.full_name ?? null,
            is_private: user.is_private ?? null,
            is_verified: user.is_verified ?? null,
            raw_json: JSON.stringify(user),
            followers_count: (user.followers_count as string) ?? null,
            ip_location: (user.ip_location as string) ?? null,
            biography: (user.biography as string) ?? null,
          });
        }
      }

      if (newUsersBatch.length > 0) {
        // 实时将本批次新抓去的用户批量入库
        try {
          await postInstagramUsersBulkUpsertInstagramUsers({
            body: { items: newUsersBatch }
          });
        } catch {
          // 批量 upsert 失败不中断整体抓取流程
        }
      }
      pageCount += 1;

      const next = typeof payload.next_max_id === "string" && payload.next_max_id.trim() ? payload.next_max_id.trim() : undefined;
      nextMaxId = next;

      task.pagesFetched = pageCount;
      task.recordsFetched = uniqueUsersMap.size;
      task.currentMaxId = nextMaxId;
      const logMsg = `第 ${pageCount} 页完成, 原始累计 ${pageUsers.length} 条, 去重后 ${uniqueUsersMap.size} 条, next_max_id=${nextMaxId ?? "undefined"}`;
      task.logs.push(logMsg);

      if (!nextMaxId) break;
    }

    const uniqueUsers = [...uniqueUsersMap.values()];

    await postInstagramUsersUpdateInstagramUserCompletion({
      body: { id: userid, is_completed: true },
    }).catch(() => undefined);

    task.status = "completed";
    task.endedAt = new Date();
    task.result = {
      userid,
      total: uniqueUsers.length,
      pages: pageCount,
      log_file: `memory://getdata_runs/${runId}`,
      has_more: false as const,
      next_max_id: undefined,
      preview: toPreviewUsers(uniqueUsers),
    };
    scheduleCleanup(runId);
    return task.result;
  } catch (error) {
    task.status = "failed";
    task.endedAt = new Date();
    task.error = error instanceof Error ? error.message : String(error);
    scheduleCleanup(runId);
    throw error;
  }
}

/**
 * 异步启动一个新的抓取任务，并返回用于查询进度的运行 ID
 * @param params - 抓取参数
 * @returns 包含生成的任务 run_id 的对象
 */
export async function startGetDataTask(params: GetDataActionParams): Promise<{ run_id: string }> {
  const userid = String(params.userid || "").trim();
  if (!userid) {
    throw new AppError(400, "userid 不能为空");
  }
  normalizeHeaders(params.headers);

  const runId = randomUUID();

  void (async () => {
    try {
      await runFollowingCrawl({ userid, headers: params.headers }, { runId });
    } catch {
      // 错误已在 taskStore 中记录
    }
  })();

  return { run_id: runId };
}

/**
 * 根据 runId 从内存中获取抓取任务的状态
 * @param runId - 任务 ID
 * @returns 任务状态对象
 */
export function getGetDataTaskProgress(runId: string): CrawlTaskState | undefined {
  return taskStore.get(runId);
}
