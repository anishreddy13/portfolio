"use client";

import React from "react";
import { Link2, ShieldCheck, Activity, RefreshCw, Zap, Wifi, HardDrive, CheckCircle2, ArrowRightLeft } from "lucide-react";
import { useBrokerConnectivity, BrokerConnectionData } from "@/hooks/useBrokerConnectivity";

function statusBadge(st: string) {
  if (st === "CONNECTED") return "bg-lime-500/10 text-lime-400 border-lime-500/30 font-bold";
  if (st === "DEGRADED") return "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold";
  return "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold";
}

export default function BrokerConnectivityPanel() {
  const { connections, statistics, triggerFailover, reconnectBroker } = useBrokerConnectivity();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-sky-400" />
            Enterprise Broker Connectivity Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Broker Adapter Connection Lifecycle • Heartbeat Monitoring • Automatic Failover • Capability Discovery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerFailover}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold transition text-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Trigger Failover
          </button>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30 font-bold flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-lime-400" />
            Active Connections: {statistics.activeConnected} / {statistics.totalConfigured}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-sky-500/30">
          <div className="text-slate-400 text-[11px] mb-1">Primary Broker</div>
          <div className="text-lg font-bold text-sky-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            {statistics.primaryBrokerName}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Failover Target</div>
          <div className="text-lg font-bold text-amber-400">{statistics.failoverBrokerName}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Avg Heartbeat Latency</div>
          <div className="text-lg font-bold text-lime-400">{statistics.averageLatencyMs} ms</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Total Reconnects</div>
          <div className="text-lg font-bold text-white">{statistics.totalReconnects} Times</div>
        </div>
      </div>

      {/* Connected Broker Adapters Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          Registered Broker Adapter Connections
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {connections.map((conn: BrokerConnectionData) => (
            <div key={conn.brokerId} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    {conn.brokerName}
                    {conn.isPrimary && (
                      <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[9px]">
                        PRIMARY
                      </span>
                    )}
                    {conn.isFailover && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px]">
                        FAILOVER
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{conn.primaryUrl}</div>
                </div>

                <span className={`text-[10px] px-2 py-0.5 rounded border ${statusBadge(conn.status)}`}>
                  {conn.status}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Heartbeat Latency:</span>
                  <strong className="text-lime-400">{conn.latencyMs} ms</strong>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Last Heartbeat Pulse:</span>
                  <strong className="text-slate-200">{conn.lastHeartbeat}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Reconnect Count:</span>
                  <strong className="text-white">{conn.reconnectCount}</strong>
                </div>
              </div>

              {/* Capabilities */}
              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/40 space-y-1 text-[10px]">
                <div className="text-slate-400 font-bold mb-1">Capabilities:</div>
                <div className="flex flex-wrap gap-1">
                  {conn.capability.supportsFractional && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Fractional</span>
                  )}
                  {conn.capability.supportsShorting && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Shorting</span>
                  )}
                  {conn.capability.supportsStopLimit && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Stop Limit</span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    Max: {conn.capability.maxOrderRatePerSec}/s
                  </span>
                </div>
              </div>

              <button
                onClick={() => reconnectBroker(conn.brokerName)}
                className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center gap-1 transition"
              >
                <RefreshCw className="w-3 h-3 text-sky-400" />
                Reconnect Adapter
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
