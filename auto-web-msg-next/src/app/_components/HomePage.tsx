"use client";

/**
 * 应用首页主面板
 *
 * 聚合浏览器实例管理、页面操作和批量任务能力。
 * 各子组件通过内置 Hooks 自行管理状态，首页无需传递任何 props。
 *
 * @module app/page
 */

import BatchTaskPanel from "@/components/features/BatchTaskPanel";
import ConfigPanel from "@/components/features/ConfigPanel";
import CookiePanel from "@/components/features/CookiePanel";
import MemoryInstancesPanel from "@/components/features/MemoryInstancesPanel";
import HelpGuideCard from "@/components/shared/HelpGuideCard";
import PageForm from "@/app/_components/PageForm";
import { HOME_HELP_GUIDE } from "@/lib/client/help-guides";

/**
 * 首页主控面板，聚合浏览器实例管理、页面操作和批量任务能力。
 *
 * @returns React 页面组件
 */
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">浏览器实例管理（Next + Playwright JS）</h1>
        <p className="text-sm text-muted-foreground">
          Server Actions 直连模式。支持 openBrowser、openPage、Cookie 管理和实例配置。
        </p>
      </section>
      <HelpGuideCard guide={HOME_HELP_GUIDE} />

      <ConfigPanel />

      <MemoryInstancesPanel />

      <section className="grid gap-4 md:grid-cols-2">
        <PageForm />
      </section>

      <BatchTaskPanel />

      <CookiePanel />
    </main>
  );
}
