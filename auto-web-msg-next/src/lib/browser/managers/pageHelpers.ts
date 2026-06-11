import type { Page } from "playwright";
import { browserConfig } from "../core/config";
import { toErrorMessage } from "../core/errors";
import type { OpenPageAutomationAction } from "@/types/browser";
import { createLogger } from "@/lib/logger";

const logger = createLogger("page-helpers");

/**
 * 从目标 URL 中提取用户名片段。
 *
 * @param targetUrl 目标 URL
 * @returns 用户名
 */
export function pickTargetUsername(targetUrl: string): string | undefined {
  try {
    const parsed = new URL(targetUrl);
    const first = parsed.pathname.split("/").filter(Boolean)[0];
    return first ? first.trim() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 将动作字符串转换为支持的自动化动作枚举。
 *
 * @param action 原始动作
 * @returns 规范动作
 */
export function normalizeOpenPageAction(action: string | null | undefined): OpenPageAutomationAction {
  const value = String(action || "").trim();
  if (!value) return "runInstagramAction";
  if (value === "runInstagramAction") return "runInstagramAction";
  if (value === "runFacebookAction") return "runFacebookAction";
  if (value === "none") return "none";
  return "none";
}

/**
 * 在页面展示自动关闭倒计时提示。
 *
 * @param page 页面对象
 * @param delaySeconds 倒计时秒数
 */
export async function showCloseToast(page: Page, delaySeconds: number): Promise<void> {
  if (delaySeconds <= 0) return;
  try {
    await page.evaluate((delay) => {
      const toastEl = document.createElement("div");
      toastEl.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.75);
        color: #fff;
        padding: 10px 20px;
        border-radius: 6px;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.25s ease;
        font-size: 14px;
      `;
      toastEl.textContent = `${delay}s后关闭页面`;
      document.body.appendChild(toastEl);
      setTimeout(() => {
        toastEl.style.opacity = "1";
      }, 10);
      setTimeout(() => {
        toastEl.style.opacity = "0";
        setTimeout(() => {
          if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
        }, 250);
      }, 3000);
    }, delaySeconds);
  } catch {
    // 忽略 toast 注入失败
  }
}

/**
 * 异步延迟关闭页面。
 *
 * @param page 页面对象
 * @param delaySeconds 延迟秒数
 * @param port 实例端口
 * @param targetUrl 目标 URL
 */
export function closePageLater(page: Page, delaySeconds: number, port: number, targetUrl: string) {
  if (delaySeconds <= 0) return;
  setTimeout(async () => {
    try {
      if (!page.isClosed()) {
        await page.close();
        if (browserConfig.debugEnabled) {
          logger.debug(`自动关闭标签页成功 | port=${port} | delay=${delaySeconds}s | url=${targetUrl}`);
        }
      }
    } catch (error) {
      if (browserConfig.debugEnabled) {
        logger.debug(`自动关闭标签页失败 | port=${port} | delay=${delaySeconds}s | url=${targetUrl} | err=${toErrorMessage(error)}`);
      }
    }
  }, delaySeconds * 1000);
}

