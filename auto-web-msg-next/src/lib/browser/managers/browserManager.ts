/**
 * 浏览器管理模块
 *
 * 负责 Chrome 实例的启动与连接：
 * - connectBrowser: 通过 CDP 协议连接已运行的浏览器
 * - launchBrowser: 使用 Playwright 启动本地浏览器
 * - getOrCreateContext: 获取或创建 BrowserContext
 * - openBrowserInstance: 完整的浏览器实例启动流程
 * - openBrowserInstanceWithLaunch: 使用 Playwright 启动的浏览器实例
 *
 * 流程：
 * 1. 检查端口是否可连接
 * 2. 如果不可连接，启动 Chrome 子进程
 * 3. 等待端口就绪
 * 4. 连接浏览器并创建上下文
 * 5. 更新全局状态
 *
 * @module lib/browser/managers/browserManager
 */
import { chromium, type BrowserContext } from "playwright";
import * as net from "node:net";
import { AppError, toErrorMessage } from "../core/errors";
import { getSession, saveSession } from "../core/state";
import { contextAlive, normalizeDataPath } from "../core/utils";
import { createLogger } from "@/lib/logger";

const logger = createLogger("browserManager");


/**
 * 通过 CDP 协议连接到已运行的 Chrome 浏览器，并获取其默认上下文
 *
 * @param id - 实例ID
 * @param debugUrl - 浏览器调试连接字符串 (如 ws://... 或 http://...)
 * @returns 已连接的 Playwright BrowserContext 实例
 * @throws {AppError} 连接失败时抛出 400 错误
 * @note 若已存在连接且可用则直接返回缓存上下文
 */
export async function connectBrowser(id: string, debugUrl: string): Promise<BrowserContext> {
  let session = getSession(id);
  if (!session) {
    session = saveSession(id, {});
  }
  if (session.context && contextAlive(session.context)) {
    logger.info(`[connectBrowser] 命中缓存，直接返回 context (id=${id})`);
    return session.context;
  }

  try {
    logger.info(`[connectBrowser] 开始连接 CDP: ${debugUrl}`);
    const browser = await chromium.connectOverCDP(debugUrl);
    const existingContexts = browser.contexts();
    let context: BrowserContext;
    if (existingContexts.length > 0 && contextAlive(existingContexts[0])) {
      context = existingContexts[0];
    } else {
      logger.info(`[connectBrowser] 无可用上下文，创建新 context`);
      context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    }
    saveSession(id, { context });
    logger.info(`[connectBrowser] 连接成功 (id=${id})`);
    return context;
  } catch (error) {
    logger.error(`[connectBrowser] 连接失败: ${debugUrl}`, error);
    throw new AppError(400, `无法连接到 ${debugUrl}`, toErrorMessage(error));
  }
}

/**
 * 连接外部浏览器实例
 *
 * @param args - 连接参数
 * @param args.id - 实例ID
 * @param args.wsEndpoint - WebSocket 调试地址
 * @param args.port - 调试端口号（可选，用于补齐信息）
 * @param args.data - 数据目录（可选）
 * @param args.name - 实例名称（可选）
 * @param args.close_after_seconds - 自动关闭秒数（可选）
 * @returns 包含操作类型（connected）、端口、数据目录的结果对象
 * @throws {AppError} 端口不可用或连接失败时抛出错误
 */
export async function openBrowserInstance(args: {
  id?: string;
  wsEndpoint?: string;
  port?: number;
  data?: string;
  name?: string | null;
  close_after_seconds?: number | null;
}): Promise<{ action: "connected"; id: string; data: string }> {
  const id = args.id || crypto.randomUUID();
  const wsEndpoint = args.wsEndpoint;
  const port = args.port;
  const name = args.name;
  const dataPath = args.data ? normalizeDataPath(args.data) : normalizeDataPath(`data/chrome_data_${id.substring(0, 8)}`);

  logger.info(`[openBrowserInstance] 开始连接实例 id=${id}`, { wsEndpoint, port, dataPath, name });

  if (wsEndpoint) {
    await connectBrowser(id, wsEndpoint);
  } else if (port) {
    async function tryConnectPort(port: number, host = "127.0.0.1"): Promise<boolean> {
      return new Promise((resolve) => {
        const socket = new net.Socket();
        const onDone = (ok: boolean) => {
          socket.destroy();
          resolve(ok);
        };

        socket.setTimeout(500);
        socket.once("connect", () => onDone(true));
        socket.once("timeout", () => onDone(false));
        socket.once("error", () => onDone(false));
        socket.connect(port, host);
      });
    }

    const isRunning = await tryConnectPort(port);
    if (!isRunning) {
      logger.error(`[openBrowserInstance] 端口不可连: ${port}`);
      throw new AppError(400, `无法连接到端口 ${port}`, "本地不再支持启动游览器，请先启动外部游览器");
    }
    await connectBrowser(id, `http://127.0.0.1:${port}`);
  } else {
    logger.error(`[openBrowserInstance] 缺少连接参数: wsEndpoint/port`);
    throw new AppError(400, "参数错误", "必须提供 wsEndpoint 或 port");
  }

  saveSession(id, {
    port: port ?? getSession(id)?.port ?? 0,
    wsEndpoint: wsEndpoint ?? getSession(id)?.wsEndpoint,
    data: dataPath,
    status: "running",
    name: name || getSession(id)?.name,
    close_after_seconds: args.close_after_seconds ?? getSession(id)?.close_after_seconds ?? 5
  });
  
  logger.info(`[openBrowserInstance] 连接完成 id=${id}`);
  return { action: "connected", id, data: dataPath };
}

