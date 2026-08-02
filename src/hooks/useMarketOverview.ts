"use client";

import { useState, useEffect } from "react";

export interface MarketOverview {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trend: string;
  marketStatus: string;
  newsCount: number;
}

export function useMarketOverview(activeSymbol: string = "AAPL") {
  const [overview, setOverview] = useState<MarketOverview>({
    symbol: activeSymbol,
    price: 182.50,
    open: 181.00,
    high: 183.25,
    low: 180.80,
    close: 182.50,
    volume: 45200000,
    trend: "Steady Bullish Trend",
    marketStatus: "OPEN",
    newsCount: 12,
  });

  useEffect(() => {
    // Reset base metrics when symbol changes
    setOverview({
      symbol: activeSymbol,
      price: activeSymbol === "AAPL" ? 182.50 : activeSymbol === "MSFT" ? 415.20 : activeSymbol === "NVDA" ? 875.40 : 178.10,
      open: activeSymbol === "AAPL" ? 181.00 : 412.00,
      high: activeSymbol === "AAPL" ? 183.25 : 416.50,
      low: activeSymbol === "AAPL" ? 180.80 : 411.20,
      close: activeSymbol === "AAPL" ? 182.50 : 415.20,
      volume: 45200000,
      trend: "Steady Bullish Trend",
      marketStatus: "OPEN",
      newsCount: 12,
    });
  }, [activeSymbol]);

  // Streaming updates appended to OHLC metrics without full reload
  useEffect(() => {
    const interval = setInterval(() => {
      setOverview((prev) => {
        const delta = (Math.random() - 0.48) * 0.4;
        const newPrice = Number(Math.max(10, prev.price + delta).toFixed(2));
        const newHigh = Number(Math.max(prev.high, newPrice).toFixed(2));
        const newLow = Number(Math.min(prev.low, newPrice).toFixed(2));

        return {
          ...prev,
          price: newPrice,
          high: newHigh,
          low: newLow,
          close: newPrice,
          volume: prev.volume + Math.floor(Math.random() * 500 + 100),
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { overview };
}
