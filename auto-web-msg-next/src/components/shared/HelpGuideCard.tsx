"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { HelpGuideConfig } from "@/types/components";

/**
 * 通用使用说明卡片组件。
 *
 * @param guide - 页面对应的说明配置
 * @returns 可折叠的使用说明与字段解释卡片
 */
export default function HelpGuideCard({ guide }: { guide: HelpGuideConfig }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{guide.title}</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen((prev) => !prev)}>
            {open ? "收起说明" : "展开说明"}
          </Button>
        </div>
        <CardDescription>{guide.description}</CardDescription>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4">
          <section className="space-y-2">
            <h3 className="text-sm font-medium">操作步骤</h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              {guide.steps.map((step, index) => (
                <li key={`${index}-${step}`}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium">字段解释</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>字段</TableHead>
                  <TableHead>含义</TableHead>
                  <TableHead>示例值</TableHead>
                  <TableHead>注意事项</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guide.fields.map((item) => (
                  <TableRow key={item.field}>
                    <TableCell className="font-mono text-xs">{item.field}</TableCell>
                    <TableCell className="text-sm">{item.meaning}</TableCell>
                    <TableCell className="font-mono text-xs">{item.example}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.note || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {guide.tip ? <p className="text-xs text-muted-foreground">{guide.tip}</p> : null}
        </CardContent>
      )}
    </Card>
  );
}

