import ExcelJS from "exceljs";

/**
 * 规范化表头键名，便于忽略大小写做匹配。
 *
 * @param input 原始表头
 * @returns 规范化后的键名
 */
function normalizeHeaderKey(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * 从行数据中按单个键读取单元格内容。
 *
 * @param row 行对象
 * @param key 要读取的键
 * @returns 读取到的值
 */
function pickCell(row: Record<string, unknown>, key: string): unknown {
  const wanted = normalizeHeaderKey(key);
  const foundKey = Object.keys(row).find((k) => normalizeHeaderKey(k) === wanted);
  if (!foundKey) return undefined;
  return row[foundKey];
}

/**
 * 从行数据中按候选键列表依次读取第一个可用值。
 *
 * @param row 行对象
 * @param keys 候选键列表
 * @returns 读取到的值
 */
export function pickCellByKeys(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = pickCell(row, key);
    if (value !== undefined) return value;
  }
  return undefined;
}

/**
 * 将工作表解析为对象数组。
 *
 * @param worksheet Excel 工作表
 * @returns 行对象数组
 */
export function worksheetToRows(worksheet: ExcelJS.Worksheet): Record<string, unknown>[] {
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = (cell.text || "").trim();
  });

  const validHeaderIndexes = headers
    .map((header, index) => ({ header, index }))
    .filter((item) => item.header.length > 0);

  const rows: Record<string, unknown>[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const record: Record<string, unknown> = {};
    let hasValue = false;
    for (const { header, index } of validHeaderIndexes) {
      const text = (row.getCell(index + 1).text || "").trim();
      record[header] = text;
      if (text !== "") hasValue = true;
    }
    if (hasValue) {
      rows.push(record);
    }
  }
  return rows;
}
