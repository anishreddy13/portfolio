"use client";

import React, { useState } from "react";
import { Server, Zap, CheckCircle2, Clock, Layers, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useExecution } from "@/hooks/useExecution";

export default function ExecutionPanel() {
  const { reports, statistics } = useExecution();
  const [activeTab, setActiveTab] = useState<"reports" | "fills">("reports");

  const allFills = reports.flatMap((r) => r.fills);

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-lime-400" />
            Enterprise Execution Management System (EMS)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Single Source of Execution • Smart Venue Routing • Real-Time Order Fills & Latency Audit
          </p>
        </div>

        <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === "reports" ? "bg-slate-800 text-white font-bold" : "text-slate-400"
            }`}
          >
            Executions ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab("fills")}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === "fills" ? "bg-slate-800 text-white font-bold" : "text-slate-400"
            }`}
          >
            Venue Fills ({allFills.length})
          </button>
        </div>
      </div>

      {/* EMS Operational Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Total Requests</div>
          <div className="text-lg font-bold text-white">{statistics.totalRequests}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Avg EMS Latency</div>
          <div className="text-lg font-bold text-lime-400">{statistics.averageLatencyMs} ms</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Partial Fills</div>
          <div className="text-lg font-bold text-amber-400">{statistics.partialFills}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Total EMS Volume</div>
          <div className="text-lg font-bold text-sky-400">${statistics.totalVolume.toLocaleString()}</div>
        </div>
      </div>

      {/* Reports / Fills Table */}
      {activeTab === "reports" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Report ID</th>
                <th className="pb-3 font-medium">Symbol</th>
                <th className="pb-3 font-medium">Side</th>
                <th className="pb-3 font-medium">Filled / Total</th>
                <th className="pb-3 font-medium">Avg Price</th>
                <th className="pb-3 font-medium">Route Venue</th>
                <th className="pb-3 font-medium">Latency</th>
                <th className="pb-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {reports.map((r) => {
                const rem = r.quantity - r.filledQuantity;
                return (
                  <tr key={r.reportId} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 text-slate-400 font-bold">{r.reportId}</td>
                    <td className="py-2.5 font-bold text-white">{r.symbol}</td>
                    <td className="py-2.5 text-lime-400 font-bold">{r.side}</td>
                    <td className="py-2.5 text-slate-300">
                      {r.filledQuantity} / {r.quantity} {rem > 0 && <span className="text-amber-400 text-[10px]">({rem} left)</span>}
                    </td>
                    <td className="py-2.5 text-slate-200">${r.avgFillPrice.toFixed(2)}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px]">
                        {r.venueRoute}
                      </span>
                    </td>
                    <td className="py-2.5 text-lime-400">{r.latencyMs} ms</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          r.status === "FILLED"
                            ? "bg-lime-500/10 text-lime-400"
                            : r.status === "PARTIALLY_FILLED"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Fill ID</th>
                <th className="pb-3 font-medium">Execution ID</th>
                <th className="pb-3 font-medium">Symbol</th>
                <th className="pb-3 font-medium">Qty</th>
                <th className="pb-3 font-medium">Fill Price</th>
                <th className="pb-3 font-medium">Venue</th>
                <th className="pb-3 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {allFills.map((f) => (
                <tr key={f.fillId} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 text-slate-400 font-bold">{f.fillId}</td>
                  <td className="py-2.5 text-slate-400">{f.executionId}</td>
                  <td className="py-2.5 font-bold text-white">{f.symbol}</td>
                  <td className="py-2.5 text-slate-300">{f.quantity}</td>
                  <td className="py-2.5 font-bold text-lime-400">${f.price.toFixed(2)}</td>
                  <td className="py-2.5 text-sky-400">{f.venue}</td>
                  <td className="py-2.5 text-right text-slate-500">{f.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
