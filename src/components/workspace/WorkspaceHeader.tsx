"use client";

import React from "react";
import { ShieldCheck, Command, Bell, Sun, Moon, Search, SlidersHorizontal, Activity } from "lucide-react";
import { WorkspaceLayoutPreset, WorkspaceNotification } from "@/hooks/useWorkspace";

interface WorkspaceHeaderProps {
  preset: WorkspaceLayoutPreset;
  applyPreset: (preset: WorkspaceLayoutPreset) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  notifications: WorkspaceNotification[];
  dismissNotification: (id: string) => void;
}

export default function WorkspaceHeader({
  preset,
  applyPreset,
  isCommandPaletteOpen,
  setIsCommandPaletteOpen,
  theme,
  toggleTheme,
  notifications,
  dismissNotification,
}: WorkspaceHeaderProps) {
  const [showNotifications, setShowNotifications] = React.useState(false);

  return (
    <header className="h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between font-mono text-xs z-30 sticky top-0">
      {/* Left Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
            AF
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
              ANTIGRAVITY WORKSTATION
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold">
                PRO v1.28
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 leading-none">Institutional Algorithmic Trading Desktop</p>
          </div>
        </div>
      </div>

      {/* Middle Layout Presets */}
      <div className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
        {(["DEFAULT", "TRADING", "ANALYTICS", "RISK_GOVERNANCE"] as WorkspaceLayoutPreset[]).map((p) => (
          <button
            key={p}
            onClick={() => applyPreset(p)}
            className={`px-3 py-1 rounded-lg transition text-[11px] font-bold ${
              preset === p ? "bg-sky-500 text-slate-950 shadow" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            {p.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Right Tools & Controls */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger (Ctrl+K) */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition text-xs"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline text-slate-400">Search Commands...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] border border-slate-800 text-slate-400 font-bold">
            Ctrl+K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
          title="Toggle Dark/Light Theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition relative"
            title="Notification Center"
          >
            <Bell className="w-4 h-4 text-sky-400" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 z-50 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-sky-400" />
                  Notifications ({notifications.length})
                </span>
                <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">No active notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 relative group">
                      <div className="flex items-center justify-between text-white font-bold text-[11px]">
                        <span>{n.title}</span>
                        <span className="text-[9px] text-slate-500">{n.timestamp}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{n.message}</p>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="absolute top-1 right-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
