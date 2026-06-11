import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAGE_SIZE_OPTIONS } from "@/constants";
import { parsePositiveIntegerInput } from "@/utils/filter-input";
import type { InstagramUser } from "@/types/api";
import { useGetDataPageStore } from "../_hooks/useGetDataPageStore";
import { parseHeaderConfig } from "../_services/getdata-page-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function GetDataUserTable() {
  const router = useRouter();
  const poolData = useGetDataPageStore((state) => state.poolData);
  const poolPageSize = useGetDataPageStore((state) => state.poolPageSize);
  const poolLoading = useGetDataPageStore((state) => state.poolLoading);
  const loading = useGetDataPageStore((state) => state.loading);
  const runningUserId = useGetDataPageStore((state) => state.runningUserId);
  const setPoolPage = useGetDataPageStore((state) => state.setPoolPage);
  const setPoolPageSize = useGetDataPageStore((state) => state.setPoolPageSize);
  const setMessage = useGetDataPageStore((state) => state.setMessage);
  const loadUserPool = useGetDataPageStore((state) => state.loadUserPool);
  const startTaskForUserid = useGetDataPageStore((state) => state.startTaskForUserid);
  const availableHeaders = useGetDataPageStore((state) => state.availableHeaders);
  const selectedHeaderKey = useGetDataPageStore((state) => state.selectedHeaderKey);
  const poolItems = useMemo(() => poolData?.items ?? [], [poolData]);
  const currentPoolPage = poolData?.page ?? 1;
  const [poolPageSizeInput, setPoolPageSizeInput] = useState(String(poolPageSize));
  const [poolJumpPageInput, setPoolJumpPageInput] = useState(String(currentPoolPage));

  function updatePoolPage(page: number) {
    setPoolPage(page);
    setPoolJumpPageInput(String(page));
  }

  function applyPoolCustomPageSize() {
    const parsed = parsePositiveIntegerInput(poolPageSizeInput);
    if (!parsed) {
      setMessage({ type: "err", text: "每页数量必须是大于 0 的整数" });
      return;
    }
    setPoolPageSize(parsed);
    setPoolPageSizeInput(String(parsed));
    updatePoolPage(1);
  }

  function jumpPoolPage() {
    const parsed = parsePositiveIntegerInput(poolJumpPageInput);
    if (!parsed) {
      setMessage({ type: "err", text: "页码必须是大于 0 的整数" });
      return;
    }
    const maxPage = Math.max(1, poolData?.total_pages ?? 1);
    updatePoolPage(Math.min(maxPage, parsed));
  }

  async function handleRowRun(item: InstagramUser) {
    if (item.is_completed) {
      const confirmed = window.confirm(`用户 ${item.id} 已抓取过，确认重新抓取吗？`);
      if (!confirmed) return;
    }
    await startTaskForUserid(router, String(item.id ?? ""));
  }

  function getPreviewFetchCode(targetId: string) {
    if (!selectedHeaderKey || availableHeaders.length === 0) return "无可用的 Header 配置";
    const parsed = parseHeaderConfig(selectedHeaderKey, availableHeaders);
    if (!parsed.headers) return parsed.error || "Header 解析失败";
    
    return `fetch("https://www.instagram.com/api/v1/friendships/${targetId || 'TARGET_USER_ID'}/following/?count=100", {
  "headers": ${JSON.stringify(parsed.headers, null, 4).replace(/\n/g, '\n  ')},
  "method": "GET"
});`;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div>
          共 {poolData?.total ?? 0} 条，页 {poolData?.page ?? 1}/{poolData?.total_pages ?? 1}
        </div>
        <div className="flex items-center gap-2">
          <span>每页</span>
          <Select
            value={String(poolPageSize)}
            onValueChange={(value) => {
              const nextSize = Number(value);
              setPoolPageSize(nextSize);
              setPoolPageSizeInput(String(nextSize));
              updatePoolPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            className="h-8 w-24"
            value={poolPageSizeInput}
            onChange={(event) => setPoolPageSizeInput(event.target.value)}
            placeholder="自定义"
          />
          <Button type="button" variant="outline" size="sm" onClick={applyPoolCustomPageSize} disabled={poolLoading}>
            设置
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updatePoolPage(Math.max(1, currentPoolPage - 1))}
            disabled={poolLoading || (poolData?.page ?? 1) <= 1}
          >
            上一页
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updatePoolPage(Math.min(poolData?.total_pages ?? 1, currentPoolPage + 1))}
            disabled={poolLoading || (poolData?.page ?? 1) >= (poolData?.total_pages ?? 1)}
          >
            下一页
          </Button>
          <Input
            type="number"
            min={1}
            className="h-8 w-20"
            value={poolJumpPageInput}
            onChange={(event) => setPoolJumpPageInput(event.target.value)}
            placeholder="页码"
          />
          <Button type="button" variant="outline" size="sm" onClick={jumpPoolPage} disabled={poolLoading}>
            跳转
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void loadUserPool(router)}
            disabled={poolLoading}
            title="按当前筛选刷新用户池分页数据"
          >
            {poolLoading ? "加载中..." : "刷新"}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>id</TableHead>
            <TableHead>username</TableHead>
            <TableHead>full_name</TableHead>
            <TableHead>repeat_count</TableHead>
            <TableHead>粉丝数</TableHead>
            <TableHead>ip属地</TableHead>
            <TableHead>is_completed</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {poolItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-muted-foreground text-center">
                {poolLoading ? "加载中..." : "暂无数据库用户数据"}
              </TableCell>
            </TableRow>
          ) : (
            poolItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>
                  {item.username ? (
                    <a
                      href={`https://www.instagram.com/${item.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {String(item.username)}
                    </a>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell>{String(item.full_name ?? "")}</TableCell>
                <TableCell>{item.repeat_count}</TableCell>
                <TableCell>{item.followers_count ?? "-"}</TableCell>
                <TableCell>{String(item.ip_location ?? "未知")}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={item.is_completed ? "secondary" : "outline"} className="w-fit">
                      {String(item.is_completed)}
                    </Badge>
                    {item.is_completed && (
                      <span className="text-xs text-muted-foreground mt-1 block">该用户已有抓取日志</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={item.is_completed ? "outline" : "default"}
                      onClick={() => void handleRowRun(item)}
                      disabled={loading || runningUserId === item.id}
                    >
                      {runningUserId === item.id ? "执行中..." : item.is_completed ? "重新抓取" : "抓取"}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          预览
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Fetch 请求预览 - 用户 {item.id}</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh] w-full rounded-md border p-4 bg-muted/30">
                          <pre className="text-xs">
                            <code>{getPreviewFetchCode(String(item.id ?? ""))}</code>
                          </pre>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
