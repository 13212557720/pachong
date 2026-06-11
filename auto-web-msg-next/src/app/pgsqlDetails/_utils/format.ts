/**
 * PG Meta 格式化工具函数
 *
 * 提供统一的格式化功能，供 getdata 和 pgsqlDetails 页面共用。
 * 主要用于处理 PostgreSQL 查询结果的展示格式化。
 *
 * @module pg-meta/utils/format
 */

/**
 * 统一格式化表格单元格值用于展示。
 *
 * 根据值的类型进行不同的格式化处理：
 * - null/undefined: 显示为 "NULL"
 * - Date 对象: 转换为 ISO 格式字符串
 * - 对象类型: 序列化为 JSON 字符串
 * - 其他类型: 转换为字符串
 *
 * @param value 单元格原始值，类型未知需要运行时判断
 * @returns 格式化后的显示文本
 *
 * @example
 * formatCellValue(null)              // "NULL"
 * formatCellValue(new Date('2024-01-01')) // "2024-01-01T00:00:00.000Z"
 * formatCellValue({ name: 'test' })  // '{"name":"test"}'
 * formatCellValue(123)               // "123"
 */
export function formatCellValue(value: unknown): string {
  // 空值统一显示为 NULL，便于用户识别数据库中的空值
  if (value === null || value === undefined) return "NULL";
  // 日期类型转换为 ISO 标准格式，保证时区信息完整
  if (value instanceof Date) return value.toISOString();
  // 对象类型（包括数组）序列化为 JSON，便于查看结构化数据
  if (typeof value === "object") return JSON.stringify(value);
  // 基本类型直接转字符串
  return String(value);
}

/**
 * 计算表格列宽。
 *
 * 根据列名和数据内容自动计算合适的列宽，确保表格展示美观且信息完整。
 * 计算逻辑：
 * 1. 以列名长度作为初始宽度基准
 * 2. 遍历数据行（最多100行），找出最长的内容
 * 3. 将宽度限制在最小值和最大值之间
 *
 * @param columns 列信息数组，包含列名
 * @param rows 数据行数组，用于计算内容宽度
 * @param minWidth 最小列宽（像素），默认 80px
 * @param maxWidth 最大列宽（像素），默认 300px
 * @returns 列名到宽度值的映射对象
 *
 * @example
 * const columns = [{ column_name: 'id' }, { column_name: 'name' }];
 * const rows = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
 * const widths = calculateColumnWidths(columns, rows);
 * // 返回: { id: 80, name: 80 }
 */
export function calculateColumnWidths(
  columns: Array<{ column_name: string }>,
  rows: Record<string, unknown>[],
  minWidth = 80,
  maxWidth = 300
): Record<string, number> {
  // 存储每列计算出的宽度
  const widths: Record<string, number> = {};

  for (const col of columns) {
    // 初始宽度基于列名长度，每个字符约占 8 像素（中文字符会更宽）
    let maxLen = col.column_name.length * 8;

    // 只检查前 100 行数据，避免大数据集性能问题
    for (const row of rows.slice(0, 100)) {
      const value = row[col.column_name];
      // 使用 formatCellValue 格式化后计算长度，保证与显示一致
      const formatted = formatCellValue(value);
      // 取当前最大长度和新值长度的较大者
      maxLen = Math.max(maxLen, formatted.length * 8);
    }

    // 将宽度限制在 [minWidth, maxWidth] 范围内
    widths[col.column_name] = Math.min(maxWidth, Math.max(minWidth, maxLen));
  }

  return widths;
}
