/**
 * SWR 缓存键常量
 *
 * 集中管理所有 SWR 使用的缓存键，避免魔法字符串散落各处。
 *
 * @module common/hooks/swr-keys
 */

export const SWR_KEYS = {
  /** 内存中活跃浏览器实例列表 */
  MEMORY_INSTANCES: "memory-instances",
  /** 全局自动化配置 */
  AUTOMATION_CONFIG: "automation-config",
  /** 批量任务进度（按 runId 区分） */
  BATCH_TASK_PROGRESS: (runId: string) => `batch-task-${runId}`,
  /** PG 元数据初始化（数据库状态 + 表列表） */
  PG_META_INIT: "pg-meta-init",
  /** PG 表数据（与 selectedTable / page / filters 组成复合 key） */
  PG_TABLE_DATA: "pg-table-data",
  /** GetData 用户池列表（与 page / filters 组成复合 key） */
  GETDATA_POOL: "getdata-pool",
  /** ExtraData 用户列表（与 page / filters 组成复合 key） */
  EXTRA_DATA_USERS: "extra-data-users",
} as const;
