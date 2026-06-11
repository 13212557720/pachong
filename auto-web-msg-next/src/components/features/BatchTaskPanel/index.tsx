"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import ExcelJS from "exceljs";
import useSWR from "swr";
import { getMemoryInstancesAction } from "@/actions/browser-instance-actions";
import { SWR_KEYS } from "@/hooks/swr-keys";
import { PAGE_SIZE_OPTIONS } from "@/constants";
import { pickCellByKeys } from "@/utils/excel";
import {
  startXlsxAutomationAction,
  getBatchTaskProgressAction,
  pauseBatchTaskAction,
  resumeBatchTaskAction,
  cancelBatchTaskAction,
  updateBatchTaskIntervalAction,
} from "@/actions/browser-batch-actions";
import InlineTip from "@/components/shared/InlineTip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PreviewRow } from "@/types/components";
import type { BrowserInstance } from "@/types/browser";
import { PAGE_ACTION_OPTIONS } from "@/lib/client/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMessage } from "@/hooks";

// Sub-components
import { FileUploader } from "./FileUploader";
import { TaskConfig } from "./TaskConfig";
import { TaskControls } from "./TaskControls";
import { TaskProgress } from "./TaskProgress";
import { TaskPreview } from "./TaskPreview";



export default function BatchTaskPanel() {
  const { message, showMessage } = useMessage();
  const [file, setFile] = useState<File | null>(null);
  const [selectedPort, setSelectedPort] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>(
    PAGE_ACTION_OPTIONS[0].value
  );
  const [intervalMs, setIntervalMs] = useState<string>("1000");

  const [runId, setRunId] = useState<string>("");
  const [taskStatus, setTaskStatus] = useState<string>("");
  const [progress, setProgress] = useState<{
    total: number;
    success: number;
    failed: number;
    duplicate: number;
    current_index: number;
  } | null>(null);

  const [summary, setSummary] = useState<{
    total: number;
    success: number;
    failed: number;
    duplicate: number;
    log_file: string;
    run_id: string;
  } | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState<number>(20);

  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [mappingLink, setMappingLink] = useState<string>("");
  const [mappingMessage, setMappingMessage] = useState<string>("");

  const skipNextPlaceholderChangeRef = useRef(false);

  // --- 任务进度：SWR 轮询 ---
  const isTaskActive = taskStatus === "running" || taskStatus === "paused";
  useSWR(
    runId && isTaskActive ? SWR_KEYS.BATCH_TASK_PROGRESS(runId) : null,
    async () => {
      const res = await getBatchTaskProgressAction(runId);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    {
      refreshInterval: isTaskActive ? 2000 : 0,
      revalidateOnFocus: false,
      onSuccess: (data) => {
        setTaskStatus(data.status);
        setProgress({
          total: data.total,
          success: data.success,
          failed: data.failed,
          duplicate: data.duplicate,
          current_index: data.current_index,
        });

        if (
          data.interval_ms !== undefined &&
          !document.getElementById("task-interval")?.matches(":focus")
        ) {
          setIntervalMs(String(data.interval_ms));
        }

        const isFinal =
          data.status === "completed" ||
          data.status === "cancelled" ||
          data.status === "error";
        if (isFinal) {
          setSummary({
            total: data.total,
            success: data.success,
            failed: data.failed,
            duplicate: data.duplicate,
            log_file: data.log_file,
            run_id: data.run_id,
          });
          if (data.status === "error") {
            showMessage("err", `任务异常: ${data.error}`);
          } else if (data.status === "completed") {
            showMessage(
              "ok",
              `批量任务完成：成功 ${data.success}，失败 ${data.failed}，跳过 ${data.duplicate}，日志 ${data.log_file}`
            );
          } else {
            showMessage("ok", `批量任务已被取消`);
          }
        }
      },
    }
  );

  // --- 浏览器实例列表：SWR 共享缓存 ---
  const { data: instances = [], mutate: mutateInstances } = useSWR<
    BrowserInstance[]
  >(
    SWR_KEYS.MEMORY_INSTANCES,
    async () => {
      const res = await getMemoryInstancesAction();
      if (!res.success) throw new Error(res.error);
      return res.data.items;
    },
    { revalidateOnFocus: false }
  );

  const refreshInstances = useCallback(() => mutateInstances(), [mutateInstances]);

  function handlePortChange(nextPort: string) {
    setSelectedPort(nextPort);
    if (nextPort !== "") return;
    if (skipNextPlaceholderChangeRef.current) {
      skipNextPlaceholderChangeRef.current = false;
      return;
    }
    void refreshInstances();
  }

  function handlePlaceholderOptionClick() {
    skipNextPlaceholderChangeRef.current = true;
    void refreshInstances();
  }

  const defaultPort = instances[0]?.port ? String(instances[0].port) : "";
  const effectiveSelectedPort = selectedPort || defaultPort;
  const selectedPortValue = effectiveSelectedPort || "__empty__";



  async function handleFileChange(nextFile: File | null) {
    setFile(nextFile);
    setSummary(null);
    if (!nextFile) {
      setRawRows([]);
      setHeaders([]);
      setPreviewPage(1);
      return;
    }
    try {
      const buffer = await nextFile.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        setRawRows([]);
        setHeaders([]);
        showMessage("err", "Excel 中没有可读取的工作表");
        return;
      }

      const parsedHeaders: string[] = [];
      worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const key = cell.value != null ? String(cell.value) : `col${colNumber}`;
        parsedHeaders.push(key);
      });
      setHeaders(parsedHeaders);

      const rows: Record<string, unknown>[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const obj: Record<string, unknown> = {};
        parsedHeaders.forEach((header, index) => {
          const cell = row.getCell(index + 1);
          let rawValue = cell.value;

          if (rawValue && typeof rawValue === "object" && !(rawValue instanceof Date)) {
            if (
              "hyperlink" in rawValue &&
              typeof (rawValue as { hyperlink?: unknown }).hyperlink === "string"
            ) {
              rawValue = (rawValue as { hyperlink: string }).hyperlink;
            } else if ("text" in rawValue) {
              rawValue = String((rawValue as { text?: unknown }).text ?? "");
            } else if (
              "richText" in rawValue &&
              Array.isArray((rawValue as { richText?: unknown }).richText)
            ) {
              rawValue = (rawValue as { richText: { text?: unknown }[] }).richText
                .map((t) => String(t.text || ""))
                .join("");
            } else if ("result" in rawValue) {
              const res = (rawValue as { result?: unknown }).result;
              rawValue =
                typeof res === "string" ||
                typeof res === "number" ||
                typeof res === "boolean"
                  ? res
                  : String(res ?? "");
            } else {
              rawValue = String(rawValue);
            }
          } else if (rawValue instanceof Date) {
            rawValue = rawValue.toISOString();
          }

          if (typeof rawValue === "string") {
            const trimmed = rawValue.trim();
            if (trimmed !== "") {
              const num = Number(trimmed);
              if (
                !Number.isNaN(num) &&
                Number.isFinite(num) &&
                !trimmed.startsWith("+") &&
                (trimmed === "0" || !trimmed.startsWith("0") || trimmed.startsWith("0."))
              ) {
                rawValue = num;
              } else {
                rawValue = trimmed;
              }
            } else {
              rawValue = "";
            }
          }

          obj[header] = rawValue ?? "";
        });
        rows.push(obj);
      });

      setRawRows(rows);

      const findMatch = (candidates: string[]) => {
        return (
          parsedHeaders.find((h) =>
            candidates.some((c) => h.toLowerCase().includes(c.toLowerCase()))
          ) || ""
        );
      };

      setMappingLink(findMatch(["链接", "url", "link"]));
      setMappingMessage(findMatch(["话术", "message"]));
      setPreviewPage(1);
    } catch (err) {
      setRawRows([]);
      setHeaders([]);
      setPreviewPage(1);
      const message = err instanceof Error ? err.message : "解析文件失败";
      showMessage("err", `解析 Excel 失败: ${message}`);
    }
  }

  const previewRows = useMemo<PreviewRow[]>(() => {
    const linkKeys = mappingLink
      ? [mappingLink]
      : ["链接", "url", "URL", "link", "Link"];
    const messageKeys = mappingMessage
      ? [mappingMessage]
      : ["话术", "message", "Message"];

    return rawRows.map((row, index) => ({
      row: index + 2,
      link: String(pickCellByKeys(row, linkKeys) ?? "").trim(),
      email: String(pickCellByKeys(row, ["邮箱", "email", "Email"]) ?? "").trim(),
      bloggerName: String(pickCellByKeys(row, ["博主名字", "博主", "name", "Name"]) ?? "").trim(),
      contact: String(pickCellByKeys(row, ["联系方式", "contact", "Contact"]) ?? "").trim(),
      message: String(pickCellByKeys(row, messageKeys) ?? "").trim(),
    }));
  }, [rawRows, mappingLink, mappingMessage]);

  const previewTotalPages = Math.max(1, Math.ceil(previewRows.length / previewPageSize));
  const safePreviewPage = Math.min(Math.max(previewPage, 1), previewTotalPages);
  const pagedPreviewRows = useMemo(() => {
    const start = (safePreviewPage - 1) * previewPageSize;
    return previewRows.slice(start, start + previewPageSize);
  }, [previewPageSize, previewRows, safePreviewPage]);

  async function handleSubmit() {
    if (!file) {
      showMessage("err", "请先选择 xlsx 文件");
      return;
    }
    const parsedPort = Number.parseInt(effectiveSelectedPort, 10) || 0;

    showMessage("", "");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("default_port", String(parsedPort));
      formData.append("default_action", selectedAction);
      formData.append("mapping_link", mappingLink);
      formData.append("mapping_message", mappingMessage);
      formData.append("interval_ms", intervalMs);

      const result = await startXlsxAutomationAction(formData);
      if (!result.success) {
        showMessage("err", `批量执行失败: ${result.error}`);
        return;
      }
      setRunId(result.data.run_id);
      setTaskStatus("running");
      setProgress(null);
      setSummary(null);
      showMessage("ok", "批量任务已提交并开始执行");
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      showMessage("err", `批量执行失败: ${message}`);
    }
  }

  async function handlePause() {
    if (!runId) return;
    const res = await pauseBatchTaskAction(runId);
    if (res.success) {
      setTaskStatus("paused");
      showMessage("ok", "任务已暂停");
    } else {
      showMessage("err", `暂停失败: ${res.error}`);
    }
  }

  async function handleResume() {
    if (!runId) return;
    const res = await resumeBatchTaskAction(runId);
    if (res.success) {
      setTaskStatus("running");
      showMessage("ok", "任务已恢复");
    } else {
      showMessage("err", `恢复失败: ${res.error}`);
    }
  }

  async function handleCancel() {
    if (!runId) return;
    const res = await cancelBatchTaskAction(runId);
    if (res.success) {
      setTaskStatus("cancelled");
      showMessage("ok", "任务已取消");
    } else {
      showMessage("err", `取消失败: ${res.error}`);
    }
  }

  async function handleIntervalBlur(val: string) {
    if (isTaskActive && runId) {
      const parsed = parseInt(val, 10);
      if (!Number.isNaN(parsed)) {
        const res = await updateBatchTaskIntervalAction(runId, parsed);
        if (res.success) {
          showMessage("ok", "已实时更新任务间隔");
        } else {
          showMessage("err", `更新间隔失败: ${res.error}`);
        }
      }
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>XLSX 批量任务</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <FileUploader
          headers={headers}
          mappingLink={mappingLink}
          setMappingLink={setMappingLink}
          mappingMessage={mappingMessage}
          setMappingMessage={setMappingMessage}
          handleFileChange={(file) => void handleFileChange(file)}
        />
        <TaskConfig
          instances={instances}
          selectedPortValue={selectedPortValue}
          handlePlaceholderOptionClick={handlePlaceholderOptionClick}
          handlePortChange={handlePortChange}
          selectedAction={selectedAction}
          setSelectedAction={setSelectedAction}
          intervalMs={intervalMs}
          setIntervalMs={setIntervalMs}
          handleIntervalBlur={handleIntervalBlur}
        />
        <TaskControls
          taskStatus={taskStatus}
          handleSubmit={() => void handleSubmit()}
          handlePause={() => void handlePause()}
          handleResume={() => void handleResume()}
          handleCancel={() => void handleCancel()}
        />
        <TaskProgress
          taskStatus={taskStatus}
          progress={progress}
          summary={summary}
        />
        <InlineTip text="建议先检查预览数据，再执行正式批量任务" />
        <TaskPreview
          previewRows={previewRows}
          pagedPreviewRows={pagedPreviewRows}
          previewPageSize={previewPageSize}
          setPreviewPageSize={setPreviewPageSize}
          previewPage={previewPage}
          setPreviewPage={setPreviewPage}
          previewTotalPages={previewTotalPages}
          safePreviewPage={safePreviewPage}
          PREVIEW_PAGE_SIZE_OPTIONS={PAGE_SIZE_OPTIONS}
        />

        {message.text && (
          <Alert variant={message.type === "err" ? "destructive" : "default"}>
            <AlertTitle>
              {message.type === "err" ? "操作失败" : "操作结果"}
            </AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
