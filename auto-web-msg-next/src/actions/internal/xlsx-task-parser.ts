import ExcelJS from "exceljs";
import { normalizeOpenPageAction } from "@/lib/browser";
import { pickCellByKeys, worksheetToRows } from "@/utils/excel";
import type { BatchTaskInput } from "@/lib/browser/batch/types";


/**
 * 将 Excel 行数据转换为批量自动化任务列表。
 * 当提供多个默认端口时，按 round-robin 方式交错分配到各端口。
 *
 * @param rows 行数组
 * @param defaults 默认端口列表和默认动作
 * @returns 批量任务数组
 */
function parseBatchTasksFromRows(
  rows: Record<string, unknown>[],
  defaults: { defaultPorts?: number[]; defaultAction?: string; mappingLink?: string; mappingMessage?: string }
): BatchTaskInput[] {
  if (rows.length === 0) {
    throw new Error("表格为空，至少需要一行数据");
  }

  const ports = defaults.defaultPorts?.length ? defaults.defaultPorts : [];

  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const linkKeys = defaults.mappingLink ? [defaults.mappingLink] : ["url", "链接", "URL", "link", "Link"];
    const messageKeys = defaults.mappingMessage ? [defaults.mappingMessage] : ["message", "话术", "MESSAGE"];
    
    const portRaw = String(pickCellByKeys(row, ["port", "端口", "PORT"]) ?? "").trim();
    const url = String(pickCellByKeys(row, linkKeys) ?? "").trim();
    const message = String(pickCellByKeys(row, messageKeys) ?? "").trim();
    const actionRaw = String(pickCellByKeys(row, ["action", "操作动作", "动作"]) ?? "").trim();
    const action = normalizeOpenPageAction(actionRaw || defaults.defaultAction || "");

    // 端口优先取 Excel 行内值，否则按 round-robin 从默认端口列表中轮转分配
    let port = 0;
    if (portRaw) {
      const parsed = Number.parseInt(portRaw, 10);
      port = Number.isInteger(parsed) ? parsed : 0;
    } else if (ports.length > 0) {
      port = ports[index % ports.length];
    }

    const errors: string[] = [];
    if (!url) {
      errors.push("url 为空");
    }

    return {
      row: rowNumber,
      port,
      url,
      message,
      action,
      ...(errors.length > 0 ? { validation_error: errors.join("; ") } : {}),
    };
  });
}

/**
 * 从上传的 Excel 文件中读取批量任务。
 *
 * @param formData 提交表单
 * @param defaults 默认端口和动作
 * @returns 任务数组
 */
export async function parseBatchTasksFromFormData(
  formData: FormData,
  defaults: { defaultPorts?: number[]; defaultAction?: string; mappingLink?: string; mappingMessage?: string }
): Promise<BatchTaskInput[]> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("请上传 .xlsx 文件");
  }

  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Excel 中没有可读取的工作表");
  }
  const rows = worksheetToRows(worksheet);
  return parseBatchTasksFromRows(rows, defaults);
}

