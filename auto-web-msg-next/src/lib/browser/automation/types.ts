/**
 * Automation 模块类型定义
 *
 * 包含平台自动化相关类型：
 * - RunInstagramArgs: Instagram 自动化参数
 * - RunFacebookArgs: Facebook 自动化参数
 *
 * @module lib/browser/automation/types
 */

export interface RunInstagramArgs {
  browser: import("playwright").Browser;
  targetUrl: string;
  greetingText: string;
  sendEnabled: boolean;
  highlightSelector: string;
  sendButtonSelector: string;
}

export interface RunFacebookArgs {
  browser: import("playwright").Browser;
  targetUrl: string;
  message: string;
  sendEnabled: boolean;
}