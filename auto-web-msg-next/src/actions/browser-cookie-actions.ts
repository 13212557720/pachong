"use server";

import type { BrowserContext } from "playwright";
import { connectBrowser } from "@/lib/browser/managers/browserManager";
import { MAX_EXPIRY_TIMESTAMP, type CookieItem } from "@/types/browser";
import { ok, fail } from "@/actions/internal/action-result";
import { createLogger } from "@/lib/logger";

const logger = createLogger("cookie-actions");

import { listInstances } from "@/lib/browser/core/state";

/**
 * 根据端口获取正确的实例ID和端点
 */
function getConnectionParams(port: number) {
  const instances = listInstances();
  const instance = instances.find(i => i.port === port);
  const id = instance?.id || String(port);
  const wsEndpoint = instance?.wsEndpoint || `http://127.0.0.1:${port}`;
  return { id, wsEndpoint };
}

/**
 * 获取指定浏览器端口下的所有 Cookie，可根据 URLs 过滤
 * @param params.port - 浏览器调试端口
 * @param params.urls - 需要获取 Cookie 的目标 URL 列表，如果为空则获取所有 Cookie
 * @returns 包含 port 和 cookies 数组的对象
 */
export async function listCookiesAction(params: { port: number; urls?: string[] | null }) {
  try {
    logger.info(`[listCookiesAction] 开始获取 port=${params.port}`);
    const { id, wsEndpoint } = getConnectionParams(params.port);
    const context = await connectBrowser(id, wsEndpoint);
    const cookies = await context.cookies(params.urls || undefined);
    logger.info(`[listCookiesAction] 成功获取 ${cookies.length} 个 Cookie`);
    return ok({ port: params.port, cookies });
  } catch (e) {
    logger.error(`[listCookiesAction] 获取失败 port=${params.port}`, e);
    return fail(e);
  }
}

/**
 * 清除指定浏览器端口下的所有 Cookie
 * @param params.port - 浏览器调试端口
 * @returns 包含 port 和 清除成功消息的对象
 */
export async function clearCookiesAction(params: { port: number }) {
  try {
    logger.info(`[clearCookiesAction] 开始清除 port=${params.port}`);
    const { id, wsEndpoint } = getConnectionParams(params.port);
    const context = await connectBrowser(id, wsEndpoint);
    await context.clearCookies();
    logger.info(`[clearCookiesAction] 清除成功`);
    return ok({ port: params.port, message: "Cookie 已清除" });
  } catch (e) {
    logger.error(`[clearCookiesAction] 清除失败 port=${params.port}`, e);
    return fail(e);
  }
}

/**
 * 向指定浏览器端口注入新的 Cookie 列表
 * @param params.port - 浏览器调试端口
 * @param params.cookies - 需要注入的 Cookie 配置项数组
 * @returns 包含成功注入数量的对象
 */
export async function addCookiesAction(params: { port: number; cookies: CookieItem[] }) {
  try {
    logger.info(`[addCookiesAction] 开始注入 port=${params.port}, 原始数量=${params.cookies.length}`);
    const cookies = ensureCookies(params.cookies);
    if (cookies.length === 0) {
      throw new Error("cookies 不能为空");
    }

    const { id, wsEndpoint } = getConnectionParams(params.port);
    const context = await connectBrowser(id, wsEndpoint);
    const normalized = cookies.map(buildCookieEntry);
    await context.addCookies(normalized);
    logger.info(`[addCookiesAction] 成功注入 ${normalized.length} 个 Cookie`);
    return ok({ port: params.port, count: normalized.length, message: `成功注入 ${normalized.length} 个 Cookie` });
  } catch (e) {
    logger.error(`[addCookiesAction] 注入失败 port=${params.port}`, e);
    return fail(e);
  }
}

/**
 * 内部工具：确保传入的 Cookie 数据结构有效并过滤掉无效项
 * @param cookies - 客户端传入的可能不安全的 Cookie 数据
 * @returns 经过校验和类型转换后的安全 CookieItem 数组
 */
function ensureCookies(cookies: unknown): CookieItem[] {
  if (!Array.isArray(cookies)) return [];
  return cookies
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
    .map((item) => ({
      name: String(item.name || "").trim(),
      value: String(item.value || ""),
      domain: String(item.domain || "").trim(),
      path: item.path == null ? "/" : String(item.path),
      expires: item.expires == null ? undefined : Number(item.expires),
      httpOnly: Boolean(item.httpOnly),
      secure: Boolean(item.secure),
      sameSite: item.sameSite == null ? "Lax" : String(item.sameSite),
      permanent: Boolean(item.permanent),
    }))
    .filter((item) => item.name.length > 0 && item.domain.length > 0);
}

/**
 * 内部工具：规范化 Cookie 的 SameSite 属性
 * @param sameSite - 原始 SameSite 值
 * @returns "Strict", "Lax", 或 "None" 之一，默认回退为 "Lax"
 */
function normalizeSameSite(sameSite: string | undefined): "Strict" | "Lax" | "None" {
  const normalized = String(sameSite || "Lax").trim().toLowerCase();
  if (normalized === "strict") return "Strict";
  if (normalized === "none") return "None";
  return "Lax";
}

/**
 * 内部工具：将前端传入的 CookieItem 转换为 Playwright \`addCookies\` 需要的格式
 * 主要处理过期时间等逻辑
 * @param cookie - 规范化的 CookieItem 对象
 * @returns 符合 Playwright API 要求的 Cookie 参数对象
 */
function buildCookieEntry(cookie: CookieItem): Parameters<BrowserContext["addCookies"]>[0][number] {
  let expires = cookie.expires ?? undefined;
  if (cookie.permanent && expires == null) {
    expires = Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60;
  }
  const safeExpires = expires && expires > 0 ? Math.min(expires, MAX_EXPIRY_TIMESTAMP) : undefined;
  return {
    name: cookie.name,
    value: cookie.value || "",
    domain: cookie.domain.trim().toLowerCase(),
    path: cookie.path || "/",
    httpOnly: Boolean(cookie.httpOnly),
    secure: Boolean(cookie.secure),
    sameSite: normalizeSameSite(cookie.sameSite),
    ...(safeExpires ? { expires: safeExpires } : {}),
  };
}
