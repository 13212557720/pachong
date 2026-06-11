"use client";

import { useState } from "react";
import useSWR from "swr";
import { getMemoryInstancesAction } from "@/actions/browser-instance-actions";
import { scanAndConnectActiveBrowsersAction } from "@/actions/browser-manager-actions";
import { SCAN_SELECTED_IDS_KEY } from "@/lib/client/constants";
import { SWR_KEYS } from "@/hooks/swr-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Monitor, Search } from "lucide-react";
import type { BrowserInstance } from "@/types/browser";
import { toast } from "sonner";

/**
 * 内存活动实例面板组件
 * 
 * 展示当前服务端内存中维护的所有活动浏览器实例的状态，包括调试端口、运行状态和连接时间。
 * 提供手动扫描遗漏实例的辅助功能。
 * 
 * @returns 实例状态列表的 React 组件
 */
export default function MemoryInstancesPanel() {
  const [isScanning, setIsScanning] = useState(false);

  const { data: instances = [], isLoading, mutate } = useSWR<BrowserInstance[]>(
    SWR_KEYS.MEMORY_INSTANCES,
    async () => {
      const res = await getMemoryInstancesAction();
      if (!res.success) throw new Error(res.error);
      return res.data.items;
    },
    { revalidateOnFocus: false },
  );

  const handleRefresh = async () => {
    await mutate();
    toast.success("已刷新内存实例列表");
  };

  const handleScan = async () => {
    try {
      setIsScanning(true);
      const raw = localStorage.getItem(SCAN_SELECTED_IDS_KEY);
      const selectedIds: string[] = raw ? (JSON.parse(raw) as string[]) : [];
      const label = selectedIds.length > 0 ? `扫描已选 ${selectedIds.length} 个环境` : "扫描最近 50 个环境";
      toast.info(`正在${label}，请稍候...`);
      const res = await scanAndConnectActiveBrowsersAction(selectedIds.length > 0 ? selectedIds : undefined);
      if (res.success) {
        toast.success(`扫描完成: 新连接了 ${res.data?.connectedCount} 个环境`);
        await mutate();
      } else {
        toast.error(`扫描失败: ${res.error}`);
      }
    } catch {
      toast.error("扫描异常");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card className="border-muted shadow-sm bg-background/50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
        <div>
          <CardTitle className="text-lg">活跃运行环境 ({instances.length})</CardTitle>
          <CardDescription>
            展示当前在 Next.js 服务内存中已连接并接管的活动浏览器实例。
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleScan} disabled={isScanning || isLoading} variant="secondary" size="sm" className="gap-2">
            <Search className={`w-4 h-4 ${isScanning ? 'animate-pulse text-primary' : ''}`} />
            {isScanning ? "扫描中..." : "扫描遗漏环境"}
          </Button>
          <Button onClick={() => void handleRefresh()} disabled={isLoading || isScanning} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground bg-muted/10">
            <Monitor className="w-8 h-8 mb-2 opacity-20" />
            <p>内存中暂无活跃实例</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[150px]">实例 ID / Name</TableHead>
                <TableHead>Profile Name</TableHead>
                <TableHead>调试端口</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>连接时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((inst) => (
                <TableRow key={inst.id} className="group hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">
                    {inst.id}
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {inst.name || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {inst.port ? `:${inst.port}` : "未知"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      运行中
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inst.last_connected_at ? new Date(inst.last_connected_at).toLocaleString() : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
