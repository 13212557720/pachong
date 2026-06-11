"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Square, Monitor, MonitorOff } from "lucide-react";
import { toast } from "sonner";
import { useBrowserManagerStore } from "../../_hooks/useBrowserManagerStore";

interface BrowserTableProps {
  scanSelectedIds: Set<string>;
  toggleScanId: (userId: string, checked: boolean) => void;
  toggleSelectAll: (checked: boolean) => void;
}

export function BrowserTable({
  scanSelectedIds,
  toggleScanId,
  toggleSelectAll,
}: BrowserTableProps) {
  const profiles = useBrowserManagerStore((state) => state.profiles);
  const isLoading = useBrowserManagerStore((state) => state.isLoading);
  const headlessStates = useBrowserManagerStore((state) => state.headlessStates);
  const actionStates = useBrowserManagerStore((state) => state.actionStates);
  const activeStatuses = useBrowserManagerStore((state) => state.activeStatuses);
  const toggleHeadless = useBrowserManagerStore((state) => state.toggleHeadless);
  const startBrowser = useBrowserManagerStore((state) => state.startBrowser);
  const stopBrowser = useBrowserManagerStore((state) => state.stopBrowser);

  const currentPage = useBrowserManagerStore((state) => state.currentPage);
  const pageSize = useBrowserManagerStore((state) => state.pageSize);
  const isRefreshing = useBrowserManagerStore((state) => state.isRefreshing);
  const endpoint = useBrowserManagerStore((state) => state.endpoint);
  const selectedGroup = useBrowserManagerStore((state) => state.selectedGroup);
  const fetchProfiles = useBrowserManagerStore((state) => state.fetchProfiles);
  const setCurrentPage = useBrowserManagerStore((state) => state.setCurrentPage);

  async function handleStart(userId: string) {
    const result = await startBrowser(userId);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  }

  async function handleStop(userId: string) {
    const result = await stopBrowser(userId);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  }

  return (
    <Card className="border-muted shadow-sm bg-background/50 backdrop-blur-xl">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg">配置文件列表 ({profiles.length})</CardTitle>
        <CardDescription>
          列表中显示的为 AdsPower 账号配置，启动时会调用本地的 AdsPower API。
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>正在加载配置...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <p>暂无浏览器配置，或者 AdsPower 客户端未开启</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    id="scan-select-all"
                    checked={
                      profiles.length > 0 &&
                      profiles.every(
                        (p) => p.user_id && scanSelectedIds.has(p.user_id)
                      )
                    }
                    onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                    aria-label="全选扫描"
                  />
                </TableHead>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>分组/平台</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="text-right">无头模式</TableHead>
                <TableHead className="w-[200px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const userId = profile.user_id;
                if (!userId) return null;

                const state = actionStates[userId] || "idle";
                const isHeadless = headlessStates[userId] || false;

                return (
                  <TableRow
                    key={userId}
                    className="group hover:bg-muted/40 transition-colors"
                  >
                    <TableCell>
                      <Checkbox
                        id={`scan-select-${userId}`}
                        checked={scanSelectedIds.has(userId)}
                        onCheckedChange={(checked) =>
                          toggleScanId(userId, !!checked)
                        }
                        aria-label={`选择 ${profile.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{userId}</TableCell>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>
                      {activeStatuses[userId] ? (
                        <Badge
                          variant={
                            activeStatuses[userId] === "运行中"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            activeStatuses[userId] === "运行中"
                              ? "bg-green-500 hover:bg-green-600"
                              : ""
                          }
                        >
                          {activeStatuses[userId]}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {profile.group_name || "默认组"}
                        </span>
                        {profile.domain_name && (
                          <Badge
                            variant="outline"
                            className="w-fit text-[10px] bg-background/50"
                          >
                            {profile.domain_name}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">
                      {profile.remark || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isHeadless ? (
                          <MonitorOff className="w-4 h-4 text-orange-500" />
                        ) : (
                          <Monitor className="w-4 h-4 text-green-500" />
                        )}
                        <Switch
                          checked={isHeadless}
                          onCheckedChange={(checked) =>
                            toggleHeadless(userId, checked)
                          }
                          aria-label="Toggle headless"
                          className="scale-90"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant={state === "starting" ? "outline" : "default"}
                          size="sm"
                          className={`gap-1 ${
                            state === "idle"
                              ? "bg-primary hover:bg-primary/90"
                              : ""
                          }`}
                          disabled={state !== "idle"}
                          onClick={() => void handleStart(userId)}
                        >
                          {state === "starting" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          启动
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-transparent"
                          disabled={state !== "idle"}
                          onClick={() => void handleStop(userId)}
                        >
                          {state === "stopping" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                          停止
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {profiles.length > 0 && !isLoading && (
        <div className="p-4 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            当前第 {currentPage} 页，本页 {profiles.length} 条
            {scanSelectedIds.size > 0 && (
              <span className="ml-3 text-primary font-medium">
                · 已选 {scanSelectedIds.size} 个待扫描
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isRefreshing}
              onClick={() => {
                const nextPage = currentPage - 1;
                setCurrentPage(nextPage);
                void fetchProfiles({
                  endpoint,
                  groupId: selectedGroup,
                  page: nextPage,
                });
              }}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={profiles.length < pageSize || isRefreshing}
              onClick={() => {
                const nextPage = currentPage + 1;
                setCurrentPage(nextPage);
                void fetchProfiles({
                  endpoint,
                  groupId: selectedGroup,
                  page: nextPage,
                });
              }}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
