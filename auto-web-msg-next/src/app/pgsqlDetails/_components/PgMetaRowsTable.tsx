/**
 * PG Meta 数据表格组件
 *
 * 展示 PostgreSQL 表数据和列结构，使用 Zustand Store 管理状态。
 * 包含列类型标签展示、行号计算、单元格格式化等功能。
 *
 * @module pg-meta/components
 */

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePgMetaStore } from "../_stores";
import { formatCellValue } from "../_utils/format";

/**
 * PG 表结构与数据展示区
 *
 * 从 Zustand Store 获取表数据、列宽配置、分页信息，
 * 动态渲染列类型标签和数据行。支持自动计算行号（基于当前页码）。
 *
 * @returns 表格区域 UI，未选择表时显示提示信息
 *
 * @example
 * ```tsx
 * <PgMetaRowsTable />
 * ```
 */
export function PgMetaRowsTable() {
  /** 当前表数据（包含列定义和数据行） */
  const tableData = usePgMetaStore((s) => s.tableData);
  /** 各列的最小宽度配置 */
  const columnWidths = usePgMetaStore((s) => s.columnWidths);
  /** 当前页码（从 1 开始） */
  const page = usePgMetaStore((s) => s.page);
  /** 每页显示行数 */
  const pageSize = usePgMetaStore((s) => s.pageSize);

  if (!tableData) {
    return <div className="py-8 text-center text-muted-foreground">请选择表</div>;
  }

  return (
    <>
      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
        {tableData.columns.map((col) => (
          <Badge key={col.column_name} variant="outline" className="font-mono text-[10px]">
            {col.column_name}
            <span className="ml-1 text-blue-500">{col.data_type}</span>
            {col.is_nullable === "NO" && <span className="ml-1 text-red-500">NOT NULL</span>}
          </Badge>
        ))}
      </div>

      {tableData.rows.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">表为空</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-xs">#</TableHead>
                {tableData.columns.map((col) => (
                  <TableHead
                    key={col.column_name}
                    className="font-mono text-xs"
                    style={{ minWidth: columnWidths[col.column_name] }}
                  >
                    {col.column_name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-muted-foreground">
                    {(page - 1) * pageSize + i + 1}
                  </TableCell>
                  {tableData.columns.map((col) => (
                    <TableCell
                      key={col.column_name}
                      className="max-w-[300px] truncate font-mono text-xs"
                      title={formatCellValue(row[col.column_name])}
                    >
                      {formatCellValue(row[col.column_name])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
