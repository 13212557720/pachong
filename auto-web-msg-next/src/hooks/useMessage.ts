import { useCallback, useState } from "react";
import type { MessageState } from "@/types/hooks";

/**
 * 统一管理页面消息状态（成功/失败提示）。
 *
 * @returns 消息状态与消息操作函数
 */
export function useMessage() {
  const [message, setMessage] = useState<MessageState>({ type: "", text: "" });

  /**
   * 设置提示消息。
   *
   * @param type 消息类型
   * @param text 消息文本
   */
  const showMessage = useCallback((type: MessageState["type"], text: string) => {
    setMessage({ type, text });
  }, []);

  /**
   * 清空当前提示消息。
   */
  const clearMessage = useCallback(() => {
    setMessage({ type: "", text: "" });
  }, []);

  return { message, showMessage, clearMessage };
}

