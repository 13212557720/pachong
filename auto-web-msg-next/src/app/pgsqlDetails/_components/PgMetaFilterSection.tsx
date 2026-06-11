/**
 * PG Meta 筛选区域组件
 *
 * 提供动态筛选功能，支持多种筛选条件：
 * - 关键词匹配（LIKE）
 * - 包含值筛选（IN）
 * - 排除值筛选（NOT IN）
 * - 数值范围筛选
 * - 布尔值筛选
 * - NULL 值筛选
 *
 * 使用 Zustand Store 管理状态，每次应用一个列筛选后加入筛选集合。
 *
 * @module pg-meta/components
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InlineTip from "@/components/shared/InlineTip";
import IpLocationMultiSelect from "@/components/shared/IpLocationMultiSelect";
import { usePgMetaStore, useSelectedColumnType } from "../_stores";
import { useMemo } from "react";
import { createFilterFromForm } from "../_utils/filter";

/**
 * PG 表动态筛选区
 *
 * 从 Zustand Store 获取表数据和筛选状态，提供筛选表单 UI。
 * 用户可以针对不同列设置筛选条件，支持多列组合筛选。
 *
 * @returns 筛选 UI，未选择表时返回 null
 *
 * @example
 * ```tsx
 * <PgMetaFilterSection />
 * ```
 */
export function PgMetaFilterSection() {
  /** 当前表数据（用于获取可选列名） */
  const tableData = usePgMetaStore((s) => s.tableData);
  /** 已应用的筛选条件列表 */
  const filters = usePgMetaStore((s) => s.filters);
  /** 当前筛选表单状态 */
  const filterForm = usePgMetaStore((s) => s.filterForm);
  /** 更新筛选表单状态的方法 */
  const updateFilterForm = usePgMetaStore((s) => s.updateFilterForm);
  /** 添加筛选条件到筛选集合的方法 */
  const addFilter = usePgMetaStore((s) => s.addFilter);
  /** 清空所有筛选条件的方法 */
  const clearFilters = usePgMetaStore((s) => s.clearFilters);

  /** 当前选中列的数据类型（用于显示提示） */
  const selectedColumnType = useSelectedColumnType();

  /** 提取当前页的候选值 */
  const availableOptions = useMemo(() => {
    if (!tableData || !filterForm.filterColumn) return [];
    const set = new Set<string>();
    for (const row of tableData.rows) {
      const v = row[filterForm.filterColumn];
      if (v != null && v !== "") {
        set.add(String(v));
      }
    }
    return Array.from(set);
  }, [tableData, filterForm.filterColumn]);

  /**
   * 应用当前列筛选
   *
   * 根据表单状态和列类型创建筛选条件，添加到筛选集合后重置表单。
   * 如果创建的筛选条件无效则不执行任何操作。
   */
  const handleApplyColumnFilter = () => {
    const filter = createFilterFromForm(filterForm, selectedColumnType);
    if (filter) {
      addFilter(filter);
      updateFilterForm({
        filterColumn: "",
        keywordInput: "",
        inValuesInput: "",
        notInValuesInput: "",
        rangeMinInput: "",
        rangeMaxInput: "",
        boolTrue: false,
        boolFalse: false,
        includeNull: false,
      });
    }
  };

  if (!tableData) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="text-sm font-medium">动态筛选</div>
      <div className="grid gap-2 md:grid-cols-3">
        <div className="space-y-2">
          <Label>筛选列</Label>
          <Select
            value={filterForm.filterColumn || "__empty__"}
            onValueChange={(value) => updateFilterForm({ filterColumn: value === "__empty__" ? "" : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择列" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty__">请选择列</SelectItem>
              {tableData.columns.map((col) => (
                <SelectItem key={col.column_name} value={col.column_name}>
                  {col.column_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">{selectedColumnType || "未选择列"}</div>
        </div>
        <div className="space-y-2">
          <Label>关键词</Label>
          <Input
            value={filterForm.keywordInput}
            onChange={(e) => updateFilterForm({ keywordInput: e.target.value })}
            placeholder="包含匹配"
          />
        </div>
        <IpLocationMultiSelect
          label="包含值(OR)"
          placeholder="点击选择或输入…"
          value={filterForm.inValuesInput}
          onChange={(v) => updateFilterForm({ inValuesInput: v })}
          availableLocations={availableOptions}
        />
        <IpLocationMultiSelect
          label="排除值(NOT IN)"
          placeholder="点击选择或输入…"
          value={filterForm.notInValuesInput}
          onChange={(v) => updateFilterForm({ notInValuesInput: v })}
          availableLocations={availableOptions}
        />
        <div className="space-y-2">
          <Label>数值最小值</Label>
          <Input
            type="number"
            value={filterForm.rangeMinInput}
            onChange={(e) => updateFilterForm({ rangeMinInput: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>数值最大值</Label>
          <Input
            type="number"
            value={filterForm.rangeMaxInput}
            onChange={(e) => updateFilterForm({ rangeMaxInput: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>布尔多选</Label>
          <div className="flex items-center gap-4 rounded-md border p-2 text-sm">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={filterForm.boolTrue}
                onCheckedChange={(checked) => updateFilterForm({ boolTrue: Boolean(checked) })}
              />
              true
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={filterForm.boolFalse}
                onCheckedChange={(checked) => updateFilterForm({ boolFalse: Boolean(checked) })}
              />
              false
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <Label>包含 NULL</Label>
          <label className="flex items-center gap-2 rounded-md border p-2 text-sm">
            <Checkbox
              checked={filterForm.includeNull}
              onCheckedChange={(checked) => updateFilterForm({ includeNull: Boolean(checked) })}
            />
            includeNull
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={handleApplyColumnFilter}>
          应用当前列筛选
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
          清空全部筛选
        </Button>
        <InlineTip text="每次只编辑一个列筛选，点应用后会加入筛选集合" />
      </div>
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {filters.map((filter) => (
            <Badge key={filter.column} variant="outline">
              {filter.column}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
