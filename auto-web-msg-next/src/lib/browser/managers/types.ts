/**
 * Managers 模块类型定义
 *
 * 包含管理器层的类型：
 * - AutomationConfig: 自动化配置
 * - 各操作的参数和返回类型
 */


/**
 * 自动化全局配置
 *
 * @property send_enabled - 是否启用真实发送动作
 * @property highlight_selector - 需高亮的页面元素选择器
 */
export interface AutomationConfig {
  send_enabled: boolean;
  highlight_selector: string;
}

/**
 * 连接或启动外部浏览器实例参数
 */
export interface OpenBrowserInstanceArgs {
  id?: string;
  wsEndpoint?: string;
  port?: number;
  data?: string;
  name?: string | null;
  close_after_seconds?: number | null;
  browser_path?: string | null;
}

/**
 * 外部浏览器实例启动结果
 */
export interface OpenBrowserInstanceResult {
  action: "started" | "connected";
  id: string;
  data: string;
}

/**
 * 使用 Playwright 启动浏览器参数
 */
export interface LaunchBrowserOptions {
  id?: string;
  wsEndpoint?: string;
  port?: number;
  data?: string;
  headless?: boolean;
  browserType?: "chrome" | "msedge" | "chromium";
  executablePath?: string;
  name?: string | null;
  close_after_seconds?: number | null;
}

/**
 * 浏览器启动结果返回对象
 */
export interface LaunchBrowserResult {
  browser: import("playwright").Browser;
  context: import("playwright").BrowserContext;
  id: string;
  port?: number;
  dataPath: string;
  action: "launched";
}

/**
 * 更新实例配置参数
 */
export interface UpdateInstanceConfigArgs {
  id: string;
  name?: string | null;
  close_after_seconds?: number | null;
}

/**
 * 更新全局自动化配置参数
 */
export interface UpdateAutomationConfigArgs {
  send_enabled?: boolean | null;
  highlight_selector?: string | null;
}

/**
 * 打开页面参数
 */
export interface OpenPageArgs {
  url: string;
  id: string;
  forced?: boolean;
  message?: string;
  action?: string;
}

/**
 * 打开页面结果
 */
export interface OpenPageResult {
  status: "success" | "duplicate";
  url: string;
  id: string;
  message: string;
}

/**
 * 注入 Cookie 结果
 */
export interface AddCookiesResult {
  id: string;
  count: number;
  message: string;
}

/**
 * 清除 Cookie 结果
 */
export interface ClearCookiesResult {
  id: string;
  message: string;
}

