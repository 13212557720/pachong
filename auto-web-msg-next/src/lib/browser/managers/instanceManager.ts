/**
 * 实例管理模块
 *
 * 管理浏览器自动化配置（send_enabled / highlight_selector）。
// 内存通过独立变量操作读写。
 */
import { getAutomationConfigData, setAutomationConfigData } from "@/actions/internal/config-file";
import { getGlobalConfig, updateGlobalConfig } from "../core/state";
import { SEND_BUTTON_SELECTOR } from "../core/selectors";
import { createLogger } from "@/lib/logger";

const logger = createLogger("instanceManager");


/**
 * 获取全局的自动化配置数据（例如发送开关和高亮选择器）。
 * 优先从持久化配置中读取，若有则同步到内存中，最终返回内存态的数据。
 * @returns 包含 send_enabled 和 highlight_selector 的对象
 */
export async function getAutomationConfig(): Promise<{ send_enabled: boolean; highlight_selector: string }> {
  const dbRow = getAutomationConfigData();

  if (dbRow) {
    logger.info("[getAutomationConfig] 从持久化文件读取到配置", dbRow);
    updateGlobalConfig({
      send_enabled: Boolean(dbRow.send_enabled),
      highlight_selector: dbRow.highlight_selector
    });
  } else {
    logger.info("[getAutomationConfig] 持久化文件无配置，使用内存默认值");
  }

  const session = getGlobalConfig();
  return {
    send_enabled: Boolean(session?.send_enabled),
    highlight_selector: (session?.highlight_selector || "").trim() || SEND_BUTTON_SELECTOR,
  };
}

/**
 * 更新全局自动化配置。
 * 将更新合并到内存状态中，并持久化保存到文件中。
 * @param args.send_enabled - 是否允许自动发送消息
 * @param args.highlight_selector - 界面高亮所使用的 CSS 选择器
 * @returns 更新后的最新完整配置
 */
export async function updateAutomationConfig(args: {
  send_enabled?: boolean | null;
  highlight_selector?: string | null;
}): Promise<{ send_enabled: boolean; highlight_selector: string }> {
  const updates: { send_enabled?: boolean; highlight_selector?: string } = {};
  if (args.send_enabled !== undefined && args.send_enabled !== null) {
    updates.send_enabled = Boolean(args.send_enabled);
  }
  if (args.highlight_selector !== undefined && args.highlight_selector !== null) {
    updates.highlight_selector = (args.highlight_selector || "").trim() || SEND_BUTTON_SELECTOR;
  }

  if (Object.keys(updates).length > 0) {
    updateGlobalConfig(updates);
  }

  const session = getGlobalConfig();

  setAutomationConfigData({
    send_enabled: Boolean(session?.send_enabled),
    highlight_selector: session?.highlight_selector || SEND_BUTTON_SELECTOR,
  });

  logger.info("[updateAutomationConfig] 配置已更新并持久化", updates);

  return getAutomationConfig();
}
