"use client";

import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useBrowserManagerStore } from "../../_hooks/useBrowserManagerStore";
import { SCAN_SELECTED_IDS_KEY } from "@/lib/client/constants";

import { ActionToolbar } from "./ActionToolbar";
import { BrowserTable } from "./BrowserTable";

function loadSelectedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SCAN_SELECTED_IDS_KEY);
    return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function saveSelectedIds(ids: Set<string>) {
  localStorage.setItem(SCAN_SELECTED_IDS_KEY, JSON.stringify([...ids]));
}

export function BrowserManagerClient() {
  const [scanSelectedIds, setScanSelectedIds] = React.useState<Set<string>>(loadSelectedIds);
  const profiles = useBrowserManagerStore((state) => state.profiles);
  const initialize = useBrowserManagerStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  function toggleScanId(userId: string, checked: boolean) {
    setScanSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(userId);
      else next.delete(userId);
      saveSelectedIds(next);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    const next = checked
      ? new Set(profiles.map((p) => p.user_id!).filter(Boolean))
      : new Set<string>();
    setScanSelectedIds(next);
    saveSelectedIds(next);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ActionToolbar />
      <BrowserTable
        scanSelectedIds={scanSelectedIds}
        toggleScanId={toggleScanId}
        toggleSelectAll={toggleSelectAll}
      />
      <Toaster />
    </div>
  );
}
