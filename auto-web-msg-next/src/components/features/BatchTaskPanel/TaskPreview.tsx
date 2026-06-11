"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { PreviewRow } from "@/types/components";

interface TaskPreviewProps {
  previewRows: PreviewRow[];
  pagedPreviewRows: PreviewRow[];
  previewPageSize: number;
  setPreviewPageSize: (size: number) => void;
  previewPage: number;
  setPreviewPage: (page: number | ((p: number) => number)) => void;
  previewTotalPages: number;
  safePreviewPage: number;
  PREVIEW_PAGE_SIZE_OPTIONS: readonly number[];
}

export function TaskPreview({
  previewRows,
  pagedPreviewRows,
  previewPageSize,
  setPreviewPageSize,
  setPreviewPage,
  previewTotalPages,
  safePreviewPage,
  PREVIEW_PAGE_SIZE_OPTIONS,
}: TaskPreviewProps) {
  if (previewRows.length === 0) return null;

  return (
    <div className="space-y-2 pt-1">
      <div className="text-xs text-muted-foreground">
        文件预览（将提取“链接 + 话术”执行，浏览器与动作使用上方自选项）
      </div>
      <ScrollArea className="h-80 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>链接</TableHead>
              <TableHead>话术</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedPreviewRows.map((row) => (
              <TableRow key={row.row}>
                <TableCell className="whitespace-normal break-all">
                  {row.link}
                </TableCell>
                <TableCell className="whitespace-normal break-all">
                  {row.message}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>每页</span>
          <Select
            value={String(previewPageSize)}
            onValueChange={(v) => {
              setPreviewPageSize(Number(v));
              setPreviewPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PREVIEW_PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>共 {previewRows.length} 条</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPreviewPage((prev) => Math.max(1, prev - 1))}
            disabled={safePreviewPage <= 1}
          >
            上一页
          </Button>
          <span>
            {safePreviewPage}/{previewTotalPages}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setPreviewPage((prev) => Math.min(previewTotalPages, prev + 1))
            }
            disabled={safePreviewPage >= previewTotalPages}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}
