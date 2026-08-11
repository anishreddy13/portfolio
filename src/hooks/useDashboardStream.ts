"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type ConnectionStatus = "CONNECTED" | "RECONNECTING" | "OFFLINE";

export interface StreamEvent {
  type: string;
  payload: any;
}

export interface DashboardSignal {
  ticker: string;
  signal_type: string;
  severity: "HIGH" | "MEDIUM" | "LOW" | string;
  description: string;
}

export interface DashboardBatch {
  batch_id: string;
  created_at: string;
  source: string;
  events?: Array<{
    event_type: string;
    payload: any;
  }>;
}

export interface WorkspaceServiceHealth {
  status?: string;
  phase?: number;
  python?: string;
  created_at?: string;
  features?: Record<string, boolean>;
  checks?: Record<string, boolean>;
}

type EventListenerCallback = (event: StreamEvent) => void;

export function useDashboardStream() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("RECONNECTING");
  const [latencyMs, setLatencyMs] = useState<number>(8.2);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [latestBatch, setLatestBatch] = useState<DashboardBatch | null>(null);
  const [latestSignals, setLatestSignals] = useState<DashboardSignal[]>([]);
  const [serviceHealth, setServiceHealth] = useState<WorkspaceServiceHealth | null>(null);

  const listenersRef = useRef<EventListenerCallback[]>([]);

  const subscribe = useCallback((callback: EventListenerCallback) => {
    listenersRef.current.push(callback);
    return () => {
      listenersRef.current = listenersRef.current.filter((cb) => cb !== callback);
    };
  }, []);

  const dispatchEvent = useCallback((event: StreamEvent) => {
    listenersRef.current.forEach((cb) => cb(event));
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource("/api/live-dashboard/stream");

        eventSource.onopen = () => {
          setConnectionStatus("CONNECTED");
        };

        eventSource.addEventListener("watchlist_tick", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            dispatchEvent({ type: "watchlist_tick", payload: data });
            setLastUpdatedAt(new Date().toISOString());
          } catch (err) {}
        });

        eventSource.addEventListener("telemetry_update", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setLatencyMs(data.streamLatencyMs || 8.2);
            dispatchEvent({ type: "telemetry_update", payload: data });
            setLastUpdatedAt(new Date().toISOString());
          } catch (err) {}
        });

        eventSource.addEventListener("signal_feed", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const signals = Array.isArray(data?.signals) ? data.signals : Array.isArray(data) ? data : [];
            setLatestSignals(signals);
            dispatchEvent({ type: "signal_feed", payload: data });
            setLastUpdatedAt(data?.updatedAt || new Date().toISOString());
          } catch (err) {}
        });

        eventSource.addEventListener("service_health", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setServiceHealth(data);
            dispatchEvent({ type: "service_health", payload: data });
            setLastUpdatedAt(data?.created_at || new Date().toISOString());
          } catch (err) {}
        });

        eventSource.addEventListener("dashboard_batch", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data) as DashboardBatch;
            setLatestBatch(data);
            const signalEvent = data.events?.find((event) => event.event_type === "signal_feed");
            if (signalEvent?.payload?.signals && Array.isArray(signalEvent.payload.signals)) {
              setLatestSignals(signalEvent.payload.signals);
            }
            const telemetryEvent = data.events?.find((event) => event.event_type === "telemetry_update");
            if (telemetryEvent?.payload?.streamLatencyMs) {
              setLatencyMs(telemetryEvent.payload.streamLatencyMs);
            }
            const healthEvent = data.events?.find((event) => event.event_type === "service_health");
            if (healthEvent?.payload) {
              setServiceHealth(healthEvent.payload);
            }
            setLastUpdatedAt(data.created_at || new Date().toISOString());
            dispatchEvent({ type: "dashboard_batch", payload: data });
          } catch (err) {}
        });

        eventSource.onerror = () => {
          setConnectionStatus("RECONNECTING");
          if (eventSource) {
            eventSource.close();
          }
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (err) {
        setConnectionStatus("OFFLINE");
      }
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [dispatchEvent]);

  return {
    connectionStatus,
    latencyMs,
    lastUpdatedAt,
    latestBatch,
    latestSignals,
    serviceHealth,
    subscribe,
  };
}
