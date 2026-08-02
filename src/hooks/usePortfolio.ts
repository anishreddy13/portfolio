"use client";

import { useState, useEffect, useCallback } from "react";

export interface PositionHolding {
  symbol: string;
  quantity: number;
  avgCostPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  marketValue: number;
  allocationPct: number;
}

export interface AllocationItem {
  symbol: string;
  marketValue: number;
  percentage: number;
}

export interface PortfolioSummary {
  totalEquity: number;
  cashBalance: number;
  unrealizedPnL: number;
  realizedPnL: number;
  dailyChange: number;
  dailyChangePct: number;
  riskScore: number;
  positions: PositionHolding[];
  allocations: AllocationItem[];
  topGainers: PositionHolding[];
  topLosers: PositionHolding[];
}

const INITIAL_POSITIONS: PositionHolding[] = [
  { symbol: "AAPL", quantity: 50, avgCostPrice: 175.0, currentPrice: 182.5, unrealizedPnL: 375.0, unrealizedPnLPct: 4.29, marketValue: 9125.0, allocationPct: 8.5 },
  { symbol: "MSFT", quantity: 25, avgCostPrice: 410.0, currentPrice: 415.2, unrealizedPnL: 130.0, unrealizedPnLPct: 1.27, marketValue: 10380.0, allocationPct: 9.7 },
  { symbol: "NVDA", quantity: 10, avgCostPrice: 850.0, currentPrice: 875.4, unrealizedPnL: 254.0, unrealizedPnLPct: 2.99, marketValue: 8754.0, allocationPct: 8.1 },
  { symbol: "TSLA", quantity: 20, avgCostPrice: 180.0, currentPrice: 178.1, unrealizedPnL: -38.0, unrealizedPnLPct: -1.06, marketValue: 3562.0, allocationPct: 3.3 },
  { symbol: "AMZN", quantity: 15, avgCostPrice: 172.0, currentPrice: 175.6, unrealizedPnL: 54.0, unrealizedPnLPct: 1.40, marketValue: 2634.0, allocationPct: 2.5 },
];

export function usePortfolio() {
  const [positions, setPositions] = useState<PositionHolding[]>(INITIAL_POSITIONS);
  const [cashBalance, setCashBalance] = useState<number>(72845.0);
  const [realizedPnL, setRealizedPnL] = useState<number>(1420.5);

  const addPosition = useCallback((symbol: string, quantity: number, price: number) => {
    const sym = symbol.trim().toUpperCase();
    if (!sym || quantity <= 0 || price <= 0) return;

    setPositions((prev) => {
      const idx = prev.findIndex((p) => p.symbol === sym);
      const totalCost = quantity * price;

      if (idx !== -1) {
        const existing = prev[idx];
        const newQty = existing.quantity + quantity;
        const newCost = (existing.quantity * existing.avgCostPrice + totalCost) / newQty;
        const newMarketVal = newQty * price;
        const newUnrealized = newMarketVal - newQty * newCost;
        const newUnrealizedPct = (newUnrealized / (newQty * newCost)) * 100;

        return prev.map((p, i) =>
          i === idx
            ? {
                ...p,
                quantity: newQty,
                avgCostPrice: Number(newCost.toFixed(2)),
                currentPrice: price,
                marketValue: Number(newMarketVal.toFixed(2)),
                unrealizedPnL: Number(newUnrealized.toFixed(2)),
                unrealizedPnLPct: Number(newUnrealizedPct.toFixed(2)),
              }
            : p
        );
      } else {
        const newMarketVal = quantity * price;
        const newItem: PositionHolding = {
          symbol: sym,
          quantity,
          avgCostPrice: price,
          currentPrice: price,
          unrealizedPnL: 0,
          unrealizedPnLPct: 0,
          marketValue: Number(newMarketVal.toFixed(2)),
          allocationPct: 5.0,
        };
        return [...prev, newItem];
      }
    });

    setCashBalance((prev) => Math.max(0, prev - quantity * price));
  }, []);

  const closePosition = useCallback((symbol: string) => {
    setPositions((prev) => {
      const target = prev.find((p) => p.symbol === symbol);
      if (target) {
        setCashBalance((c) => c + target.marketValue);
        setRealizedPnL((r) => r + target.unrealizedPnL);
      }
      return prev.filter((p) => p.symbol !== symbol);
    });
  }, []);

  // Compute live aggregates
  const totalHoldingsValue = positions.reduce((acc, p) => acc + p.marketValue, 0);
  const totalEquity = cashBalance + totalHoldingsValue;
  const totalUnrealizedPnL = positions.reduce((acc, p) => acc + p.unrealizedPnL, 0);

  const allocations: AllocationItem[] = positions.map((p) => ({
    symbol: p.symbol,
    marketValue: p.marketValue,
    percentage: Number(((p.marketValue / totalEquity) * 100).toFixed(1)),
  }));

  const sortedPositions = [...positions].sort((a, b) => b.unrealizedPnLPct - a.unrealizedPnLPct);
  const topGainers = sortedPositions.filter((p) => p.unrealizedPnLPct > 0).slice(0, 3);
  const topLosers = sortedPositions.filter((p) => p.unrealizedPnLPct < 0).slice(-3);

  return {
    portfolio: {
      totalEquity,
      cashBalance,
      unrealizedPnL: totalUnrealizedPnL,
      realizedPnL,
      dailyChange: totalUnrealizedPnL * 0.4,
      dailyChangePct: Number(((totalUnrealizedPnL * 0.4 / totalEquity) * 100).toFixed(2)),
      riskScore: 18.5,
      positions,
      allocations,
      topGainers,
      topLosers,
    },
    addPosition,
    closePosition,
  };
}
