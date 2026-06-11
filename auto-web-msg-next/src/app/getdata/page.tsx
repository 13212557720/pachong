"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import HelpGuideCard from "@/components/shared/HelpGuideCard";
import { GETDATA_HELP_GUIDE } from "@/lib/client/help-guides";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GetDataFilterForm from "./_components/GetDataFilterForm";
import GetDataCrawlForm from "./_components/GetDataCrawlForm";
import GetDataTaskProgressPanel from "./_components/GetDataTaskProgressPanel";
import GetDataResultSummary from "./_components/GetDataResultSummary";
import GetDataUserTable from "./_components/GetDataUserTable";
import { useGetDataPageStore } from "./_hooks/useGetDataPageStore";
import { SWR_KEYS } from "@/hooks/swr-keys";

export default function GetDataPage() {
  const router = useRouter();
  const hasToken = useGetDataPageStore((state) => state.hasToken);
  const message = useGetDataPageStore((state) => state.message);
  const running = useGetDataPageStore((state) => state.running);
  const runId = useGetDataPageStore((state) => state.runId);
  const poolPage = useGetDataPageStore((state) => state.poolPage);
  const poolPageSize = useGetDataPageStore((state) => state.poolPageSize);
  const poolFilters = useGetDataPageStore((state) => state.poolFilters);
  const initializePage = useGetDataPageStore((state) => state.initializePage);
  const loadUserPool = useGetDataPageStore((state) => state.loadUserPool);
  const pollTaskProgress = useGetDataPageStore((state) => state.pollTaskProgress);

  // SWR #1: 页面初始化（仅挂载时执行一次）
  useSWR("getdata-init", () => initializePage(), {
    revalidateOnFocus: false,
  });

  // SWR #2: 用户池列表（依赖 filters / page / pageSize 自动重新请求）
  useSWR(
    [SWR_KEYS.GETDATA_POOL, poolPage, poolPageSize, JSON.stringify(poolFilters)],
    () => loadUserPool(router),
    { revalidateOnFocus: false },
  );

  // SWR #3: 任务进度轮询（仅在 running 时以 1s 间隔刷新）
  useSWR(
    running && runId ? ["getdata-progress", runId] : null,
    () => pollTaskProgress(router),
    { refreshInterval: 1000, revalidateOnFocus: false },
  );

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">/getdata - Instagram Following 抓取</h1>
        <p className="text-sm text-muted-foreground">输入 userid 和 headers，自动分页抓取并写入日志。</p>
      </section>
      <HelpGuideCard guide={GETDATA_HELP_GUIDE} />

      {hasToken === false && (
        <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <AlertDescription>
            尚未配置 Token 或 Token 已失效，请先{" "}
            <a href="/settings" className="font-medium text-amber-700 underline underline-offset-2 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200">
              前往设置
            </a>{" "}
            配置后再使用。
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>用户池（来自 PostgreSQL）</CardTitle>
          <CardDescription>分页展示聚合用户数据，可直接点击抓取或重新抓取。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <GetDataFilterForm />
          <GetDataUserTable />
        </CardContent>
      </Card>

      <GetDataCrawlForm />
      <GetDataTaskProgressPanel />

      {message.text && (
        <Alert variant={message.type === "err" || message.type === "warn" ? "destructive" : "default"}>
          <AlertTitle>{message.type === "err" ? "执行失败" : "执行结果"}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <GetDataResultSummary />
    </main>
  );
}
