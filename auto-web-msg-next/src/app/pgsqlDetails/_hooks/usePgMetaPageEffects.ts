"use client";

import useSWR from "swr";
import { usePgMetaStore } from "../_stores";
import { getPgStatus, fetchPgTableData, listPgTables } from "../_queries";
import { SWR_KEYS } from "@/hooks/swr-keys";

/**
 * PG 元数据页面数据加载 Hook（基于 SWR）
 *
 * 替代原有的 useEffect + cancelled flag 模式：
 * - SWR #1: 初始化拉取 status + tables（仅挂载时触发一次）
 * - SWR #2: 依赖 selectedTable / page / pageSize / filters 拉取表数据
 *
 * 数据仍写入 Zustand Store，保持下游选择器 Hook 不变。
 */
export function usePgMetaPageEffects() {
  const selectedTable = usePgMetaStore((s) => s.selectedTable);
  const page = usePgMetaStore((s) => s.page);
  const pageSize = usePgMetaStore((s) => s.pageSize);
  const filters = usePgMetaStore((s) => s.filters);
  const setStatus = usePgMetaStore((s) => s.setStatus);
  const setTables = usePgMetaStore((s) => s.setTables);
  const setSelectedTable = usePgMetaStore((s) => s.setSelectedTable);
  const setTableData = usePgMetaStore((s) => s.setTableData);
  const setLoading = usePgMetaStore((s) => s.setLoading);
  const setError = usePgMetaStore((s) => s.setError);
  const setTotalPages = usePgMetaStore((s) => s.setTotalPages);
  const setTotalCount = usePgMetaStore((s) => s.setTotalCount);

  // SWR #1: 初始化元数据（数据库状态 + 表列表）
  useSWR(
    SWR_KEYS.PG_META_INIT,
    async () => {
      const [status, tables] = await Promise.all([getPgStatus(), listPgTables()]);
      return { status, tables };
    },
    {
      revalidateOnFocus: false,
      onSuccess: (data) => {
        setStatus(data.status);
        setTables(data.tables);
        if (data.tables.length > 0 && !selectedTable) {
          setSelectedTable(data.tables[0]);
        }
      },
      onError: (err) => {
        setError(`加载基础元数据失败: ${err instanceof Error ? err.message : String(err)}`);
      },
    },
  );

  // SWR #2: 表数据（依赖 selectedTable / page / pageSize / filters）
  const apiFilters = filters.reduce((acc, filter) => {
    acc[filter.column] = { keyword: filter.keyword || "" };
    return acc;
  }, {} as Record<string, { keyword: string }>);

  useSWR(
    selectedTable
      ? [SWR_KEYS.PG_TABLE_DATA, selectedTable, page, pageSize, JSON.stringify(apiFilters)]
      : null,
    async () => {
      return fetchPgTableData(
        selectedTable,
        page,
        pageSize,
        Object.keys(apiFilters).length ? apiFilters : undefined,
      );
    },
    {
      revalidateOnFocus: false,
      onSuccess: (data) => {
        setTableData(data);
        setTotalPages(data.total_pages);
        setTotalCount(data.total);
      },
      onError: (err) => {
        setError(`加载表数据失败: ${err instanceof Error ? err.message : String(err)}`);
      },
      onLoadingSlow: () => setLoading(true),
      loadingTimeout: 0, // 立即触发 onLoadingSlow → setLoading(true)
    },
  );
}
