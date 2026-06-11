import useSWR from "swr";
import { getMemoryInstancesAction } from "@/actions/browser-instance-actions";
import type { BrowserInstance } from "@/types/browser";
import { SWR_KEYS } from "./swr-keys";

/**
 * 用于获取浏览器实例列表的 React Hook（基于 SWR）
 *
 * 相比旧版 useState+useEffect 实现：
 * - 自动去重：多个组件同时挂载不会重复请求
 * - 缓存 + 重新验证：页面切换/聚焦时自动刷新
 * - 乐观更新：refreshList() 可立即触发数据重新获取
 *
 * @returns 包含实例列表状态、加载状态、错误信息与手动刷新函数的对象
 */
export function useInstances() {
  const { data, error, isLoading, mutate } = useSWR<BrowserInstance[]>(
    SWR_KEYS.MEMORY_INSTANCES,
    async () => {
      const res = await getMemoryInstancesAction();
      if (!res.success) throw new Error(res.error);
      return res.data.items;
    },
    {
      // 不自动定时轮询，由调用方按需刷新
      revalidateOnFocus: false,
    },
  );

  return {
    instances: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refreshList: async () => {
      const result = await mutate();
      return result ?? [];
    },
  };
}
