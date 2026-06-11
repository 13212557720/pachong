/**
 * PG Meta 分页与导出控制组件
 *
 * 提供分页控制和数据导出功能，支持：
 * - 预设每页行数选择
 * - 自定义每页行数设置
 * - 上一页/下一页导航
 * - 页码跳转
 * - CSV/XLSX 格式导出
 *
 * 使用 Zustand Store 管理状态，导出受当前筛选条件影响。
 *
 * @module pg-meta/components
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InlineTip from "@/components/shared/InlineTip";
import { usePgMetaStore } from "../_stores";
import { PAGE_SIZE_OPTIONS } from "@/constants";

/**
 * PgMetaPagerExport 组件属性接口
 */
interface PgMetaPagerExportProps {
  /** 导出 CSV 文件的回调函数 */
  onExportCsv: () => void;
  /** 导出 XLSX 文件的回调函数 */
  onExportXlsx: () => void;
}

/**
 * PG 表分页与导出控制区
 *
 * 从 Zustand Store 获取分页状态和导出状态，提供分页导航和导出按钮。
 * 支持预设和自定义每页行数，以及页码跳转功能。
 *
 * @param props - 组件属性，包含导出回调函数
 * @param props.onExportCsv - 导出 CSV 文件的回调函数
 * @param props.onExportXlsx - 导出 XLSX 文件的回调函数
 * @returns 控制区 UI
 *
 * @example
 * ```tsx
 * <PgMetaPagerExport
 *   onExportCsv={() => handleExport('csv')}
 *   onExportXlsx={() => handleExport('xlsx')}
 * />
 * ```
 */
export function PgMetaPagerExport({ onExportCsv, onExportXlsx }: PgMetaPagerExportProps) {
  /** 当前页码（从 1 开始） */
  const page = usePgMetaStore((s) => s.page);
  /** 每页显示行数 */
  const pageSize = usePgMetaStore((s) => s.pageSize);
  /** 总页数 */
  const totalPages = usePgMetaStore((s) => s.totalPages);
  /** 数据加载中状态 */
  const loading = usePgMetaStore((s) => s.loading);
  /** 导出中状态 */
  const exporting = usePgMetaStore((s) => s.exporting);
  /** 导出数量上限 */
  const exportLimit = usePgMetaStore((s) => s.exportLimit);
  /** 页码跳转输入框的值 */
  const jumpPageInput = usePgMetaStore((s) => s.jumpPageInput);
  /** 自定义每页行数输入框的值 */
  const pageSizeInput = usePgMetaStore((s) => s.pageSizeInput);

  /** 设置当前页码的方法 */
  const setPage = usePgMetaStore((s) => s.setPage);
  /** 设置每页行数的方法 */
  const setPageSize = usePgMetaStore((s) => s.setPageSize);
  /** 设置导出数量上限的方法 */
  const setExportLimit = usePgMetaStore((s) => s.setExportLimit);
  /** 设置页码跳转输入框值的方法 */
  const setJumpPageInput = usePgMetaStore((s) => s.setJumpPageInput);
  /** 设置自定义每页行数输入框值的方法 */
  const setPageSizeInput = usePgMetaStore((s) => s.setPageSizeInput);

  /**
   * 跳转到上一页
   *
   * 将页码减 1，但不小于 1。
   */
  const handlePrevPage = () => {
    setPage(Math.max(1, page - 1));
  };

  /**
   * 跳转到下一页
   *
   * 将页码加 1，但不大于总页数。
   */
  const handleNextPage = () => {
    setPage(Math.min(totalPages, page + 1));
  };

  /**
   * 跳转到指定页码
   *
   * 解析输入框中的页码，验证有效后跳转并清空输入框。
   * 无效输入不执行任何操作。
   */
const handleJumpToPage = () => {
    const target = parseInt(jumpPageInput, 10);
    if (target) {
      setPage(target);
      setJumpPageInput("");
    }
  };

  const handleApplyCustomPageSize = () => {
    const size = parseInt(pageSizeInput, 10);
    if (size) {
      setPageSize(size);
      setPageSizeInput("");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">每页</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => setPageSize(Number(v))}
        >
          <SelectTrigger className="w-20">
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
          className="h-8 w-24"
          value={pageSizeInput}
          onChange={(e) => setPageSizeInput(e.target.value)}
          placeholder="自定义"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleApplyCustomPageSize}>
          设置
        </Button>
        <span className="text-muted-foreground">行</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrevPage}
          disabled={page <= 1 || loading}
        >
          上一页
        </Button>
        <span className="text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={page >= totalPages || loading}
        >
          下一页
        </Button>
        <Input
          type="number"
          min={1}
          className="h-8 w-20"
          value={jumpPageInput}
          onChange={(e) => setJumpPageInput(e.target.value)}
          placeholder="页码"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleJumpToPage}>
          跳转
        </Button>
        <Input
          type="number"
          min={1}
          className="h-8 w-24"
          value={String(exportLimit)}
          onChange={(e) => setExportLimit(parseInt(e.target.value, 10) || 10000)}
          placeholder="导出数量"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExportCsv}
          disabled={exporting}
        >
          {exporting ? "导出中..." : "CSV"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExportXlsx}
          disabled={exporting}
        >
          {exporting ? "导出中..." : "XLSX"}
        </Button>
        <InlineTip text="导出受当前筛选影响，并按导出数量上限截取" />
      </div>
    </div>
  );
}
