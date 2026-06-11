/**
 * 配置文件读写库
 *
 * 管理 auto-web-msg-next.json（JSON 格式），单配置文件（Headers/Cookie/Token 数组）
 *
 * @module services/internal/config-file
 */

import fs from "node:fs";
import path from "node:path";
import type {
  SimpleConfig,
  ActiveConfig,
  ExtraDataTemplate,
} from "@/types/config";
import { createEmptyConfig } from "@/types/config";

import { SEND_BUTTON_SELECTOR } from "@/lib/browser/core/selectors";

/** 配置文件存放的绝对路径 */
const CONFIG_FILE = path.resolve(process.cwd(), "auto-web-msg-next.json");

/** 内存中缓存的配置对象，避免频繁读取磁盘 */
let cachedConfig: SimpleConfig | null = null;

/**
 * 规范化激活的配置索引对象
 * 确保各索引值为非负整数
 * @param active - 原始激活配置数据
 * @returns 规范化后的 ActiveConfig
 */
function normalizeActive(active: unknown): ActiveConfig {
  const toNonNegativeInt = (v: unknown): number =>
    Number.isInteger(v) && typeof v === "number" && v >= 0 ? v : 0;

  if (active && typeof active === "object") {
    const a = active as {
      headers?: unknown;
      cookies?: unknown;
      tokens?: unknown;
      extraDataTemplates?: unknown;
    };
    return {
      headers: toNonNegativeInt(a.headers),
      cookies: toNonNegativeInt(a.cookies),
      tokens: toNonNegativeInt(a.tokens),
      extraDataTemplates: toNonNegativeInt(a.extraDataTemplates),
    };
  }
  return { headers: 0, cookies: 0, tokens: 0, extraDataTemplates: 0 };
}

/** 读取配置文件，不存在时创建并返回默认空配置 */
export function readConfig(): SimpleConfig {
  if (cachedConfig) return cachedConfig;

  if (!fs.existsSync(CONFIG_FILE)) {
    const empty = createEmptyConfig();
    writeConfig(empty);
    return empty;
  }

  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8").trim();
    if (!raw) {
      const empty = createEmptyConfig();
      writeConfig(empty);
      return empty;
    }
    const parsed = JSON.parse(raw) as SimpleConfig;
    if (!parsed.headers) parsed.headers = [];
    if (!parsed.cookies) parsed.cookies = [];
    if (!parsed.tokens) parsed.tokens = [];
    if (!parsed.extraDataTemplates) parsed.extraDataTemplates = [];
    parsed.active = normalizeActive(parsed.active);
    cachedConfig = parsed;
    return cachedConfig;
  } catch {
    const empty = createEmptyConfig();
    writeConfig(empty);
    return empty;
  }
}

/** 写入配置文件 */
export function writeConfig(config: SimpleConfig): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  cachedConfig = config;
}

function configValueToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return JSON.stringify(value);
}

/** 获取当前激活的 Token 值 */
export function getActiveToken(): string {
  const config = readConfig();
  const idx = config.active.tokens;
  if (!config.tokens || config.tokens.length === 0) return "";
  if (idx < 0 || idx >= config.tokens.length) return "";
  return configValueToString(config.tokens[idx].value);
}

/** 获取当前激活的 Cookie 值 */
export function getActiveCookie(): string {
  const config = readConfig();
  const idx = config.active.cookies;
  if (!config.cookies || config.cookies.length === 0) return "";
  if (idx < 0 || idx >= config.cookies.length) return "";
  return configValueToString(config.cookies[idx].value);
}

/** 获取当前激活的 Headers 值 */
export function getActiveHeaders(): Record<string, string> {
  const config = readConfig();
  const idx = config.active.headers;
  if (!config.headers || config.headers.length === 0) return {};
  if (idx < 0 || idx >= config.headers.length) return {};
  const value = config.headers[idx].value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, raw]) => [key, String(raw ?? "")])
    );
  }
  try {
    return JSON.parse(configValueToString(value) || "{}");
  } catch {
    return {};
  }
}

/** 检查是否有 token（供前端判断是否需要跳转到设置页） */
export function hasToken(): boolean {
  const config = readConfig();
  const idx = config.active.tokens;
  if (!config.tokens || config.tokens.length === 0) return false;
  if (idx < 0 || idx >= config.tokens.length) return false;
  return !!config.tokens[idx].value;
}

/** 读取 AdsPower 端点（不存在时返回默认地址） */
export function getAdsPowerEndpoint(): string {
  const config = readConfig();
  return (config.adspowerEndpoint || "http://127.0.0.1:50325").replace(
    /\/+$/,
    "",
  );
}

/** 将 AdsPower 端点持久化到配置文件 */
export function setAdsPowerEndpoint(endpoint: string): void {
  const config = readConfig();
  config.adspowerEndpoint = endpoint.replace(/\/+$/, "");
  writeConfig(config);
}

/** 获取全局自动化配置 */
export function getAutomationConfigData(): {
  send_enabled: boolean;
  highlight_selector: string;
} {
  const config = readConfig();
  if (config.automation) {
    return config.automation;
  }
  return {
    send_enabled: false,
    highlight_selector: SEND_BUTTON_SELECTOR,
  };
}

/** 写入全局自动化配置 */
export function setAutomationConfigData(automation: {
  send_enabled: boolean;
  highlight_selector: string;
}): void {
  const config = readConfig();
  config.automation = automation;
  writeConfig(config);
}

/** 获取额外数据发包请求模板 (当前激活的) */
export function getExtraDataTemplate() {
  const config = readConfig();
  const idx = config.active.extraDataTemplates;
  if (!config.extraDataTemplates || config.extraDataTemplates.length === 0) return null;
  if (idx < 0 || idx >= config.extraDataTemplates.length) return null;
  
  const val = config.extraDataTemplates[idx].value;
  if (!val || typeof val !== "object") return null;
  return val as ExtraDataTemplate;
}
