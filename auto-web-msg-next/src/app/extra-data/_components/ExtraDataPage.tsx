"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import HelpGuideCard from "@/components/shared/HelpGuideCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EXTRA_DATA_HELP_GUIDE } from "@/lib/client/help-guides";
import { useInstances } from "@/hooks";
import type { InstagramUser } from "@/types/api";
import ExtraDataFilter from "./ExtraDataFilter";
import ExtraDataTable from "./ExtraDataTable";
import ExtraDataBatch from "./ExtraDataBatch";
import { PageSizeSelector } from "./ExtraDataPager";
import { useExtraDataPageStore } from "../_hooks/useExtraDataPageStore";
import useSWR from "swr";
import { SWR_KEYS } from "@/hooks/swr-keys";

export default function ExtraDataPage() {
  const router = useRouter();
  const { instances, error: instancesError, refreshList: refreshInstances } = useInstances();
  const page = useExtraDataPageStore((state) => state.page);
  const pageSize = useExtraDataPageStore((state) => state.pageSize);
  const pageData = useExtraDataPageStore((state) => state.pageData);
  const loadingUsers = useExtraDataPageStore((state) => state.loadingUsers);
  const filters = useExtraDataPageStore((state) => state.filters);
  const message = useExtraDataPageStore((state) => state.message);
  const setMessage = useExtraDataPageStore((state) => state.setMessage);
  const setInstances = useExtraDataPageStore((state) => state.setInstances);
  const loadAvailableLocations = useExtraDataPageStore((state) => state.loadAvailableLocations);
  const refreshInstancesWithFallback = useExtraDataPageStore((state) => state.refreshInstancesWithFallback);
  const loadUsers = useExtraDataPageStore((state) => state.loadUsers);
  const currentItems = useMemo(() => (pageData?.items ?? []) as InstagramUser[], [pageData]);

  // SWR: 初始化加载可选地区列表 + 实例刷新（仅挂载一次）
  useSWR("extra-data-init", async () => {
    await Promise.all([
      loadAvailableLocations(),
      refreshInstancesWithFallback(refreshInstances),
    ]);
  }, { revalidateOnFocus: false });

  useEffect(() => {
    if (!instancesError) return;
    setMessage({ type: "err", text: instancesError });
  }, [instancesError, setMessage]);

  useEffect(() => {
    setInstances(instances);
  }, [instances, setInstances]);

  // SWR: 用户列表（依赖 filters / pageSize 自动重新请求）
  useSWR(
    [SWR_KEYS.EXTRA_DATA_USERS, JSON.stringify(filters), pageSize],
    () => loadUsers(router, 1, { filters, pageSize }),
    { revalidateOnFocus: false },
  );

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">额外数据处理</h1>
        <p className="text-sm text-muted-foreground">选择实例并按分页批量增强用户粉丝数与 IP 信息。</p>
      </section>
      <HelpGuideCard guide={EXTRA_DATA_HELP_GUIDE} />

      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>支持复杂筛选、重置、分页处理。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExtraDataFilter />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>批量增强</CardTitle>
          <CardDescription>支持复杂筛选、分页处理、指定数量导出。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExtraDataBatch />

          <div className="flex flex-wrap items-end gap-2">
            <Button type="button" variant="outline" onClick={() => void loadUsers(router, page)} disabled={loadingUsers}>
              {loadingUsers ? "加载中..." : "刷新用户"}
            </Button>

            <PageSizeSelector />
          </div>
        </CardContent>
      </Card>

      {message.text && (
        <Alert variant={message.type === "err" ? "destructive" : "default"}>
          <AlertTitle>{message.type === "err" ? "执行失败" : "执行结果"}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>当前页用户</CardTitle>
          <CardDescription>
            共 {pageData?.total ?? 0} 条，页 {pageData?.page ?? 1}/{pageData?.total_pages ?? 1}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ExtraDataTable items={currentItems} />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>每页 {pageSize} 条</div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void loadUsers(router, Math.max(1, page - 1), { filters })}
                disabled={loadingUsers || page <= 1}
              >
                上一页
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void loadUsers(router, page + 1, { filters })}
                disabled={loadingUsers || page >= (pageData?.total_pages ?? 1)}
              >
                下一页
              </Button>
              <span>
                第 {page}/{pageData?.total_pages ?? 1} 页
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
