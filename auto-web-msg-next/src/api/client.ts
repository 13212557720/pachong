/**
 * Python 后端 API 客户端
 * Token 从 auto-web-msg-next.json 读取，每次请求通过 Authorization: Bearer 携带。
 */

import { getActiveToken } from "@/actions/internal/config-file";

const BASE_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public isAuthError: boolean = false
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── 请求配置类型 ─────────────────────────────────────────────

export interface RequestConfig<T = unknown> {
  /** HTTP 方法 */
  method: string;
  /** 相对路径（不含 BASE_URL 和 API_PREFIX） */
  url: string;
  /** 查询参数（拼接为 query string） */
  params?: Record<string, unknown>;
  /** 请求体（自动 JSON 序列化） */
  data?: unknown;
  /** 额外的请求头 */
  headers?: Record<string, string>;
  /** AbortSignal */
  signal?: AbortSignal;
  /** 泛型占位，用于类型推导 */
  _phantom?: T;
}

export interface RequestResponse<T = unknown> {
  data: T;
  status: number;
}

// ─── 核心请求方法 ─────────────────────────────────────────────

export async function request<T = unknown>(
  config: RequestConfig<T>
): Promise<RequestResponse<T>> {
  const { method, url, params, data, headers: extraHeaders, signal } = config;

  // 拼接完整 URL
  const fullPath = `${BASE_URL}${API_PREFIX}${url}${buildQuery(params)}`;

  const headers: Record<string, string> = { ...extraHeaders };

  const apiToken = getActiveToken();
  if (apiToken) {
    headers["Authorization"] = `Bearer ${apiToken}`;
  }
  if (data !== undefined && data !== null) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(fullPath, {
    method: method.toUpperCase(),
    headers,
    body: data !== undefined && data !== null ? JSON.stringify(data) : undefined,
    signal,
    cache: "no-store",
  }).catch((err: unknown) => {
    throw new Error(`API 请求失败: ${err instanceof Error ? err.message : String(err)}`);
  });

  // 401 鉴权失败
  if (res.status === 401) {
    throw new ApiError("[401] Token无效或已过期，请前往设置页重新配置", 401, true);
  }

  // 204 无内容
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }

  const json = await res.json();
  return { data: json, status: res.status };
}

// ─── 工具函数 ──────────────────────────────────────────────────

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null
  );
  if (entries.length === 0) return "";
  const qs = new URLSearchParams();
  for (const [k, v] of entries) {
    qs.set(k, String(v));
  }
  return `?${qs.toString()}`;
}

// checkIsSuperKey 已迁移至 src/common/services/settings-actions.ts，此处不重复实现
