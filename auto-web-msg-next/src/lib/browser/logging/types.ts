/**
 * Logging 模块类型定义
 *
 * 包含日志系统相关类型：
 * - OpenPageLogEntry: 页面访问日志条目
 * - TaskLogEntry: 任务执行日志条目
 *
 * @module lib/browser/logging/types
 */
import type { OpenPageAutomationAction } from "@/types/browser";

export interface OpenPageLogEntry {
  timestamp: string;
  port: number;
  url: string;
  canonical_url: string;
  forced: boolean;
  action: "opened" | "skipped_duplicate";
  automation_action: OpenPageAutomationAction;
}

export type TaskLogEntry =
  | {
      timestamp: string;
      run_id: string;
      kind: "run_start";
      total: number;
    }
  | {
      timestamp: string;
      run_id: string;
      kind: "run_end";
      total: number;
      success: number;
      failed: number;
      duplicate: number;
    }
  | {
      timestamp: string;
      run_id: string;
      row: number;
      port: number;
      url: string;
      action: OpenPageAutomationAction;
      message_preview: string;
      status: "success" | "failed" | "duplicate";
      error?: string;
      duration_ms: number;
    };