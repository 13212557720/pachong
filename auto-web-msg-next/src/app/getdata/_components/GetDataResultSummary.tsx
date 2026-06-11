import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetDataPageStore } from "../_hooks/useGetDataPageStore";

export default function GetDataResultSummary() {
  const result = useGetDataPageStore((state) => state.result);

  if (!result) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>抓取摘要</CardTitle>
        <CardDescription>完整数据已写入日志文件</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm">
          <div>userid: {result.userid}</div>
          <div>total: {result.total}</div>
          <div>pages: {result.pages}</div>
          <div className="break-all">log_file: {result.log_file}</div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">前 20 条预览（完整数据见日志文件）</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>id</TableHead>
                <TableHead>username</TableHead>
                <TableHead>full_name</TableHead>
                <TableHead>is_private</TableHead>
                <TableHead>is_verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.preview.map((item) => (
                <TableRow key={`${item.id}-${item.username}`}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    {item.username ? (
                      <a
                        href={`https://www.instagram.com/${item.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {item.username}
                      </a>
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell>{item.full_name}</TableCell>
                  <TableCell>{String(item.is_private)}</TableCell>
                  <TableCell>{String(item.is_verified)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
