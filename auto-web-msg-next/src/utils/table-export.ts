import ExcelJS from "exceljs";

/**
 * 格式化单元格数据为字符串、数字或布尔值，处理对象和日期的序列化
 * @param value - 原始单元格值
 * @returns 格式化后的安全基本类型值
 */
function sanitizeCell(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return value as string | number | boolean;
}

/**
 * 触发浏览器的文件下载行为
 * @param blob - 包含文件数据的 Blob 对象
 * @param fileName - 下载文件的默认名称
 */
function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * 将数据数组导出并下载为 CSV 文件
 * @param fileName - 导出的文件名
 * @param rows - 包含数据的对象数组
 */
export function downloadCsv(fileName: string, rows: Record<string, unknown>[]) {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const escapeCell = (value: unknown): string => {
    const text = String(sanitizeCell(value));
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const csvRows = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => escapeCell(row[key])).join(",")),
  ];
  const content = `\uFEFF${csvRows.join("\n")}`;
  triggerDownload(new Blob([content], { type: "text/csv;charset=utf-8;" }), fileName);
}

/**
 * 将数据数组导出并下载为 XLSX (Excel) 文件
 * @param fileName - 导出的文件名
 * @param rows - 包含数据的对象数组
 */
export function downloadXlsx(fileName: string, rows: Record<string, unknown>[]) {
  void (async () => {
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("data");

    if (headers.length > 0) {
      worksheet.addRow(headers);
      for (const row of rows) {
        worksheet.addRow(headers.map((key) => sanitizeCell(row[key])));
      }
    }

    const output = await workbook.xlsx.writeBuffer();
    triggerDownload(
      new Blob([output], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      fileName
    );
  })();
}

/**
 * 清理并规范化文件名片段，移除非法字符，适合用作导出文件的名称
 * @param input - 原始文件名片段
 * @returns 安全的文件名片段，默认为 "export"
 */
export function sanitizeFilePart(input: string): string {
  return String(input || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "export";
}
