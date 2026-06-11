"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getIgAccounts,
  postIgAccounts,
  deleteIgAccountsByUsername,
  getIgUserByUserId,
} from "@/lib/instagram-api/generated/ig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2, Trash2, Search, PlusCircle } from "lucide-react";
import { toast } from "sonner";

interface IgAccount {
  username: string;
}

function normalizeAccounts(value: unknown): IgAccount[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || !("username" in item)) return null;
      const username = String((item as Record<string, unknown>).username || "").trim();
      return username ? { username } : null;
    })
    .filter((item): item is IgAccount => item !== null);
}

export default function IgAccountsPage() {
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Add account form
  const [newUsername, setNewUsername] = useState("");
  const [newSettings, setNewSettings] = useState("");
  const [adding, setAdding] = useState(false);

  // Test user query
  const [queryUserId, setQueryUserId] = useState("");
  const [queryResult, setQueryResult] = useState<unknown>(null);
  const [querying, setQuerying] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getIgAccounts();
      setAccounts(normalizeAccounts(data));
    } catch (error) {
      toast.error("账号加载失败", { description: String(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadAccounts());
  }, [loadAccounts]);

  const handleAddAccount = async () => {
    if (!newUsername.trim() || !newSettings.trim()) {
      toast.warning("请输入用户名和 Settings JSON");
      return;
    }

    setAdding(true);
    try {
      let settings: Record<string, unknown>;
      try {
        const parsed = JSON.parse(newSettings.trim());
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Settings must be an object");
        }
        settings = parsed as Record<string, unknown>;
      } catch {
        toast.error("Settings JSON 格式无效");
        return;
      }
      
      await postIgAccounts({
        body: { username: newUsername.trim(), settings },
      });
      
      toast.success("账号添加成功！");
      setNewUsername("");
      setNewSettings("");
      await loadAccounts();
    } catch (error) {
      toast.error("账号添加失败", { description: String(error) });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteAccount = async (username: string) => {
    if (!confirm(`确定要删除账号 ${username} 吗？`)) return;

    try {
      await deleteIgAccountsByUsername({ path: { username } });
      toast.success(`账号 ${username} 已删除`);
      await loadAccounts();
    } catch (error) {
      toast.error("账号删除失败", { description: String(error) });
    }
  };

  const handleQueryUser = async () => {
    if (!queryUserId.trim()) {
      toast.warning("请输入用户 ID");
      return;
    }

    setQuerying(true);
    setQueryResult(null);
    try {
      const data = await getIgUserByUserId({ path: { user_id: queryUserId.trim() } });
      setQueryResult(data);
      toast.success("用户信息获取成功！");
    } catch (error) {
      toast.error("用户信息获取失败", { description: String(error) });
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Instagram 账号代理池</h1>
          <p className="text-slate-500 mt-2">管理你的 Instagram 账号池，用于免密调取 API 抓取数据。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: List and Query */}
        <div className="lg:col-span-2 space-y-8">
          {/* Account List */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="flex items-center text-lg font-semibold">
                活跃账号池
                {loading && <Loader2 className="w-4 h-4 ml-3 animate-spin text-slate-400" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16 text-center">#</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-slate-500">
                        暂无配置的账号。请在右侧面板添加。
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((acc, idx) => (
                      <TableRow key={acc.username}>
                        <TableCell className="text-center text-slate-400">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-slate-700">{acc.username}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteAccount(acc.username)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            移除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* User Query Testing */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Search className="w-5 h-5 mr-2 text-indigo-500" />
                用户数据查询测试
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-4">
                <Input 
                  placeholder="输入 Instagram 用户 ID (例如 25025320)" 
                  value={queryUserId}
                  onChange={(e) => setQueryUserId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQueryUser()}
                  className="flex-1"
                />
                <Button onClick={handleQueryUser} disabled={querying} className="bg-indigo-600 hover:bg-indigo-700">
                  {querying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  查询
                </Button>
              </div>

              {queryResult !== null && (
                <div className="mt-4 p-4 bg-slate-900 rounded-lg overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono">
                    {JSON.stringify(queryResult, null, 2) ?? ""}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Add Form */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-slate-200 sticky top-8">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-semibold flex items-center">
                <PlusCircle className="w-5 h-5 mr-2 text-emerald-500" />
                新增账号 Session
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">用户名</label>
                <Input 
                  placeholder="qrdchy585" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  <span>Settings JSON</span>
                  <span className="text-xs text-slate-400 font-normal">来源 test/ig_state.json</span>
                </label>
                <Textarea 
                  placeholder='{"uuids": {"phone_id": "...", ...}, "cookies": {...}}' 
                  value={newSettings}
                  onChange={(e) => setNewSettings(e.target.value)}
                  className="font-mono text-xs min-h-[280px]"
                />
              </div>
              <Button 
                onClick={handleAddAccount} 
                disabled={adding} 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                保存账号配置
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
