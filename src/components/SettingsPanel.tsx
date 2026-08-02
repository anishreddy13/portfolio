"use client";

import React, { useState } from "react";
import {
  Settings,
  Save,
  Download,
  Upload,
  Camera,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { usePersistence } from "@/hooks/usePersistence";

export default function SettingsPanel() {
  const {
    autoSave,
    toggleAutoSave,
    snapshots,
    createSnapshot,
    restoreSnapshot,
    exportPortfolio,
    importPortfolio,
    resetDemoAccount,
    lastSavedAt,
  } = usePersistence();

  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExport = () => {
    exportPortfolio({
      export_version: "Phase 7 Sprint 1",
      exported_at: new Date().toISOString(),
      account: "Default Demo Portfolio",
    });
    triggerNotify("Portfolio exported successfully to JSON.");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importPortfolio(file, () => {
        triggerNotify("Imported portfolio data from JSON.");
      });
    }
  };

  const handleCreateSnap = () => {
    const snap = createSnapshot();
    triggerNotify(`Created snapshot #${snap.id}`);
  };

  const handleRestore = (id: string) => {
    restoreSnapshot(id);
    triggerNotify(`Restored portfolio to snapshot #${id}`);
  };

  const handleReset = () => {
    if (confirm("Reset demo account to initial $100,000 cash balance?")) {
      resetDemoAccount();
      triggerNotify("Demo account reset to $100,000 cash.");
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-lime-400" />
            Persistence & State Snapshots
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-Save Engine • State Snapshots • Export/Import Ledger • Demo Reset
          </p>
        </div>

        <span className="text-[11px] text-slate-400">
          Last Saved: <strong className="text-lime-400">{lastSavedAt}</strong>
        </span>
      </div>

      {/* Auto Save & Export/Import Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <Save className="w-4 h-4 text-lime-400" />
              Automated Background Auto-Save
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Persists portfolio and open orders every 30 seconds.
            </div>
          </div>
          <button
            onClick={toggleAutoSave}
            className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
              autoSave ? "bg-lime-500 text-slate-950" : "bg-slate-800 text-slate-400"
            }`}
          >
            {autoSave ? "ENABLED" : "DISABLED"}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4 text-lime-400" />
            Export JSON
          </button>

          <label className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4 text-sky-400" />
            Import JSON
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Point-in-Time State Snapshots */}
      <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            Point-in-Time State Snapshots ({snapshots.length})
          </div>
          <button
            onClick={handleCreateSnap}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl transition font-bold"
          >
            + Create Snapshot
          </button>
        </div>

        <div className="space-y-2">
          {snapshots.map((s) => (
            <div key={s.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">{s.id}</span>
                <span className="text-[11px] text-slate-400 ml-3">
                  Created {s.createdAt} (${s.equity.toLocaleString()} • {s.positionsCount} positions)
                </span>
              </div>
              <button
                onClick={() => handleRestore(s.id)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition text-[11px]"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Account Danger Zone */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <div className="text-slate-400">
          <strong className="text-rose-400 font-bold">Reset Demo Account:</strong> Wipes demo holdings and resets cash balance to $100,000.
        </div>
        <button
          onClick={handleReset}
          className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Account
        </button>
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-lime-500/10 border border-lime-500/30 text-lime-400 text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}
    </div>
  );
}
