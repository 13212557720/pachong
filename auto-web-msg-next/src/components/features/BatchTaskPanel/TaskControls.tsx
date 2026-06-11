"use client";

import { Button } from "@/components/ui/button";

interface TaskControlsProps {
  taskStatus: string;
  handleSubmit: () => void;
  handlePause: () => void;
  handleResume: () => void;
  handleCancel: () => void;
}

export function TaskControls({
  taskStatus,
  handleSubmit,
  handlePause,
  handleResume,
  handleCancel,
}: TaskControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={taskStatus === "running" || taskStatus === "paused"}
      >
        开始批量执行
      </Button>
      {taskStatus === "running" && (
        <Button type="button" variant="secondary" onClick={handlePause}>
          暂停任务
        </Button>
      )}
      {taskStatus === "paused" && (
        <Button type="button" variant="secondary" onClick={handleResume}>
          恢复任务
        </Button>
      )}
      {(taskStatus === "running" || taskStatus === "paused") && (
        <Button type="button" variant="destructive" onClick={handleCancel}>
          取消任务
        </Button>
      )}
    </div>
  );
}
