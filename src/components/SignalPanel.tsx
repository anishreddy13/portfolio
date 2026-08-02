"use client";

import React from "react";
import { Zap, ArrowUpRight, ArrowDownRight, MinusCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useSignals, SignalItem } from "@/hooks/useSignals";

function directionIcon(dir: string) {
  if (dir === "BUY") return <ArrowUpRight className="w-3.5 h-3.5 text-lime-400" />;
  if (dir === "SELL") return <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />;
  return <MinusCircle className="w-3.5 h-3.5 text-slate-400" />;
}

function directionColor(dir: string) {
  if (dir === "BUY") return "text-lime-400";
  if (dir === "SELL") return "text-rose-400";
  return "text-slate-400";
}

function strengthBadge(level: string) {
  if (level === "STRONG_CONVICTION")
    return "bg-lime-500/10 text-lime-400 border-lime-500/30";
  if (level === "MODERATE")
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  return "bg-slate-800/60 text-slate-400 border-slate-700/40";
}

export default function SignalPanel() {
  const { signals } = useSignals();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-lime-400" />
            Enterprise Signal Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Signal Generation • Strength Scoring • Conflict Resolution • TTL Expiry
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30">
          {signals.length} Active Signals
        </span>
      </div>

      {/* Signal Cards */}
      <div className="space-y-3">
        {signals.map((sig: SignalItem) => (
          <div
            key={sig.signalId}
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/60 space-y-3"
          >
            {/* Row 1: Symbol, Direction, Source */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {directionIcon(sig.direction)}
                <span className="font-bold text-white text-sm">{sig.symbol}</span>
                <span className={`font-bold text-sm ${directionColor(sig.direction)}`}>
                  {sig.direction}
                </span>
                <span className="text-slate-500">via</span>
                <span className="text-sky-400 font-semibold">{sig.source}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${strengthBadge(sig.strengthLevel)}`}>
                  {sig.strengthLevel.replace("_", " ")}
                </span>
                {sig.isApproved ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
            </div>

            {/* Row 2: Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">Strength</span>
                <div className="text-white font-bold">{(sig.strengthValue * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span className="text-slate-500">Confidence</span>
                <div className="text-sky-400 font-bold">{sig.confidencePct}%</div>
              </div>
              <div>
                <span className="text-slate-500">Entry</span>
                <div className="text-white font-bold">${sig.suggestedPrice.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-slate-500">SL / TP</span>
                <div className="text-white font-bold">
                  ${sig.stopLoss.toFixed(1)} / ${sig.takeProfit.toFixed(1)}
                </div>
              </div>
              <div>
                <span className="text-slate-500">TTL</span>
                <div className="text-amber-400 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {sig.ttlSec}s
                </div>
              </div>
            </div>

            {/* Row 3: Conflict + Timestamp */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/40">
              <span>
                Conflict:{" "}
                <strong className={sig.isConflictResolved ? "text-lime-400" : "text-amber-400"}>
                  {sig.isConflictResolved ? "Resolved" : "Pending"}
                </strong>
              </span>
              <span>{sig.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
