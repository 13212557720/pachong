/**
 * Facebook 自动化模块
 *
 * 当前为占位实现，保持 API 稳定。
 * 后续可扩展：
 * - 消息输入框定位
 * - 发送按钮点击
 * - 好友请求处理
 *
 * @module lib/browser/automation/facebook
 */
import type { BrowserContext } from "playwright";
import { createActionLogger } from "../logging/actionLog";

const FACEBOOK_HOSTS = new Set([
  "www.facebook.com",
  "facebook.com",
  "m.facebook.com",
]);

const log = createActionLogger("FB");

/**
 * 检测给定 URL 是否为 Facebook URL
 *
 * @param url - 待检测的 URL 字符串
 * @returns 是否为 Facebook URL
 * @example isFacebookUrl("https://www.facebook.com/username") // true
 * @example isFacebookUrl("https://instagram.com/username") // false
 */
export function isFacebookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && FACEBOOK_HOSTS.has(parsed.host);
  } catch {
    return false;
  }
}

/**
 * 执行 Facebook 自动化动作
 *
 * @param args - 自动化参数
 * @param args.browser - Playwright Browser 实例
 * @param args.targetUrl - 目标 Facebook URL
 * @param args.message - 要发送的消息内容
 * @param args.sendEnabled - 是否发送消息
 * @returns Promise<void>
 * @note 当前为占位实现，不执行实际动作
 */
export async function runFacebookAction(args: {
  context: BrowserContext;
  targetUrl: string;
  message: string;
  sendEnabled: boolean;
}): Promise<void> {
  const { targetUrl, message, sendEnabled } = args;
  log("Facebook自动化占位开始", `sendEnabled=${String(sendEnabled)} | messageLength=${message.length}`, targetUrl);
  log("Facebook自动化占位完成", "no-op", targetUrl);
}