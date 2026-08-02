"use client";

import React from "react";
import { Activity, ShieldCheck, Cpu, Wifi, Server, CheckCircle2 } from "lucide-react";

export default function WorkspaceStatusBar() {
  return (
    <footer className="h-7 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-between font-mono text-[10px] text-slate-400 z-30 sticky bottom-0">
      {/* Left System Status Items */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-lime-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          SYSTEM OPERATIONAL
        </span>

        <span className="flex items-center gap-1 text-slate-400">
          <Cpu className="w-3 h-3 text-sky-400" />
          37 Subsystems Active
        </span>

        <span className="flex items-center gap-1 text-slate-400">
          <Wifi className="w-3 h-3 text-lime-400" />
          Consensus WebSocket: CONNECTED
        </span>
      </div>

      {/* Right Environment & Latency Items */}
      <div className="flex items-center gap-4">
        <span>Latency P95: <strong className="text-lime-400">12.4 ms</strong></span>
        <span>Audit Chain: <strong className="text-sky-400">VERIFIED (SHA-256)</strong></span>
        <span>Environment: <strong className="text-white">PRODUCTION (us-east-1)</strong></span>
      </div>
    </footer>
  );
}
