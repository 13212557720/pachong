"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import IpLocationMultiSelect from "@/components/shared/IpLocationMultiSelect";
import InlineTip from "@/components/shared/InlineTip";
import { ReactNode } from "react";

export interface SharedDataFilterPanelProps {
  id: string;
  setId: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  ipLocationIn: string;
  setIpLocationIn: (v: string) => void;
  ipLocationNotIn: string;
  setIpLocationNotIn: (v: string) => void;
  ipLocationNotIncludeNull: boolean;
  setIpLocationNotIncludeNull: (v: boolean) => void;

  availableLocations: string[];
  
  createdAtMin: string;
  setCreatedAtMin: (v: string) => void;
  createdAtMax: string;
  setCreatedAtMax: (v: string) => void;

  children?: ReactNode;

  onApply: () => void;
  onReset: () => void;
  loading?: boolean;

  exportLimit: string;
  setExportLimit: (v: string) => void;
  onExport: (format: "csv" | "xlsx") => void;
  exportingFormat: "" | "csv" | "xlsx";
}

export default function SharedDataFilterPanel({
  id,
  setId,
  username,
  setUsername,
  ipLocationIn,
  setIpLocationIn,
  ipLocationNotIn,
  setIpLocationNotIn,
  ipLocationNotIncludeNull,
  setIpLocationNotIncludeNull,
  availableLocations,
  createdAtMin,
  setCreatedAtMin,
  createdAtMax,
  setCreatedAtMax,
  children,
  onApply,
  onReset,
  loading,
  exportLimit,
  setExportLimit,
  onExport,
  exportingFormat,
}: SharedDataFilterPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="shared-filter-id">id / keyword</Label>
          <Input
            id="shared-filter-id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="包含匹配"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shared-filter-username">username</Label>
          <Input
            id="shared-filter-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="包含匹配"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="shared-filter-date-max">录入时间 (晚于及早于)</Label>
          <div className="flex gap-2">
            <Input
              id="shared-filter-date-min"
              type="date"
              value={createdAtMin}
              onChange={(e) => setCreatedAtMin(e.target.value)}
              className="flex-1"
            />
            <span className="self-center text-muted-foreground">-</span>
            <Input
              id="shared-filter-date-max"
              type="date"
              value={createdAtMax}
              onChange={(e) => setCreatedAtMax(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {children}

        <IpLocationMultiSelect
          label="ip_location 包含(OR)"
          placeholder="点击选择或输入要包含的 ip 属地…"
          value={ipLocationIn}
          onChange={setIpLocationIn}
          availableLocations={availableLocations}
        />
        <IpLocationMultiSelect
          label="ip_location 排除(NOT IN)"
          placeholder="点击选择要排除的 ip 属地…"
          value={ipLocationNotIn}
          onChange={setIpLocationNotIn}
          availableLocations={availableLocations}
        />
        <div className="space-y-2">
          <Label>非筛选包含 NULL</Label>
          <label className="flex items-center gap-2 rounded-md border p-2 text-sm bg-background">
            <Checkbox
              checked={ipLocationNotIncludeNull}
              onCheckedChange={(checked) => setIpLocationNotIncludeNull(Boolean(checked))}
            />
            不包含未知/NULL
          </label>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" onClick={onApply} disabled={loading}>
          查询
        </Button>
        <Button type="button" variant="outline" onClick={onReset} disabled={loading}>
          重置筛选
        </Button>
        <InlineTip text="筛选后自动回到第一页" />
        
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">导出限制</span>
          <Input
            type="number"
            min={1}
            className="h-9 w-24"
            value={exportLimit}
            onChange={(e) => setExportLimit(e.target.value)}
            placeholder="数量"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => onExport("csv")}
            disabled={exportingFormat !== ""}
          >
            {exportingFormat === "csv" ? "导出中..." : "导出 CSV"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onExport("xlsx")}
            disabled={exportingFormat !== ""}
          >
            {exportingFormat === "xlsx" ? "导出中..." : "导出 XLSX"}
          </Button>
        </div>
      </div>
    </div>
  );
}
