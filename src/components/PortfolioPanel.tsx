"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Plus,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";

export default function PortfolioPanel() {
  const { portfolio, addPosition, closePosition } = usePortfolio();

  const [symbolInput, setSymbolInput] = useState("");
  const [qtyInput, setQtyInput] = useState("10");
  const [priceInput, setPriceInput] = useState("150.00");
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbolInput.trim()) return;
    addPosition(symbolInput.trim(), parseFloat(qtyInput), parseFloat(priceInput));
    setSymbolInput("");
    setShowAddModal(false);
  };

  const isDailyPos = portfolio.dailyChange >= 0;
  const isUnrealizedPos = portfolio.unrealizedPnL >= 0;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 space-y-6">
      {/* Header & Primary Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
            <Wallet className="w-5 h-5 text-lime-400" />
            Enterprise Portfolio & Holdings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mark-to-Market Valuations • Real-Time P&L Accounting • Risk Score: {portfolio.riskScore}/100
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-slate-950 font-medium text-xs rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Holding
        </button>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Total Equity</div>
          <div className="text-lg font-bold text-white">${portfolio.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Cash Balance</div>
          <div className="text-lg font-bold text-slate-200">${portfolio.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Unrealized P&L</div>
          <div className={`text-lg font-bold ${isUnrealizedPos ? "text-lime-400" : "text-rose-400"}`}>
            {isUnrealizedPos ? "+" : ""}${portfolio.unrealizedPnL.toFixed(2)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Realized P&L</div>
          <div className="text-lg font-bold text-sky-400">+${portfolio.realizedPnL.toFixed(2)}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 col-span-2 sm:col-span-1">
          <div className="text-slate-400 text-[11px] mb-1">Today's Change</div>
          <div className={`text-lg font-bold flex items-center gap-1 ${isDailyPos ? "text-lime-400" : "text-rose-400"}`}>
            {isDailyPos ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {portfolio.dailyChangePct}%
          </div>
        </div>
      </div>

      {/* Allocation Breakdown Bar */}
      <div>
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-lime-400" />
            Portfolio Allocation Breakdown
          </span>
          <span>Cash: {((portfolio.cashBalance / portfolio.totalEquity) * 100).toFixed(1)}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-950 overflow-hidden flex gap-0.5 border border-slate-800">
          {portfolio.allocations.map((alloc, idx) => {
            const colors = ["bg-lime-400", "bg-sky-400", "bg-amber-400", "bg-purple-400", "bg-emerald-400"];
            return (
              <div
                key={alloc.symbol}
                style={{ width: `${alloc.percentage}%` }}
                className={`h-full ${colors[idx % colors.length]}`}
                title={`${alloc.symbol}: ${alloc.percentage}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Gainers & Losers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60">
          <div className="text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-lime-400" />
            Top Gainers
          </div>
          <div className="space-y-2">
            {portfolio.topGainers.map((g) => (
              <div key={g.symbol} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-white">{g.symbol}</span>
                <span className="text-lime-400 font-bold">+{g.unrealizedPnLPct}% (+${g.unrealizedPnL})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60">
          <div className="text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            Top Losers / Underperformers
          </div>
          <div className="space-y-2">
            {portfolio.topLosers.length > 0 ? (
              portfolio.topLosers.map((l) => (
                <div key={l.symbol} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white">{l.symbol}</span>
                  <span className="text-rose-400 font-bold">{l.unrealizedPnLPct}% (${l.unrealizedPnL})</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs p-2">All positions currently in profit.</div>
            )}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 font-mono">Active Holdings ({portfolio.positions.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Symbol</th>
                <th className="pb-3 font-medium">Quantity</th>
                <th className="pb-3 font-medium">Avg Cost</th>
                <th className="pb-3 font-medium">Mark Price</th>
                <th className="pb-3 font-medium">Market Value</th>
                <th className="pb-3 font-medium">Unrealized P&L</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {portfolio.positions.map((p) => {
                const isPos = p.unrealizedPnL >= 0;
                return (
                  <tr key={p.symbol} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-bold text-white">{p.symbol}</td>
                    <td className="py-3 text-slate-300">{p.quantity}</td>
                    <td className="py-3 text-slate-300">${p.avgCostPrice.toFixed(2)}</td>
                    <td className="py-3 text-lime-400">${p.currentPrice.toFixed(2)}</td>
                    <td className="py-3 text-white">${p.marketValue.toFixed(2)}</td>
                    <td className={`py-3 font-bold ${isPos ? "text-lime-400" : "text-rose-400"}`}>
                      {isPos ? "+" : ""}${p.unrealizedPnL.toFixed(2)} ({p.unrealizedPnLPct}%)
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => closePosition(p.symbol)}
                        className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition text-[11px]"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Position Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add New Holding Position</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Ticker Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. GOOGL"
                  value={symbolInput}
                  onChange={(e) => setSymbolInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-lime-500/50 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Quantity (Shares)</label>
                <input
                  type="number"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-lime-500/50 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Acquisition Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-lime-500/50 text-sm"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-lime-500 text-slate-950 font-bold rounded-xl hover:bg-lime-400 text-xs"
                >
                  Confirm Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
