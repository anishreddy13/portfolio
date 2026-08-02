"use client";

import React from "react";
import { Cpu, Server, Activity, BarChart2, ShieldCheck, CheckCircle2, AlertTriangle, Zap, HardDrive, Layers } from "lucide-react";
import { useObservability, SubsystemHealthData, LatencyChartEntry } from "@/hooks/useObservability";

function statusBadge(status: string) {
  if (status === "HEALTHY") return "bg-lime-500/10 text-lime-400 border-lime-500/30 font-bold";
  if (status === "DEGRADED") return "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold";
  return "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold";
}

export default function ObservabilityPanel() {
  const { subsystemHealths, latencyData, alerts, resources } = useObservability();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-lime-400 animate-pulse" />
            Enterprise Observability & Monitoring Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            System Telemetry • Latency Percentiles (P50/P95/P99) • Resource Utilization & Health Metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30 flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
            System Health: {resources.overallHealthScore}%
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
            Active Alerts: <strong className="text-white">{resources.activeAlertsCount}</strong>
          </span>
        </div>
      </div>

      {/* System Resource Gauge Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-lime-500/30">
          <div className="text-slate-400 text-[11px] mb-1">System Status</div>
          <div className="text-lg font-bold text-lime-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-lime-400" />
            {resources.systemStatus}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">CPU Load</div>
          <div className="text-lg font-bold text-sky-400">{resources.cpuUsagePct}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Memory Allocation</div>
          <div className="text-lg font-bold text-amber-400">{resources.memoryUsageMb} MB</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Queue Depth</div>
          <div className="text-lg font-bold text-white">{resources.queueDepth} Items</div>
        </div>
      </div>

      {/* Subsystem Health Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-lime-400" />
          Subsystem Health Matrix (30 Monitored Engines)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {subsystemHealths.map((sub: SubsystemHealthData) => (
            <div key={sub.subsystem} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white truncate text-[10px]">{sub.subsystem.replace("_", " ")}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${statusBadge(sub.status)}`}>
                  {sub.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>P95: <strong className="text-slate-200">{sub.latencyP95Ms}ms</strong></span>
                <span>Score: <strong className="text-lime-400">{sub.healthScore}</strong></span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-lime-500 rounded-full" style={{ width: `${sub.healthScore}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latency Percentiles (P50, P95, P99) Distribution Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
          Subsystem Latency Percentiles (P50 / P95 / P99)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-medium">Subsystem</th>
                <th className="pb-2 font-medium">P50 (Median)</th>
                <th className="pb-2 font-medium">P95 (95th)</th>
                <th className="pb-2 font-medium">P99 (Tail)</th>
                <th className="pb-2 font-medium text-right">Max Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {latencyData.map((row: LatencyChartEntry) => (
                <tr key={row.subsystem} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 font-bold text-white">{row.subsystem}</td>
                  <td className="py-2.5 text-slate-300">{row.p50Ms} ms</td>
                  <td className="py-2.5 text-amber-400 font-semibold">{row.p95Ms} ms</td>
                  <td className="py-2.5 text-rose-400 font-bold">{row.p99Ms} ms</td>
                  <td className="py-2.5 text-right text-slate-400">{row.maxMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts & System Notifications */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Active Monitoring Alerts & Notifications
        </h3>
        <div className="space-y-1.5">
          {alerts.map((a) => (
            <div key={a.alertId} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">{a.timestamp}</span>
                <span className="text-sky-400 font-bold">[{a.subsystem}]</span>
                <span className="text-slate-300">{a.message}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/30 font-bold">
                RESOLVED
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
