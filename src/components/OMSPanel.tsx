"use client";

import React, { useState } from "react";
import { GitMerge, Layers, Clock, CheckCircle2, ShieldCheck, GitCommit, FileText, XCircle } from "lucide-react";
import { useOMS } from "@/hooks/useOMS";

export default function OMSPanel() {
  const { orders, auditLogs, cancelOrder } = useOMS();
  const [activeTab, setActiveTab] = useState<"orders" | "audit">("orders");

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-lime-400" />
            Enterprise Order Management System (OMS)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Owns Full Order Lifecycle • Parent/Child Order Slicing • Complex Brackets & Audit Timeline
          </p>
        </div>

        <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === "orders" ? "bg-slate-800 text-white font-bold" : "text-slate-400"
            }`}
          >
            Parent Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === "audit" ? "bg-slate-800 text-white font-bold" : "text-slate-400"
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Orders / Audit Table */}
      {activeTab === "orders" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Parent ID</th>
                <th className="pb-3 font-medium">Symbol</th>
                <th className="pb-3 font-medium">Side</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Qty (Child Slices)</th>
                <th className="pb-3 font-medium">Fill Price</th>
                <th className="pb-3 font-medium">Lifecycle State</th>
                <th className="pb-3 font-medium text-right">Action / Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {orders.map((o) => (
                <tr key={o.parentId} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 text-slate-400 font-bold">{o.parentId}</td>
                  <td className="py-3 font-bold text-white">{o.symbol}</td>
                  <td className="py-3 text-lime-400 font-bold">{o.side}</td>
                  <td className="py-3 text-slate-300">{o.orderType}</td>
                  <td className="py-3 text-slate-300">
                    {o.filledQuantity} / {o.quantity}{" "}
                    <span className="text-slate-500 text-[10px]">({o.childOrders.length} child slices)</span>
                  </td>
                  <td className="py-3 text-slate-200">
                    {o.avgFillPrice > 0 ? `$${o.avgFillPrice.toFixed(2)}` : "Market"}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        o.status === "FILLED"
                          ? "bg-lime-500/10 text-lime-400 border border-lime-500/30"
                          : o.status === "APPROVED"
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {o.status !== "FILLED" && o.status !== "CANCELLED" ? (
                      <button
                        onClick={() => cancelOrder(o.parentId)}
                        className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition text-[10px]"
                      >
                        Cancel Order
                      </button>
                    ) : (
                      <span className="text-slate-500">{o.timestamp}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Audit ID</th>
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">State Transition</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {auditLogs.map((a) => (
                <tr key={a.entryId} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 text-slate-400 font-bold">{a.entryId}</td>
                  <td className="py-2.5 text-slate-300">{a.orderId}</td>
                  <td className="py-2.5 text-amber-400 font-bold">
                    {a.fromState} → {a.toState}
                  </td>
                  <td className="py-2.5 text-slate-300">{a.description}</td>
                  <td className="py-2.5 text-right text-slate-500">{a.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
