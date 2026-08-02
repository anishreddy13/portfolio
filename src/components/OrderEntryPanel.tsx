"use client";

import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, DollarSign, Send, CheckCircle2 } from "lucide-react";
import { OrderSide, OrderType, useOrders } from "@/hooks/useOrders";

interface OrderEntryPanelProps {
  activeSymbol?: string;
  currentPrice?: number;
}

export default function OrderEntryPanel({
  activeSymbol = "AAPL",
  currentPrice = 182.5,
}: OrderEntryPanelProps) {
  const { submitOrder } = useOrders();

  const [symbol, setSymbol] = useState(activeSymbol);
  const [side, setSide] = useState<OrderSide>("BUY");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [quantity, setQuantity] = useState<string>("10");
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toFixed(2));
  const [stopPrice, setStopPrice] = useState<string>((currentPrice * 0.98).toFixed(2));
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const qtyNum = parseFloat(quantity) || 0;
  const priceNum = orderType === "LIMIT" ? parseFloat(limitPrice) || currentPrice : currentPrice;
  const estimatedCost = qtyNum * priceNum;
  const simulatedCommission = Math.max(0, qtyNum * 0.0005);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lPrice = orderType === "LIMIT" ? parseFloat(limitPrice) : 0;
    const sPrice = orderType === "STOP" ? parseFloat(stopPrice) : 0;

    const res = submitOrder(symbol, side, orderType, qtyNum, lPrice, sPrice, currentPrice);
    if (res) {
      setSubmittedMessage(`Submitted ${side} order #${res.orderId} for ${qtyNum} ${symbol}`);
      setTimeout(() => setSubmittedMessage(null), 3000);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Send className="w-4 h-4 text-lime-400" />
          Paper Trading Order Entry
        </h2>
        <span className="text-[11px] text-slate-400 font-mono">
          Mark: <strong className="text-lime-400">${currentPrice.toFixed(2)}</strong>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Buy / Sell Toggle Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("BUY")}
            className={`py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              side === "BUY"
                ? "bg-lime-500 text-slate-950 shadow-lg shadow-lime-500/20"
                : "bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            BUY
          </button>
          <button
            type="button"
            onClick={() => setSide("SELL")}
            className={`py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              side === "SELL"
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                : "bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            SELL
          </button>
        </div>

        {/* Order Type Tabs */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          {(["MARKET", "LIMIT", "STOP"] as OrderType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setOrderType(t)}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                orderType === t ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 block mb-1">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-lime-500/50 uppercase"
              required
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-lime-500/50"
              required
            />
          </div>

          {orderType === "LIMIT" && (
            <div>
              <label className="text-slate-400 block mb-1">Limit Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-lime-500/50"
                required
              />
            </div>
          )}

          {orderType === "STOP" && (
            <div>
              <label className="text-slate-400 block mb-1">Stop Trigger Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-lime-500/50"
                required
              />
            </div>
          )}
        </div>

        {/* Estimated Cost Breakdown */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>Estimated Cost:</span>
            <strong className="text-white">${estimatedCost.toFixed(2)}</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Simulated Commission:</span>
            <span className="text-lime-400">${simulatedCommission.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
            side === "BUY" ? "bg-lime-500 hover:bg-lime-400 text-slate-950" : "bg-rose-500 hover:bg-rose-400 text-white"
          }`}
        >
          Submit {orderType} {side} Order
        </button>

        {submittedMessage && (
          <div className="p-2.5 rounded-xl bg-lime-500/10 border border-lime-500/30 text-lime-400 text-center flex items-center justify-center gap-2 text-[11px]">
            <CheckCircle2 className="w-4 h-4" />
            {submittedMessage}
          </div>
        )}
      </form>
    </div>
  );
}
