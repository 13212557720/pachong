"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CookieGlobalConfigProps {
  httpOnly: boolean;
  setHttpOnly: (val: boolean) => void;
  secure: boolean;
  setSecure: (val: boolean) => void;
  isSession: boolean;
  setIsSession: (val: boolean) => void;
  expiresYears: string;
  setExpiresYears: (val: string) => void;
  cookiePath: string;
  setCookiePath: (val: string) => void;
  sameSite: "Strict" | "Lax" | "None";
  setSameSite: (val: "Strict" | "Lax" | "None") => void;
}

export function CookieGlobalConfig({
  httpOnly,
  setHttpOnly,
  secure,
  setSecure,
  isSession,
  setIsSession,
  expiresYears,
  setExpiresYears,
  cookiePath,
  setCookiePath,
  sameSite,
  setSameSite,
}: CookieGlobalConfigProps) {
  return (
    <div className="rounded-md border p-4 bg-muted/20">
      <div className="flex items-center mb-3">
        <span className="text-sm font-semibold opacity-80">
          全局附加属性拦截配置
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="chk-httponly"
              checked={httpOnly}
              onCheckedChange={(val) => setHttpOnly(!!val)}
            />
            <label
              htmlFor="chk-httponly"
              className="text-xs font-medium cursor-pointer leading-none"
            >
              HttpOnly
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="chk-secure"
              checked={secure}
              onCheckedChange={(val) => setSecure(!!val)}
            />
            <label
              htmlFor="chk-secure"
              className="text-xs font-medium cursor-pointer leading-none"
            >
              Secure
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="chk-session"
              checked={isSession}
              onCheckedChange={(val) => setIsSession(!!val)}
            />
            <label
              htmlFor="chk-session"
              className="text-xs font-medium cursor-pointer leading-none hover:text-amber-500"
            >
              会话级 (Session){" "}
              <span className="opacity-60 text-[10px] block">
                勾选即忽略过时
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            过时年限 (默认10年)
          </Label>
          <Input
            type="number"
            className="h-8"
            value={expiresYears}
            onChange={(e) => setExpiresYears(e.target.value)}
            disabled={isSession}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            Path (路径)
          </Label>
          <Input
            className="h-8"
            value={cookiePath}
            onChange={(e) => setCookiePath(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">SameSite</Label>
          <Select
            value={sameSite}
            onValueChange={(val: "Strict" | "Lax" | "None") => setSameSite(val)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lax">Lax</SelectItem>
              <SelectItem value="Strict">Strict</SelectItem>
              <SelectItem value="None">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
