import { useCallback } from "react";
import useSWR from "swr";
import {
  getAutomationConfigAction,
  updateAutomationConfigAction,
} from "@/actions/browser-config-actions";
import { SWR_KEYS } from "./swr-keys";

/**
 * 读取并更新自动化配置开关（基于 SWR）。
 *
 * - 自动拉取当前配置，无需手动 useEffect
 * - updateConfig 成功后通过 mutate 乐观更新缓存
 *
 * @returns 当前配置状态与更新函数
 */
export function useAutomationConfig() {
  const { data, isLoading, mutate } = useSWR(
    SWR_KEYS.AUTOMATION_CONFIG,
    async () => {
      const res = await getAutomationConfigAction();
      if (!res.success) throw new Error(res.error);
      return Boolean(res.data.config?.send_enabled ?? false);
    },
    { revalidateOnFocus: false },
  );

  /**
   * 更新自动化配置开关并返回标准结果。
   *
   * @param nextValue 新的开关值
   * @returns 更新结果
   */
  const updateConfig = useCallback(
    async (nextValue: boolean) => {
      try {
        const res = await updateAutomationConfigAction({ send_enabled: nextValue });
        if (res.success) {
          // 乐观更新缓存，不重新请求
          await mutate(Boolean(res.data.config?.send_enabled ?? nextValue), false);
          return { success: true as const, data: res.data };
        }
        return { success: false as const, error: res.error };
      } catch (err) {
        const error = err instanceof Error ? err.message : "更新失败";
        return { success: false as const, error };
      }
    },
    [mutate],
  );

  return {
    sendEnabled: data ?? false,
    loading: isLoading,
    updateConfig,
  };
}
