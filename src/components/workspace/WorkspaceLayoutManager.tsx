"use client";

import React, { useState } from "react";
import { Search, Command, X, Check, Eye, Sliders, RefreshCw, LayoutGrid } from "lucide-react";
import { WorkspaceLayoutPreset } from "@/hooks/useWorkspace";

interface WorkspaceLayoutManagerProps {
  isOpen: boolean;
  onClose: () => void;
  panelVisibility: Record<string, boolean>;
  togglePanel: (key: string) => void;
  preset: WorkspaceLayoutPreset;
  applyPreset: (preset: WorkspaceLayoutPreset) => void;
}

export default function WorkspaceLayoutManager({
  isOpen,
  onClose,
  panelVisibility,
  togglePanel,
  preset,
  applyPreset,
}: WorkspaceLayoutManagerProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredPanels = Object.entries(panelVisibility).filter(([key]) =>
    key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden space-y-4 p-5">
        {/* Search Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Command className="w-4 h-4 text-sky-400" />
            <span>Command Palette & Workspace Manager</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search panels or workspace commands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
            autoFocus
          />
        </div>

        {/* Layout Presets */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Layout Presets</span>
          <div className="grid grid-cols-2 gap-2">
            {(["DEFAULT", "TRADING", "ANALYTICS", "RISK_GOVERNANCE"] as WorkspaceLayoutPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  applyPreset(p);
                  onClose();
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                  preset === p ? "bg-sky-500/10 border-sky-500/30 text-sky-400 font-bold" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <span>{p.replace("_", " ")}</span>
                {preset === p && <Check className="w-3.5 h-3.5 text-sky-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Panel Visibility List */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dockable Panels Toggle</span>
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {filteredPanels.map(([key, visible]) => (
              <div
                key={key}
                onClick={() => togglePanel(key)}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition"
              >
                <span className="text-white capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${visible ? "bg-lime-500/10 text-lime-400 border border-lime-500/30" : "bg-slate-900 text-slate-500 border border-slate-800"}`}>
                  {visible ? "VISIBLE" : "HIDDEN"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
