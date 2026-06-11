"use server";

import { getDeviceClient } from "@/lib/adspower-api/client";
import { ok, fail } from "@/actions/internal/action-result";
import { connectBrowser } from "@/lib/browser/managers/browserManager";
import { saveSession, listInstances, deleteSession } from "@/lib/browser/core/state";
import { createLogger } from "@/lib/logger";
import { getSession } from "@/lib/browser/core/state";
import { chromium } from "playwright";
import "@/lib/adspower-api/generated/v2";
import "@/lib/adspower-api/generated/v1";

const logger = createLogger("browser-manager-actions");

/**
 * 连接 Playwright 并将浏览器会话保存到内存中
 * @param userId - AdsPower 环境 ID
 * @param wsUrl - Playwright WebSocket 连接地址
 * @param profileName - AdsPower 环境名称（可选，若未提供则尝试读取缓存或 API）
 * @returns 是否连接成功
 */
async function connectAndSaveBrowserSession(userId: string, wsUrl: string, profileName?: string) {
  try {
    let finalName = profileName;
    if (!finalName) {
      const existing = getSession(userId);
      if (existing?.name) {
        finalName = existing.name;
      } else {
        try {
          const client = getDeviceClient("http://127.0.0.1:50325");
          const res = await client.getV1UserList({ query: { user_id: userId } });
          if (res.code === 0 && res.data?.list && res.data.list.length > 0) {
            finalName = res.data.list[0].name;
          }
          logger.info("回退拉取名称结果", { userId, name: finalName });
        } catch (e) {
          logger.error(`尝试回退拉取名称失败 userId=${userId}`, e);
        }
      }
    }

    await connectBrowser(userId, wsUrl);
    const portMatch = wsUrl.match(/:(\d+)\//);
    saveSession(userId, {
      wsEndpoint: wsUrl,
      status: "running",
      isExternal: true,
      user_id: userId,
      name: finalName,
      port: portMatch ? parseInt(portMatch[1], 10) : undefined
    });
    return true;
  } catch (err) {
    logger.error(`环境 ${userId} 活跃，但连接 Playwright 失败`, err);
    return false;
  }
}

/**
 * 获取 AdsPower 环境列表
 * @param page - 页码，默认 1
 * @param pageSize - 每页条数，默认 100
 * @param endpoint - AdsPower 本地 API 端点地址
 * @param groupId - 分组 ID，"all" 表示全部分组
 * @returns 包含环境列表的统一响应结果
 */
export async function listProfilesAction(page: number = 1, pageSize: number = 100, endpoint?: string, groupId?: string) {
  try {
    const client = getDeviceClient(endpoint || "http://127.0.0.1:50325");
    const query: Record<string, string> = {
      page: String(page),
      page_size: String(pageSize),
      user_sort: '{"last_open_time":"desc"}'
    };
    if (groupId && groupId !== "all") {
      query.group_id = String(groupId);
    }
    logger.info(`[listProfilesAction] 开始拉取环境列表`, { page, pageSize, groupId });
    const res = await client.getV1UserList({ query });

    // AdsPower 返回格式通常为 { code, msg, data: { list: [...] } }
    if (res.code !== 0) {
      throw new Error(res.msg || "获取列表失败");
    }

    return ok(res.data?.list || []);
  } catch (e) {
    return fail(e);
  }
}

/**
 * 启动指定的 AdsPower 环境，并在成功后自动连接并保存到内存
 * @param userId - 环境 ID
 * @param headless - 是否以无头模式启动
 * @param endpoint - AdsPower API 地址
 * @param profileName - 环境名称，保存到内存时使用
 * @returns 启动结果信息
 */
export async function startBrowserAction(userId: string, headless: boolean = false, endpoint?: string, profileName?: string) {
  try {
    const client = getDeviceClient(endpoint || "http://127.0.0.1:50325");
    logger.info(`[startBrowserAction] 尝试启动环境`, { userId, headless });
    const res = await client.getV1BrowserStart({
      query: {
        user_id: userId,
        open_tabs: "1",
        headless: headless ? "1" : "0"
      }
    });

    if (res.code !== 0) {
      throw new Error(res.msg || "启动失败");
    }

    if (res.data && res.data.ws && res.data.ws.puppeteer) {
      await connectAndSaveBrowserSession(userId, res.data.ws.puppeteer, profileName);
    }

    logger.info(`[startBrowserAction] 启动成功`, { userId });
    return ok(res.data);
  } catch (e) {
    logger.error(`[startBrowserAction] 启动失败`, e);
    return fail(e);
  }
}

/**
 * 停止指定的 AdsPower 环境
 * @param userId - 环境 ID
 * @param endpoint - AdsPower API 地址
 * @returns 是否停止成功
 */
export async function stopBrowserAction(userId: string, endpoint?: string) {
  try {
    const client = getDeviceClient(endpoint || "http://127.0.0.1:50325");
    logger.info(`[stopBrowserAction] 尝试停止环境`, { userId });
    const res = await client.getV1BrowserStop({ query: { user_id: userId } });
    if (res.code !== 0) {
      throw new Error(res.msg || "停止失败");
    }
    logger.info(`[stopBrowserAction] 停止成功`, { userId });
    return ok(true);
  } catch (e) {
    logger.error(`[stopBrowserAction] 停止失败`, e);
    return fail(e);
  }
}

/**
 * 获取所有的 AdsPower 环境分组列表
 * @param endpoint - AdsPower API 地址
 * @returns 分组列表数组
 */
export async function listGroupsAction(endpoint?: string) {
  try {
    const client = getDeviceClient(endpoint || "http://127.0.0.1:50325");
    logger.info(`[listGroupsAction] 获取分组列表`);
    const res = await client.getV1GroupList({ query: { page: "1", page_size: "100" } });
    if (res.code !== 0) {
      throw new Error(res.msg || "获取分组失败");
    }
    return ok(res.data?.list || []);
  } catch (e) {
    return fail(e);
  }
}

/**
 * 检查单个 AdsPower 环境是否处于运行状态，若运行中则自动连接
 * @param profileId - 环境 ID
 * @param endpoint - AdsPower API 地址
 * @param profileName - 环境名称，保存到内存时使用
 * @returns 环境的当前运行状态
 */
export async function checkActiveProfilesAction(profileId: string, endpoint?: string, profileName?: string) {
  try {
    const client = getDeviceClient(endpoint || "http://127.0.0.1:50325");
    const res = await client.getV2BrowserProfileActive({ query: { profile_id: profileId } });
    if (res.code !== 0) {
      throw new Error(res.msg || "查询运行状态失败");
    }

    if (res.data?.status === "Active" && res.data.ws?.puppeteer) {
      await connectAndSaveBrowserSession(profileId, res.data.ws.puppeteer, profileName);
    }

    logger.info(`[checkActiveProfilesAction] 检查状态完成`, { profileId, status: res.data?.status });
    return ok(res.data);
  } catch (e) {
    logger.error(`[checkActiveProfilesAction] 检查状态失败`, e);
    return fail(e);
  }
}

/**
 * 扫描指定环境（或最近 50 个），发现 Active 状态则连接并保存到内存
 * @param profileIds 若提供则只扫描这些 ID，否则扫描最近 50 个
 * @param endpoint AdsPower API 地址
 */
export async function scanAndConnectActiveBrowsersAction(profileIds?: string[], endpoint?: string) {
  try {
    const client = getDeviceClient(endpoint || "http://127.0.0.1:50325");

    let targetIds: string[];

    if (profileIds && profileIds.length > 0) {
      targetIds = profileIds;
    } else {
      const listRes = await client.getV1UserList({
        query: { page: "1", page_size: "50", user_sort: '{"last_open_time":"desc"}' }
      });
      if (listRes.code !== 0 || !listRes.data?.list) {
        throw new Error(listRes.msg || "获取最近环境列表失败");
      }
      targetIds = listRes.data.list.map(p => p.user_id).filter(Boolean) as string[];
    }

    // 加上内存中已有的环境，防止遗漏检查它们是否已被关闭
    const memoryIds = listInstances().map(i => i.id);
    targetIds = Array.from(new Set([...targetIds, ...memoryIds]));

    let connectedCount = 0;

    for (const userId of targetIds) {
      try {
        const activeRes = await client.getV2BrowserProfileActive({ query: { profile_id: userId } });
        logger.debug(`active profile result: ${userId}`, activeRes);
        if (activeRes.code === 0) {
          if (activeRes.data?.status === "Active" && activeRes.data.ws?.puppeteer) {
            const success = await connectAndSaveBrowserSession(userId, activeRes.data.ws.puppeteer);
            if (success) connectedCount++;
          } else {
            // 浏览器已关闭，从内存中清除
            deleteSession(userId);
          }
        }
        await new Promise(r => setTimeout(r, 400));
      } catch (err) {
        logger.warn(`扫描环境 ${userId} 状态失败`, err);
      }
    }

    return ok({ connectedCount, scannedCount: targetIds.length });
  } catch (e) {
    return fail(e);
  }
}



/**
 * 获取当前 Next.js 内存中维护的所有浏览器实例状态字典
 * 主要用于前端快速对比哪些实例已经接管
 * @returns 状态字典，键为 userId，值为状态文字（如 "运行中"）
 */
export async function getMemoryStatusesAction() {
  try {
    const instances = listInstances();
    const statuses: Record<string, string> = {};
    for (const inst of instances) {
      if (inst.status === "running") {
        statuses[inst.id] = "运行中";
      }
    }
    return ok(statuses);
  } catch (e) {
    return fail(e);
  }
}

/**
 * 对指定的 WebSocket 端点进行后台截屏
 * @param id - 浏览器会话 ID
 * @param wsEndpoint - Playwright WebSocket 连接地址
 * @returns 包含截图 Base64 数据的字符串，若失败则返回 null
 */
async function captureScreenshotByEndpoint(id: string, wsEndpoint: string): Promise<string | null> {
  logger.info(`开始对端点截图: ${wsEndpoint}`);

  const session = getSession(id);
  if (session && session.context && !session.context.isClosed()) {
    try {
      logger.info("复用内存上下文");
      const pages = session.context.pages();
      if (pages.length > 0) {
        const activePage = pages[pages.length - 1];
        const buffer = await activePage.screenshot({ type: "jpeg", quality: 20, timeout: 2000 });
        logger.info(`内存复用截图成功，大小: ${buffer.length} bytes`);
        return `data:image/jpeg;base64,${buffer.toString("base64")}`;
      }
    } catch (e) {
      logger.info("内存复用截图失败，降级为直连", e);
    }
  }

  try {
    logger.info("正在连接 CDP");
    const browser = await chromium.connectOverCDP(wsEndpoint, { timeout: 2000 });
    logger.info("CDP 连接成功");

    const contexts = browser.contexts();
    logger.info(`获取到 ${contexts.length} 个上下文`);
    if (contexts.length === 0) {
      await browser.close();
      logger.info("上下文数量为 0，退出");
      return null;
    }
    const pages = contexts[0].pages();
    logger.info(`上下文中存在 ${pages.length} 个页面`);
    if (pages.length === 0) {
      await browser.close();
      logger.info("页面数量为 0，退出");
      return null;
    }

    const activePage = pages[pages.length - 1];
    logger.info("准备执行 screenshot()");
    const buffer = await activePage.screenshot({ type: "jpeg", quality: 20 });
    logger.info(`截图成功，大小: ${buffer.length} bytes`);

    await browser.close();
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch (err) {
    logger.error(`获取外部实例的截图失败 (${wsEndpoint})`, err);
    return null;
  }
}

/**
 * 抓取所有外部实例屏幕截图 (Server Action)
 */
export async function getScreenshotsAction() {
  try {
    const results: Array<{ id: string; image: string; profileName?: string }> = [];
    const browsers = listInstances().filter(i => i.isExternal);

    const tasks = browsers.map(async (b) => {
      if (!b.wsEndpoint) return;
      const image = await captureScreenshotByEndpoint(b.id, b.wsEndpoint);
      if (image) {
        results.push({ id: b.id, image, profileName: b.name });
      }
    });

    await Promise.allSettled(tasks);
    results.sort((a, b) => a.id.localeCompare(b.id));
    return ok(results);
  } catch (e) {
    return fail(e);
  }
}
