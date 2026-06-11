import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetDataPageStore } from "../_hooks/useGetDataPageStore";

export default function GetDataTaskProgressPanel() {
  const progress = useGetDataPageStore((state) => state.progress);
  const running = useGetDataPageStore((state) => state.running);

  if (!running && !progress) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>抓取日志与进度</CardTitle>
        <CardDescription>实时显示分页抓取过程和 next_max_id</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {progress && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">run_id: {progress.run_id}</Badge>
            <Badge variant="secondary">status: {progress.status}</Badge>
            <Badge variant="secondary">pages: {progress.pages_fetched}</Badge>
            <Badge variant="secondary">records: {progress.records_fetched}</Badge>
            <Badge variant="secondary">max_id: {progress.current_max_id ?? "undefined"}</Badge>
          </div>
        )}
        <ScrollArea className="h-52 rounded-md border p-2">
          <div className="space-y-1 text-xs">
            {(progress?.logs || []).length === 0 ? (
              <div className="text-muted-foreground">等待日志...</div>
            ) : (
              (progress?.logs || []).map((line, index) => (
                <div key={`${index}-${line}`} className="break-all font-mono">
                  {line}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
