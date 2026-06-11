"use client";

import { useState } from "react";
import { addCookiesAction } from "@/actions/browser-cookie-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CookieItem } from "@/types/browser";
import { Cookie } from "lucide-react";
import { useInstances } from "@/hooks";
import { useMessage } from "@/hooks";

import { CookieTargetConfig } from "./CookieTargetConfig";
import { CookieRawInput } from "./CookieRawInput";
import { CookieGlobalConfig } from "./CookieGlobalConfig";

const COMMON_DOMAINS = [
  { label: "Instagram (.instagram.com)", value: ".instagram.com" },
  { label: "Facebook (.facebook.com)", value: ".facebook.com" },
  { label: "Google (.google.com)", value: ".google.com" },
  { label: "Twitter (.x.com)", value: ".x.com" },
];

export default function CookiePanel() {
  const { instances } = useInstances();
  const { message, showMessage } = useMessage();

  const [selectedPort, setSelectedPort] = useState("");
  const [domainMode, setDomainMode] = useState<"preset" | "custom">("preset");
  const [presetDomain, setPresetDomain] = useState<string>(
    COMMON_DOMAINS[0].value
  );
  const [customDomain, setCustomDomain] = useState<string>("");
  const [cookieText, setCookieText] = useState("");
  const [loading, setLoading] = useState(false);

  const [httpOnly, setHttpOnly] = useState(false);
  const [secure, setSecure] = useState(true);
  const [isSession, setIsSession] = useState(false);
  const [expiresYears, setExpiresYears] = useState("10");
  const [sameSite, setSameSite] = useState<"Strict" | "Lax" | "None">("Lax");
  const [cookiePath, setCookiePath] = useState("/");

  async function handleConfirm() {
    if (!selectedPort) {
      showMessage("err", "请先选择浏览器终端实例");
      return;
    }

    let finalDomain =
      domainMode === "preset" ? presetDomain : customDomain.trim();
    if (!finalDomain) finalDomain = "";

    let cleanText = cookieText.trim();
    if (cleanText.toLowerCase().startsWith("cookie:")) {
      cleanText = cleanText.substring(7).trim();
    }
    if (!cleanText) return;

    let cookiesToInject: Partial<CookieItem>[] = [];

    const pairs = cleanText
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean);
    const parsedCookies: Partial<CookieItem>[] = [];
    for (const pair of pairs) {
      const idx = pair.indexOf("=");
      if (idx > -1) {
        parsedCookies.push({
          name: pair.slice(0, idx).trim(),
          value: pair.slice(idx + 1).trim(),
        });
      }
    }
    cookiesToInject = parsedCookies;

    if (cookiesToInject.length === 0) {
      showMessage(
        "err",
        "未解析出任何有效的 Raw Cookie！格式需类似 c_user=xxx;"
      );
      return;
    }

    let expiresValue: number | undefined = undefined;
    if (!isSession) {
      const years = parseFloat(expiresYears);
      if (!isNaN(years) && years > 0) {
        expiresValue =
          Math.floor(Date.now() / 1000) + years * 365 * 24 * 60 * 60;
      }
    }

    const standardizedCookies: CookieItem[] = cookiesToInject.map((item) => ({
      name: item.name!,
      value: item.value!,
      domain: finalDomain || "",
      path: cookiePath || "/",
      httpOnly: httpOnly,
      secure: secure,
      sameSite: sameSite,
      ...(expiresValue ? { expires: expiresValue } : {}),
    }));

    setLoading(true);
    try {
      const result = await addCookiesAction({
        port: Number(selectedPort),
        cookies: standardizedCookies,
      });

      if (!result.success) {
        showMessage("err", `注入 Cookie 失败: ${result.error}`);
        return;
      }
      showMessage(
        "ok",
        `成功解构出 ${standardizedCookies.length} 条属性结构体并注入成功！`
      );
      setCookieText("");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "未知错误";
      showMessage("err", `注入 Cookie 失败: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  }

  const runningInstances = instances.filter((i) => i.status === "running");
  const selectedPortValue = selectedPort || "__empty__";

  return (
    <Card className="mt-4 border-2 border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cookie className="h-5 w-5 text-amber-500" />
          Cookie 全局属性注入舱
        </CardTitle>
        <CardDescription>
          直接粘贴以分号隔开的 Raw String 字符串，所有扩展属性皆可在此面板底部统一支配拦截。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <CookieTargetConfig
          selectedPortValue={selectedPortValue}
          setSelectedPort={setSelectedPort}
          runningInstances={runningInstances}
          domainMode={domainMode}
          setDomainMode={setDomainMode}
          presetDomain={presetDomain}
          setPresetDomain={setPresetDomain}
          customDomain={customDomain}
          setCustomDomain={setCustomDomain}
          COMMON_DOMAINS={COMMON_DOMAINS}
        />

        <CookieRawInput
          cookieText={cookieText}
          setCookieText={setCookieText}
        />

        <CookieGlobalConfig
          httpOnly={httpOnly}
          setHttpOnly={setHttpOnly}
          secure={secure}
          setSecure={setSecure}
          isSession={isSession}
          setIsSession={setIsSession}
          expiresYears={expiresYears}
          setExpiresYears={setExpiresYears}
          cookiePath={cookiePath}
          setCookiePath={setCookiePath}
          sameSite={sameSite}
          setSameSite={setSameSite}
        />

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => void handleConfirm()}
            disabled={loading || !cookieText.trim()}
          >
            {loading ? "属性封印并下发进程中..." : "开始全局拦截式注入"}
          </Button>
        </div>

        {message.text && (
          <Alert variant={message.type === "err" ? "destructive" : "default"}>
            <AlertTitle>
              {message.type === "err" ? "操作失败" : "操作结果"}
            </AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
