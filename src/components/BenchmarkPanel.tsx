"use client";

import React from "react";
import { Gauge, Zap, BarChart3, Play, Activity, ShieldCheck, CheckCircle2, TrendingUp, Target } from "lucide-react";
import { useBenchmark, BenchmarkReportData } from "@/hooks/useBenchmark";

function statusBadge(status: string) {
  if (status === "PASSED") return "bg-lime-500/10 text-lime-400 border-lime-500/30 font-bold";
  if (status === "DEGRADED") return "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold";
  return "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold";
}

export default function BenchmarkPanel() {
  const { reports, statistics, runBenchmark } = useBenchmark();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-lime-400 animate-pulse" />
            Enterprise Benchmark & Load Testing Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Latency Distribution (P50/P95/P99) • Throughput RPS Measurements • SLA Performance Targets • Regression Comparisons
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runBenchmark("Custom On-Demand Load Test")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 border border-lime-500/30 font-bold transition text-xs"
          >
            <Play className="w-3.5 h-3.5" />
            Run Benchmark Test
          </button>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
            Baseline P95: <strong className="text-white">{statistics.baselineP95Ms} ms</strong>
          </span>
        </div>
      </div>

      {/* Summary Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-lime-500/30">
          <div className="text-slate-400 text-[11px] mb-1">Current P95 Latency</div>
          <div className="text-lg font-bold text-lime-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-lime-400" />
            {statistics.currentP95Ms} ms
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Max Throughput</div>
          <div className="text-lg font-bold text-sky-400">{statistics.maxThroughputRps} RPS</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Success Rate SLA</div>
          <div className="text-lg font-bold text-amber-400">{statistics.overallSuccessRatePct}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Benchmark Runs</div>
          <div className="text-lg font-bold text-white">{statistics.totalRunsExecuted} Executed</div>
        </div>
      </div>

      {/* Benchmark History & Evaluation Reports */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-lime-400" />
          Benchmark Evaluation Reports History
        </h3>
        <div className="space-y-3">
          {reports.map((rpt: BenchmarkReportData) => (
            <div key={rpt.reportId} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3 text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <div>
                  <span className="font-bold text-white text-xs">{rpt.scenarioName}</span>
                  <div className="text-[10px] text-slate-500">
                    Run ID: {rpt.runId} • Deployment Tag: <strong className="text-sky-400">{rpt.deploymentTag}</strong> • {rpt.timestamp}
                  </div>
                </div>

                <span className={`text-[10px] px-2 py-0.5 rounded border ${statusBadge(rpt.status)}`}>
                  {rpt.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-900/50">
                <div>
                  <span className="text-slate-500 text-[10px] block">P50 (Median) Latency</span>
                  <span className="text-white font-bold">{rpt.latency.p50Ms} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">P95 (95th) Latency</span>
                  <span className="text-amber-400 font-bold">{rpt.latency.p95Ms} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">P99 (Tail) Latency</span>
                  <span className="text-rose-400 font-bold">{rpt.latency.p99Ms} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Throughput Rate</span>
                  <span className="text-lime-400 font-bold">{rpt.throughput.requestsPerSec} RPS</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA Performance Targets Matrix */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-sky-400" />
          Subsystem SLA Performance Targets (benchmark/performance_targets.md)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-sky-400 font-bold block">RequestCoordinator</span>
            <span className="text-slate-400">P95 &lt; 25ms | 5,000 RPS</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-lime-400 font-bold block">MarketCache</span>
            <span className="text-slate-400">P95 &lt; 3ms | 50,000 RPS</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-amber-400 font-bold block">OrderManagement</span>
            <span className="text-slate-400">P95 &lt; 35ms | 500 orders/s</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-violet-400 font-bold block">ExecutionManager</span>
            <span className="text-slate-400">P95 &lt; 75ms | 200 fills/s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
