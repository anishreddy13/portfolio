"use client";

import { useState, useEffect } from "react";

export interface Telemetry {
  messagesPerSec: number;
  cacheHitRatio: number;
  cacheMisses: number;
  consensusPerSec: number;
  streamLatencyMs: number;
  refreshCount: number;
  reconnectCount: number;
  duplicatePrevented: number;
  activeSubscriptions: number;
}

export function useTelemetry(subscriptionCount: number = 5) {
  const [telemetry, setTelemetry] = useState<Telemetry>({
    messagesPerSec: 48.5,
    cacheHitRatio: 98.6,
    cacheMisses: 14,
    consensusPerSec: 42.1,
    streamLatencyMs: 8.2,
    refreshCount: 124,
    reconnectCount: 0,
    duplicatePrevented: 86,
    activeSubscriptions: subscriptionCount,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        messagesPerSec: Number((45 + Math.random() * 8).toFixed(1)),
        cacheHitRatio: Number((98.2 + Math.random() * 0.6).toFixed(1)),
        consensusPerSec: Number((38 + Math.random() * 6).toFixed(1)),
        streamLatencyMs: Number((7.8 + Math.random() * 1.2).toFixed(1)),
        refreshCount: prev.refreshCount + (Math.random() > 0.6 ? 1 : 0),
        duplicatePrevented: prev.duplicatePrevented + (Math.random() > 0.5 ? 1 : 0),
        activeSubscriptions: subscriptionCount,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [subscriptionCount]);

  const updateTelemetry = (data: Partial<Telemetry>) => {
    setTelemetry((prev) => ({
      ...prev,
      ...data,
      activeSubscriptions: subscriptionCount,
    }));
  };

  return { telemetry, updateTelemetry };
}
