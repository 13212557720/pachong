/**
 * Instagram FastAPI 客户端
 */

const BASE_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestConfig<T = unknown> {
  method: string;
  url: string;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  _phantom?: T;
}

export interface RequestResponse<T = unknown> {
  data: T;
  status: number;
}

export async function request<T = unknown>(
  config: RequestConfig<T>
): Promise<RequestResponse<T>> {
  const { method, url, params, data, headers: extraHeaders, signal } = config;

  const fullPath = `${BASE_URL}${API_PREFIX}${url}${buildQuery(params)}`;

  const headers: Record<string, string> = { ...extraHeaders };

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

  if (!res.ok) {
    throw new ApiError(`[${res.status}] API Error: ${res.statusText}`, res.status);
  }

  // 204 无内容
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }

  const json = await res.json();
  return { data: json, status: res.status };
}

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
