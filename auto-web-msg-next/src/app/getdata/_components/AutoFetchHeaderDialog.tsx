"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getMemoryInstancesAction } from "@/actions/browser-instance-actions";
import { autoFetchInstagramHeaderAction } from "@/actions/getdata-actions";
import { getServerConfigAction } from "@/actions/settings-actions";
import type { BrowserInstance } from "@/types/browser";

const DEFAULT_URL = "https://www.instagram.com/assassinscreed/";
const LS_URLS_KEY = "auto-fetch-header-urls";

interface Props {
  onFetched: (key: string) => void;
}

function loadSavedUrls(): string[] {
  if (typeof window === "undefined") return [DEFAULT_URL];
  const raw = localStorage.getItem(LS_URLS_KEY);
  if (!raw) return [DEFAULT_URL];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.from(new Set([DEFAULT_URL, ...parsed]));
  } catch {
    return [DEFAULT_URL];
  }
}

export default function AutoFetchHeaderDialog({ onFetched }: Props) {
  const [open, setOpen] = useState(false);
  const [instances, setInstances] = useState<BrowserInstance[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [targetUrl, setTargetUrl] = useState(DEFAULT_URL);
  const [savedUrls, setSavedUrls] = useState<string[]>(loadSavedUrls);
  const [loading, setLoading] = useState(false);

  // Load running instances when dialog opens
  useEffect(() => {
    if (!open) return;
    void (async () => {
      const res = await getMemoryInstancesAction();
      if (res.success) {
        const running = res.data.items.filter((i) => i.status === "running");
        setInstances(running);
        if (running.length > 0 && !selectedId) {
          setSelectedId(running[0].id);
        }
      }
    })();
  }, [open, selectedId]);

  const saveUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed || trimmed === DEFAULT_URL) return;
    const next = Array.from(new Set([DEFAULT_URL, trimmed, ...savedUrls])).slice(0, 10);
    setSavedUrls(next);
    localStorage.setItem(LS_URLS_KEY, JSON.stringify(next.filter((u) => u !== DEFAULT_URL)));
  };

  const handleFetch = async () => {
    if (!selectedId) {
      toast.error("请选择一个运行中的浏览器实例");
      return;
    }
    const url = targetUrl.trim() || DEFAULT_URL;
    saveUrl(url);
    setLoading(true);
    try {
      const res = await autoFetchInstagramHeaderAction(selectedId, url);
      if (!res.success) {
        toast.error(`提取失败: ${res.error}`);
        return;
      }
      toast.success(`Header 已保存为 "${res.data.key}"`);
      // Reload available headers list
      const configRes = await getServerConfigAction();
      if (configRes.success) {
        onFetched(res.data.key);
      }
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">自动提取 Header</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>自动提取 Instagram Header</DialogTitle>
          <DialogDescription>
            选择已连接的浏览器实例，程序将自动打开页面并拦截请求，提取鉴权 Header。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>浏览器实例</Label>
            {instances.length === 0 ? (
              <p className="text-sm text-muted-foreground">无运行中的实例，请先在浏览器管理页面连接</p>
            ) : (
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择实例" />
                </SelectTrigger>
                <SelectContent>
                  {instances.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name || inst.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>目标 URL</Label>
            <div className="flex gap-2">
              <Select value={targetUrl} onValueChange={setTargetUrl}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {savedUrls.map((url) => (
                    <SelectItem key={url} value={url}>{url}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="输入自定义 URL（回车保存）"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    saveUrl(val);
                    setTargetUrl(val);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
            <p className="text-xs text-muted-foreground">在输入框输入新 URL 后按 Enter 即可保存到下拉列表</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>取消</Button>
          <Button onClick={handleFetch} disabled={loading || instances.length === 0}>
            {loading ? "提取中（约 15 秒）..." : "开始提取"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
