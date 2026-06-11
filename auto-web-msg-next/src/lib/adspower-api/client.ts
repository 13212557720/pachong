/**
 * AdsPower Local API 客户端核心模块
 * 支持单实例（向后兼容默认连接）与多实例（面向局域网设备群控 IP+端口）
 * Token 注：原生遗留依赖机制目前采用无 Token（如果后续有 auth 将从 config 或缓存中调取）
 */
import { serverSideFetch } from "./server-actions";

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

// ─── 核心请求配置类型定义 ─────────────────────────────────────────────

type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "head" | "options";

export interface RequestConfig<T = unknown> {
  /** HTTP 方法 */
  method: string | HttpMethod;
  /** 相对路径（不含 BASE_URL 但包含或不包含 API_PREFIX 都可以，内部会处理） */
  url: string;
  /** 查询参数（拼接为 query string） */
  params?: Record<string, unknown>;
  /** 请求体（自动 JSON 序列化） */
  data?: unknown;
  /** 额外的请求头 */
  headers?: Record<string, string>;
  /** AbortSignal：防请求死锁、用于提前终止 */
  signal?: AbortSignal;
  /** 泛型占位，用于类型推导 */
  _phantom?: T;
}

export interface RequestResponse<T = unknown> {
  data: T;
  status: number;
}

export interface ApiClientConfig {
  /** 目标基准地址，如: http://192.168.1.100:50325 */
  baseURL: string;
  /** 公共附加请求头 */
  headers?: Record<string, string>;
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

// ─── API 客户端核心类实现 ─────────────────────────────────────────────

export class ApiClient {
  readonly baseURL: string;
  private readonly defaultHeaders: Record<string, string>;

  /** 统一的 API 前缀 */
  readonly API_PREFIX = "/api";

  constructor(config: ApiClientConfig) {
    // 自动清洗尾部斜杠
    this.baseURL = config.baseURL.replace(/\/+$/, "");
    this.defaultHeaders = config.headers ?? {};
  }

  /**
   * 核心实例请求构造器
   * 承担连接状态拦截、序列化装填以及异常冒泡转换
   */
  async request<T = unknown>(
    config: RequestConfig<T>
  ): Promise<RequestResponse<T>> {
    const { method, url, params, data, headers: extraHeaders } = config;

    // 清洗路径前缀，确保路径合并安全性
    let standardizedUrl = url;
    if (!standardizedUrl.startsWith(this.API_PREFIX) && !standardizedUrl.startsWith("http")) {
      standardizedUrl = `${this.API_PREFIX}${url.startsWith("/") ? url : "/" + url}`;
    }
    const fullPath = `${this.baseURL}${standardizedUrl}${buildQuery(params)}`;

    const headers: Record<string, string> = { ...this.defaultHeaders, ...extraHeaders };

    if (data !== undefined && data !== null) {
      // 默认附加 JSON Header
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
    }

    try {
      const stringifiedBody = data !== undefined && data !== null ? JSON.stringify(data) : undefined;
      // 利用 Server Action 把真实请求丢给 Node 端执行，绕过浏览器跨域
      const res = await serverSideFetch(fullPath, method.toUpperCase(), headers, stringifiedBody);

      // 401 鉴权拦截防泄漏
      if (res.status === 401) {
        throw new ApiError(`[401] 设备 (${this.baseURL}) 拒绝连接，认证无效或已过期`, 401, true);
      }

      // 204 回应处理
      if (res.status === 204) {
        return { data: undefined as T, status: res.status };
      }

      // 如果返回非 OK，抛出服务端错误附带原因
      if (!res.ok) {
        throw new ApiError(`[${res.status}] ${res.text || "Unknown Server Error"}`, res.status);
      }

      let parsedData: unknown = null;
      if (res.contentType.includes("application/json")) {
        try {
          parsedData = JSON.parse(res.text);
        } catch {
          parsedData = res.text; // 回退
        }
      } else {
        parsedData = res.text;
      }

      return { data: parsedData as T, status: res.status };
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(
        `API 寻址/请求失败 (${this.baseURL}): ${err instanceof Error ? err.message : String(err)}`,
        500
      );
    }
  }
}

// ─── 全局设备连接池管理器 ─────────────────────────────────────────────

/**
 * 缓存池，通过 IP+Port 或者专用的 Hash String 维护长久的客户端实体
 * 规避内存泄漏及频繁创建开销
 */
const deviceClientPool = new Map<string, ApiClient>();

/**
 * 获取或按需创建一个指向该局域网端点的新 API Client 实例
 * @param endpoint 远程地址（例如: http://192.168.1.100:50325）
 */
export function getDeviceClient(endpoint: string): ApiClient {
  // 标准化一下入参点
  const normalizedEndpoint = endpoint.replace(/\/+$/, "");

  if (deviceClientPool.has(normalizedEndpoint)) {
    return deviceClientPool.get(normalizedEndpoint)!;
  }

  const client = new ApiClient({ baseURL: normalizedEndpoint });
  deviceClientPool.set(normalizedEndpoint, client);
  return client;
}

/**
 * 失效并移除缓存中的设备客户端挂载
 */
export function invalidateDeviceClient(endpoint: string) {
  const normalizedEndpoint = endpoint.replace(/\/+$/, "");
  deviceClientPool.delete(normalizedEndpoint);
}

// ─── 遗留兼容架构 (单例桥接) ─────────────────────────────────────────────
