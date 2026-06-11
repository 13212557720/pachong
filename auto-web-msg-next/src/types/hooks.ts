/**
 * React Hooks 类型定义模块
 *
 * 定义与 React Hooks 相关的类型，用于状态管理和 UI 反馈
 * @module types/hooks
 */

/**
 * 消息状态类型，用于 UI 显示操作结果
 *
 * @property type - 消息类型：""=无消息, "ok"=成功, "err"=错误
 * @property text - 消息文本内容
 * @example { type: "ok", text: "操作成功" }
 */
export interface MessageState {
  type: "" | "ok" | "err" | "warn";
  text: string;
}

/**
 * 单个实例配置草稿项类型
 *
 * @property name - 实例名称
 * @property closeAfterSeconds - 自动关闭延迟秒数
 * @property saving - 是否正在保存中
 */
export interface DraftItem {
  name: string;
  closeAfterSeconds: string;
  saving: boolean;
  headless?: boolean;
}

/**
 * 草稿状态类型，按端口号索引的草稿映射
 *
 * @see DraftItem
 * @example { 2234: { name: "我的浏览器", closeAfterSeconds: "5", saving: false } }
 */
export type DraftState = Record<number, DraftItem>;
