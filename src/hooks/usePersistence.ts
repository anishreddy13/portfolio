"use client";

import { useState, useCallback } from "react";

export interface SnapshotItem {
  id: string;
  createdAt: string;
  equity: number;
  positionsCount: number;
}

export function usePersistence() {
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([
    { id: "snap-101", createdAt: "10:00 AM Today", equity: 100000.0, positionsCount: 3 },
    { id: "snap-102", createdAt: "02:30 PM Today", equity: 104520.5, positionsCount: 5 },
  ]);
  const [lastSavedAt, setLastSavedAt] = useState<string>("Just now");

  const toggleAutoSave = useCallback(() => {
    setAutoSave((prev) => !prev);
  }, []);

  const createSnapshot = useCallback((equity: number = 100000, count: number = 5) => {
    const id = `snap-${Math.random().toString(36).substring(2, 7)}`;
    const nowStr = new Date().toLocaleTimeString();
    const newSnap: SnapshotItem = {
      id,
      createdAt: nowStr,
      equity,
      positionsCount: count,
    };
    setSnapshots((prev) => [newSnap, ...prev]);
    setLastSavedAt(nowStr);
    return newSnap;
  }, []);

  const restoreSnapshot = useCallback((id: string) => {
    setLastSavedAt(new Date().toLocaleTimeString());
    return true;
  }, []);

  const exportPortfolio = useCallback((data: unknown) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importPortfolio = useCallback((file: File, onComplete?: (data: unknown) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (onComplete) onComplete(data);
      } catch (err) {}
    };
    reader.readAsText(file);
  }, []);

  const resetDemoAccount = useCallback(() => {
    setLastSavedAt(new Date().toLocaleTimeString());
    return true;
  }, []);

  return {
    autoSave,
    toggleAutoSave,
    snapshots,
    createSnapshot,
    restoreSnapshot,
    exportPortfolio,
    importPortfolio,
    resetDemoAccount,
    lastSavedAt,
  };
}
