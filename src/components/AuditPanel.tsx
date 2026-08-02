"use client";

import React from "react";
import { Database, Lock, Search, Filter, ShieldCheck, CheckCircle2, AlertTriangle, Activity, Key } from "lucide-react";
import { useAudit, AuditEventData } from "@/hooks/useAudit";

function severityBadge(sev: string) {
  if (sev === "CRITICAL") return "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold";
  if (sev === "HIGH") return "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold";
  if (sev === "WARNING") return "bg-amber-500/10 text-amber-300 border-amber-500/20";
  return "bg-sky-500/10 text-sky-400 border-sky-500/30";
}

function subsystemColor(sub: string) {
  if (sub === "SIGNAL_ENGINE") return "text-sky-400";
  if (sub === "PORTFOLIO_CONSTRUCTION") return "text-amber-400";
  if (sub === "COMPLIANCE_ENGINE") return "text-rose-400";
  if (sub === "ORDER_MANAGEMENT") return "text-violet-400";
  if (sub === "EXECUTION_MANAGER") return "text-lime-400";
  if (sub === "PORTFOLIO_MANAGER") return "text-emerald-400";
  return "text-slate-400";
}

export default function AuditPanel() {
  const { events, rawCount, filter, setFilter, isChainValid } = useAudit();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-lime-400" />
            Enterprise Audit & Event Sourcing Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable Append-Only Event Log • Cryptographic SHA-256 Hash Chain • System of Record
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30 flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
            Hash Chain: {isChainValid ? "VERIFIED VALID" : "CORRUPTED"}
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
            Log Count: <strong className="text-white">{events.length} / {rawCount}</strong>
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-lime-500/30">
          <div className="text-slate-400 text-[11px] mb-1">Log Integrity</div>
          <div className="text-lg font-bold text-lime-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-lime-400" />
            SHA-256 VALID
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Total Events</div>
          <div className="text-lg font-bold text-white">{rawCount} Events</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Subsystems Logging</div>
          <div className="text-lg font-bold text-sky-400">6 Engines</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Mode</div>
          <div className="text-lg font-bold text-amber-400">APPEND ONLY</div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search events, tickers, IDs..."
            value={filter.searchQuery}
            onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-lime-500/50 w-full sm:w-56 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filter.subsystem}
            onChange={(e) => setFilter({ ...filter, subsystem: e.target.value })}
            className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none cursor-pointer font-mono"
          >
            <option value="ALL">All Subsystems</option>
            <option value="SIGNAL_ENGINE">SignalEngine</option>
            <option value="PORTFOLIO_CONSTRUCTION">PortfolioConstructionEngine</option>
            <option value="COMPLIANCE_ENGINE">ComplianceEngine</option>
            <option value="ORDER_MANAGEMENT">OrderManagementSystem</option>
            <option value="EXECUTION_MANAGER">ExecutionManager</option>
            <option value="PORTFOLIO_MANAGER">PortfolioManager</option>
          </select>

          <select
            value={filter.severity}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
            className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none cursor-pointer font-mono"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Live Event Timeline Log */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-lime-400" />
          Immutable Audit Event Stream
        </h3>
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {events.map((evt: AuditEventData) => (
            <div
              key={evt.eventId}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/60 space-y-2 text-[11px]"
            >
              {/* Line 1: Timestamp, Subsystem, Event Type, Severity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-500 font-bold">{evt.timestamp}</span>
                  <span className={`font-bold ${subsystemColor(evt.subsystem)}`}>
                    [{evt.subsystem}]
                  </span>
                  <span className="text-white font-semibold">{evt.eventType}</span>
                  {evt.symbol && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      {evt.symbol}
                    </span>
                  )}
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] border ${severityBadge(evt.severity)}`}>
                  {evt.severity}
                </span>
              </div>

              {/* Line 2: Payload Description */}
              <div className="text-slate-300 leading-relaxed pl-1 border-l-2 border-slate-800">
                {evt.payloadDescription}
              </div>

              {/* Line 3: Cryptographic Hash Signature & Chain Link */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/40">
                <div className="flex items-center gap-1 truncate max-w-md font-mono">
                  <Key className="w-3 h-3 text-slate-600 shrink-0" />
                  <span className="text-slate-400">Sig: {evt.hashSignature}</span>
                </div>
                <span className="text-slate-500 font-mono">Prev: {evt.previousHash.slice(0, 10)}...</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
