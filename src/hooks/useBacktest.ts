"use client";

import { useState, useCallback } from "react";

export interface EquityPoint {
  timestamp: string;
  equity: number;
  drawdownPct: number;
}

export interface BacktestTradeItem {
  tradeId: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  pnl: number;
  pnlPct: number;
}

export interface BacktestMetricsData {
  totalReturnPct: number;
  cagr: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  expectancy: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
}

const SAMPLE_EQUITY_CURVE: EquityPoint[] = [
  { timestamp: "2024-01-01", equity: 100000.0, drawdownPct: 0.0 },
  { timestamp: "2024-02-01", equity: 102450.0, drawdownPct: 0.0 },
  { timestamp: "2024-03-01", equity: 101800.0, drawdownPct: 0.63 },
  { timestamp: "2024-04-01", equity: 106200.0, drawdownPct: 0.0 },
  { timestamp: "2024-05-01", equity: 108900.0, drawdownPct: 0.0 },
  { timestamp: "2024-06-01", equity: 107500.0, drawdownPct: 1.28 },
  { timestamp: "2024-07-01", equity: 112400.0, drawdownPct: 0.0 },
  { timestamp: "2024-08-01", equity: 115800.0, drawdownPct: 0.0 },
  { timestamp: "2024-09-01", equity: 118450.0, drawdownPct: 0.0 },
];

const SAMPLE_TRADES: BacktestTradeItem[] = [
  { tradeId: "bt-1", symbol: "AAPL", side: "BUY", quantity: 50, entryPrice: 175.0, exitPrice: 182.5, entryTime: "2024-01-10", exitTime: "2024-02-15", pnl: 375.0, pnlPct: 4.29 },
  { tradeId: "bt-2", symbol: "AAPL", side: "BUY", quantity: 50, entryPrice: 180.0, exitPrice: 188.0, entryTime: "2024-03-01", exitTime: "2024-04-10", pnl: 400.0, pnlPct: 4.44 },
  { tradeId: "bt-3", symbol: "AAPL", side: "BUY", quantity: 50, entryPrice: 186.0, exitPrice: 184.0, entryTime: "2024-05-15", exitTime: "2024-06-01", pnl: -100.0, pnlPct: -1.08 },
  { tradeId: "bt-4", symbol: "AAPL", side: "BUY", quantity: 50, entryPrice: 185.0, exitPrice: 195.0, entryTime: "2024-06-15", exitTime: "2024-08-01", pnl: 500.0, pnlPct: 5.41 },
];

export function useBacktest(defaultSymbol: string = "AAPL") {
  const [strategy, setStrategy] = useState("EMA_Crossover");
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [timeframe, setTimeframe] = useState("1d");
  const [initialCash, setInitialCash] = useState(100000);

  const [isBacktesting, setIsBacktesting] = useState(false);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>(SAMPLE_EQUITY_CURVE);
  const [trades, setTrades] = useState<BacktestTradeItem[]>(SAMPLE_TRADES);

  const [metrics, setMetrics] = useState<BacktestMetricsData>({
    totalReturnPct: 18.45,
    cagr: 18.45,
    sharpeRatio: 1.85,
    sortinoRatio: 2.35,
    maxDrawdownPct: 1.28,
    winRatePct: 75.0,
    profitFactor: 12.75,
    expectancy: 293.75,
    totalTrades: 4,
    winningTrades: 3,
    losingTrades: 1,
  });

  const runBacktest = useCallback(() => {
    setIsBacktesting(true);
    setTimeout(() => {
      // Simulate historical backtest execution
      const newEquity = Number((initialCash * (1 + (0.12 + Math.random() * 0.12))).toFixed(2));
      const totalRet = Number((((newEquity - initialCash) / initialCash) * 100).toFixed(2));
      const winRate = Number((65 + Math.random() * 20).toFixed(1));
      const sharpe = Number((1.5 + Math.random() * 0.8).toFixed(2));
      const maxDD = Number((1.0 + Math.random() * 3.5).toFixed(2));

      setMetrics({
        totalReturnPct: totalRet,
        cagr: totalRet,
        sharpeRatio: sharpe,
        sortinoRatio: Number((sharpe * 1.3).toFixed(2)),
        maxDrawdownPct: maxDD,
        winRatePct: winRate,
        profitFactor: Number((2.5 + Math.random() * 2).toFixed(2)),
        expectancy: Number((150 + Math.random() * 200).toFixed(2)),
        totalTrades: 12,
        winningTrades: Math.floor(12 * (winRate / 100)),
        losingTrades: 12 - Math.floor(12 * (winRate / 100)),
      });

      setIsBacktesting(false);
    }, 800);
  }, [initialCash]);

  return {
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
  };
}
