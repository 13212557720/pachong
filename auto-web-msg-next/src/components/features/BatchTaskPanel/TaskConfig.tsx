"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { BrowserInstance } from "@/types/browser";
import { PAGE_ACTION_OPTIONS } from "@/lib/client/constants";

interface TaskConfigProps {
  instances: BrowserInstance[];
  selectedPortValue: string;
  handlePlaceholderOptionClick: () => void;
  handlePortChange: (value: string) => void;
  selectedAction: string;
  setSelectedAction: (value: string) => void;
  intervalMs: string;
  setIntervalMs: (value: string) => void;
  handleIntervalBlur?: (value: string) => void;
}

export function TaskConfig({
  instances,
  selectedPortValue,
  handlePlaceholderOptionClick,
  handlePortChange,
  selectedAction,
  setSelectedAction,
  intervalMs,
  setIntervalMs,
  handleIntervalBlur,
}: TaskConfigProps) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="task-port">浏览器端口（自选）</Label>
        </div>
        <Select
          value={selectedPortValue}
          onValueChange={(value) => {
            if (value === "__empty__") {
              handlePlaceholderOptionClick();
              handlePortChange("");
              return;
            }
            handlePortChange(value);
          }}
        >
          <SelectTrigger id="task-port" className="w-full">
            <SelectValue placeholder="请选择端口" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty__">请选择端口</SelectItem>
            {instances.map((item) => (
              <SelectItem key={item.id} value={String(item.port)}>
                {item.name || item.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-action">操作动作（自选）</Label>
        <Select
          value={selectedAction}
          onValueChange={(value) => setSelectedAction(value)}
        >
          <SelectTrigger id="task-action" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_ACTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-interval">任务间隔 (毫秒)</Label>
        <Input
          id="task-interval"
          type="number"
          placeholder="例如 1000"
          value={intervalMs}
          onChange={(e) => setIntervalMs(e.target.value)}
          onBlur={(e) => handleIntervalBlur?.(e.target.value)}
        />
      </div>
    </>
  );
}
