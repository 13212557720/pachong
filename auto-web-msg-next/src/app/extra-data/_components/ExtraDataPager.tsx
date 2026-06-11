"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "@/constants";
import { useExtraDataPageStore } from "../_hooks/useExtraDataPageStore";

export function PageSizeSelector() {
  const pageSize = useExtraDataPageStore((state) => state.pageSize);
  const pageSizeInput = useExtraDataPageStore((state) => state.pageSizeInput);
  const loadingUsers = useExtraDataPageStore((state) => state.loadingUsers);
  const setPageSize = useExtraDataPageStore((state) => state.setPageSize);
  const setPageSizeInput = useExtraDataPageStore((state) => state.setPageSizeInput);
  const applyCustomPageSize = useExtraDataPageStore((state) => state.applyCustomPageSize);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">每页</span>
      <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
        <SelectTrigger className="h-9 w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={1}
        className="h-9 w-24"
        value={pageSizeInput}
        onChange={(event) => setPageSizeInput(event.target.value)}
        placeholder="自定义"
      />
      <Button type="button" variant="outline" size="sm" onClick={applyCustomPageSize} disabled={loadingUsers}>
        设置
      </Button>
    </div>
  );
}
