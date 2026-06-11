"use server";

import {
  getAdsPowerEndpoint,
  getAutomationConfigData,
  setAdsPowerEndpoint,
  setAutomationConfigData,
} from "@/actions/internal/config-file";
import { ok, fail } from "@/actions/internal/action-result";
import { SEND_BUTTON_SELECTOR } from "@/lib/browser/core/selectors";
import { createLogger } from "@/lib/logger";

const logger = createLogger("config-actions");

/** 系统默认的自动化全局配置（若文件未配置时的兜底项） */
const DEFAULT_AUTOMATION_CONFIG = {
  send_enabled: true,
  highlight_selector: SEND_BUTTON_SELECTOR,
};

/**
 * 保存并持久化 AdsPower 的本地 API 端点地址
 * @param endpoint - 新的 API 端点（例如 "http://127.0.0.1:50325"）
 * @returns 保存成功的端点地址
 */
export async function saveAdsPowerEndpointAction(endpoint: string) {
  try {
    setAdsPowerEndpoint(endpoint);
    logger.info(`[saveAdsPowerEndpointAction] 成功保存端点: ${endpoint}`);
    return ok(endpoint);
  } catch (e) {
    logger.error(`[saveAdsPowerEndpointAction] 保存端点失败`, e);
    return fail(e);
  }
}

/**
 * 获取当前持久化的 AdsPower 本地 API 端点地址
 * @returns 获取到的端点地址（包含默认值）
 */
export async function getAdsPowerEndpointAction() {
  try {
    return ok(getAdsPowerEndpoint());
  } catch (e) {
    return fail(e);
  }
}

/**
 * 获取全局的自动化配置信息（发送开关、高亮选择器）
 * @returns 包含配置对象的响应
 */
export async function getAutomationConfigAction() {
  try {
    return ok({ config: getAutomationConfigData() || DEFAULT_AUTOMATION_CONFIG });
  } catch (e) {
    return fail(e);
  }
}

/**
 * 更新全局的自动化配置信息，并持久化到本地文件
 * @param params.send_enabled - 是否允许发送消息（可选）
 * @param params.highlight_selector - 高亮元素的 CSS 选择器（可选）
 * @returns 更新后的配置对象响应
 */
export async function updateAutomationConfigAction(params: {
  send_enabled?: boolean;
  highlight_selector?: string;
}) {
  try {
    if (params.send_enabled === undefined && params.highlight_selector === undefined) {
      throw new Error("至少提供 send_enabled 或 highlight_selector 之一");
    }

    const current = getAutomationConfigData() || DEFAULT_AUTOMATION_CONFIG;
    setAutomationConfigData({
      send_enabled: params.send_enabled ?? current.send_enabled,
      highlight_selector: params.highlight_selector ?? current.highlight_selector,
    });

    logger.info(`[updateAutomationConfigAction] 更新配置成功`);
    return ok({ config: getAutomationConfigData() });
  } catch (e) {
    logger.error(`[updateAutomationConfigAction] 更新配置失败`, e);
    return fail(e);
  }
}
