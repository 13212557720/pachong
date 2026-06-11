/**
 * Browser 模块主入口
 *
 * 模块结构：
 * - core: 基础设施（配置、状态、错误、网络、工具、类型）
 * - managers: 核心管理器（浏览器、实例、页面、Cookie、类型）
 * - automation: 平台自动化（Instagram、Facebook、类型）
 * - batch: 批量任务执行、类型
 * - logging: 日志系统（URL日志、任务日志、类型）
 *
 * 使用示例：
 * ```typescript
 * import { 
 *   openBrowserInstance, 
 *   openPage, 
 *   addCookies,
 *   pingBrowserPort,
 *   updateBrowserInstanceConfig,
 *   deleteBrowserInstanceConfig,
 *   getAutomationConfig 
 * } from "@/lib/browser";
 * import type { BrowserInstance } from "@/lib/browser";
 * ```
 *
 * @module lib/browser
 */

// Core exports
export * from "./core";

// Managers exports
export * from "./managers";

// Automation exports
export * from "./automation";

// Batch exports
export * from "./batch";