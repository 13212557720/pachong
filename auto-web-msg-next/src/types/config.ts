/**
 * 配置文件类型定义
 *
 * auto-web-msg-next.json 的数据结构，单配置文件（Headers/Cookie/Token 数组）
 * @module types/config
 */

export interface ConfigItem {
  /** 配置项名称 */
  key: string;
  /** 配置项值 */
  value: unknown;
}

export interface ActiveConfig {
  /** 激活的 headers 下标 */
  headers: number;
  /** 激活的 cookies 下标 */
  cookies: number;
  /** 激活的 tokens 下标 */
  tokens: number;
  /** 激活的 extraDataTemplates 下标 */
  extraDataTemplates: number;
}

/** 额外数据模板配置 */
export interface ExtraDataTemplate {
  created_at?: number;
  following?: {
    method: string;
    headers: Record<string, string>;
  };
  graphql: {
    method: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
  };
  wbloks: {
    method: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
    bkv?: string;
  };
}

/** 简化的单配置结构 */
export interface SimpleConfig {
  /** Headers 数组 */
  headers: ConfigItem[];
  /** Cookie 数组 */
  cookies: ConfigItem[];
  /** Token 数组 */
  tokens: ConfigItem[];
  /** 激活配置 */
  active: ActiveConfig;
  /** 外部浏览器监控目录 */
  monitorDirs?: string[];
  /** AdsPower Local API 端点（默认 http://127.0.0.1:50325） */
  adspowerEndpoint?: string;
  /** 自动化任务全局配置 */
  automation?: {
    send_enabled: boolean;
    highlight_selector: string;
  };
  /** 额外数据发包请求模板数组 */
  extraDataTemplates?: ConfigItem[];
}

/** 创建默认空配置 */
export function createEmptyConfig(): SimpleConfig {
  return { 
    headers: [], 
    cookies: [], 
    tokens: [], 
    extraDataTemplates: [],
    active: { headers: 0, cookies: 0, tokens: 0, extraDataTemplates: 0 }, 
    monitorDirs: [],
    adspowerEndpoint: "http://127.0.0.1:50325",
  };
}

