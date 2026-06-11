"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HelpGuideCard from "@/components/shared/HelpGuideCard";
import { PGSQL_HELP_GUIDE } from "@/lib/client/help-guides";
import { PgMetaPagerExport } from "./PgMetaPagerExport";
import { PgMetaFilterSection } from "./PgMetaFilterSection";
import { PgMetaRowsTable } from "./PgMetaRowsTable";
import { usePgMetaStore } from "../_stores";
import { usePgMetaPageEffects } from "../_hooks/usePgMetaPageEffects";

export function PgMetaPage() {
  usePgMetaPageEffects();
  const status = usePgMetaStore((s) => s.status);
  const tables = usePgMetaStore((s) => s.tables);
  const selectedTable = usePgMetaStore((s) => s.selectedTable);
  const tableData = usePgMetaStore((s) => s.tableData);
  const page = usePgMetaStore((s) => s.page);
  const error = usePgMetaStore((s) => s.error);
  const setSelectedTable = usePgMetaStore((s) => s.setSelectedTable);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">PostgreSQL 管理面板</h1>
        <p className="text-sm text-muted-foreground">查看数据库状态、表结构与数据内容。</p>
      </section>
      <HelpGuideCard guide={PGSQL_HELP_GUIDE} />

      {status && (
        <Card>
          <CardHeader>
            <CardTitle>数据库状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 text-sm">
              <Badge variant="secondary">数据库: {status.database}</Badge>
              <Badge variant="secondary">连接: {status.active_connections} / {status.max_connections}</Badge>
              <Badge variant="secondary">大小: {status.database_size}</Badge>
              <Badge variant="outline">版本: {status.version.split(",").shift()}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>数据表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {tables.length === 0 ? (
              <span className="text-sm text-muted-foreground">无数据表</span>
            ) : (
              tables.map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={t === selectedTable ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTable(t)}
                >
                  {t}
                </Button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTable && tableData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedTable}</span>
              <Badge variant="secondary">
                {tableData.total} 行 · 第 {page}/{tableData.total_pages} 页
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PgMetaFilterSection />
            <PgMetaRowsTable />
            <PgMetaPagerExport onExportCsv={() => {}} onExportXlsx={() => {}} />
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
