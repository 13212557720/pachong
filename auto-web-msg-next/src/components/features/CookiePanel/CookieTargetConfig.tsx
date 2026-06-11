"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BrowserInstance } from "@/types/browser";

interface CookieTargetConfigProps {
  selectedPortValue: string;
  setSelectedPort: (val: string) => void;
  runningInstances: BrowserInstance[];
  domainMode: "preset" | "custom";
  setDomainMode: (val: "preset" | "custom" | ((m: "preset" | "custom") => "preset" | "custom")) => void;
  presetDomain: string;
  setPresetDomain: (val: string) => void;
  customDomain: string;
  setCustomDomain: (val: string) => void;
  COMMON_DOMAINS: { label: string; value: string }[];
}

export function CookieTargetConfig({
  selectedPortValue,
  setSelectedPort,
  runningInstances,
  domainMode,
  setDomainMode,
  presetDomain,
  setPresetDomain,
  customDomain,
  setCustomDomain,
  COMMON_DOMAINS,
}: CookieTargetConfigProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>目标浏览器终端</Label>
        <Select
          value={selectedPortValue}
          onValueChange={(value) =>
            setSelectedPort(value === "__empty__" ? "" : value)
          }
        >
          <SelectTrigger className="bg-background h-9">
            <SelectValue placeholder="选择终端" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty__">
              -- 选择待挂载连接的实例 --
            </SelectItem>
            {runningInstances.map((item) => (
              <SelectItem key={item.id} value={String(item.port)}>
                {item.name || item.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center h-[20px]">
          <Label>指定作用统一下发域名</Label>
          <Button
            variant="link"
            className="h-auto p-0 text-[10px]"
            onClick={() =>
              setDomainMode((m) => (m === "preset" ? "custom" : "preset"))
            }
          >
            切换为{domainMode === "preset" ? "手动输入" : "内置预设"}
          </Button>
        </div>

        {domainMode === "preset" ? (
          <Select value={presetDomain} onValueChange={setPresetDomain}>
            <SelectTrigger className="bg-background h-9">
              <SelectValue placeholder="选择预设" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_DOMAINS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            className="h-9"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="自定义 (如 .facebook.com)"
          />
        )}
      </div>
    </div>
  );
}
