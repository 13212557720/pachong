/**
 * 页面管理模块
 * 负责打开页面、执行自动化动作、写入日志。
 *
 * @module lib/browser/managers/pageManager
 */
import { connectBrowser } from "./browserManager";
import { listInstances } from "@/lib/browser/core/state";
import { getAutomationConfig } from "./instanceManager";
import { isInstagramUrl, runInstagramAction } from "../automation/instagram";
import { isFacebookUrl, runFacebookAction } from "../automation/facebook";
import { appendOpenPageLog, canonicalizeUrl, isDuplicateOpenUrl } from "../logging/urlLog";
import { AppError, toErrorMessage } from "../core/errors";
import { createLogger } from "@/lib/logger";
import { browserConfig } from "../core/config";
import { cleanCloseAfterSeconds } from "../core/utils";
import type { BrowserContext, Page } from "playwright";
import { postSendMessageLogsCreateSendMessageLog } from "@/api/generated/send_message_logs";
import { closePageLater, normalizeOpenPageAction, pickTargetUsername } from "./pageHelpers";
import { nowIso } from "@/lib/utils";

const logger = createLogger("pageManager");

export { normalizeOpenPageAction } from "./pageHelpers";



// ─── 内部工具 ─────────────────────────────────────────────────────

/**
 * 统一执行自动化动作并写入消息日志，消除 Instagram/Facebook 两段重复的 try/catch
 *
 * @param meta - 日志元数据（端口、URL、用户名、消息内容）
 * @param run - 实际的自动化执行回调
 * @param sendEnabled - 当前是否允许发送消息（影响日志状态）
 * @throws 抛出内部执行错误
 */
async function runAutomationWithLog(
  meta: { port: number; url: string; username?: string; message: string },
  run: () => Promise<void>,
  sendEnabled: boolean,
): Promise<void> {
  const bodyBase = {
    id: "", port: meta.port, target_url: meta.url,
    target_username: meta.username?.trim() || null, message: meta.message,
  };
  try {
    await run();
    await postSendMessageLogsCreateSendMessageLog({
      body: { ...bodyBase, status: sendEnabled ? "success" : "skipped", error_message: null }
    });
  } catch (error) {
    await postSendMessageLogsCreateSendMessageLog({
      body: { ...bodyBase, status: "failed", error_message: toErrorMessage(error) || null }
    });
    throw error;
  }
}

// ─── 主函数 ───────────────────────────────────────────────────────

/**
 * 打开页面并尝试执行预设的自动化动作（如 Instagram/Facebook 消息发送）
 *
 * @param args - 打开页面的参数
 * @param args.url - 目标网页的 URL
 * @param args.port - 运行的外部浏览器端口（默认为系统默认端口）
 * @param args.forced - 是否强制打开（即使近期已打开过）
 * @param args.message - 要发送的自动消息内容
 * @param args.action - 自动化动作名称（如 runInstagramAction）
 * @returns 包含页面状态和对应信息的结果对象
 * @throws {AppError} 参数错误、找不到实例或连接失败时抛出错误
 */
export async function openPage(args: {
  url: string;
  port?: number;
  forced?: boolean;
  message?: string;
  action?: string;
  isBatch?: boolean;
  maxTabs?: number;
}): Promise<{ status: "success" | "duplicate"; url: string; port: number; message: string }> {
  const targetPort = args.port ?? browserConfig.defaultPort;
  const forced = Boolean(args.forced);
  const normalizedAction = normalizeOpenPageAction(args.action);
  let targetUrl = String(args.url || "").trim();

  logger.info(`[openPage] 开始 port=${targetPort} action=${normalizedAction} url=${targetUrl}`);

  if (!targetUrl) throw new AppError(400, "url 不能为空");
  if (!targetUrl.includes("://")) targetUrl = `http://${targetUrl}`;

  const canonicalUrl = canonicalizeUrl(targetUrl);
  logger.info(`[openPage] canonicalUrl=${canonicalUrl} forced=${String(forced)}`);

  if (!forced && await isDuplicateOpenUrl(canonicalUrl)) {
    logger.info(`[openPage] 重复 URL，跳过`);
    await appendOpenPageLog({ timestamp: nowIso(), port: targetPort, url: targetUrl, canonical_url: canonicalUrl, forced, action: "skipped_duplicate", automation_action: normalizedAction });
    return { status: "duplicate", url: targetUrl, port: targetPort, message: "重复点击" };
  }

  // 获取外部浏览器实例
  const browsers = listInstances().filter(i => i.isExternal);
  logger.info(`[openPage] 内存实例总数=${browsers.length}，目标端口=${targetPort}`);
  browsers.forEach(b => logger.info(`  - id=${b.id} port=${b.port} wsEndpoint=${b.wsEndpoint ?? "(无)"}`))

  const targetBrowser = browsers.find(b => b.port === targetPort);
  if (!targetBrowser || !targetBrowser.wsEndpoint) {
    logger.error(`[openPage] 未找到端口 ${targetPort} 的实例，或 wsEndpoint 为空`);
    throw new AppError(404, `未找到运行在端口 ${targetPort} 的外部浏览器实例或连接信息丢失`);
  }
  logger.info(`[openPage] 找到实例 id=${targetBrowser.id} wsEndpoint=${targetBrowser.wsEndpoint}`);

  // 连接浏览器
  let context: BrowserContext;
  try {
    logger.info(`[openPage] 正在连接浏览器 CDP...`);
    context = await connectBrowser(targetBrowser.id, targetBrowser.wsEndpoint);
    logger.info(`[openPage] CDP 连接成功，当前页面数=${context.pages().length}`);
  } catch (error) {
    logger.error(`[openPage] 连接浏览器失败: ${toErrorMessage(error)}`);
    throw new AppError(500, "连接浏览器失败", toErrorMessage(error));
  }

  // 打开新页面
  let page: Page;
  try {
    logger.info(`[openPage] 创建新标签页...`);
    page = await context.newPage();
    if (args.isBatch) {
      const allPages = context.pages();
      for (const p of allPages) {
        if (p !== page) {
          await p.close().catch((err) => {
            logger.warn(`[openPage] 关闭旧标签页失败: ${toErrorMessage(err)}`);
          });
        }
      }
    }
    logger.info(`[openPage] 导航到 ${targetUrl} waitUntil=domcontentloaded `);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    logger.info(`[openPage] 导航完成，当前 URL=${page.url()}`);
  } catch (error) {
    logger.error(`[openPage] 打开页面失败: ${toErrorMessage(error)}`);
    throw new AppError(500, "打开页面失败", toErrorMessage(error));
  }

  // 执行自动化
  const config = await getAutomationConfig();
  const sendEnabled = Boolean(config.send_enabled);
  const message = String(args.message || "").trim();
  const username = pickTargetUsername(targetUrl);
  const meta = { port: targetPort, url: targetUrl, username, message };
  logger.info(`[openPage] 自动化配置: sendEnabled=${String(sendEnabled)} message长度=${message.length}`);

  if (normalizedAction === "runInstagramAction" && isInstagramUrl(targetUrl)) {
    logger.info(`[openPage] 命中 Instagram 自动化分支`);
    if (!message) throw new AppError(400, "Instagram URL 需要提供 message 参数");
    await runAutomationWithLog(meta, () =>
      runInstagramAction({
        page, targetUrl, greetingText: message, sendEnabled,
      }), sendEnabled);
  } else if (normalizedAction === "runFacebookAction" && isFacebookUrl(targetUrl)) {
    logger.info(`[openPage] 命中 Facebook 自动化分支`);
    await runAutomationWithLog(meta, () =>
      runFacebookAction({ context, targetUrl, message, sendEnabled }), sendEnabled);
  } else {
    logger.info(`[openPage] 未命中任何自动化分支（action=${normalizedAction} isIG=${String(isInstagramUrl(targetUrl))}）`);
  }

  // 自动关闭
  const closeAfterSeconds = targetBrowser ? cleanCloseAfterSeconds(targetBrowser.close_after_seconds) : 5;
  logger.info(`[openPage] 自动关闭设置: closeAfterSeconds=${closeAfterSeconds}`);
  if (closeAfterSeconds > 0 && !args.isBatch) {
    // await showCloseToast(page, closeAfterSeconds);
    closePageLater(page, closeAfterSeconds, targetPort, targetUrl);
  }

  await appendOpenPageLog({ timestamp: nowIso(), port: targetPort, url: targetUrl, canonical_url: canonicalUrl, forced, action: "opened", automation_action: normalizedAction });
  logger.info(`[openPage] 完成`);
  return { status: "success", url: targetUrl, port: targetPort, message: "页面已打开" };
}
