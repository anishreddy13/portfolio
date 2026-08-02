"use client";

import { useState, useEffect, useCallback } from "react";

export interface WatchlistItem {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  changePct: number;
  confidence: number;
  provider: string;
  agreementStatus: string;
  updatedAt: string;
  flash: "up" | "down" | null;
}

const INITIAL_WATCHLIST: WatchlistItem[] = [
  { symbol: "AAPL", price: 182.50, bid: 182.45, ask: 182.55, changePct: +1.24, confidence: 0.99, provider: "POLYGON", agreementStatus: "AGREED", updatedAt: "Just now", flash: null },
  { symbol: "MSFT", price: 415.20, bid: 415.10, ask: 415.30, changePct: +0.85, confidence: 0.98, provider: "ALPACA", agreementStatus: "AGREED", updatedAt: "Just now", flash: null },
  { symbol: "NVDA", price: 875.40, bid: 875.20, ask: 875.60, changePct: +2.65, confidence: 0.99, provider: "POLYGON", agreementStatus: "AGREED", updatedAt: "Just now", flash: null },
  { symbol: "TSLA", price: 178.10, bid: 178.00, ask: 178.20, changePct: -0.45, confidence: 0.95, provider: "FINNHUB", agreementStatus: "SINGLE_SOURCE", updatedAt: "Just now", flash: null },
  { symbol: "AMZN", price: 175.60, bid: 175.50, ask: 175.70, changePct: +1.10, confidence: 0.98, provider: "POLYGON", agreementStatus: "AGREED", updatedAt: "Just now", flash: null },
];

export function useWatchlist(initialSymbols: string[] = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN"]) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(INITIAL_WATCHLIST);

  const addSymbol = useCallback((symbol: string) => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;

    setWatchlist((prev) => {
      if (prev.some((item) => item.symbol === sym)) return prev;

      const newItem: WatchlistItem = {
        symbol: sym,
        price: Number((100 + Math.random() * 150).toFixed(2)),
        bid: 100.0,
        ask: 100.1,
        changePct: Number(((Math.random() - 0.4) * 2).toFixed(2)),
        confidence: 0.99,
        provider: "POLYGON",
        agreementStatus: "AGREED",
        updatedAt: new Date().toLocaleTimeString(),
        flash: "up",
      };
      return [...prev, newItem];
    });
  }, []);

  const removeSymbol = useCallback((symbol: string) => {
    setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
  }, []);

  const updateSymbolTick = useCallback((tickData: any) => {
    if (!tickData || !tickData.symbol) return;

    setWatchlist((prev) => {
      const idx = prev.findIndex((item) => item.symbol === tickData.symbol);
      if (idx === -1) return prev;

      const oldPrice = prev[idx].price;
      const newPrice = Number(tickData.price.toFixed(2));
      const flashType = newPrice > oldPrice ? "up" : newPrice < oldPrice ? "down" : null;

      return prev.map((item, i) => {
        if (i !== idx) return item;
        return {
          ...item,
          price: newPrice,
          bid: Number((newPrice - 0.05).toFixed(2)),
          ask: Number((newPrice + 0.05).toFixed(2)),
          changePct: tickData.changePct || item.changePct,
          provider: tickData.provider || item.provider,
          confidence: tickData.confidence || item.confidence,
          agreementStatus: tickData.agreement_status || item.agreementStatus,
          updatedAt: tickData.timestamp || new Date().toLocaleTimeString(),
          flash: flashType,
        };
      });
    });
  }, []);

  // Real-time tick simulation (updates granular symbols without full reload)
  useEffect(() => {
    const interval = setInterval(() => {
      setWatchlist((prev) => {
        // Pick one random symbol to tick
        const targetIdx = Math.floor(Math.random() * prev.length);
        return prev.map((item, idx) => {
          if (idx !== targetIdx) return item;

          const delta = (Math.random() - 0.48) * 0.5;
          const oldPrice = item.price;
          const newPrice = Number(Math.max(10, oldPrice + delta).toFixed(2));
          const flashType = newPrice > oldPrice ? "up" : newPrice < oldPrice ? "down" : null;

          return {
            ...item,
            price: newPrice,
            bid: Number((newPrice - 0.05).toFixed(2)),
            ask: Number((newPrice + 0.05).toFixed(2)),
            changePct: Number((item.changePct + delta * 0.1).toFixed(2)),
            updatedAt: new Date().toLocaleTimeString(),
            flash: flashType,
          };
        });
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return {
    watchlist,
    addSymbol,
    removeSymbol,
    updateSymbolTick,
  };
}
