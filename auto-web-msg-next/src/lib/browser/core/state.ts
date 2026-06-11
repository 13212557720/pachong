import type { BrowserContext } from "playwright";
import type { BrowserInstance } from "@/types/browser";
import { SEND_BUTTON_SELECTOR } from "./selectors";

/**
 * 浏览器会话接口，代表一个内存中的活动浏览器连接
 */
export interface BrowserSession {
  // ── 唯一标识 ──
  /** AdsPower user_id 或自定义的唯一标识符 */
  id: string;

  // ── 底层句柄 ──
  /** Playwright 浏览器上下文，包含实际的 CDP 连接和页面控制权 */
  context?: BrowserContext;

  // ── 游览器配置 ──
  /** 操作完成后延迟多少秒自动关闭浏览器 */
  close_after_seconds?: number;
  /** 允许的最大并发标签页数量 */
  max_tabs?: number;
  /** 是否为无头模式启动 */
  headless?: boolean;
  /** 浏览器可执行文件的绝对路径 */
  browser_path?: string;

  // ── 实例纯文本信息 ──
  /** 本地调试端口号（Playwright CDP 端口） */
  port?: number;
  /** WebSocket 端点地址（例如 ws://127.0.0.1:xxx/devtools/...） */
  wsEndpoint?: string;
  /** 调试页面的 HTTP 地址 */
  debug_url?: string;
  /** 当前连接状态：running (连接中) | disconnected (已断开) */
  status: "running" | "disconnected";
  /** 最后一次成功连接的 ISO 时间字符串 */
  last_connected_at?: string;
  /** AdsPower 配置文件中的名称 */
  name?: string;
  /** AdsPower user_id，与 id 类似，但作为额外字段供特定 API 使用 */
  user_id?: string;
  /** 用户传入的额外数据或标记 */
  data?: string;
  /** 是否为外部连接（即通过 AdsPower API 获取的已存在连接） */
  isExternal?: boolean;

  // ── 自动化配置 (独立到各个实例) ──
  /** 是否允许自动发送消息（通常用于防误触控制） */
  send_enabled?: boolean;
  /** 目标高亮元素的 CSS 选择器（如发送按钮） */
  highlight_selector?: string;
}

// ── 内部单例 (唯一的 Map) ──────────────────────────────────────────────────

/** 
 * 全局唯一的会话存储 Map
 * 键为 user_id，值为活动的 BrowserSession 实例
 */
const sessions = new Map<string, BrowserSession>();

/** 全局配置状态的默认值 */
const globalConfigState = {
  /** 全局是否允许发送 */
  send_enabled: false,
  /** 全局默认高亮选择器 */
  highlight_selector: SEND_BUTTON_SELECTOR,
};

// ── 核心操作函数 ────────────────────────────────────────────────────────────

/**
 * 获取全局自动化配置的一个浅拷贝
 * @returns 包含 send_enabled 和 highlight_selector 的对象
 */
export function getGlobalConfig() {
  return { ...globalConfigState };
}

/**
 * 更新全局自动化配置
 * @param updates.send_enabled - 是否允许发送消息（可选）
 * @param updates.highlight_selector - 高亮元素的 CSS 选择器（可选）
 * @returns 更新后的完整全局配置对象
 */
export function updateGlobalConfig(updates: { send_enabled?: boolean; highlight_selector?: string }) {
  if (updates.send_enabled !== undefined) {
    globalConfigState.send_enabled = updates.send_enabled;
  }
  if (updates.highlight_selector !== undefined) {
    globalConfigState.highlight_selector = updates.highlight_selector;
  }
  return { ...globalConfigState };
}

/**
 * 根据 ID 获取内存中的浏览器会话
 * @param id - 会话唯一标识符 (user_id)
 * @returns 浏览器会话对象，若不存在则返回 undefined
 */
export function getSession(id: string): BrowserSession | undefined {
  return sessions.get(id);
}

/**
 * 创建或更新浏览器会话信息
 * 若会话已存在，则合并更新；若不存在，则创建一个新会话（默认状态为 disconnected）
 * @param id - 会话唯一标识符 (user_id)
 * @param updates - 需要更新或设置的部分会话属性（可选）
 * @returns 更新或创建后的完整浏览器会话对象
 */
export function saveSession(id: string, updates: Partial<BrowserSession> = {}): BrowserSession {
  const current = sessions.get(id);
  const next: BrowserSession = current
    ? { ...current, ...updates, id }
    : { id, status: "disconnected", ...updates };
  sessions.set(id, next);
  return next;
}

/**
 * 从内存中删除指定的浏览器会话
 * 注意：此函数不负责关闭底层的 Playwright 浏览器进程
 * @param id - 会话唯一标识符 (user_id)
 */
export function deleteSession(id: string): void {
  sessions.delete(id);
}

/**
 * 获取浏览器会话的纯前端安全快照
 * 过滤掉 Playwright Context 等不可序列化的内部对象，用于返回给客户端
 * @param id - 会话唯一标识符 (user_id)
 * @returns 前端安全格式的实例信息，若不存在则返回 undefined
 */
export function getSessionSnapshot(id: string): BrowserInstance | undefined {
  const session = sessions.get(id);
  return session ? toBrowserInstance(session) : undefined;
}

/**
 * 获取所有活动浏览器会话的前端安全快照列表
 * @returns 所有实例的前端安全格式数组
 */
export function listSessionSnapshots(): BrowserInstance[] {
  return Array.from(sessions.values(), toBrowserInstance);
}

/**
 * 获取所有活动浏览器实例的前端安全快照列表
 * (listSessionSnapshots 的别名)
 * @returns 所有实例的前端安全格式数组
 */
export function listInstances(): BrowserInstance[] {
  return listSessionSnapshots();
}

/**
 * 内部工具函数：将内部 BrowserSession 转换为对外安全的 BrowserInstance 格式
 * @param session - 内部的浏览器会话对象
 * @returns 可安全序列化并返回给前端的 BrowserInstance 对象
 */
function toBrowserInstance(session: BrowserSession): BrowserInstance {
  return {
    id: session.id,
    port: session.port,
    wsEndpoint: session.wsEndpoint,
    data: session.data ?? session.id,
    debug_url: session.debug_url ?? "",
    status: session.status,
    last_connected_at: session.last_connected_at ?? new Date().toISOString(),
    name: session.name,
    user_id: session.user_id || session.id,
    close_after_seconds: session.close_after_seconds ?? 5,
    browser_path: session.browser_path,
    headless: session.headless,
    isExternal: session.isExternal,
  };
}
