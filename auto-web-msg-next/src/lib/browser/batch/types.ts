/**
 * Batch 模块类型定义
 *
 * 包含批量任务相关类型：
 * - OpenPageAutomationAction: 页面自动化动作类型
 * - TaskExecutionStatus: 任务执行状态
 * - BatchTaskInput: 批量任务输入
 * - BatchTaskResult: 批量任务结果
 * - BatchAutomationResult: 批量自动化结果
 *
 * @module lib/browser/batch/types
 */

import { OpenPageAutomationAction } from "@/types/browser";


export type TaskExecutionStatus = "success" | "failed" | "duplicate";

export interface BatchTaskInput {
  row: number;
  port: number;
  url: string;
  message: string;
  action?: OpenPageAutomationAction;
  validation_error?: string;
}

export interface BatchTaskResult {
  row: number;
  port: number;
  url: string;
  action: OpenPageAutomationAction;
  status: TaskExecutionStatus;
  error?: string;
  duration_ms: number;
}

export interface BatchAutomationResult {
  run_id: string;
  log_file: string;
  total: number;
  success: number;
  failed: number;
  duplicate: number;
  items: BatchTaskResult[];
}

export type BatchTaskStatus = "running" | "paused" | "cancelled" | "completed" | "error";

export interface BatchTaskState {
  run_id: string;
  status: BatchTaskStatus;
  total: number;
  success: number;
  failed: number;
  duplicate: number;
  current_index: number;
  log_file: string;
  tasks: BatchTaskInput[];
  results: BatchTaskResult[];
  error?: string;
  interval_ms: number;
}
