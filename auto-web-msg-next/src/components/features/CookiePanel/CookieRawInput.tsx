"use client";

import { Label } from "@/components/ui/label";

interface CookieRawInputProps {
  cookieText: string;
  setCookieText: (val: string) => void;
}

export function CookieRawInput({
  cookieText,
  setCookieText,
}: CookieRawInputProps) {
  return (
    <div className="space-y-2">
      <Label className="flex justify-between">
        <span>纯净 Raw Cookie 载荷输入区</span>
        <span className="text-[10px] text-muted-foreground font-normal text-amber-500/80">
          移除 JSON 支持，仅接受 c_user=xx;xs=xx; 等 F12 脱出网络头
        </span>
      </Label>
      <textarea
        className="h-28 w-full rounded-md border bg-background p-3 text-xs font-mono"
        value={cookieText}
        onChange={(e) => setCookieText(e.target.value)}
        placeholder="c_user=100076117985747; xs=48:w0uhFMPMxYB02w...;"
      />
    </div>
  );
}
