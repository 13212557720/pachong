"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Activity } from "lucide-react";
import { toast } from "sonner";
import { useBrowserManagerStore } from "../../_hooks/useBrowserManagerStore";

export function ActionToolbar() {
  const endpoint = useBrowserManagerStore((state) => state.endpoint);
  const groups = useBrowserManagerStore((state) => state.groups);
  const selectedGroup = useBrowserManagerStore((state) => state.selectedGroup);
  const isRefreshing = useBrowserManagerStore((state) => state.isRefreshing);
  const isCheckingAll = useBrowserManagerStore((state) => state.isCheckingAll);
  const profiles = useBrowserManagerStore((state) => state.profiles);

  const setEndpoint = useBrowserManagerStore((state) => state.setEndpoint);
  const fetchProfiles = useBrowserManagerStore((state) => state.fetchProfiles);
  const saveEndpointAndRefresh = useBrowserManagerStore(
    (state) => state.saveEndpointAndRefresh
  );
  const changeGroup = useBrowserManagerStore((state) => state.changeGroup);
  const checkAllStatuses = useBrowserManagerStore(
    (state) => state.checkAllStatuses
  );

  async function handleEndpointBlur() {
    const result = await saveEndpointAndRefresh();
    if (result.ok) toast.success("浏览器列表已刷新");
    else toast.error(result.error || "刷新失败");
  }

  async function handleRefresh() {
    const result = await fetchProfiles({ showToast: true });
    if (result.ok) toast.success("浏览器列表已刷新");
    else toast.error(result.error || "刷新失败");
  }

  async function handleCheckAllStatuses() {
    toast.info("开始检查所有环境状态...");
    const result = await checkAllStatuses();
    if (!result.skipped) toast.success("检查完成");
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">浏览器管理</h1>
        <p className="text-muted-foreground mt-1">
          从 AdsPower 客户端拉取配置，支持一键启动和无头模式控制
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Select
          value={selectedGroup}
          onValueChange={(value) => void changeGroup(value)}
        >
          <SelectTrigger className="w-48 bg-background/50">
            <SelectValue placeholder="全部分组" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分组</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.group_id} value={group.group_id}>
                {group.group_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="API 地址 (留空使用默认)"
          value={endpoint}
          onChange={(event) => setEndpoint(event.target.value)}
          onBlur={() => void handleEndpointBlur()}
          onKeyDown={(event) =>
            event.key === "Enter" && void handleEndpointBlur()
          }
          className="w-64 bg-background/50"
        />
        <Button
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          刷新当前页
        </Button>
        <Button
          onClick={() => void handleCheckAllStatuses()}
          disabled={isCheckingAll || profiles.length === 0}
          variant="outline"
          className="gap-2"
        >
          <Activity
            className={`w-4 h-4 ${
              isCheckingAll ? "animate-pulse text-blue-500" : ""
            }`}
          />
          一键查状态
        </Button>
      </div>
    </div>
  );
}
