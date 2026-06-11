"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getServerConfigAction, saveServerConfigAction } from "@/actions/settings-actions";
import type { SimpleConfig } from "@/types/config";
import ProfileEditor from "@/app/settings/_components/ProfileEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TokenAdmin = dynamic(() => import("@/app/settings/_components/TokenAdmin").then((m) => ({ default: m.TokenAdmin })), {
  ssr: false,
});

export default function SettingsPage() {
  const [config, setConfig] = useState<SimpleConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const doLoad = async () => {
      setError(null);
      setLoading(true);
      const res = await getServerConfigAction();
      if (cancelled) return;
      if (res.success) {
        setConfig(res.data);
      } else {
        setError(String(res.error));
      }
      setLoading(false);
    };
    doLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = useCallback((updates: Partial<SimpleConfig>) => {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const onSave = useCallback(async () => {
    if (!config || saving) return;
    setSaving(true);
    const res = await saveServerConfigAction(config);
    setSaving(false);
    if (res.success) {
      setMessage("保存成功");
    } else {
      setError(String(res.error));
    }
  }, [config, saving]);

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">设置</h1>
        <p className="text-sm text-muted-foreground">编辑 Headers/Token 配置</p>
      </section>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">配置编辑</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config && <ProfileEditor config={config} onChange={onChange} />}
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={onSave} disabled={saving}>
              {saving ? "保存中..." : "保存配置"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <TokenAdmin />
    </main>
  );
}
