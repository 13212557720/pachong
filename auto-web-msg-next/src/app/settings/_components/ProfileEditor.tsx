"use client";

import type { ConfigItem, SimpleConfig, ActiveConfig } from "@/types/config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  config: SimpleConfig;
  onChange: (updates: Partial<SimpleConfig>) => void;
};

type ConfigCategory = "cookies" | "tokens";

function ActiveBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
      激活
    </span>
  );
}

function configValueToText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return JSON.stringify(value, null, 2);
}

function ConfigItemList({
  category,
  items,
  activeIndex,
  onAdd,
  onRemove,
  onUpdate,
  onActiveChange,
}: {
  category: ConfigCategory;
  items: ConfigItem[];
  activeIndex: number;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, key: string, value: string) => void;
  onActiveChange: (index: number) => void;
}) {
  const categoryLabels: Record<ConfigCategory, string> = {
    cookies: "Cookie",
    tokens: "Token",
  };

  const hasItems = items.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Label className="text-sm font-medium">{categoryLabels[category]}</Label>
          {hasItems && <ActiveBadge />}
        </div>
        <div className="flex items-center gap-2">
          {hasItems && (
            <Select
              value={String(activeIndex)}
              onValueChange={(val) => onActiveChange(Number(val))}
            >
              <SelectTrigger className="h-6 w-24">
                <SelectValue placeholder="选择激活项" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item, idx) => (
                  <SelectItem key={idx} value={String(idx)}>
                    <span className="flex items-center gap-1">
                      {item.key || `(未命名 ${idx + 1})`}
                      {idx === activeIndex && <span className="text-primary">✓</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={onAdd}>
            + 添加
          </Button>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2">暂无配置</div>
      ) : (
        items.map((item, idx) => (
          <div key={idx} className={`flex gap-2 items-start ${idx === activeIndex ? "rounded-md border border-primary/50 bg-primary/5 p-1 -mx-1" : ""}`}>
            <Input
              placeholder="名称"
              value={item.key}
              onChange={(e) => onUpdate(idx, e.target.value, configValueToText(item.value))}
              className="w-24"
            />
            <Textarea
              placeholder="值"
              value={configValueToText(item.value)}
              onChange={(e) => onUpdate(idx, item.key, e.target.value)}
              className="flex-1 min-h-[60px]"
              rows={2}
            />
            <Button variant="ghost" size="sm" onClick={() => onRemove(idx)} className="text-destructive">
              ×
            </Button>
          </div>
        ))
      )}
    </div>
  );
}

export default function ProfileEditor({ config, onChange }: Props) {
  const handleAddItem = (category: ConfigCategory) => {
    const newItems = [...(config[category] ?? [])];
    newItems.push({ key: `${category}_${Date.now()}`, value: "" });
    onChange({ [category]: newItems });
  };

  const handleRemoveItem = (category: ConfigCategory, index: number) => {
    const newItems = [...(config[category] ?? [])];
    newItems.splice(index, 1);
    onChange({ [category]: newItems });
  };

  const handleUpdateItem = (category: ConfigCategory, index: number, key: string, value: string) => {
    const newItems = [...(config[category] ?? [])];
    newItems[index] = { key, value };
    onChange({ [category]: newItems });
  };

  const handleActiveChange = (category: ConfigCategory, index: number) => {
    const newActive: ActiveConfig = { ...config.active };
    newActive[category] = index;
    onChange({ active: newActive });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ConfigItemList
            category="tokens"
            items={config.tokens ?? []}
            activeIndex={config.active?.tokens ?? 0}
            onAdd={() => handleAddItem("tokens")}
            onRemove={(idx) => handleRemoveItem("tokens", idx)}
            onUpdate={(idx, key, value) => handleUpdateItem("tokens", idx, key, value)}
            onActiveChange={(idx) => handleActiveChange("tokens", idx)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">额外数据发包模板 (管理)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(config.extraDataTemplates ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground py-2 text-center">暂无模板</div>
          ) : (
            <div className="space-y-1">
              {(config.extraDataTemplates ?? []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group rounded-md p-2 hover:bg-muted/50 transition-colors">
                  <div className="text-sm font-medium truncate flex-1">{item.key}</div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const newTemplates = [...(config.extraDataTemplates ?? [])];
                      newTemplates.splice(idx, 1);
                      onChange({ extraDataTemplates: newTemplates });
                    }} 
                    className="text-destructive opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="text-[10px] text-muted-foreground mt-2 px-1">
            模板由提取操作自动生成。在此仅支持删除过期或多余的模板。
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
