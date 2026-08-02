"use client";

import React from "react";
import {
  Play,
  TrendingUp,
  Award,
  ShieldAlert,
  BarChart2,
  Calendar,
  Layers,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useBacktest } from "@/hooks/useBacktest";

interface BacktestPanelProps {
  activeSymbol?: string;
}

export default function BacktestPanel({ activeSymbol = "AAPL" }: BacktestPanelProps) {
  const {
    strategy,
    setStrategy,
    symbol,
    setSymbol,
    timeframe,
    setTimeframe,
    initialCash,
    setInitialCash,
    isBacktesting,
    equityCurve,
    trades,
    metrics,
    runBacktest,
  } = useBacktest(activeSymbol);

  const isPosReturn = metrics.totalReturnPct >= 0;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-lime-400" />
            Quantitative Backtesting Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Candle-by-Candle Simulation • RequestCoordinator Cache Data • Institutional Performance Metrics
          </p>
        </div>

        <button
          onClick={runBacktest}
          disabled={isBacktesting}
          className="px-5 py-2.5 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-2 text-xs shadow-lg shadow-lime-500/20 disabled:opacity-50"
        >
          {isBacktesting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              Simulating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
              Run Backtest
            </>
          )}
        </button>
      </div>

      {/* Control Inputs Form */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-slate-400 block mb-1">Strategy</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-lime-500/50"
          >
            <option value="EMA_Crossover">20/50 EMA Crossover</option>
            <option value="RSI_MeanReversion">RSI Mean Reversion (30/70)</option>
            <option value="MACD_Momentum">MACD Trend Momentum</option>
            <option value="Bollinger_Breakout">Bollinger Band Breakout</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-lime-500/50 uppercase"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-lime-500/50"
          >
            <option value="1d">1 Day (Daily)</option>
            <option value="1h">1 Hour</option>
            <option value="15m">15 Minutes</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Initial Cash ($)</label>
          <input
            type="number"
            value={initialCash}
            onChange={(e) => setInitialCash(parseFloat(e.target.value) || 100000)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-lime-500/50"
          />
        </div>
      </div>

      {/* Metrics Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Total Return / CAGR</div>
          <div className={`text-lg font-bold ${isPosReturn ? "text-lime-400" : "text-rose-400"}`}>
            {isPosReturn ? "+" : ""}{metrics.totalReturnPct}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Sharpe Ratio</div>
          <div className="text-lg font-bold text-sky-400">{metrics.sharpeRatio}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Win Rate</div>
          <div className="text-lg font-bold text-amber-400">{metrics.winRatePct}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Max Drawdown</div>
          <div className="text-lg font-bold text-rose-400">-{metrics.maxDrawdownPct}%</div>
        </div>
      </div>

      {/* Equity Curve Visualizer */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-lime-400" />
            Historical Equity Curve Simulation
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            Peak: ${Math.max(...equityCurve.map((e) => e.equity)).toLocaleString()}
          </span>
        </div>

        <div className="h-28 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-800">
          {equityCurve.map((point, idx) => {
            const minEq = 95000;
            const maxEq = 125000;
            const heightPct = Math.min(100, Math.max(15, ((point.equity - minEq) / (maxEq - minEq)) * 100));

            return (
              <div
                key={idx}
                className="flex-1 bg-lime-500/30 hover:bg-lime-400 rounded-t transition-all relative group cursor-pointer"
                style={{ height: `${heightPct}%` }}
              >
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-slate-900 border border-slate-700 text-[10px] text-white rounded whitespace-nowrap z-10 font-mono">
                  {point.timestamp}: ${point.equity.toLocaleString()} (DD: -{point.drawdownPct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trade Log Table */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-lime-400" />
          Backtest Trade Log ({trades.length} Executions)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Trade ID</th>
                <th className="pb-3 font-medium">Symbol</th>
                <th className="pb-3 font-medium">Side</th>
                <th className="pb-3 font-medium">Entry Price</th>
                <th className="pb-3 font-medium">Exit Price</th>
                <th className="pb-3 font-medium">P&L ($)</th>
                <th className="pb-3 font-medium text-right">P&L (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {trades.map((t) => {
                const isWin = t.pnl >= 0;
                return (
                  <tr key={t.tradeId} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 text-slate-400 font-bold">{t.tradeId}</td>
                    <td className="py-2.5 font-bold text-white">{t.symbol}</td>
                    <td className="py-2.5 text-lime-400">{t.side}</td>
                    <td className="py-2.5 text-slate-300">${t.entryPrice.toFixed(2)}</td>
                    <td className="py-2.5 text-slate-300">${t.exitPrice.toFixed(2)}</td>
                    <td className={`py-2.5 font-bold ${isWin ? "text-lime-400" : "text-rose-400"}`}>
                      {isWin ? "+" : ""}${t.pnl.toFixed(2)}
                    </td>
                    <td className={`py-2.5 text-right font-bold ${isWin ? "text-lime-400" : "text-rose-400"}`}>
                      {isWin ? "+" : ""}{t.pnlPct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
