import { create } from "zustand";
import {
  exportExtraDataAction,
  listExtraDataUsersAction,
  runExtraDataEnrichBatchAction,
} from "@/actions/extra-data-actions";
import { listDistinctIpLocationsAction } from "@/actions/getdata-actions";
import { getServerConfigAction, saveServerConfigAction } from "@/actions/settings-actions";
import type { BrowserInstance } from "@/types/browser";
import type { InstagramUserFilters, InstagramUser, PagedResult } from "@/types/api";
import type { ConfigItem } from "@/types/config";
import type { MessageState } from "@/types/hooks";
import { downloadCsv, downloadXlsx } from "@/utils/table-export";
import { parsePositiveIntegerInput } from "@/utils/filter-input";
import { createLogger } from "@/lib/logger";
import {
  type ExtraDataFilterFormState,
  toExtraDataFilters,
} from "../_services/extra-data-filter-form";
import { isUnauthorizedError, redirectToSettings } from "@/utils/auth";

const logger = createLogger("extra-data");

const DEFAULT_FILTER_FORM: ExtraDataFilterFormState = {
  id: "",
  username: "",
  is_private_true: false,
  is_private_false: false,
  followers_count_min: "",
  followers_count_max: "",
  ip_location: "",
  ip_location_in: "",
  ip_location_not_in: "",
  ip_location_not_include_null: true,
  created_at_min: "",
  created_at_max: "",
};

interface RouterLike {
  push: (href: string) => void;
}

interface ExtraDataPageStore {
  instanceItems: BrowserInstance[];
  page: number;
  pageSize: number;
  pageSizeInput: string;
  extraDataTemplates: ConfigItem[];
  activeTemplateIndex: number;
  filterForm: ExtraDataFilterFormState;
  filters: InstagramUserFilters;
  pageData: PagedResult<Record<string, unknown>> | null;
  loadingUsers: boolean;
  runningBatch: boolean;
  runningRowId: string;
  exportingFormat: "" | "csv" | "xlsx";
  exportLimit: string;
  availableLocations: string[];
  message: MessageState;
  setMessage: (message: MessageState) => void;
  setInstances: (instances: BrowserInstance[]) => void;
  loadConfig: () => Promise<void>;
  setActiveTemplateIndex: (index: number) => Promise<void>;

  setPageSize: (size: number) => void;
  setPageSizeInput: (input: string) => void;
  setFilterForm: (
    updater: ExtraDataFilterFormState | ((prev: ExtraDataFilterFormState) => ExtraDataFilterFormState)
  ) => void;
  setExportLimit: (limit: string) => void;
  loadAvailableLocations: () => Promise<void>;
  refreshInstancesWithFallback: (refreshInstances: () => Promise<BrowserInstance[]>) => Promise<void>;
  loadUsers: (router: RouterLike, targetPage: number, options?: { filters?: InstagramUserFilters; pageSize?: number }) => Promise<void>;
  applyFilters: () => void;
  resetFilters: () => void;
  applyCustomPageSize: () => void;
  handleExport: (router: RouterLike, format: "csv" | "xlsx") => Promise<void>;
  runCurrentPageBatch: (router: RouterLike) => Promise<void>;
  runSingleRowEnrich: (router: RouterLike, item: InstagramUser) => Promise<void>;
}

function appendStepLog(text: string) {
  const line = `[${new Date().toLocaleTimeString()}] ${text}`;
  logger.info(line);
}

export const useExtraDataPageStore = create<ExtraDataPageStore>((set, get) => ({
  instanceItems: [],
  extraDataTemplates: [],
  activeTemplateIndex: 0,
  page: 1,
  pageSize: 20,
  pageSizeInput: "20",
  filterForm: { ...DEFAULT_FILTER_FORM },
  filters: toExtraDataFilters({ ...DEFAULT_FILTER_FORM }),
  pageData: null,
  loadingUsers: false,
  runningBatch: false,
  runningRowId: "",
  exportingFormat: "",
  exportLimit: "1000",
  availableLocations: [],

  message: { type: "", text: "" },
  setMessage: (message) => set({ message }),
  setInstances: (instanceItems) => set({ instanceItems }),
  
  loadConfig: async () => {
    const res = await getServerConfigAction();
    if (res.success && res.data) {
      const templates = res.data.extraDataTemplates ?? [];
      set({ 
        extraDataTemplates: templates,
        activeTemplateIndex: templates.length > 0 ? templates.length - 1 : 0
      });
    }
  },
  
  setActiveTemplateIndex: async (index: number) => {
    set({ activeTemplateIndex: index });
    const res = await getServerConfigAction();
    if (res.success && res.data) {
      const updatedConfig = { ...res.data };
      updatedConfig.active = { ...updatedConfig.active, extraDataTemplates: index };
      await saveServerConfigAction(updatedConfig);
    }
  },

  setPageSize: (pageSize) => set({ pageSize, pageSizeInput: String(pageSize), page: 1 }),
  setPageSizeInput: (pageSizeInput) => set({ pageSizeInput }),
  setFilterForm: (updater) =>
    set((state) => ({
      filterForm: typeof updater === "function" ? updater(state.filterForm) : updater,
    })),
  setExportLimit: (exportLimit) => set({ exportLimit }),
  loadAvailableLocations: async () => {
    const res = await listDistinctIpLocationsAction();
    if (res.success && res.data) {
      set({ availableLocations: res.data });
    }
  },
  refreshInstancesWithFallback: async (refreshInstances) => {
    appendStepLog("开始刷新实例列表");
    const hookItems = await refreshInstances();
    if (hookItems.length > 0) {
      get().setInstances(hookItems);
      appendStepLog(`实例列表已更新：${hookItems.length} 个`);
    } else {
      appendStepLog("实例列表为空");
    }
  },
  loadUsers: async (router, targetPage, options) => {
    const state = get();
    const optFilters = options?.filters ?? state.filters;
    const optPageSize = options?.pageSize ?? state.pageSize;
    appendStepLog(`开始加载用户：page=${targetPage}, pageSize=${optPageSize}`);

    set({ loadingUsers: true });
    try {
      const res = await listExtraDataUsersAction({
        page: targetPage,
        page_size: optPageSize,
        filters: optFilters,
      });
      if (!res.success) throw new Error(res.error);

      appendStepLog(
        `加载用户成功：items=${res.data.items.length}, total=${res.data.total}, page=${res.data.page}/${res.data.total_pages}`
      );
      set({
        pageData: res.data,
        page: res.data.page,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (isUnauthorizedError(errMsg)) {
        appendStepLog("Token 已失效");
        redirectToSettings(router, (message) => set({ message }));
        return;
      }
      appendStepLog(`加载用户失败: ${errMsg}`);
      set({ message: { type: "err", text: errMsg } });
    } finally {
      set({ loadingUsers: false });
    }
  },
  applyFilters: () => {
    const nextFilters = toExtraDataFilters(get().filterForm);
    set({ filters: nextFilters, page: 1 });
  },
  resetFilters: () => {
    const defaultForm = { ...DEFAULT_FILTER_FORM };
    set({
      filterForm: defaultForm,
      filters: toExtraDataFilters(defaultForm),
      page: 1,
    });
  },
  applyCustomPageSize: () => {
    const parsed = parsePositiveIntegerInput(get().pageSizeInput) ?? 20;
    set({ pageSize: parsed, pageSizeInput: String(parsed), page: 1 });
  },
  handleExport: async (router, format) => {
    const { exportLimit, filters } = get();
    const limit = parsePositiveIntegerInput(exportLimit) ?? 1000;
    set({ exportingFormat: format });

    try {
      appendStepLog(`开始导出：format=${format}, limit=${limit}`);
      const res = await exportExtraDataAction({ filters, limit });
      if (!res.success) throw new Error(res.error);

      const baseName = `${res.data.file_name}-${Date.now()}`;
      if (format === "csv") {
        downloadCsv(`${baseName}.csv`, res.data.items);
      } else {
        downloadXlsx(`${baseName}.xlsx`, res.data.items);
      }

      appendStepLog(`导出成功：rows=${res.data.items.length}, file=${baseName}.${format}`);
      set({ message: { type: "ok", text: `导出完成：${res.data.items.length} 条` } });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (isUnauthorizedError(errMsg)) {
        appendStepLog("Token 已失效");
        redirectToSettings(router, (message) => set({ message }));
        return;
      }
      appendStepLog(`导出失败：${errMsg}`);
      set({ message: { type: "err", text: errMsg } });
    } finally {
      set({ exportingFormat: "" });
    }
  },
  runCurrentPageBatch: async (router) => {
    const state = get();

    set({ runningBatch: true, message: { type: "", text: "" } });
    appendStepLog(`开始执行增强：page=${state.page}, pageSize=${state.pageSize}`);

    try {
      const res = await runExtraDataEnrichBatchAction({
        page: state.page,
        page_size: state.pageSize,
        filters: state.filters,
      });
      if (!res.success) throw new Error(res.error);

      appendStepLog(`增强任务完成：processed=${res.data.processed}, success=${res.data.success}, failed=${res.data.failed}`);
      set({
        message: {
          type: "ok",
          text: `执行完成：成功 ${res.data.success}，失败 ${res.data.failed}`,
        },
      });
      await get().loadUsers(router, get().page);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (isUnauthorizedError(errMsg)) {
        appendStepLog("Token 已失效");
        redirectToSettings(router, (message) => set({ message }));
      } else {
        appendStepLog(`增强任务失败：${errMsg}`);
        set({ message: { type: "err", text: errMsg } });
      }
    } finally {
      set({ runningBatch: false });
      appendStepLog("增强任务结束");
    }
  },
  runSingleRowEnrich: async (router, item) => {
    set({
      runningRowId: item.id,
      message: { type: "", text: "" },
    });
    appendStepLog(`开始单条记录增强：target=${item.username}`);

    try {
      const res = await runExtraDataEnrichBatchAction({
        page: 1,
        page_size: 1,
        filters: { id: item.id },
      });
      if (!res.success) throw new Error(res.error);

      appendStepLog(`单条任务完成：processed=${res.data.processed}`);

      // 就地更新 pageData 中该行数据，无需重新加载整页
      const enrichedItem = res.data.items?.[0];
      if (enrichedItem && get().pageData) {
        set((prev) => {
          if (!prev.pageData) return prev;
          const updatedItems = prev.pageData.items.map((row) =>
            (row as Record<string, unknown>).id === item.id
              ? {
                  ...row,
                  followers_count: enrichedItem.followers_count,
                  ip_location: enrichedItem.ip_location,
                  biography: enrichedItem.biography ?? (row as Record<string, unknown>).biography,
                }
              : row
          );
          return { pageData: { ...prev.pageData, items: updatedItems } };
        });
      }

      set({
        message: {
          type: enrichedItem?.success ? "ok" : "err",
          text: enrichedItem?.success
            ? `单条执行完成：${item.username} | 粉丝数=${enrichedItem.followers_count} | 归属地=${enrichedItem.ip_location}`
            : `单条执行有误：${item.username} | ${enrichedItem?.error ?? "未知错误"}`,
        },
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (isUnauthorizedError(errMsg)) {
        redirectToSettings(router, (message) => set({ message }));
      } else {
        set({ message: { type: "err", text: errMsg } });
      }
    } finally {
      set({ runningRowId: "" });
    }
  },
}));
