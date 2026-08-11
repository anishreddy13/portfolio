"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import {
  Activity,
  BrainCircuit,
  Clock3,
  Command,
  Home,
  Monitor,
  Search,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { User, Workspace } from "@/hooks/useIdentity";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { UserMenu } from "@/components/UserMenu";
import { WorkspaceServiceHealth } from "@/hooks/useDashboardStream";

interface WorkspaceHeaderProps {
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  onSwitch: (id: string) => void;
  user: User;
  onLogout: () => void;
  connectionStatus: "CONNECTED" | "RECONNECTING" | "OFFLINE";
  latencyMs: number;
  lastUpdatedAt: string | null;
  serviceHealth: WorkspaceServiceHealth | null;
  latestSignalCount: number;
}

function formatUpdatedAt(value: string | null) {
  if (!value) return "Waiting for stream";
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Live";
  }
}

export default function WorkspaceHeader({
  isCommandPaletteOpen,
  setIsCommandPaletteOpen,
  theme,
  toggleTheme,
  workspaces,
  activeWorkspace,
  onSwitch,
  user,
  onLogout,
  connectionStatus,
  latencyMs,
  lastUpdatedAt,
  serviceHealth,
  latestSignalCount,
}: WorkspaceHeaderProps) {
  const connectionLabel =
    connectionStatus === "CONNECTED" ? "live" : connectionStatus === "RECONNECTING" ? "syncing" : "offline";

  const connectionClass =
    connectionStatus === "CONNECTED"
      ? "border-lime-500/30 bg-lime-500/10 text-lime-300"
      : connectionStatus === "RECONNECTING"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-rose-500/30 bg-rose-500/10 text-rose-300";

  return (
    <header className="sticky top-0 z-30 border-b border-white/6 bg-[#050505]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 lg:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C8FF00]/25 bg-[#C8FF00]/8 text-[#C8FF00] shadow-[0_0_30px_rgba(200,255,0,0.08)]">
              <BrainCircuit className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-lg tracking-[0.12em] text-white">
                  AI Financial Analyst
                </h1>
                <span className="rounded-full border border-[#C8FF00]/25 bg-[#C8FF00]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C8FF00]">
                  live workspace
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-white/50">
                Analyze any stock with a cleaner trading surface, live signal stream, and quick access to market, risk, and execution tools.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] ${connectionClass}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {connectionLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
              <Activity className="h-3.5 w-3.5 text-sky-400" />
              {latestSignalCount} signals
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
              <Zap className="h-3.5 w-3.5 text-[#C8FF00]" />
              {serviceHealth?.status === "online" ? "services online" : "service check"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
              <Clock3 className="h-3.5 w-3.5 text-white/50" />
              {formatUpdatedAt(lastUpdatedAt)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
              <Monitor className="h-3.5 w-3.5 text-white/50" />
              {latencyMs.toFixed(1)} ms
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <WorkspaceSelector workspaces={workspaces} activeWorkspace={activeWorkspace} onSwitch={onSwitch} />
            <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
              <Search className="h-3.5 w-3.5 text-white/40" />
              cmd+K for panel search
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 transition-colors hover:border-[#FF2D2D]/30 hover:text-[#FF2D2D]"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <Link
              href="/projects/ai-financial-analyst"
              className="inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/25 bg-[#C8FF00]/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#C8FF00] transition-colors hover:bg-[#C8FF00]/18"
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              Analyst
            </Link>
            <button
              onClick={() => setIsCommandPaletteOpen(!isCommandPaletteOpen)}
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 transition-colors hover:border-white/20 hover:text-white"
            >
              <Command className="h-3.5 w-3.5" />
              search panels
            </button>
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 transition-colors hover:border-white/20 hover:text-white"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-300" /> : <Moon className="h-3.5 w-3.5 text-sky-400" />}
            </button>
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </header>
  );
}
