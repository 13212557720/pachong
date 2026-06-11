import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InlineTip from "@/components/shared/InlineTip";
import { useGetDataPageStore } from "../_hooks/useGetDataPageStore";
import { parseHeaderConfig } from "../_services/getdata-page-helpers";
import AutoFetchHeaderDialog from "./AutoFetchHeaderDialog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";

export default function GetDataCrawlForm() {
  const router = useRouter();
  const userid = useGetDataPageStore((state) => state.userid);
  const availableHeaders = useGetDataPageStore((state) => state.availableHeaders);
  const selectedHeaderKey = useGetDataPageStore((state) => state.selectedHeaderKey);
  const loading = useGetDataPageStore((state) => state.loading);
  const setUserid = useGetDataPageStore((state) => state.setUserid);
  const setSelectedHeaderKey = useGetDataPageStore((state) => state.setSelectedHeaderKey);
  const startTaskForUserid = useGetDataPageStore((state) => state.startTaskForUserid);
  const initializePage = useGetDataPageStore((state) => state.initializePage);

  const handleHeaderFetched = async (newKey: string) => {
    await initializePage();
    setSelectedHeaderKey(newKey);
  };

  const selectedHeader = availableHeaders.find((h) => h.key === selectedHeaderKey);

  const previewFetchCode = useMemo(() => {
    if (!selectedHeaderKey || availableHeaders.length === 0) return "无数据";
    const parsed = parseHeaderConfig(selectedHeaderKey, availableHeaders);
    if (!parsed.headers) return parsed.error || "解析失败";
    
    return `fetch("https://www.instagram.com/api/v1/friendships/${userid || 'TARGET_USER_ID'}/following/?count=100", {
  "headers": ${JSON.stringify(parsed.headers, null, 4).replace(/\n/g, '\n  ')},
  "method": "GET"
});`;
  }, [selectedHeaderKey, availableHeaders, userid]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>抓取参数</CardTitle>
        <CardDescription>按固定分页大小 100 自动翻页，直到无 next_max_id。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userid">userid</Label>
          <Input
            id="userid"
            value={userid}
            onChange={(event) => setUserid(event.target.value)}
            placeholder="例如: 78255850299"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="headers">选择 Header 配置</Label>
            <AutoFetchHeaderDialog onFetched={handleHeaderFetched} />
          </div>
          {availableHeaders.length === 0 ? (
            <div className="text-sm text-amber-600 dark:text-amber-400 p-2 border rounded-md">
              无可选项，请先 <Link href="/settings" className="font-medium underline hover:text-amber-700">导航到设置</Link> 添加 Headers，或使用“自动提取 Header”。
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={selectedHeaderKey} onValueChange={setSelectedHeaderKey}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="请选择 Header" />
                </SelectTrigger>
                <SelectContent>
                  {availableHeaders.map((header) => (
                    <SelectItem key={header.key} value={header.key}>
                      {header.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" disabled={!selectedHeader}>
                    <Eye className="w-4 h-4" />
                    <span className="sr-only">查看详情</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Header: {selectedHeaderKey}</DialogTitle>
                  </DialogHeader>
                  <pre className="p-4 bg-muted rounded-md overflow-auto max-h-[60vh] text-xs">
                    {previewFetchCode}
                  </pre>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
        <Button type="button" onClick={() => void startTaskForUserid(router, userid)} disabled={loading}>
          {loading ? "抓取中..." : "开始抓取"}
        </Button>
        <InlineTip text="会创建后台任务，进度在下方日志区实时刷新" />
      </CardContent>
    </Card>
  );
}
