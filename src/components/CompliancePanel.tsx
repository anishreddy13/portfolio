"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, AlertOctagon, CheckCircle2, XCircle, Ban, Lock, Sliders, ArrowRight } from "lucide-react";
import { useCompliance, ComplianceDecisionData } from "@/hooks/useCompliance";

function severityBadge(sev: string) {
  if (sev === "CRITICAL") return "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold";
  if (sev === "HIGH") return "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold";
  return "bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold";
}

export default function CompliancePanel() {
  const {
    rules,
    restrictedSecurities,
    auditHistory,
    limits,
    activeViolations,
    approvedCount,
    rejectedCount,
    approveDecision,
    rejectDecision,
  } = useCompliance();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-lime-400" />
            Enterprise Pre-Trade Compliance Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-Trade Mandate Validation • Restricted Securities Gate • IPS Limits & Audit Trail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30">
            Passed: <strong className="text-white">{approvedCount}</strong>
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            Blocked: <strong className="text-white">{rejectedCount}</strong>
          </span>
        </div>
      </div>

      {/* Compliance Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-lime-500/30">
          <div className="text-slate-400 text-[11px] mb-1">Compliance Status</div>
          <div className="text-lg font-bold text-lime-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-lime-400" />
            ACTIVE
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Active Rules</div>
          <div className="text-lg font-bold text-white">{rules.length} Mandates</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Restricted Assets</div>
          <div className="text-lg font-bold text-amber-400">{restrictedSecurities.length} Symbols</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Active Violations</div>
          <div className={`text-lg font-bold ${activeViolations.length > 0 ? "text-rose-400" : "text-lime-400"}`}>
            {activeViolations.length} Detected
          </div>
        </div>
      </div>

      {/* Exposure & Policy Limits Bar */}
      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-lime-400" />
          Mandatory Pre-Trade Exposure Limits
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
          <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/40">
            <span className="text-slate-400">Max Single Position</span>
            <div className="text-white font-bold">{limits.maxPositionSizePct}% Equity</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/40">
            <span className="text-slate-400">Max Sector Exposure</span>
            <div className="text-white font-bold">{limits.maxSectorExposurePct}% Equity</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/40">
            <span className="text-slate-400">Min Cash Reserve</span>
            <div className="text-white font-bold">{limits.minCashReservePct}% Cash</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/40">
            <span className="text-slate-400">Max Gross Leverage</span>
            <div className="text-white font-bold">{limits.maxGrossLeverage}x Leverage</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/40">
            <span className="text-slate-400">Wash-Sale Lockout</span>
            <div className="text-amber-400 font-bold">30 Days Window</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/40">
            <span className="text-slate-400">ESG Minimum Score</span>
            <div className="text-lime-400 font-bold">50 / 100</div>
          </div>
        </div>
      </div>

      {/* Restricted Securities List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Ban className="w-3.5 h-3.5 text-rose-400" />
          Restricted & Embargoed Securities List
        </h3>
        <div className="space-y-2">
          {restrictedSecurities.map((item) => (
            <div key={item.symbol} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-3">
                <span className="font-bold text-rose-400 text-xs px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 font-mono">
                  {item.symbol}
                </span>
                <span className="text-white font-semibold">{item.reason}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-slate-400">Since {item.restrictedSince}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono font-bold">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Evaluation Audit History */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-sky-400" />
          Pre-Trade Compliance Audit Trail
        </h3>
        <div className="space-y-2">
          {auditHistory.map((item: ComplianceDecisionData) => (
            <div
              key={item.decisionId}
              className={`p-3.5 rounded-xl border space-y-2 text-[11px] ${
                item.isCompliant
                  ? "bg-slate-950/60 border-slate-800/60"
                  : "bg-rose-950/30 border-rose-800/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.isCompliant ? (
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-bold text-white">{item.symbol}</span>
                  <span className={`font-bold ${item.direction === "BUY" ? "text-lime-400" : "text-rose-400"}`}>
                    {item.direction}
                  </span>
                  <span className="text-slate-400">Alloc: {item.allocationId}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.isCompliant ? "bg-lime-500/10 text-lime-400 border border-lime-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"}`}>
                    {item.isCompliant ? "COMPLIANT" : "BLOCKED"}
                  </span>
                  <button
                    onClick={() => (item.isCompliant ? rejectDecision(item.decisionId) : approveDecision(item.decisionId))}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {item.isCompliant ? "Override Reject" : "Override Approve"}
                  </button>
                </div>
              </div>

              {/* Violations detail if any */}
              {item.violations.length > 0 && (
                <div className="pt-2 border-t border-rose-800/40 space-y-1">
                  {item.violations.map((v) => (
                    <div key={v.violationId} className="flex items-start gap-2 text-rose-300 text-[10px]">
                      <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                      <span><strong>{v.ruleName}:</strong> {v.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
