import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PreviewRow } from "@/types/components";

interface BatchPreviewTableProps {
  page: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  rows: PreviewRow[];
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * 批量任务预览表格。
 *
 * @param props 表格数据和分页事件
 * @returns 预览区域 UI
 */
export function BatchPreviewTable(props: BatchPreviewTableProps) {
  const safePage = Math.min(Math.max(props.page, 1), props.totalPages);
  const start = (safePage - 1) * props.pageSize;
  const visibleRows = props.rows.slice(start, start + props.pageSize);

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
            {visibleRows.map((row) => (
              <TableRow key={row.row}>
                <TableCell className="whitespace-normal break-all">{row.link}</TableCell>
                <TableCell className="whitespace-normal break-all">{row.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>每页</span>
          <Select
            value={String(props.pageSize)}
            onValueChange={(v) => {
              props.onPageSizeChange(Number(v));
              props.onPageChange(1);
            }}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {props.pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>共 {props.rows.length} 条</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => props.onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
          >
            上一页
          </Button>
          <span>{safePage}/{props.totalPages}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => props.onPageChange(Math.min(props.totalPages, safePage + 1))}
            disabled={safePage >= props.totalPages}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}

