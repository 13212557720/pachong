import { create } from "zustand";
import {
  exportGetDataUsersAction,
  getDataTaskProgressAction,
  listDistinctIpLocationsAction,
  listGetDataUsersAction,
  startGetDataTaskAction,
} from "@/actions/getdata-actions";
import { checkHasTokenAction, getServerConfigAction } from "@/actions/settings-actions";
import type {
  GetDataActionResult,
  GetDataTaskProgress,
  InstagramUserFilters,
  InstagramUser,
  PagedResult,
} from "@/types/api";
import type { ConfigItem } from "@/types/config";
import type { MessageState } from "@/types/hooks";
import { downloadCsv, downloadXlsx, sanitizeFilePart } from "@/utils/table-export";
import { parsePositiveIntegerInput } from "@/utils/filter-input";
import {
  type GetDataFilterFormState,
  toGetDataFilters,
} from "../_services/getdata-filter-form";
import { isUnauthorizedError, redirectToSettings } from "@/utils/auth";
import {
  parseHeaderConfig,
} from "../_services/getdata-page-helpers";

const DEFAULT_POOL_FILTER_FORM: GetDataFilterFormState = {
  id: "",
  username: "",
  is_completed: "all",
  repeat_count_min: "",
  repeat_count_max: "",
  ip_location: "",
  ip_location_in: "",
  ip_location_not_in: "",
  ip_location_not_include_null: false,
  created_at_min: "",
  created_at_max: "",
};

interface RouterLike {
  push: (href: string) => void;
}

interface GetDataPageStore {
  userid: string;
  manualUserId: string;
  exportLimit: string;
  availableHeaders: ConfigItem[];
  selectedHeaderKey: string;
  availableLocations: string[];
  loading: boolean;
  running: boolean;
  runId: string;
  progress: GetDataTaskProgress | null;
  message: MessageState;
  result: GetDataActionResult | null;
  poolExporting: "" | "csv" | "xlsx";
  runningUserId: string;
  hasToken: boolean | null;
  poolPage: number;
  poolPageSize: number;
  poolFiltersForm: GetDataFilterFormState;
  poolFilters: InstagramUserFilters;
  poolData: PagedResult<InstagramUser> | null;
  poolLoading: boolean;
  setUserid: (userid: string) => void;
  setManualUserId: (userid: string) => void;
  setExportLimit: (limit: string) => void;
  setSelectedHeaderKey: (key: string) => void;
  setPoolPage: (page: number | ((prev: number) => number)) => void;
  setPoolPageSize: (size: number) => void;
  setPoolFiltersForm: (
    updater: GetDataFilterFormState | ((prev: GetDataFilterFormState) => GetDataFilterFormState)
  ) => void;
  setMessage: (message: MessageState) => void;
  initializePage: () => Promise<void>;
  loadUserPool: (router: RouterLike) => Promise<void>;
  applyPoolFilters: () => void;
  resetPoolFilters: () => void;
  startTaskForUserid: (router: RouterLike, targetUserId: string) => Promise<void>;
  pollTaskProgress: (router: RouterLike) => Promise<void>;
  exportPool: (router: RouterLike, format: "csv" | "xlsx", limitStr: string) => Promise<void>;
}

export const useGetDataPageStore = create<GetDataPageStore>((set, get) => ({
  userid: "",
  manualUserId: "",
  exportLimit: "1000",
  availableHeaders: [],
  selectedHeaderKey: "",
  availableLocations: [],
  loading: false,
  running: false,
  runId: "",
  progress: null,
  message: { type: "", text: "" },
  result: null,
  poolExporting: "",
  runningUserId: "",
  hasToken: null,
  poolPage: 1,
  poolPageSize: 20,
  poolFiltersForm: { ...DEFAULT_POOL_FILTER_FORM },
  poolFilters: toGetDataFilters({ ...DEFAULT_POOL_FILTER_FORM }),
  poolData: null,
  poolLoading: false,
  setUserid: (userid) => set({ userid }),
  setManualUserId: (manualUserId) => set({ manualUserId }),
  setExportLimit: (exportLimit) => set({ exportLimit }),
  setSelectedHeaderKey: (selectedHeaderKey) => set({ selectedHeaderKey }),
  setPoolPage: (page) =>
    set((state) => ({ poolPage: typeof page === "function" ? page(state.poolPage) : page })),
  setPoolPageSize: (poolPageSize) => set({ poolPageSize }),
  setPoolFiltersForm: (updater) =>
    set((state) => ({
      poolFiltersForm: typeof updater === "function" ? updater(state.poolFiltersForm) : updater,
    })),
  setMessage: (message) => set({ message }),
  initializePage: async () => {
    const [tokenResult, configResult, locationsResult] = await Promise.all([
      checkHasTokenAction(),
      getServerConfigAction().catch(() => null),
      listDistinctIpLocationsAction().catch(() => null),
    ]);

    if (tokenResult.success) {
      set({ hasToken: tokenResult.data });
    }

    if (configResult?.success && configResult.data) {
      const templates = configResult.data.extraDataTemplates || [];
      set({
        availableHeaders: templates,
        selectedHeaderKey: templates.length > 0 ? templates[templates.length - 1].key : "",
      });
    }

    if (locationsResult?.success && locationsResult.data) {
      set({ availableLocations: locationsResult.data });
    }
  },
  loadUserPool: async (router) => {
    const { poolPage, poolPageSize, poolFilters } = get();
    set({ poolLoading: true });

    try {
      const res = await listGetDataUsersAction({
        page: poolPage,
        page_size: poolPageSize,
        filters: poolFilters,
      });

      if (!res.success) {
        if (isUnauthorizedError(res.error)) {
          redirectToSettings(router, (message) => set({ message }));
          return;
        }
        set({ message: { type: "err", text: res.error } });
        return;
      }

      set({
        poolData: res.data,
        poolPage: res.data.page,
      });
    } finally {
      set({ poolLoading: false });
    }
  },
  applyPoolFilters: () => {
    const { poolFiltersForm } = get();
    set({
      poolFilters: toGetDataFilters(poolFiltersForm),
      poolPage: 1,
    });
  },
  resetPoolFilters: () => {
    const defaults = { ...DEFAULT_POOL_FILTER_FORM };
    set({
      poolFiltersForm: defaults,
      poolFilters: toGetDataFilters(defaults),
      poolPage: 1,
    });
  },
  startTaskForUserid: async (router, targetUserId) => {
    const { availableHeaders, selectedHeaderKey } = get();
    const trimmedUserId = targetUserId.trim();
    if (!trimmedUserId) {
      set({ message: { type: "err", text: "userid 不能为空" } });
      return;
    }

    const parsedHeaders = parseHeaderConfig(selectedHeaderKey, availableHeaders);
    if (!parsedHeaders.headers) {
      set({ message: { type: "err", text: parsedHeaders.error || "Headers 解析失败" } });
      return;
    }

    set({
      loading: true,
      running: false,
      runningUserId: trimmedUserId,
      runId: "",
      progress: null,
      message: { type: "", text: "" },
      result: null,
    });

    try {
      const response = await startGetDataTaskAction({
        userid: trimmedUserId,
        headers: parsedHeaders.headers,
      });

      if (!response.success) {
        if (isUnauthorizedError(response.error)) {
          redirectToSettings(
            router,
            (message) => set({ message }),
            () => set({ running: false, runningUserId: "" })
          );
          return;
        }

        set({ message: { type: "err", text: response.error } });
        return;
      }

      set({
        runId: response.data.run_id,
        running: true,
        userid: trimmedUserId,
        message: {
          type: "ok",
          text: `抓取任务已启动，run_id=${response.data.run_id}`,
        },
      });
    } catch (error) {
      set({
        message: {
          type: "err",
          text: error instanceof Error ? error.message : "抓取失败",
        },
      });
    } finally {
      set({ loading: false });
    }
  },
  pollTaskProgress: async (router) => {
    const { runId, running } = get();
    if (!running || !runId) {
      return;
    }

    const res = await getDataTaskProgressAction(runId);
    if (!res.success) {
      if (isUnauthorizedError(res.error)) {
        redirectToSettings(
          router,
          (message) => set({ message }),
          () => set({ running: false, runningUserId: "" })
        );
        return;
      }

      set({
        message: { type: "err", text: res.error },
        running: false,
        runningUserId: "",
      });
      return;
    }

    const data = res.data;
    set({ progress: data });

    if (data.status === "completed") {
      set({ running: false, runningUserId: "" });
      await get().loadUserPool(router);
      if (data.result) {
        set({
          result: data.result,
          message: {
            type: "ok",
            text: `抓取完成：共 ${data.result.total} 条，${data.result.pages} 页`,
          },
        });
      }
      return;
    }

    if (data.status === "failed") {
      set({
        running: false,
        runningUserId: "",
        message: { type: "err", text: data.error || "抓取失败" },
      });
    }
  },
  exportPool: async (_router, format, limitStr) => {
    const { poolFilters } = get();
    const parsedLimit = parsePositiveIntegerInput(limitStr);
    if (!parsedLimit) {
      set({ message: { type: "err", text: "导出数量必须是大于 0 的整数" } });
      return;
    }

    set({ poolExporting: format });
    try {
      const exportResult = await exportGetDataUsersAction({ filters: poolFilters, limit: parsedLimit });
      if (!exportResult.success) {
        set({ message: { type: "err", text: exportResult.error } });
        return;
      }

      const baseName = `${sanitizeFilePart(exportResult.data.file_name)}-${Date.now()}`;
      if (format === "csv") {
        downloadCsv(`${baseName}.csv`, exportResult.data.items);
      } else {
        downloadXlsx(`${baseName}.xlsx`, exportResult.data.items);
      }

      set({
        message: { type: "ok", text: `导出完成：${exportResult.data.items.length} 条` },
      });
    } finally {
      set({ poolExporting: "" });
    }
  },
}));
