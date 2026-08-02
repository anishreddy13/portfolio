"use client";

import React, { useState } from "react";
import { Clock, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";

export default function OpenOrdersPanel() {
  const { openOrders, completedOrders, cancelOrder } = useOrders();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const displayOrders = activeTab === "pending" ? openOrders : completedOrders;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-lime-400" />
          Order Execution Ledger
        </h2>

        <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === "pending" ? "bg-slate-800 text-white font-bold" : "text-slate-400"
            }`}
          >
            Pending ({openOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === "history" ? "bg-slate-800 text-white font-bold" : "text-slate-400"
            }`}
          >
            Completed ({completedOrders.length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 font-medium">Order ID</th>
              <th className="pb-3 font-medium">Symbol</th>
              <th className="pb-3 font-medium">Side</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Qty</th>
              <th className="pb-3 font-medium">Price</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Action / Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {displayOrders.length > 0 ? (
              displayOrders.map((o) => (
                <tr key={o.orderId} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 text-slate-400 font-bold">{o.orderId}</td>
                  <td className="py-3 font-bold text-white">{o.symbol}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.side === "BUY" ? "bg-lime-500/10 text-lime-400 border border-lime-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"}`}>
                      {o.side}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{o.orderType}</td>
                  <td className="py-3 text-slate-300">{o.quantity}</td>
                  <td className="py-3 text-slate-200">
                    {o.avgFillPrice > 0 ? `$${o.avgFillPrice.toFixed(2)}` : o.limitPrice > 0 ? `$${o.limitPrice.toFixed(2)} (Limit)` : o.stopPrice > 0 ? `$${o.stopPrice.toFixed(2)} (Stop)` : "Market"}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${o.status === "FILLED" ? "bg-sky-500/10 text-sky-400" : o.status === "PENDING" ? "bg-amber-500/10 text-amber-400" : "bg-slate-800 text-slate-400"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {activeTab === "pending" && o.status === "PENDING" ? (
                      <button
                        onClick={() => cancelOrder(o.orderId)}
                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition flex items-center gap-1 ml-auto text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" />
                        Cancel
                      </button>
                    ) : (
                      <span className="text-slate-500">{o.createdAt}</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-500">
                  No {activeTab} orders recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
