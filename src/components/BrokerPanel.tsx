"use client";

import React from "react";
import {
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  PieChart,
  ListOrdered,
  Wifi,
  ShieldCheck,
} from "lucide-react";
import { useBroker } from "@/hooks/useBroker";

export default function BrokerPanel() {
  const {
    activeBroker,
    switchBroker,
    account,
    positions,
    orders,
    connectionStatus,
    isReconnecting,
    reconnect,
  } = useBroker();

  const BROKERS = ["Alpaca Markets", "Interactive Brokers", "Tradier Brokerage", "Paper Trading"];

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 font-mono text-xs space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white leading-none">BROKER CONNECTIVITY ENGINE</h3>
            <p className="text-[10px] text-slate-400 leading-tight">Multi-Broker REST & WebSocket Gateway Adapter</p>
          </div>
        </div>

        {/* Broker Switcher Dropdown / Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {BROKERS.map((b) => (
            <button
              key={b}
              onClick={() => switchBroker(b)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                activeBroker === b
                  ? "bg-sky-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {b.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Reconnect Button */}
        <button
          onClick={() => reconnect()}
          disabled={isReconnecting}
          className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-sky-400 transition font-bold text-[10px] flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? "animate-spin text-amber-400" : ""}`} />
          <span>{isReconnecting ? "Reconnecting..." : "Reconnect"}</span>
        </button>
      </div>

      {/* Connection & Account Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Connection Status Card */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>CONNECTION STATUS</span>
            <Wifi className="w-3.5 h-3.5 text-lime-400" />
          </div>
          <div className="flex items-center gap-1.5 font-bold text-lime-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            {connectionStatus.status}
          </div>
          <p className="text-[9px] text-slate-500">Latency: {connectionStatus.latencyMs}ms ({connectionStatus.health})</p>
        </div>

        {/* Total Equity Card */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Account Equity</span>
          <div className="font-bold text-white text-sm">${account.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <p className="text-[9px] text-slate-500">Account: {account.accountId}</p>
        </div>

        {/* Buying Power Card */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Buying Power</span>
          <div className="font-bold text-sky-400 text-sm">${account.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <p className="text-[9px] text-slate-500">Cash: ${account.cashBalance.toLocaleString()}</p>
        </div>

        {/* Margin Used Card */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Margin Used</span>
          <div className="font-bold text-amber-400 text-sm">${account.marginUsed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <p className="text-[9px] text-slate-500">Currency: {account.currency}</p>
        </div>
      </div>

      {/* Open Positions & Open Orders Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Open Positions */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-white border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1">
              <PieChart className="w-3.5 h-3.5 text-sky-400" /> Open Positions ({positions.length})
            </span>
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1">
            {positions.map((p) => (
              <div key={p.symbol} className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-bold text-white">{p.symbol}</span>
                  <span className="text-[9px] text-slate-500 ml-2">{p.quantity} shares @ ${p.avgEntryPrice.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">${p.marketValue.toFixed(2)}</div>
                  <div className={p.unrealizedPnl >= 0 ? "text-lime-400 font-bold text-[9px]" : "text-rose-400 font-bold text-[9px]"}>
                    {p.unrealizedPnl >= 0 ? "+" : ""}${p.unrealizedPnl.toFixed(2)} ({p.pnlPct >= 0 ? "+" : ""}{p.pnlPct.toFixed(2)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open Orders */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-white border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1">
              <ListOrdered className="w-3.5 h-3.5 text-amber-400" /> Open Orders ({orders.length})
            </span>
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1">
            {orders.map((o) => (
              <div key={o.brokerOrderId} className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">{o.symbol}</span>
                    <span className={`text-[9px] px-1 rounded font-bold ${o.side === "BUY" ? "bg-lime-500/10 text-lime-400" : "bg-rose-500/10 text-rose-400"}`}>
                      {o.side}
                    </span>
                    <span className="text-[9px] text-slate-400">{o.orderType}</span>
                  </div>
                  <span className="text-[9px] text-slate-500">Qty: {o.quantity} @ ${o.price.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${o.status === "FILLED" ? "bg-lime-500/10 text-lime-400 border border-lime-500/30" : "bg-sky-500/10 text-sky-400 border border-sky-500/30"}`}>
                    {o.status}
                  </span>
                  <div className="text-[9px] text-slate-500 mt-1">{o.submittedAt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
