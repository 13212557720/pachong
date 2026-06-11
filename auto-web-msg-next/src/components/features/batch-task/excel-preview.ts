import ExcelJS from "exceljs";
import type { PreviewRow } from "@/types/components";
import { worksheetToRows, pickCellByKeys } from "@/utils/excel";


/**
 * 从 Excel 文件读取预览行。
 *
 * @param file 用户选择的文件
 * @returns 预览行数组
 */
export async function parsePreviewRowsFromExcel(file: File): Promise<PreviewRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Excel 中没有可读取的工作表");
  }

  const rows = worksheetToRows(worksheet);
  return rows.map((row, index) => ({
    row: index + 2,
    link: String(pickCellByKeys(row, ["链接", "url", "link"]) ?? "").trim(),
    email: String(pickCellByKeys(row, ["邮箱", "email"]) ?? "").trim(),
    bloggerName: String(pickCellByKeys(row, ["博主名字", "博主", "name"]) ?? "").trim(),
    contact: String(pickCellByKeys(row, ["联系方式", "contact"]) ?? "").trim(),
    message: String(pickCellByKeys(row, ["话术", "message"]) ?? "").trim(),
  }));
}

