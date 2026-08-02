"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, Cpu, Layers, Activity, FileCheck, Server, AlertCircle } from "lucide-react";
import { useSystemStatus } from "@/hooks/useSystemStatus";

function readinessBadge(readiness: string) {
  if (readiness === "READY_FOR_RELEASE") return "bg-lime-500/10 text-lime-400 border-lime-500/30 font-bold";
  if (readiness === "IN_REVIEW") return "bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold";
  return "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold";
}

export default function SystemStatusPanel() {
  const { status } = useSystemStatus();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-lime-400" />
            Enterprise Quality Assurance & Release Readiness Framework
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated Unit/Integration Testing • SLA Benchmark Verification • CI/CD Pipeline Status • Production Release Gate
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] px-2.5 py-1 rounded-full border flex items-center gap-1 ${readinessBadge(status.releaseReadiness)}`}>
            <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
            Status: {status.releaseReadiness.replace(/_/g, " ")}
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
            Version: <strong className="text-white">{status.systemVersion}</strong>
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-lime-500/30">
          <div className="text-slate-400 text-[11px] mb-1">CI Build Status</div>
          <div className="text-lg font-bold text-lime-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-lime-400" />
            {status.buildStatus}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Automated Test Coverage</div>
          <div className="text-lg font-bold text-sky-400">{status.testCoveragePct}% Passed</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Benchmark SLA Status</div>
          <div className="text-lg font-bold text-amber-400">{status.benchmarkStatus}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Completed Subsystems</div>
          <div className="text-lg font-bold text-white">{status.subsystemCount} / 37 Engines</div>
        </div>
      </div>

      {/* Documentation Suite Overview */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileCheck className="w-3.5 h-3.5 text-sky-400" />
          Enterprise Documentation & Operational Suite (docs/)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-sky-400 font-bold block">ARCHITECTURE.md</span>
            <span className="text-slate-400">Decoupling & 4-Layer Architecture</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-lime-400 font-bold block">SYSTEM_OVERVIEW.md</span>
            <span className="text-slate-400">37 Subsystems Functional Catalog</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-amber-400 font-bold block">DEPLOYMENT_GUIDE.md</span>
            <span className="text-slate-400">Docker, Kubernetes & Helm</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-violet-400 font-bold block">API_OVERVIEW.md</span>
            <span className="text-slate-400">Python API Reference Code</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-rose-400 font-bold block">OPERATIONS.md</span>
            <span className="text-slate-400">Runbook & Disaster Recovery</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-cyan-400 font-bold block">ci.yml</span>
            <span className="text-slate-400">GitHub Actions Pipeline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
