"use client";

import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SharedDataFilterPanel from "@/components/shared/SharedDataFilterPanel";
import { useSharedFilterBindings } from "@/hooks/useSharedFilterBindings";
import { useExtraDataPageStore } from "../_hooks/useExtraDataPageStore";

export default function ExtraDataFilter() {
  const router = useRouter();
  const filterForm = useExtraDataPageStore((state) => state.filterForm);
  const availableLocations = useExtraDataPageStore((state) => state.availableLocations);
  const loadingUsers = useExtraDataPageStore((state) => state.loadingUsers);
  const exportLimit = useExtraDataPageStore((state) => state.exportLimit);
  const exportingFormat = useExtraDataPageStore((state) => state.exportingFormat);
  const setFilterForm = useExtraDataPageStore((state) => state.setFilterForm);
  const setExportLimit = useExtraDataPageStore((state) => state.setExportLimit);
  const applyFilters = useExtraDataPageStore((state) => state.applyFilters);
  const resetFilters = useExtraDataPageStore((state) => state.resetFilters);
  const handleExport = useExtraDataPageStore((state) => state.handleExport);
  const bindings = useSharedFilterBindings(filterForm, setFilterForm);

  return (
    <SharedDataFilterPanel
      {...bindings}
      availableLocations={availableLocations}
      onApply={applyFilters}
      onReset={resetFilters}
      loading={loadingUsers}
      exportLimit={exportLimit}
      setExportLimit={setExportLimit}
      onExport={(format) => void handleExport(router, format)}
      exportingFormat={exportingFormat}
    >
      <div className="space-y-2">
        <Label>is_private（多选）</Label>
        <div className="flex items-center gap-4 rounded-md border p-2 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={filterForm.is_private_true}
              onCheckedChange={(checked) =>
                setFilterForm((prev) => ({ ...prev, is_private_true: Boolean(checked) }))
              }
            />
            true
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={filterForm.is_private_false}
              onCheckedChange={(checked) =>
                setFilterForm((prev) => ({ ...prev, is_private_false: Boolean(checked) }))
              }
            />
            false
          </label>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-followers-min">followers_count_min</Label>
        <Input
          id="filter-followers-min"
          type="number"
          value={filterForm.followers_count_min}
          onChange={(event) => setFilterForm((prev) => ({ ...prev, followers_count_min: event.target.value }))}
          placeholder="最小值"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-followers-max">followers_count_max</Label>
        <Input
          id="filter-followers-max"
          type="number"
          value={filterForm.followers_count_max}
          onChange={(event) => setFilterForm((prev) => ({ ...prev, followers_count_max: event.target.value }))}
          placeholder="最大值"
        />
      </div>
    </SharedDataFilterPanel>
  );
}
