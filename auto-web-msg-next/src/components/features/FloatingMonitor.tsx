"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Tv, X } from "lucide-react";
import { createLogger } from "@/lib/logger";
import { getScreenshotsAction } from "@/actions/browser-manager-actions";

const logger = createLogger("floating-monitor");

/**
 * 全局屏幕监控浮窗组件
 * 
 * 在页面角落显示一个悬浮按钮，点击后展开面板，通过短轮询实时获取所有活动浏览器实例的屏幕截图。
 * 提供最大化和关闭等视图控制功能。
 * 
 * @returns 浮窗及监控面板 React 组件
 */
export function FloatingMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [screenshots, setScreenshots] = useState<{ id: string; image: string; profileName?: string }[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // 只有在打开面板时才连接，节省资源
    if (!isOpen) {
      const resetTimer = setTimeout(() => {
        setScreenshots([]);
        setError("");
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    let isActive = true;

    async function pollScreenshots() {
      while (isActive) {
        try {
          const res = await getScreenshotsAction();
          if (res.success) {
            setScreenshots(res.data || []);
            setError("");
          } else {
            setError(res.error || "获取截图数据失败");
          }
        } catch (e) {
          logger.error("解析监控流数据失败", e);
          setError("无法获取监控数据，正在重试...");
        }

        // 帧间隙 1000ms
        if (isActive) await new Promise(r => setTimeout(r, 1000));
      }
    }

    pollScreenshots();

    return () => {
      isActive = false;
    };
  }, [isOpen]);

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white transition-transform hover:scale-105"
        onClick={() => setIsOpen(true)}
        title="打开全局屏幕监控"
      >
        <span className="flex flex-col items-center">
          <Tv className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight font-medium">监控</span>
        </span>
      </Button>
    );
  }

  return (
    <div
      className={`fixed z-50 flex flex-col bg-background border shadow-2xl transition-all duration-300 ease-in-out ${isMaximized
        ? "top-4 left-4 right-4 bottom-4 rounded-xl"
        : "bottom-6 right-6 w-[400px] h-[550px] rounded-xl"
        }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-sm">全局屏幕监控</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "还原" : "最大化"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => {
              setIsOpen(false);
              setIsMaximized(false);
            }}
            title="关闭"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
        {error && (
          <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded text-xs">
            {error}
          </div>
        )}

        {screenshots.length === 0 && !error ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-6 text-sm text-center">
            <Tv className="w-8 h-8 mb-2 opacity-50" />
            <p>暂无活动实例或正在获取第一帧...</p>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${isMaximized
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-1"
              }`}
          >
            {screenshots.map((item) => (
              <div
                key={item.id}
                className="flex flex-col rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden"
              >
                <div className="px-2 py-1.5 border-b bg-muted/50 text-[11px] font-medium text-muted-foreground truncate" title={item.profileName || item.id}>
                  {`ID: ${item.id}`}
                </div>
                <div className="bg-black/5 flex items-center justify-center p-2 min-h-[120px]">
                  <Image
                    src={item.image}
                    alt={`ID ${item.id} screen`}
                    width={640}
                    height={360}
                    unoptimized
                    className="rounded max-h-[300px] w-full object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
