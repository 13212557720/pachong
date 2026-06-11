"use server";

import { normalizeOpenPageAction, openPage } from "@/lib/browser";
import { ok, fail } from "@/actions/internal/action-result";
import { createLogger } from "@/lib/logger";

const logger = createLogger("page-actions");

/**
 * 控制指定端口的浏览器打开页面并执行自动化动作
 * @param params.port - 浏览器调试端口
 * @param params.url - 要打开的目标网页 URL
 * @param params.forced - 是否强制刷新（忽略缓存或忽略是否已在同一页面）
 * @param params.message - 需要发送的消息内容（如果 action 包含发送消息）
 * @param params.action - 页面加载后执行的自动化动作名称
 * @returns 包含执行结果的对象
 */
export async function openPageAction(params: {
  port: number;
  url: string;
  forced?: boolean;
  message?: string;
  action?: string;
}) {
  try {
    logger.info(`[openPageAction] 准备打开页面 port=${params.port}, url=${params.url}, action=${params.action}`);
    if (!params.url?.trim()) throw new Error("url 不能为空");
    return ok(await openPage({
      port: params.port,
      url: params.url,
      forced: params.forced,
      message: params.message?.trim() || undefined,
      action: normalizeOpenPageAction(params.action),
    }));
  } catch (e) {
    logger.error(`[openPageAction] 打开页面失败 port=${params.port}, url=${params.url}`, e);
    return fail(e);
  }
}
