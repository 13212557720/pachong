"use client";

interface TaskProgressProps {
  taskStatus: string;
  progress: {
    total: number;
    success: number;
    failed: number;
    duplicate: number;
    current_index: number;
  } | null;
  summary: {
    total: number;
    success: number;
    failed: number;
    duplicate: number;
    log_file: string;
    run_id: string;
  } | null;
}

export function TaskProgress({
  taskStatus,
  progress,
  summary,
}: TaskProgressProps) {
  return (
    <>
      {(taskStatus === "running" || taskStatus === "paused") && progress && (
        <div className="mt-4 space-y-2 rounded-md border p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm">任务进度</span>
            <span className="text-sm font-medium">
              {progress.current_index} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all"
              style={{
                width: `${
                  progress.total > 0
                    ? Math.round((progress.current_index / progress.total) * 100)
                    : 0
                }%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground pt-1">
            <span>
              状态: {taskStatus === "running" ? "执行中..." : "已暂停"}
            </span>
            <span>
              成功: <span className="text-green-500">{progress.success}</span> |
              失败: <span className="text-red-500">{progress.failed}</span> |
              跳过: <span className="text-yellow-500">{progress.duplicate}</span>
            </span>
          </div>
        </div>
      )}

      {summary && (
        <div className="space-y-1 text-xs text-muted-foreground pt-4">
          <div className="font-medium text-foreground">
            执行完成：总数 {summary.total} 行 | 成功 {summary.success} 行 |
            失败/警告 {summary.failed} 行 | 跳过(重复) {summary.duplicate} 行
          </div>
          <div className="break-all pt-1">日志路径: {summary.log_file}</div>
        </div>
      )}
    </>
  );
}
