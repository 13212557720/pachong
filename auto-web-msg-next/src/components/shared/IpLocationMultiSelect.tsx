"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IpLocationMultiSelectProps {
  /** 当前选中的值列表（逗号分隔字符串） */
  value: string;
  /** 值变更回调 */
  onChange: (value: string) => void;
  /** 从已加载数据中提取的可选项 */
  availableLocations?: string[];
  /** 标签 */
  label?: string;
  /** 未选择时的提示文案 */
  placeholder?: string;
}

/**
 * IP 属地多选组件
 *
 * 合并单值/多值筛选，提供：
 * - 从已加载数据自动提取可选的属地列表
 * - 点击 checkbox 快速勾选/取消
 * - 手动输入自定义值追加
 * - Badge 标签展示已选项，可单独移除
 */
export default function IpLocationMultiSelect({
  value,
  onChange,
  availableLocations = [],
  label = "选项（多选）",
  placeholder = "点击选择选项…",
}: IpLocationMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  function setPanelOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setSearchQuery("");
  }

  // 当前已选中的值（从逗号分隔字串解析）
  const selectedValues = useMemo(() => {
    return value
      .split(/[,，\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  // 合并：从 availableLocations 中去重 + 已选中但可能不在可选项中的值
  const allOptions = useMemo(() => {
    const set = new Set<string>();
    for (const loc of availableLocations) {
      if (loc && loc.trim()) set.add(loc.trim());
    }
    for (const v of selectedValues) {
      set.add(v);
    }
    // 默认提供 null 选项
    set.add("null");
    // 按字母排序，"未知" 放最后
    return Array.from(set).sort((a, b) => {
      if (a === "未知") return 1;
      if (b === "未知") return -1;
      return a.localeCompare(b, "zh-CN");
    });
  }, [availableLocations, selectedValues]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return allOptions;
    const lowerQuery = searchQuery.toLowerCase();
    return allOptions.filter((opt) => opt.toLowerCase().includes(lowerQuery));
  }, [allOptions, searchQuery]);

  const serializeAndEmit = useCallback(
    (next: string[]) => {
      onChange(next.join(","));
    },
    [onChange]
  );

  function toggleOption(option: string) {
    if (selectedValues.includes(option)) {
      serializeAndEmit(selectedValues.filter((v) => v !== option));
    } else {
      serializeAndEmit([...selectedValues, option]);
    }
  }

  function removeTag(tag: string) {
    serializeAndEmit(selectedValues.filter((v) => v !== tag));
  }


  function clearAll() {
    serializeAndEmit([]);
  }

  // 点击外部收起面板
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (open && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <Label className="text-sm">{label}</Label>

      {/* 已选中的标签展示 */}
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[36px] rounded-md border px-3 py-1.5 text-sm cursor-pointer bg-background hover:border-primary/50 transition-colors"
        onClick={() => setPanelOpen(!open)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPanelOpen(!open); }}
      >
        {selectedValues.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          selectedValues.map((v) => (
            <Badge
              key={v}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {v}
              <button
                type="button"
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 text-xs leading-none"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(v);
                }}
                aria-label={`移除 ${v}`}
              >
                ✕
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* 展开面板 */}
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover p-3 shadow-md space-y-3 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* 搜索框 */}
          <Input
            placeholder="搜索属地..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm"
          />

          {/* 可选项列表 */}
          {allOptions.length > 0 ? (
            <div className="max-h-64 overflow-y-auto p-1">
              {filteredOptions.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredOptions.map((option) => {
                    const checked = selectedValues.includes(option);
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-2 rounded px-2 py-1 text-sm cursor-pointer hover:bg-accent transition-colors"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleOption(option)}
                        />
                        <span className={checked ? "font-medium truncate" : "truncate"}>{option}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  没有找到匹配的选项
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">
              暂无可选项，请先加载数据或手动输入
            </p>
          )}

          {/* 手动输入 */}
          {/* <div className="flex items-center gap-2">
            <Input
              className="h-8 text-sm"
              placeholder="手动输入，逗号分隔多个"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={addCustom}>
              添加
            </Button>
          </div> */}

          {/* 操作栏 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              已选 {selectedValues.length} 项
            </span>
            <div className="flex items-center gap-2">
              {selectedValues.length > 0 && (
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
                  清空
                </Button>
              )}
              <Button type="button" variant="secondary" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>
                收起
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
