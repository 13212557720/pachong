import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SharedDataFilterPanel from "@/components/shared/SharedDataFilterPanel";
import InlineTip from "@/components/shared/InlineTip";
import { useSharedFilterBindings } from "@/hooks/useSharedFilterBindings";
import { useGetDataPageStore } from "../_hooks/useGetDataPageStore";

export default function GetDataFilterForm() {
  const router = useRouter();
  const manualUserId = useGetDataPageStore((state) => state.manualUserId);
  const exportLimit = useGetDataPageStore((state) => state.exportLimit);
  const loading = useGetDataPageStore((state) => state.loading);
  const runningUserId = useGetDataPageStore((state) => state.runningUserId);
  const poolFiltersForm = useGetDataPageStore((state) => state.poolFiltersForm);
  const poolLoading = useGetDataPageStore((state) => state.poolLoading);
  const availableLocations = useGetDataPageStore((state) => state.availableLocations);
  const exportingFormat = useGetDataPageStore((state) => state.poolExporting);
  const setManualUserId = useGetDataPageStore((state) => state.setManualUserId);
  const setExportLimit = useGetDataPageStore((state) => state.setExportLimit);
  const setPoolFiltersForm = useGetDataPageStore((state) => state.setPoolFiltersForm);
  const applyPoolFilters = useGetDataPageStore((state) => state.applyPoolFilters);
  const resetPoolFilters = useGetDataPageStore((state) => state.resetPoolFilters);
  const startTaskForUserid = useGetDataPageStore((state) => state.startTaskForUserid);
  const exportPool = useGetDataPageStore((state) => state.exportPool);
  const bindings = useSharedFilterBindings(poolFiltersForm, setPoolFiltersForm);

  return (
    <div className="space-y-3">
      <SharedDataFilterPanel
        {...bindings}
        availableLocations={availableLocations}
        onApply={applyPoolFilters}
        onReset={resetPoolFilters}
        loading={poolLoading}
        exportLimit={exportLimit}
        setExportLimit={setExportLimit}
        onExport={(format) => void exportPool(router, format, exportLimit)}
        exportingFormat={exportingFormat}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">is_completed</label>
          <Select
            value={poolFiltersForm.is_completed}
            onValueChange={(value: "all" | "true" | "false") =>
              setPoolFiltersForm((prev) => ({ ...prev, is_completed: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">is_completed: 全部</SelectItem>
              <SelectItem value="true">is_completed: true</SelectItem>
              <SelectItem value="false">is_completed: false</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">repeat_count 最小值</label>
          <Input
            type="number"
            min={0}
            value={poolFiltersForm.repeat_count_min}
            onChange={(event) => setPoolFiltersForm((prev) => ({ ...prev, repeat_count_min: event.target.value }))}
            placeholder="repeat_count 最小值"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">repeat_count 最大值</label>
          <Input
            type="number"
            min={0}
            value={poolFiltersForm.repeat_count_max}
            onChange={(event) => setPoolFiltersForm((prev) => ({ ...prev, repeat_count_max: event.target.value }))}
            placeholder="repeat_count 最大值"
          />
        </div>
      </SharedDataFilterPanel>
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <Input
          value={manualUserId}
          onChange={(event) => setManualUserId(event.target.value)}
          placeholder="手动输入 userid，例如 78255850299"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void startTaskForUserid(router, manualUserId)}
          disabled={loading || !manualUserId.trim()}
          title="使用输入框中的 userid 发起抓取"
        >
          {loading && runningUserId === manualUserId.trim() ? "执行中..." : "手动ID抓取"}
        </Button>
        <InlineTip text="适合不在当前列表中的临时目标" />
      </div>
    </div>
  );
}
