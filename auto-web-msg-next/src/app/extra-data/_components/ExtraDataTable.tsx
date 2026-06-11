"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InstagramUser } from "@/types/api";
import { useExtraDataPageStore } from "../_hooks/useExtraDataPageStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExtraDataTableProps {
  items: InstagramUser[];
}

interface PreviewTemplate {
  graphql?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  wbloks?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    bkv?: string;
  };
}

export default function ExtraDataTable({ items }: ExtraDataTableProps) {
  const router = useRouter();
  const loadingUsers = useExtraDataPageStore((state) => state.loadingUsers);
  const runningRowId = useExtraDataPageStore((state) => state.runningRowId);
  const runSingleRowEnrich = useExtraDataPageStore((state) => state.runSingleRowEnrich);
  const extraDataTemplates = useExtraDataPageStore((state) => state.extraDataTemplates);
  const activeTemplateIndex = useExtraDataPageStore((state) => state.activeTemplateIndex);

  function getPreviewFetchCode(targetId: string, username: string) {
    if (!extraDataTemplates[activeTemplateIndex]) return "无可用模板";
    
    try {
      const val = extraDataTemplates[activeTemplateIndex].value;
      const template = (typeof val === "object" && val !== null ? val : JSON.parse(String(val))) as PreviewTemplate;
      const referer = `https://www.instagram.com/${username}/`;
      
      const buildBodyParams = (bodyObj: unknown, targetId: string) => {
        if (!bodyObj) return "";
        if (typeof bodyObj === "string") {
          return bodyObj.replace(/\{\{TARGET_USER_ID\}\}/g, targetId);
        }
        if (typeof bodyObj !== "object" || Array.isArray(bodyObj)) {
          return String(bodyObj);
        }
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(bodyObj as Record<string, unknown>)) {
          let val = v;
          if (typeof v === "object" && v !== null) {
            val = JSON.stringify(v).replace(/\{\{TARGET_USER_ID\}\}/g, targetId);
          } else if (typeof v === "string") {
            val = v.replace(/\{\{TARGET_USER_ID\}\}/g, targetId);
          }
          params.append(k, String(val));
        }
        return params.toString();
      };

      const gHeaders = { ...template?.graphql?.headers, "Referer": referer };
      const gBody = buildBodyParams(template?.graphql?.body, targetId);

      const wHeaders = { ...template?.wbloks?.headers, "Referer": referer };
      const wBody = buildBodyParams(template?.wbloks?.body, targetId);
      
      const bkv = template?.wbloks?.bkv || "ad0f1f5e41c2d9fcde83dfd68eea4def768b66bc3029c58e846d7c1dda44ba2a";

      return `// 1. GraphQL 数据 (粉丝数、简介)
fetch("https://www.instagram.com/graphql/query", {
  "method": "${template?.graphql?.method || 'POST'}",
  "headers": ${JSON.stringify(gHeaders, null, 4).replace(/\n/g, '\n  ')},
  "body": "${gBody}"
});

// 2. Wbloks 数据 (IP属地)
fetch("https://www.instagram.com/async/wbloks/fetch/?appid=com.bloks.www.ig.about_this_account&type=app&__bkv=${bkv}", {
  "method": "${template?.wbloks?.method || 'POST'}",
  "headers": ${JSON.stringify(wHeaders, null, 4).replace(/\n/g, '\n  ')},
  "body": "${wBody}"
});`;

    } catch (err) {
      return `解析模板失败: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>id</TableHead>
          <TableHead>username</TableHead>
          <TableHead>is_private</TableHead>
          <TableHead className="text-left">followers_count</TableHead>
          <TableHead>ip_location</TableHead>
          <TableHead>biography</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-muted-foreground text-center">
              {loadingUsers ? "加载中..." : "暂无数据"}
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>
                {item.username ? (
                  <a
                    href={`https://www.instagram.com/${item.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {String(item.username)}
                  </a>
                ) : (
                  ""
                )}
              </TableCell>
              <TableCell>{String(Boolean(item.is_private))}</TableCell>
              <TableCell className="text-left">{String(item.followers_count ?? "")}</TableCell>
              <TableCell>{String(item.ip_location ?? "")}</TableCell>
              <TableCell className="max-w-xs truncate" title={item.biography ?? ""}>
                {item.biography ?? ""}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={() => void runSingleRowEnrich(router, item)}
                    disabled={runningRowId === item.id || loadingUsers}
                  >
                    {runningRowId === item.id ? "执行中..." : "捕获增强"}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        预览
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Fetch 请求预览 - 用户 {item.id}</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[60vh] w-full rounded-md border p-4 bg-muted/30">
                        <pre className="text-xs">
                          <code>{getPreviewFetchCode(String(item.id ?? ""), String(item.username ?? ""))}</code>
                        </pre>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
