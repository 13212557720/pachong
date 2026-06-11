"use client";

import { useState } from "react";
import { listCookiesAction } from "@/actions/browser-cookie-actions";
import { openPageAction } from "@/actions/browser-page-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useInstances } from "@/hooks/useInstances";
import { useMessage } from "@/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_PAGE_URL, DEFAULT_PORT, PAGE_ACTION_OPTIONS } from "@/lib/client/constants";
import type { OpenPageAutomationAction } from "@/types/browser";

/**
 * PageForm 组件 - 提供打开新浏览器标签页的表单界面
 * 
 * 该组件渲染一个表单，允许用户配置并执行打开新标签页的操作。
 * 支持选择自动化动作类型（如 Instagram 自动化）、输入目标 URL、
 * 设置消息内容等。
 * 
 * @component
 * @param {FormProps} props - 组件属性对象
 * @param {Function} props.onSuccess - 表单提交成功后的回调函数
 * @param {Function} props.showMessage - 用于显示提示消息的回调函数
 * @param {string} props.showMessage[0] - 消息类型（"ok" | "err" | ""）
 * @param {string} props.showMessage[1] - 消息内容
 * @returns {JSX.Element} 返回表单的 JSX 元素
 * 
 * @example
 * ```tsx
 * <PageForm onSuccess={() => undefined} />
 * ```
 * 
 * @remarks
 * - 表单包含以下字段：port（端口）、url（目标网址）、action（自动化动作）、message（消息内容）、forced（强制执行）
 * - 提交时会调用 openPageAction 服务器操作
 * - 加载状态会禁用提交按钮并显示"处理中..."文本
 */
export default function PageForm({ onSuccess }: { onSuccess?: () => void }) {
  const { message, showMessage } = useMessage();
  const [port, setPort] = useState(DEFAULT_PORT);
  const [url, setUrl] = useState(DEFAULT_PAGE_URL);
  const [msgText, setMsgText] = useState("");
  const [action, setAction] = useState<OpenPageAutomationAction>("runInstagramAction");
  const [forced, setForced] = useState(false);
  const [loading, setLoading] = useState(false);

  const { instances } = useInstances();
  const runningInstances = instances.filter(item => item.status === "running");

  /**
   * 处理表单提交事件 - 验证输入并调用服务器操作打开新标签页
   * 
   * 该异步函数负责：
   * 1. 收集表单数据（端口、URL、动作类型、消息内容、是否强制执行）
   * 2. 调用 openPageAction 服务器操作执行打开标签页
   * 3. 根据执行结果调用 showMessage 显示成功或错误提示
   * 4. 成功后触发 onSuccess 回调
   * 
   * @async
   * @returns {Promise<void>} 该函数不返回任何值，通过回调和状态更新传递结果
   * 
   * @throws {Error} 当 openPageAction 执行失败或网络请求异常时捕获错误
   * 
   * @example
   * ```tsx
   * // 在按钮点击时调用
   * <button type="button" onClick={handleSubmit} disabled={loading}>
   *   {loading ? "处理中..." : "打开新标签页"}
   * </button>
   * ```
   * 
   * @remarks
   * - 提交前会显示加载状态，禁用按钮防止重复提交
   * - URL 和消息内容会自动去除首尾空白字符
   * - 端口号会被转换为数字类型
   * - result.data.status === "duplicate" 时表示重复点击操作
   */
  async function handleSubmit() {
    const parsedPort = Number.parseInt(String(port).trim(), 10) || 0;

    setLoading(true);
    showMessage("", "");
    try {
      const probe = await listCookiesAction({ port: parsedPort, urls: null });
      if (!probe.success) {
        showMessage("err", "端口不可连接，请先启动实例或检查端口");
        return;
      }

      const result = await openPageAction({
        port: parsedPort,
        url: url.trim(),
        forced,
        message: msgText.trim(),
        action,
      });

      if (!result.success) {
        showMessage("err", `openPage 失败（action=${action}）: ${result.error}`);
        return;
      }

      if (result.data.status === "duplicate") {
        showMessage("ok", "重复点击");
      } else {
        showMessage("ok", `已在端口 ${result.data.port} 打开新标签页：${result.data.url}`);
      }
      onSuccess?.();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "未知错误";
      showMessage("err", `openPage 失败（action=${action}）: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>openPage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="page-port">实例端口</Label>
          <Select value={String(port)} onValueChange={(value) => setPort(value)}>
            <SelectTrigger id="page-port" className="w-full">
              <SelectValue placeholder="请选择在线实例" />
            </SelectTrigger>
            <SelectContent>
              {runningInstances.length === 0 ? (
                <SelectItem value="__none__" disabled>暂无在线实例</SelectItem>
              ) : (
                runningInstances.map((item) => (
                  <SelectItem key={item.id} value={String(item.port)}>
                    {item.name || item.id}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">可用在线实例：{runningInstances.length} 个</div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="page-url">url</Label>
          <Input id="page-url" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="page-action">action</Label>
          <Select value={action} onValueChange={(value) => setAction(value as OpenPageAutomationAction)}>
            <SelectTrigger id="page-action" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_ACTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="page-message">message（Instagram 自动化发送内容）</Label>
          <Textarea
            id="page-message"
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="输入要发送的消息内容"
          />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border/70 p-2">
          <Checkbox id="forced" checked={forced} onCheckedChange={(checked) => setForced(Boolean(checked))} />
          <Label htmlFor="forced" className="mb-0">
            Forced（重复时也执行）
          </Label>
        </div>
        <Button type="button" onClick={handleSubmit} disabled={loading} title="先探活端口，再执行 openPage">
          {loading ? "处理中..." : "打开新标签页"}
        </Button>
        {message.text && (
          <Alert variant={message.type === "err" ? "destructive" : "default"}>
            <AlertTitle>{message.type === "err" ? "操作失败" : "操作结果"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}




