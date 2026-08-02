"use client";

import React from "react";
import { ShieldCheck, Server, RefreshCw, Zap, Activity, HardDrive, ArrowRightLeft, CheckCircle2, AlertOctagon } from "lucide-react";
import { useHighAvailability, ServiceNodeData, RecoveryPlanData, FailoverDecisionData } from "@/hooks/useHighAvailability";

function roleBadge(role: string) {
  if (role === "PRIMARY") return "bg-lime-500/10 text-lime-400 border-lime-500/30 font-bold";
  if (role === "STANDBY") return "bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold";
  return "bg-amber-500/10 text-amber-400 border-amber-500/30";
}

function statusBadge(status: string) {
  if (status === "ONLINE") return "bg-lime-500/10 text-lime-400 border-lime-500/30 font-bold";
  if (status === "DEGRADED") return "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold";
  return "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold";
}

export default function HighAvailabilityPanel() {
  const { nodes, plans, decisions, statistics, triggerFailover, triggerRecovery } = useHighAvailability();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-lime-400 animate-pulse" />
            Enterprise High Availability & Disaster Recovery Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-Region Cluster Topology • Automated Leader Election • Disaster Recovery Orchestration • Service Availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerFailover}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold transition text-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Initiate Failover
          </button>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
            Uptime: {statistics.clusterUptimePct}%
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-lime-500/30">
          <div className="text-slate-400 text-[11px] mb-1">Active Primary Leader</div>
          <div className="text-lg font-bold text-lime-400 flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0" />
            {statistics.activePrimaryNode}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Standby Replicas</div>
          <div className="text-lg font-bold text-sky-400">{statistics.standbyNodesCount} Nodes</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Failovers Executed</div>
          <div className="text-lg font-bold text-amber-400">{statistics.totalFailovers} Events</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">DR Recoveries Executed</div>
          <div className="text-lg font-bold text-white">{statistics.totalRecoveries} Plans</div>
        </div>
      </div>

      {/* Cluster Nodes Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-lime-400" />
          Multi-Region Infrastructure Cluster Nodes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {nodes.map((node: ServiceNodeData) => (
            <div key={node.nodeId} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <span className="font-bold text-white text-xs">{node.nodeName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${roleBadge(node.role)}`}>
                  {node.role}
                </span>
              </div>

              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className={`px-1.5 py-0.2 rounded border ${statusBadge(node.status)}`}>{node.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IP Address:</span>
                  <span className="font-bold text-slate-200">{node.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Region:</span>
                  <span className="text-sky-400 font-bold">{node.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Probe:</span>
                  <span className="text-slate-400">{node.lastSeen}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disaster Recovery Plans & Leader Election Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DR Recovery Plans */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            Disaster Recovery Orchestration Plans
          </h3>
          <div className="space-y-2">
            {plans.map((p: RecoveryPlanData) => (
              <div key={p.planId} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Target: {p.targetSubsystem}</span>
                  <span className="px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/30 font-bold text-[10px]">
                    {p.status}
                  </span>
                </div>
                <div className="text-slate-400 text-[10px] space-y-0.5">
                  {p.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-lime-400">✓</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leader Election & Failover Audit Log */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            Leader Election & Failover Events Log
          </h3>
          <div className="space-y-2">
            {decisions.map((d: FailoverDecisionData) => (
              <div key={d.decisionId} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>{d.timestamp}</span>
                  <span className="text-amber-400 font-bold">ID: {d.decisionId}</span>
                </div>
                <div className="text-white font-bold">{d.reason}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>Failed Node: <strong className="text-rose-400">{d.failedNodeId}</strong></span>
                  <span>→</span>
                  <span>Elected Leader: <strong className="text-lime-400">{d.electedNodeId}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
