"use client";

import { useState, useEffect } from "react";

export interface ProviderHealth {
  name: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  latencyMs: number;
  successRate: number;
  active: boolean;
  totalRequests: number;
  failedRequests: number;
}

const INITIAL_PROVIDERS: ProviderHealth[] = [
  { name: "POLYGON (Massive)", status: "HEALTHY", latencyMs: 8.4, successRate: 99.9, active: true, totalRequests: 1450, failedRequests: 0 },
  { name: "ALPACA", status: "HEALTHY", latencyMs: 12.2, successRate: 99.7, active: true, totalRequests: 1200, failedRequests: 1 },
  { name: "FINNHUB", status: "HEALTHY", latencyMs: 15.6, successRate: 99.5, active: true, totalRequests: 980, failedRequests: 2 },
];

export function useProviderHealth() {
  const [providers, setProviders] = useState<ProviderHealth[]>(INITIAL_PROVIDERS);

  useEffect(() => {
    const interval = setInterval(() => {
      setProviders((prev) =>
        prev.map((p) => {
          const latDelta = (Math.random() - 0.5) * 0.8;
          return {
            ...p,
            latencyMs: Number(Math.max(4.0, p.latencyMs + latDelta).toFixed(1)),
            totalRequests: p.totalRequests + Math.floor(Math.random() * 3 + 1),
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return { providers };
}
