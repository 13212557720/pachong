"use server";

import {
  getInstagramUsersListInstagramUsers,
  getInstagramUsersListDistinctIpLocations,
} from "@/api/generated/instagram_users";
import { ok, fail } from "@/actions/internal/action-result";
import {
  startGetDataTask,
  getGetDataTaskProgress,
  type CrawlTaskState,
} from "@/app/getdata/_services/getdata-crawl";
import { instagramUserFiltersToQuery, withRaw } from "@/utils/instagram-filters";
import { normalizePaging } from "@/utils";
import type {
  GetDataActionParams,
  InstagramUserFilters,
  GetDataTaskProgress,
} from "@/types/api";
import { getSession } from "@/lib/browser/core/state";
import { connectBrowser } from "@/lib/browser/managers/browserManager";
import { readConfig, writeConfig } from "@/actions/internal/config-file";
import { createLogger } from "@/lib/logger";

const logger = createLogger("getdata-actions");
function crawlTaskToProgress(task: CrawlTaskState): GetDataTaskProgress {
  return {
    run_id: task.runId,
    status: task.status,
    userid: task.userid,
    started_at: task.startedAt.toISOString(),
    ended_at: task.endedAt?.toISOString(),
    pages_fetched: task.pagesFetched,
    records_fetched: task.recordsFetched,
    current_max_id: task.currentMaxId,
    logs: task.logs,
    ...(task.result && { result: task.result }),
    ...(task.error && { error: task.error }),
  };
}

/**
 * 分页查询爬取的用户数据（直接调用 generated API，无中转函数）
 * @param params.page - 目标页码
 * @param params.page_size - 每页大小
 * @param params.filters - 筛选条件对象
 * @returns 包含 items 和分页信息的响应
 */
export async function listGetDataUsersAction(params: {
  page: number;
  page_size: number;
  filters?: InstagramUserFilters;
}) {
  try {
    const { page, pageSize } = normalizePaging(params.page, params.page_size);
    const res = await getInstagramUsersListInstagramUsers({
      query: {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        ...instagramUserFiltersToQuery(params.filters),
      },
    });
    const items = (res.items ?? []).map(withRaw);
    return ok({
      items,
      page,
      page_size: pageSize,
      total: res.total ?? 0,
      total_pages: Math.ceil((res.total ?? 0) / pageSize),
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * 启动新的 Instagram 爬虫任务（逻辑复杂，保留委托给 server.ts）
 * @param params - 包含目标用户 ID 和请求 Headers
 * @returns 包含生成任务 ID 的响应
 */
export async function startGetDataTaskAction(params: GetDataActionParams) {
  try {
    return ok(await startGetDataTask(params));
  } catch (e) {
    return fail(e);
  }
}

/**
 * 导出爬取的用户数据（直接调用 generated API，无中转函数）
 * @param params.filters - 筛选条件对象
 * @param params.limit - 导出的最大数量，默认 1000
 * @returns 包含 items 和建议文件名的响应
 */
export async function exportGetDataUsersAction(params: {
  filters?: InstagramUserFilters;
  limit?: number;
}) {
  try {
    const res = await getInstagramUsersListInstagramUsers({
      query: {
        limit: params.limit ?? 1000,
        offset: 0,
        ...instagramUserFiltersToQuery(params.filters),
      },
    });
    const items = (res.items ?? []).map(withRaw);
    return ok({ items, file_name: `getdata-users-${items.length}` });
  } catch (e) {
    return fail(e);
  }
}

/**
 * 获取指定的爬虫任务运行进度
 * @param runId - 任务的唯一标识 ID
 * @returns 当前任务进度的前端安全格式数据
 */
export async function getDataTaskProgressAction(runId: string) {
  try {
    const task = getGetDataTaskProgress(runId);
    if (!task) throw new Error(`任务不存在: ${runId}`);
    return ok(crawlTaskToProgress(task));
  } catch (e) {
    return fail(e);
  }
}

/**
 * 获取所有去重的 IP 归属地，用于前端下拉筛选
 * @returns 字符串数组，包含所有已有的国家/地区名称
 */
export async function listDistinctIpLocationsAction() {
  try {
    const res = await getInstagramUsersListDistinctIpLocations();
    return ok(res.items ?? []);
  } catch (e) {
    return fail(e);
  }
}

/**
 * 用 Playwright 打开新页面，拦截 Instagram following 请求以及额外数据所需请求，提取 Headers 并保存到配置文件
 * @param browserId - 环境的 userId，用于复用内存中的 CDP 链接
 * @param targetUrl - 要打开的 Instagram 主页，必须带有粉丝列表入口和“关于此账号”选项
 * @returns 包含自动生成 KeyName 的响应
 */
export async function autoFetchInstagramHeaderAction(
  browserId: string,
  targetUrl: string,
) {
  try {
    const session = getSession(browserId);
    if (!session?.wsEndpoint) {
      throw new Error("浏览器实例未连接，请先在浏览器管理器中连接该实例");
    }

    const context = await connectBrowser(browserId, session.wsEndpoint);
    const page = await context.newPage();

    let capturedFollowingHeaders: Record<string, string> | null = null;
    let graphqlHeaders: Record<string, string> | null = null;
    let graphqlBody: string | null = null;
    let wbloksHeaders: Record<string, string> | null = null;
    let wbloksBody: string | null = null;
    let wbloksBkv: string = "";

    // 监听请求
    const handler = async (request: import("playwright").Request) => {
      const url = request.url();
      const method = request.method();
      if (url.includes("/api/v1/friendships/") && !capturedFollowingHeaders) {
        const headers = await request.allHeaders();
        // 必须包含关键的鉴权头部，以过滤掉 OPTIONS 预检请求或跳转请求
        if (headers["x-ig-www-claim"] && headers["x-ig-app-id"]) {
          capturedFollowingHeaders = headers;
          logger.info(`[AutoFetch] 捕获到了完整的 API 请求 Header: ${url}`);
        }
      }

      if (method === "POST") {
        const postData = request.postData() || "";

        if (
          url.includes("/graphql/query") &&
          postData.includes("PolarisProfilePageContentQuery")
        ) {
          const headers = await request.allHeaders();
          graphqlHeaders = Object.fromEntries(
            Object.entries(headers).filter(([k]) => !k.startsWith(":")),
          );
          graphqlBody = postData.replace(
            /%22id%22%3A%22\d+%22/g,
            "%22id%22%3A%22{{TARGET_USER_ID}}%22",
          );
          logger.info(`[AutoFetch] 捕获到了 GraphQL 请求 (粉丝数/简介)`);
        }

        if (
          url.includes("/async/wbloks/fetch/") &&
          url.includes("appid=com.bloks.www.ig.about_this_account")
        ) {
          const headers = await request.allHeaders();
          wbloksHeaders = Object.fromEntries(
            Object.entries(headers).filter(([k]) => !k.startsWith(":")),
          );
          wbloksBody = postData.replace(
            /%22target_user_id%22%3A%22\d+%22/g,
            "%22target_user_id%22%3A%22{{TARGET_USER_ID}}%22",
          );
          try {
            wbloksBkv = new URL(url).searchParams.get("__bkv") || "";
          } catch {}
          logger.info(
            `[AutoFetch] 捕获到了 Wbloks 请求 (IP 属地), bkv: ${wbloksBkv}`,
          );
        }
      }
    };
    page.on("request", handler);

    try {
      await page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
      logger.info("打开了网页", targetUrl);

      const urlObj = new URL(targetUrl);
      const username = urlObj.pathname.split("/").filter(Boolean)[0];
      logger.info("提取了 username", username);

      // --- 阶段1：点击 following 链接触发目标请求 ---
      logger.info(`[AutoFetch] 开始等待 Following 链接出现 (最大等待 30s)`);
      const followinglocator =
        'section div:nth-child(3) div:nth-child(3) a[href="#"][role="link"]';
      await page
        .waitForSelector(followinglocator, { state: "visible", timeout: 30000 })
        .catch(() => null);
      const followingLink = page.locator(followinglocator).first();
      if ((await followingLink.count()) > 0) {
        logger.info(`[AutoFetch] 找到了 Following 链接，尝试点击...`);
        await followingLink.click();
        logger.info(`[AutoFetch] 已经点击 Following 链接`);
      } else {
        logger.info(`[AutoFetch] 警告：没有找到 Following 链接!`);
      }

      // 等待最多 5 秒让 following 请求触发
      logger.info(`[AutoFetch] 等待 Following 请求拦截器响应 (最大 5s)...`);
      for (let i = 0; i < 5; i++) {
        if (capturedFollowingHeaders) {
          logger.info(`[AutoFetch] 成功在等待期内获取到 Following Headers`);
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      // --- 阶段2：关闭弹窗，准备提取额外数据模板 ---
      logger.info(`[AutoFetch] 发送 Escape 键关闭可能打开的弹窗...`);
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 1000));

      const OPTIONS_ICON_SELECTOR =
        'section > main header section div div[role="button"] svg';
      const DIALOG_BUTTONS_SELECTOR =
        'body div[tabindex="-1"] div[role="dialog"] button';

      logger.info(`[AutoFetch] 开始查找右上角的选项图标 (...)`);
      await page
        .waitForSelector(OPTIONS_ICON_SELECTOR, { timeout: 15_000 })
        .catch(() => {
          logger.info(`[AutoFetch] 警告：等待 15s 未找到选项图标`);
        });
      const optionIcons = page.locator(OPTIONS_ICON_SELECTOR);
      const optionCount = await optionIcons.count();
      logger.info(`[AutoFetch] 查找到 ${optionCount} 个选项图标`);

      if (optionCount > 0) {
        logger.info(`[AutoFetch] 尝试点击选项图标...`);
        await optionIcons.first().click();

        logger.info(`[AutoFetch] 开始等待弹窗内的按钮加载...`);
        await page
          .waitForSelector(DIALOG_BUTTONS_SELECTOR, { timeout: 15_000 })
          .catch(() => {
            logger.info(`[AutoFetch] 警告：等待 15s 未找到弹窗按钮`);
          });
        const dialogButtons = page.locator(DIALOG_BUTTONS_SELECTOR);
        const btnCount = await dialogButtons.count();
        logger.info(`[AutoFetch] 弹窗内查找到 ${btnCount} 个按钮`);

        if (btnCount > 4) {
          logger.info(
            `[AutoFetch] 尝试点击第 5 个按钮（假设为“关于此账号”）...`,
          );
          await dialogButtons.nth(4).click();
          logger.info(`[AutoFetch] 点击了 '关于此账号' 按钮`);
        } else {
          logger.info(
            `[AutoFetch] 警告：弹窗内按钮少于 5 个，无法点击“关于此账号”`,
          );
        }
      }

      // 等待 GraphQL 和 wBloks 捕获，最长等 10 秒
      logger.info(
        `[AutoFetch] 开始等待 WBloks(IP) / GraphQL 请求触发 (最大等待 10s)...`,
      );
      for (let i = 0; i < 10; i++) {
        if (graphqlBody && wbloksBody) {
          logger.info(
            `[AutoFetch] 成功在等待期内获取到所有 GraphQL/WBloks 请求`,
          );
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      logger.info(
        `[AutoFetch] 收集阶段结束。是否捕获 Following: ${!!capturedFollowingHeaders}, GraphQL: ${!!graphqlBody}, Wbloks: ${!!wbloksBody}`,
      );
    } finally {
      page.off("request", handler);
      await page.close().catch(() => undefined);
    }

    if (!capturedFollowingHeaders) {
      throw new Error(
        "未能捕获到 Instagram following 请求，请确认该浏览器实例已登录 Instagram",
      );
    }
    if (!graphqlHeaders || !graphqlBody) {
      throw new Error("未能捕获到 GraphQL 请求，请确认页面已完全加载");
    }
    if (!wbloksHeaders || !wbloksBody) {
      throw new Error(
        "未能捕获到 IP 属地 (wBloks) 请求，请确认已触发 '关于此账号' 弹窗",
      );
    }

    // 剔除 HTTP/2 伪头 (针对 Following Header)
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(capturedFollowingHeaders)) {
      if (!k.startsWith(":")) cleaned[k] = String(v);
    }

    // 生成键名
    const now = new Date();
    const keyName = "AutoFetch_" + now.toLocaleString();

    // 保存到配置文件
    const config = readConfig();

    // 1. 存入 ExtraDataTemplates
    config.extraDataTemplates = config.extraDataTemplates ?? [];

    const parseBody = (b: string | null) => {
      if (!b) return {};
      const params = new URLSearchParams(b);
      const obj: Record<string, unknown> = {};
      for (const [k, v] of params.entries()) {
        try {
          // 尝试将 value 解析为 JSON，如果是 JSON 字符串（比如 variables）则转为对象
          obj[k] = v.startsWith("{") || v.startsWith("[") ? JSON.parse(v) : v;
        } catch {
          obj[k] = v;
        }
      }
      return obj;
    };

    const templateObj = {
      created_at: now.getTime(),
      following: {
        method: "GET",
        headers: cleaned,
      },
      graphql: {
        method: "POST",
        headers: graphqlHeaders,
        body: parseBody(graphqlBody),
      },
      wbloks: {
        method: "POST",
        headers: wbloksHeaders,
        body: parseBody(wbloksBody),
        bkv: wbloksBkv,
      },
    };

    config.extraDataTemplates.push({ key: keyName, value: templateObj });

    writeConfig(config);
    return ok({ key: keyName });
  } catch (e) {
    return fail(e);
  }
}
