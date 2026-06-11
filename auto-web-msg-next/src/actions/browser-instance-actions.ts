"use server";

import { listInstances } from "@/lib/browser/core/state";
import { ok, fail } from "@/actions/internal/action-result";
import { createLogger } from "@/lib/logger";

const logger = createLogger("instance-actions");



/**
 * 仅获取当前存在于服务端内存中的活动实例列表
 * @returns 内存中的活动浏览器实例安全信息数组
 */
export async function getMemoryInstancesAction() {
  try {
    return ok({ items: listInstances() });
  } catch (e) {
    logger.error("[getMemoryInstancesAction] 获取内存实例失败", e);
    return fail(e);
  }
}
