import { create } from "zustand";
import {
  checkActiveProfilesAction,
  getMemoryStatusesAction,
  listGroupsAction,
  listProfilesAction,
  startBrowserAction,
  stopBrowserAction,
} from "@/actions/browser-manager-actions";
import { getAdsPowerEndpointAction, saveAdsPowerEndpointAction } from "@/actions/browser-config-actions";
import type { AdsPowerProfile } from "@/lib/adspower-api/adspower-bridge";

export interface BrowserManagerGroup {
  group_id: string;
  group_name: string;
}

type ActionState = "starting" | "stopping" | "idle";

interface BrowserManagerStore {
  profiles: AdsPowerProfile[];
  isLoading: boolean;
  isRefreshing: boolean;
  endpoint: string;
  groups: BrowserManagerGroup[];
  selectedGroup: string;
  headlessStates: Record<string, boolean>;
  actionStates: Record<string, ActionState>;
  activeStatuses: Record<string, string>;
  isCheckingAll: boolean;
  currentPage: number;
  pageSize: number;
  setEndpoint: (endpoint: string) => void;
  setCurrentPage: (page: number) => void;
  toggleHeadless: (userId: string, checked: boolean) => void;
  initialize: () => Promise<void>;
  fetchMemoryStatuses: () => Promise<void>;
  fetchGroups: (endpoint?: string) => Promise<void>;
  fetchProfiles: (args?: { showToast?: boolean; endpoint?: string; groupId?: string; page?: number }) => Promise<{ ok: boolean; error?: string }>;
  saveEndpointAndRefresh: () => Promise<{ ok: boolean; error?: string }>;
  changeGroup: (groupId: string) => Promise<void>;
  startBrowser: (userId: string) => Promise<{ ok: boolean; message: string }>;
  stopBrowser: (userId: string) => Promise<{ ok: boolean; message: string }>;
  checkAllStatuses: () => Promise<{ ok: boolean; skipped?: boolean }>;
}

const DEFAULT_GROUP = "all";
const PAGE_SIZE = 20;

export const useBrowserManagerStore = create<BrowserManagerStore>((set, get) => ({
  profiles: [],
  isLoading: true,
  isRefreshing: false,
  endpoint: "",
  groups: [],
  selectedGroup: DEFAULT_GROUP,
  headlessStates: {},
  actionStates: {},
  activeStatuses: {},
  isCheckingAll: false,
  currentPage: 1,
  pageSize: PAGE_SIZE,
  setEndpoint: (endpoint) => set({ endpoint }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  toggleHeadless: (userId, checked) =>
    set((state) => ({ headlessStates: { ...state.headlessStates, [userId]: checked } })),
  initialize: async () => {
    const res = await getAdsPowerEndpointAction();
    const endpoint = res.success ? res.data : "";
    set({ endpoint });
    await Promise.all([
      get().fetchGroups(endpoint),
      get().fetchProfiles({ endpoint, groupId: DEFAULT_GROUP, page: 1 }),
      get().fetchMemoryStatuses(),
    ]);
  },
  fetchMemoryStatuses: async () => {
    const res = await getMemoryStatusesAction();
    if (res.success && res.data) {
      set((state) => ({ activeStatuses: { ...state.activeStatuses, ...res.data } }));
    }
  },
  fetchGroups: async (endpoint) => {
    const res = await listGroupsAction(endpoint ?? get().endpoint);
    if (res.success && Array.isArray(res.data)) {
      set({
        groups: res.data.map((group) => ({
          group_id: group.group_id || "",
          group_name: group.group_name || "",
        })),
      });
    }
  },
  fetchProfiles: async (args) => {
    const state = get();
    const targetGroup = args?.groupId ?? state.selectedGroup;
    const targetPage = args?.page ?? state.currentPage;
    const targetEndpoint = args?.endpoint ?? state.endpoint;
    set({ isRefreshing: true });

    try {
      const res = await listProfilesAction(targetPage, state.pageSize, targetEndpoint, targetGroup);
      if (!res.success) {
        return { ok: false, error: res.error || "刷新失败" };
      }

      set({ profiles: res.data });
      await get().fetchMemoryStatuses();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "获取列表发生异常" };
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },
  saveEndpointAndRefresh: async () => {
    const { endpoint, selectedGroup } = get();
    const saveResult = await saveAdsPowerEndpointAction(endpoint);
    if (!saveResult.success) {
      return { ok: false, error: saveResult.error };
    }

    set({ currentPage: 1 });
    await get().fetchGroups(endpoint);
    return get().fetchProfiles({ showToast: true, endpoint, groupId: selectedGroup, page: 1 });
  },
  changeGroup: async (selectedGroup) => {
    const { endpoint } = get();
    set({ selectedGroup, currentPage: 1 });
    await get().fetchProfiles({ endpoint, groupId: selectedGroup, page: 1 });
  },
  startBrowser: async (userId) => {
    const { endpoint, headlessStates, profiles } = get();
    const profileName = profiles.find(p => p.user_id === userId)?.name;
    set((state) => ({ actionStates: { ...state.actionStates, [userId]: "starting" } }));

    try {
      const res = await startBrowserAction(userId, headlessStates[userId] || false, endpoint, profileName);
      if (!res.success) {
        return { ok: false, message: `启动失败: ${res.error}` };
      }
      await get().fetchMemoryStatuses();
      return { ok: true, message: `实例 ${userId} 启动成功` };
    } catch (error) {
      return { ok: false, message: `启动异常: ${error instanceof Error ? error.message : String(error)}` };
    } finally {
      set((state) => ({ actionStates: { ...state.actionStates, [userId]: "idle" } }));
    }
  },
  stopBrowser: async (userId) => {
    const { endpoint } = get();
    set((state) => ({ actionStates: { ...state.actionStates, [userId]: "stopping" } }));

    try {
      const res = await stopBrowserAction(userId, endpoint);
      if (!res.success) {
        return { ok: false, message: `关闭失败: ${res.error}` };
      }
      return { ok: true, message: `实例 ${userId} 已关闭` };
    } catch (error) {
      return { ok: false, message: `关闭异常: ${error instanceof Error ? error.message : String(error)}` };
    } finally {
      set((state) => ({ actionStates: { ...state.actionStates, [userId]: "idle" } }));
    }
  },
  checkAllStatuses: async () => {
    const { activeStatuses, endpoint, isCheckingAll, profiles } = get();
    if (isCheckingAll || profiles.length === 0) return { ok: true, skipped: true };

    set({ isCheckingAll: true });
    const nextStatuses = { ...activeStatuses };
    try {
      for (const profile of profiles) {
        const userId = profile.user_id;
        if (!userId) continue;

        nextStatuses[userId] = "Checking...";
        set({ activeStatuses: { ...nextStatuses } });

        try {
          const res = await checkActiveProfilesAction(userId, endpoint, profile.name);
          nextStatuses[userId] = res.success && res.data?.status
            ? res.data.status === "Active" ? "运行中" : "未运行"
            : "未知";
          await new Promise((resolve) => setTimeout(resolve, 400));
        } catch {
          nextStatuses[userId] = "检查失败";
        }

        set({ activeStatuses: { ...nextStatuses } });
      }

      return { ok: true };
    } finally {
      set({ isCheckingAll: false });
    }
  },
}));
