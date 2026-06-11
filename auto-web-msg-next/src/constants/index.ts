/**
 * 全局统一常量定义
 *
 * 将原本分散在各个组件和配置文件中的同名/同义常量抽取至此，
 * 确保各处下拉框选项和默认值一致。
 *
 * @module common/constants/index
 */

/** 表格/列表的分页配置选项 */
export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

/** 默认浏览器调试端口 */
export const DEFAULT_PORT = 2234;
