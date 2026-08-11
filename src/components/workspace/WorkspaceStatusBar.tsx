"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { Activity, ArrowUpRight, Clock3, Wifi } from "lucide-react";
import { WorkspaceServiceHealth } from "@/hooks/useDashboardStream";

interface WorkspaceStatusBarProps {
  connectionStatus: "CONNECTED" | "RECONNECTING" | "OFFLINE";
  latencyMs: number;
  lastUpdatedAt: string | null;
  serviceHealth: WorkspaceServiceHealth | null;
  latestSignalCount: number;
}

function formatUpdatedAt(value: string | null) {
  if (!value) return "waiting";
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "live";
  }
}

export default function WorkspaceStatusBar({
  connectionStatus,
  latencyMs,
  lastUpdatedAt,
  serviceHealth,
  latestSignalCount,
}: WorkspaceStatusBarProps) {
  const connectionLabel =
    connectionStatus === "CONNECTED" ? "connected" : connectionStatus === "RECONNECTING" ? "reconnecting" : "offline";

  return (
    <footer className="sticky bottom-0 z-30 border-t border-white/6 bg-[#050505]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-white/55 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-white/70">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connectionStatus === "CONNECTED"
                  ? "bg-lime-400"
                  : connectionStatus === "RECONNECTING"
                    ? "bg-amber-400"
                    : "bg-rose-400"
              }`}
            />
            stream {connectionLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5">
            <Wifi className="h-3.5 w-3.5 text-sky-400" />
            {latestSignalCount} live signals
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5">
            <Activity className="h-3.5 w-3.5 text-[#C8FF00]" />
            phase {serviceHealth?.phase ?? 5}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5">
            <Clock3 className="h-3.5 w-3.5 text-white/40" />
            updated {formatUpdatedAt(lastUpdatedAt)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5">
            latency {latencyMs.toFixed(1)} ms
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-white/70 transition-colors hover:border-[#FF2D2D]/30 hover:text-[#FF2D2D]"
          >
            back home
          </Link>
          <Link
            href="/projects/ai-financial-analyst/explainer"
            className="inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/25 bg-[#C8FF00]/10 px-3 py-1.5 text-[#C8FF00] transition-colors hover:bg-[#C8FF00]/18"
          >
            system tour
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
