"use client";

import { useState } from "react";

export interface SignalItem {
  signalId: string;
  symbol: string;
  direction: "BUY" | "SELL" | "HOLD";
  source: string;
  strengthValue: number;
  confidencePct: number;
  strengthLevel: "STRONG_CONVICTION" | "MODERATE" | "WEAK";
  suggestedPrice: number;
  stopLoss: number;
  takeProfit: number;
  ttlSec: number;
  timestamp: string;
  isConflictResolved: boolean;
  isApproved: boolean;
}

const INITIAL_SIGNALS: SignalItem[] = [
  {
    signalId: "sig-501",
    symbol: "AAPL",
    direction: "BUY",
    source: "EMA_CROSSOVER",
    strengthValue: 0.88,
    confidencePct: 92.0,
    strengthLevel: "STRONG_CONVICTION",
    suggestedPrice: 175.0,
    stopLoss: 171.5,
    takeProfit: 182.0,
    ttlSec: 45,
    timestamp: "10:14:00 AM",
    isConflictResolved: false,
    isApproved: true,
  },
  {
    signalId: "sig-502",
    symbol: "MSFT",
    direction: "BUY",
    source: "RSI_MEAN_REVERSION",
    strengthValue: 0.82,
    confidencePct: 88.5,
    strengthLevel: "STRONG_CONVICTION",
    suggestedPrice: 410.0,
    stopLoss: 401.8,
    takeProfit: 426.4,
    ttlSec: 30,
    timestamp: "10:22:15 AM",
    isConflictResolved: true,
    isApproved: true,
  },
  {
    signalId: "sig-503",
    symbol: "NVDA",
    direction: "SELL",
    source: "MACD_MOMENTUM",
    strengthValue: 0.65,
    confidencePct: 75.0,
    strengthLevel: "MODERATE",
    suggestedPrice: 840.0,
    stopLoss: 861.0,
    takeProfit: 798.0,
    ttlSec: 15,
    timestamp: "10:28:40 AM",
    isConflictResolved: false,
    isApproved: false,
  },
];

export function useSignals() {
  const [signals, setSignals] = useState<SignalItem[]>(INITIAL_SIGNALS);

  return {
    signals,
  };
}
