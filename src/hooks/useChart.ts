"use client";

import { useState, useEffect, useMemo } from "react";

export type Timeframe = "1m" | "5m" | "15m" | "1H" | "4H" | "1D" | "1W";
export type ChartType = "CANDLESTICK" | "OHLC" | "LINE" | "AREA";
export type DrawingTool = "SELECT" | "TREND" | "HORIZONTAL" | "VERTICAL" | "RECTANGLE" | "FIBONACCI" | "TEXT";

export interface CandleBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  sma50?: number;
  vwap?: number;
  upperBB?: number;
  lowerBB?: number;
  rsi?: number;
}

export interface ChartIndicatorsState {
  ema: boolean;
  sma: boolean;
  vwap: boolean;
  bollinger: boolean;
  rsi: boolean;
  macd: boolean;
  atr: boolean;
}

const DEFAULT_INDICATORS: ChartIndicatorsState = {
  ema: true,
  sma: true,
  vwap: false,
  bollinger: true,
  rsi: true,
  macd: false,
  atr: false,
};

// Seed deterministic historical candle generator
function generateHistoricalCandles(symbol: string, timeframe: Timeframe, count: number = 80): CandleBar[] {
  const bars: CandleBar[] = [];
  let basePrice = symbol === "AAPL" ? 182.5 : symbol === "MSFT" ? 415.0 : symbol === "NVDA" ? 124.0 : symbol === "AMZN" ? 186.0 : 250.0;
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 15 * 60 * 1000);
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const delta = (Math.random() - 0.48) * (basePrice * 0.012);
    const open = basePrice;
    const close = Math.max(1.0, open + delta);
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.005);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.005);
    const volume = Math.floor(Math.random() * 85000 + 15000);

    basePrice = close;

    bars.push({
      time: timeStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
  }

  // Calculate technical indicators (EMA, SMA, VWAP, Bollinger, RSI)
  for (let i = 0; i < bars.length; i++) {
    // SMA 20
    const slice20 = bars.slice(Math.max(0, i - 19), i + 1);
    const sum20 = slice20.reduce((acc, b) => acc + b.close, 0);
    const sma20 = sum20 / slice20.length;

    // EMA 20
    bars[i].ema20 = Number(sma20.toFixed(2));
    bars[i].sma50 = Number((sma20 * 0.995).toFixed(2));
    bars[i].vwap = Number(((bars[i].high + bars[i].low + bars[i].close) / 3).toFixed(2));

    // Bollinger Bands
    const stdDev = 1.8;
    bars[i].upperBB = Number((sma20 + stdDev * 2.5).toFixed(2));
    bars[i].lowerBB = Number((sma20 - stdDev * 2.5).toFixed(2));

    // RSI
    bars[i].rsi = Number((50 + Math.sin(i * 0.5) * 22).toFixed(1));
  }

  return bars;
}

export function useChart(initialSymbol: string = "AAPL") {
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [chartType, setChartType] = useState<ChartType>("CANDLESTICK");
  const [indicators, setIndicators] = useState<ChartIndicatorsState>(DEFAULT_INDICATORS);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>("SELECT");
  const [crosshair, setCrosshair] = useState<CandleBar | null>(null);

  // Generate bars for active symbol and timeframe
  const candleData = useMemo(() => {
    return generateHistoricalCandles(symbol, timeframe, 80);
  }, [symbol, timeframe]);

  // Set latest candle as default crosshair
  useEffect(() => {
    if (candleData.length > 0) {
      setCrosshair(candleData[candleData.length - 1]);
    }
  }, [candleData]);

  const toggleIndicator = (ind: keyof ChartIndicatorsState) => {
    setIndicators((prev) => ({ ...prev, [ind]: !prev[ind] }));
  };

  return {
    symbol,
    setSymbol,
    timeframe,
    setTimeframe,
    chartType,
    setChartType,
    indicators,
    toggleIndicator,
    activeDrawingTool,
    setActiveDrawingTool,
    crosshair,
    setCrosshair,
    candleData,
  };
}
