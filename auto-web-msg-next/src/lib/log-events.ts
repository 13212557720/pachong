type LogEvent = {
  timestamp: string;
  level: "info" | "warn" | "error";
  scope: string;
  message: string;
};

let listeners: Set<(event: LogEvent) => void> | null = null;

function getListeners(): Set<(event: LogEvent) => void> {
  if (!listeners) listeners = new Set();
  return listeners;
}

export function emitLog(event: LogEvent) {
  for (const listener of getListeners()) {
    try { listener(event); } catch { /* 忽略监听器异常 */ }
  }
}

export function subscribeToLogs(callback: (event: LogEvent) => void) {
  getListeners().add(callback);
  return () => getListeners().delete(callback);
}
