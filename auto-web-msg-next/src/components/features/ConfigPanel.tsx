"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAutomationConfig, useMessage } from "@/hooks";

/**
 * 配置面板组件
 *
 * 提供 Instagram 自动化发送开关的配置界面。
 * 内部通过 useAutomationConfig / useMessage 自行管理状态，无需父组件传 props。
 */
export default function ConfigPanel() {
  const { sendEnabled, loading, updateConfig } = useAutomationConfig();
  const { message, showMessage } = useMessage();

  async function handleChange(nextValue: boolean) {
    const result = await updateConfig(nextValue);
    if (result.success) {
      showMessage("ok", `Instagram自动发送已${nextValue ? "开启" : "关闭（仅高亮）"}`);
    } else {
      showMessage("err", `更新自动化配置失败: ${result.error}`);
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>自动化配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>调用模式</Label>
          <Input value="Server Actions（直连）" readOnly />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border/70 p-3">
          <Label htmlFor="send-enabled" className="text-sm">
            Instagram发送开关：{sendEnabled ? "发送" : "不发送（仅高亮）"}
          </Label>
          <Switch
            id="send-enabled"
            checked={sendEnabled}
            disabled={loading}
            onCheckedChange={(checked) => void handleChange(Boolean(checked))}
          />
        </div>
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
