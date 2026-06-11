/**
 * 组件 Props 类型定义模块
 *
 * 定义所有 React 组件的 Props 接口，确保类型安全和一致性
 * @module types/components
 */
import type { SameSiteOption } from "@/lib/client/constants";

/**
 * 新建 Cookie 表单数据类型
 *
 * @property name - Cookie 名称
 * @property value - Cookie 值
 * @property domain - 所属域名
 * @property path - Cookie 路径
 * @property httpOnly - 是否仅 HTTP 传输
 * @property secure - 是否仅通过 HTTPS 传输
 * @property sameSite - SameSite 策略
 * @property permanent - 是否永久有效
 */
export interface NewCookieForm {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: SameSiteOption;
  permanent: boolean;
}

/**
 * 空 Cookie 表单的默认值
 * @see NewCookieForm
 */
export const EMPTY_COOKIE: NewCookieForm = {
  name: "",
  value: "",
  domain: "",
  path: "/",
  httpOnly: false,
  secure: false,
  sameSite: "Lax",
  permanent: false,
};

/**
 * 使用说明中的字段解释项。
 *
 * @property field - 字段名
 * @property meaning - 字段含义
 * @property example - 示例值
 * @property note - 备注或注意事项
 */
export interface HelpGuideFieldItem {
  field: string;
  meaning: string;
  example: string;
  note?: string;
}

/**
 * 页面使用说明配置。
 *
 * @property title - 卡片标题
 * @property description - 场景描述
 * @property steps - 操作步骤列表
 * @property fields - 字段解释列表
 * @property tip - 额外提示
 */
export interface HelpGuideConfig {
  title: string;
  description: string;
  steps: string[];
  fields: HelpGuideFieldItem[];
  tip?: string;
}



export interface PreviewRow {
  row: number;
  link: string;
  email: string;
  bloggerName: string;
  contact: string;
  message: string;
}
