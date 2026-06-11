"use client";

import { useEffect, useRef } from "react";
import { scanAndConnectActiveBrowsersAction } from "@/actions/browser-manager-actions";

/**
 * 全局初始化扫描组件
 * 放置在 layout 中，在客户端首次挂载时触发一次全量扫描，
 * 将外部已打开的 AdsPower 浏览器实例自动连接并放入内存中，防止遗漏。
 */
export function InitScanner() {
  const scanned = useRef(false);

  useEffect(() => {
    if (!scanned.current) {
      scanned.current = true;
      // 延迟一点扫描，避免阻塞首屏渲染
      setTimeout(() => {
        void scanAndConnectActiveBrowsersAction().catch(() => undefined);
      }, 1000);
    }
  }, []);

  return null;
}
