/**
 * Browser 相关客户端安全类型定义
 *
 * 此文件仅供客户端代码导入，不引入任何 Node.js / Playwright 依赖。
 * @module types/browser
 */

/**
 * 浏览器实例的客户端安全表示
 * 用于在前端展示活动浏览器的状态
 */
export interface BrowserInstance {
  /** 实例的唯一标识符（通常是 user_id） */
  id: string;
  /** CDP 调试端口号 */
  port?: number;
  /** WebSocket 连接端点地址 */
  wsEndpoint?: string;
  /** 附加的实例数据，默认等于 id */
  data: string;
  /** Web 调试界面的 URL */
  debug_url: string;
  /** 实例当前的连接状态 */
  status: "running" | "disconnected";
  /** 最后一次成功连接的 ISO 时间字符串 */
  last_connected_at: string;
  /** AdsPower 实例名称 */
  name?: string;
  /** AdsPower 用户 ID */
  user_id?: string;
  /** 执行任务后自动关闭的延迟时间（秒） */
  close_after_seconds: number;
  /** 浏览器可执行文件的路径 */
  browser_path?: string;
  /** 是否以无头模式运行 */
  headless?: boolean;
  /** 当前打开的标签页数量 */
  pagesCount?: number;
  /** 当前活动页面的 URL 列表 */
  activeUrls?: string[];
  /** 是否为外部连接（如通过 AdsPower API 扫描发现的连接） */
  isExternal?: boolean;
}

/**
 * Cookie 项目配置接口
 * 描述了用于注入浏览器的单个 Cookie 的结构
 */
export interface CookieItem {
  /** Cookie 名称 */
  name: string;
  /** Cookie 值 */
  value: string;
  /** Cookie 所属域名 */
  domain: string;
  /** Cookie 路径，默认为 "/" */
  path?: string;
  /** Cookie 过期时间的时间戳（Unix 秒数） */
  expires?: number | null;
  /** 是否仅通过 HTTP(S) 传输 */
  httpOnly?: boolean;
  /** 是否需要安全连接 (HTTPS) */
  secure?: boolean;
  /** 同站策略 ("Strict", "Lax", "None") */
  sameSite?: string;
  /** 标记是否将该 Cookie 设置为永久有效 (如果未提供明确过期时间) */
  permanent?: boolean;
}

/**
 * 打开页面时自动执行的预设动作
 * "none" 表示不执行任何动作
 */
export type OpenPageAutomationAction = "runInstagramAction" | "runFacebookAction" | "none";

/** 表示最大的有效过期时间戳（2038年），避免 32位整型溢出 */
export const MAX_EXPIRY_TIMESTAMP = 2_147_483_647;