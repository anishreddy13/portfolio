"use client";

import React from "react";
import { Shield, ShieldAlert, ShieldCheck, PieChart, Activity, AlertTriangle, Lock } from "lucide-react";
import { useRisk } from "@/hooks/useRisk";

export default function RiskPanel() {
  const { riskData } = useRisk();

  const isLowRisk = riskData.riskScore <= 35;
  const isMedRisk = riskData.riskScore > 35 && riskData.riskScore <= 65;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-lime-400" />
            Enterprise Risk Management Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Single Source of Truth for Order Approval • Real-Time Exposure • VaR & Expected Shortfall
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Risk Score:</span>
          <span
            className={`px-3 py-1 rounded-xl font-bold border ${
              isLowRisk
                ? "bg-lime-500/10 text-lime-400 border-lime-500/30"
                : isMedRisk
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            }`}
          >
            {riskData.riskScore} / 100 ({isLowRisk ? "LOW RISK" : isMedRisk ? "MODERATE" : "HIGH RISK"})
          </span>
        </div>
      </div>

      {/* Primary Exposure & Risk Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Total Exposure</div>
          <div className="text-lg font-bold text-white">{riskData.totalExposurePct}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Leverage Ratio</div>
          <div className="text-lg font-bold text-sky-400">{riskData.leverage}x</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">VaR (95% Daily)</div>
          <div className="text-lg font-bold text-amber-400">{riskData.var95Pct}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Expected Shortfall</div>
          <div className="text-lg font-bold text-rose-400">{riskData.expectedShortfall95Pct}%</div>
        </div>
      </div>

      {/* Sector Concentration */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
        <div className="font-semibold text-slate-200 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-lime-400" />
          Sector Concentration Exposure
        </div>

        <div className="space-y-2">
          {riskData.sectorExposure.map((sec) => (
            <div key={sec.sector} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300">{sec.sector}</span>
                <span className="text-lime-400 font-bold">{sec.exposurePct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-lime-500/80 rounded-full"
                  style={{ width: `${Math.min(100, sec.exposurePct * 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Risk Violations Log */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Recent Risk Violation Logs ({riskData.recentViolations.length})
        </h3>
        <div className="space-y-2">
          {riskData.recentViolations.length > 0 ? (
            riskData.recentViolations.map((v, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/20 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold text-[10px]">
                    {v.severity}
                  </span>
                  <strong className="text-slate-200">{v.ruleName}:</strong>
                  <span className="text-slate-400">{v.description}</span>
                </div>
                <span className="text-slate-500">{v.timestamp}</span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-slate-500">Zero active risk violations. All orders approved.</div>
          )}
        </div>
      </div>
    </div>
  );
}
