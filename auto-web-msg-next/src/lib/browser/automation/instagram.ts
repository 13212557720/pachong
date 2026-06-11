/**
 * Instagram 自动化模块
 *
 * 实现 Instagram 消息自动发送功能：
 * - 检测 Instagram URL
 * - 查找目标页面
 * - 模拟人类点击（带随机轨迹）
 * - 输入消息文本
 * - 高亮或点击发送按钮
 *
 * 关键选择器：
 * - INSTAGRAM_PRIMARY_BUTTON_SELECTOR: 主页按钮
 * - INSTAGRAM_INPUT_SELECTOR: 消息输入框
 * - SEND_BUTTON_SELECTOR: 发送按钮
 *
 * @module lib/browser/automation/instagram
 */
import type { Page } from "playwright";
import { toErrorMessage } from "../core/errors";
import {
  INSTAGRAM_HOST,
  INSTAGRAM_PRIMARY_BUTTON_SELECTOR,
  INSTAGRAM_INPUT_SELECTOR,
  SEND_BUTTON_SELECTOR,
} from "../core/selectors";
import { createActionLogger } from "../logging/actionLog";
import { createLogger } from "@/lib/logger";
import { humanClick, randomBetween } from "./utils";

const log = createActionLogger("IG");
const logger = createLogger("instagram-automation");


/**
 * 模拟人类等待延迟
 *
 * @param min - 最小等待秒数（默认 0.18）
 * @param max - 最大等待秒数（默认 0.46）
 * @returns Promise
 * @note 用于模拟人类操作节奏，避免被检测为机器人
 */
async function sleepHuman(min = 0.18, max = 0.46): Promise<void> {
  const waitMs = Math.round(randomBetween(min, max) * 1000);
  await new Promise((resolve) => setTimeout(resolve, waitMs));
}

/**
 * 检测给定 URL 是否为 Instagram URL
 *
 * @param url - 待检测的 URL 字符串
 * @returns 是否为 Instagram URL
 * @example isInstagramUrl("https://www.instagram.com/username") // true
 * @example isInstagramUrl("https://facebook.com/username") // false
 */
export function isInstagramUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.host === INSTAGRAM_HOST;
  } catch {
    return false;
  }
}

// 移除了 findPageForUrl，因为我们直接传递 Page 实例



/**
 * 高亮显示指定元素
 *
 * @param page - Playwright Page 实例
 * @param selector - 目标元素选择器
 * @param logUrl - 日志记录用的 URL
 * @returns void
 * @throws {Error} 元素不存在时抛出
 * @note 使用红色轮廓和阴影效果高亮元素，用于调试或视觉反馈
 */
async function highlightElement(page: Page, selector: string, logUrl: string): Promise<void> {
  log("注入高亮", `selector=${selector}`, logUrl);
  const highlighted = await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return false;
    el.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });
    el.style.outline = "4px solid #ff4d4f";
    el.style.outlineOffset = "2px";
    el.style.border = "4px solid #ff4d4f";
    el.style.boxShadow = "0 0 0 4px rgba(255,77,79,0.2)";
    return true;
  }, selector);
  if (!highlighted) throw new Error(`高亮目标不存在: ${selector}`);
}

/**
 * 执行 Instagram 自动化消息发送
 *
 * @param args - 自动化参数
 * @param args.page - Playwright Page 实例
 * @param args.targetUrl - 目标 Instagram URL
 * @param args.greetingText - 要发送的问候语文本
 * @param args.sendEnabled - 是否发送消息（false 仅高亮）
 * @returns Promise<void>
 * @throws {Error} 页面未找到或操作失败时抛出
 * @note 完整流程：查找页面 → 点击主页按钮 → 输入文本 → 发送/高亮
 */
export async function runInstagramAction(args: {
  page: Page;
  targetUrl: string;
  greetingText: string;
  sendEnabled: boolean;
}): Promise<void> {
  logger.info("Instagram自动化开始", { targetUrl: args.targetUrl, sendEnabled: args.sendEnabled });

  const { page, targetUrl, greetingText, sendEnabled } = args;

  try {
    logger.info(`[Step 1] 等待 DOM 加载，URL: ${targetUrl}`);
    await page.waitForLoadState("domcontentloaded", { timeout: 60_000 });

    logger.info(`[Step 2] 等待并点击主页Message按钮，selector: ${INSTAGRAM_PRIMARY_BUTTON_SELECTOR}`);
    await humanClick(page, INSTAGRAM_PRIMARY_BUTTON_SELECTOR, 5000, targetUrl);

    logger.info(`[Step 3] 等待消息输入框，selector: ${INSTAGRAM_INPUT_SELECTOR}`);
    const inputNode = page.locator(INSTAGRAM_INPUT_SELECTOR).first();
    await inputNode.waitFor({ state: "attached", timeout: 5000 });

    logger.info(`[Step 4] 点击输入框并输入消息`);
    await inputNode.click({ delay: Math.round(randomBetween(50, 120)) });
    await sleepHuman();
    const lines = greetingText.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) await page.keyboard.press("Shift+Enter");
      if (lines[i]) {
        await page.keyboard.type(lines[i], { delay: Math.round(randomBetween(30, 160)) });
      }
    }

    if (sendEnabled) {
      logger.info(`[Step 5] 执行发送，点击按钮 selector: ${SEND_BUTTON_SELECTOR}`);
      await humanClick(page, SEND_BUTTON_SELECTOR, 60_000, targetUrl);
    } else {
      logger.info(`[Step 5] 发送未开启，执行高亮 selector: ${SEND_BUTTON_SELECTOR}`);
      await highlightElement(page, SEND_BUTTON_SELECTOR, targetUrl);
    }

    logger.info("Instagram自动化全部完成");
    log("Instagram自动化完成", "", targetUrl);
  } catch (error) {
    const message = toErrorMessage(error);
    logger.error(`Instagram 操作失败: ${message}`);
    log("失败", message, targetUrl);
    throw new Error(`Instagram 操作失败: ${message}`);
  }
}
