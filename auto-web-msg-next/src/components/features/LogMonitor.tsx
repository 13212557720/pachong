"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";

type LogEntry = {
  timestamp: string;
  level: "info" | "warn" | "error";
  scope: string;
  message: string;
};

const MAX_ENTRIES = 500;

const LEVEL_COLORS: Record<string, string> = {
  info: "text-muted-foreground",
  warn: "text-amber-600",
  error: "text-red-600",
};

const LEVEL_BADGES: Record<string, string> = {
  info: "bg-muted",
  warn: "bg-amber-100",
  error: "bg-red-100",
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("zh-CN", { hour12: false });
  } catch {
    return "";
  }
}

export function LogMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      try {
        es = new EventSource("/api/logs/stream");

        es.onmessage = (e) => {
          try {
            const entry: LogEntry = JSON.parse(e.data);
            setLogs((prev) => {
              const next = prev.length >= MAX_ENTRIES ? prev.slice(prev.length - MAX_ENTRIES + 1) : prev;
              return [...next, entry];
            });
            if (!userScrolledUp.current) {
              requestAnimationFrame(scrollToBottom);
            }
          } catch { /* 忽略解析错误 */ }
        };

        es.onerror = () => {
          es?.close();
          // 断线重连
          reconnectTimer = setTimeout(connect, 5000);
        };
      } catch { /* 忽略连接错误 */ }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [scrollToBottom]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const handler = () => {
      userScrolledUp.current = el.scrollTop + el.clientHeight < el.scrollHeight - 40;
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [isOpen]);

  // 当面板打开时，立即滚动到底部
  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 50);
    }
  }, [isOpen, scrollToBottom]);

  function handleClear() {
    setLogs([]);
  }

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-24 right-6 z-50 rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center bg-slate-600 hover:bg-slate-700 text-white transition-transform hover:scale-105"
        onClick={() => setIsOpen(true)}
        title="打开全局日志"
      >
        <span className="flex flex-col items-center">
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight font-medium">日志</span>
        </span>
      </Button>
    );
  }

  return (
    <div className="fixed z-50 bottom-24 right-6 w-[450px] h-[400px] rounded-xl bg-background border shadow-2xl flex flex-col transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-sm">全局日志</h3>
          <span className="text-xs text-muted-foreground">{logs.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7 text-xs" onClick={handleClear} title="清除">
            清
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => setIsOpen(false)}
            title="关闭"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-muted/10 p-2 font-mono text-xs leading-relaxed">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg text-sm">
            <FileText className="w-6 h-6 mr-2 opacity-50" />
            等待日志...
          </div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((entry, i) => (
              <div key={i} className={`flex gap-2 px-1.5 py-0.5 rounded ${LEVEL_BADGES[entry.level]}`}>
                <span className="text-muted-foreground shrink-0">{formatTime(entry.timestamp)}</span>
                <span className={`font-medium shrink-0 ${LEVEL_COLORS[entry.level]}`}>{entry.level.toUpperCase()}</span>
                <span className="text-muted-foreground shrink-0 truncate max-w-[90px]">{entry.scope}</span>
                <span className="truncate">{entry.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
