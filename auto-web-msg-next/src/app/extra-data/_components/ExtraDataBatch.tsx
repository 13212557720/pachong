"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useExtraDataPageStore } from "../_hooks/useExtraDataPageStore";

// ─── 组件 ────────────────────────────────────────────────────────

export default function ExtraDataBatch() {
  const router = useRouter();
  const [renderedAt] = useState(() => Date.now());
  const extraDataTemplates = useExtraDataPageStore((state) => state.extraDataTemplates);
  const activeTemplateIndex = useExtraDataPageStore((state) => state.activeTemplateIndex);
  const runningBatch = useExtraDataPageStore((state) => state.runningBatch);
  const setActiveTemplateIndex = useExtraDataPageStore((state) => state.setActiveTemplateIndex);
  const loadConfig = useExtraDataPageStore((state) => state.loadConfig);

  const runCurrentPageBatch = useExtraDataPageStore((state) => state.runCurrentPageBatch);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleRunBatch = () => {
    void runCurrentPageBatch(router);
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="extra-template">额外数据发包模板（当前激活）</Label>
        <Select 
          value={String(activeTemplateIndex)} 
          onValueChange={(val) => void setActiveTemplateIndex(Number(val))}
        >
          <SelectTrigger id="extra-template">
            <SelectValue placeholder="请选择发包模板" />
          </SelectTrigger>
          <SelectContent>
            {extraDataTemplates.map((item, idx) => {
              let isExpired = false;
              try {
                const parsed = typeof item.value === "string" ? JSON.parse(item.value) : item.value;
                const createdAt =
                  parsed && typeof parsed === "object" && "created_at" in parsed
                    ? Number((parsed as Record<string, unknown>).created_at)
                    : 0;
                if (createdAt && renderedAt - createdAt > 12 * 60 * 60 * 1000) {
                  isExpired = true;
                }
              } catch {}
              
              return (
                <SelectItem key={idx} value={String(idx)}>
                  {item.key || `(未命名 ${idx + 1})`} {isExpired && <span className="text-red-500 ml-2">(可能已过期)</span>}
                </SelectItem>
              );
            })}
            {extraDataTemplates.length === 0 && (
              <SelectItem value="0" disabled>暂无模板，请前往设置或提取</SelectItem>
            )}
          </SelectContent>
        </Select>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>可用模板：{extraDataTemplates.length} 个</span>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 md:col-span-2">
        <Button type="button" onClick={handleRunBatch} disabled={runningBatch}>
          {runningBatch ? "执行中..." : "执行当前页增强"}
        </Button>
      </div>
    </div>
  );
}
