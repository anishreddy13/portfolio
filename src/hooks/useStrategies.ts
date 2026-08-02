"use client";

import { useState, useCallback } from "react";

export interface StrategyPluginItem {
  name: string;
  category: string;
  description: string;
  isActive: boolean;
  parameters: Record<string, any>;
  riskPerTradePct: number;
  lastSignal: {
    type: "BUY" | "SELL" | "HOLD";
    strength: number;
    timestamp: string;
  };
}

const INITIAL_STRATEGIES: StrategyPluginItem[] = [
  {
    name: "EMA_Crossover",
    category: "Trend Following",
    description: "Emits BUY when 20 EMA crosses above 50 EMA; emits SELL on downward crossover.",
    isActive: true,
    parameters: { fastPeriod: 20, slowPeriod: 50 },
    riskPerTradePct: 2.0,
    lastSignal: { type: "BUY", strength: 0.85, timestamp: "10:15 AM" },
  },
  {
    name: "RSI_MeanReversion",
    category: "Mean Reversion",
    description: "Emits BUY when RSI < 30 (oversold); emits SELL when RSI > 70 (overbought).",
    isActive: true,
    parameters: { oversold: 30, overbought: 70 },
    riskPerTradePct: 1.5,
    lastSignal: { type: "HOLD", strength: 0.0, timestamp: "10:20 AM" },
  },
  {
    name: "MACD_Momentum",
    category: "Momentum",
    description: "Emits BUY when MACD line crosses above Signal line with volume confirmation.",
    isActive: true,
    parameters: { fast: 12, slow: 26, signal: 9 },
    riskPerTradePct: 2.5,
    lastSignal: { type: "BUY", strength: 0.88, timestamp: "10:25 AM" },
  },
  {
    name: "Bollinger_Breakout",
    category: "Volatility Breakout",
    description: "Emits BUY when price closes above upper Bollinger Band.",
    isActive: false,
    parameters: { period: 20, stdDev: 2.0 },
    riskPerTradePct: 2.0,
    lastSignal: { type: "SELL", strength: 0.80, timestamp: "10:28 AM" },
  },
];

export function useStrategies() {
  const [strategies, setStrategies] = useState<StrategyPluginItem[]>(INITIAL_STRATEGIES);

  const toggleStrategy = useCallback((name: string) => {
    setStrategies((prev) =>
      prev.map((s) => (s.name === name ? { ...s, isActive: !s.isActive } : s))
    );
  }, []);

  const updateParameters = useCallback((name: string, newParams: Record<string, any>) => {
    setStrategies((prev) =>
      prev.map((s) => (s.name === name ? { ...s, parameters: { ...s.parameters, ...newParams } } : s))
    );
  }, []);

  return {
    strategies,
    toggleStrategy,
    updateParameters,
  };
}
