"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type ConnectionStatus = "CONNECTED" | "RECONNECTING" | "OFFLINE";

export interface StreamEvent {
  type: string;
  payload: any;
}

type EventListenerCallback = (event: StreamEvent) => void;

export function useDashboardStream() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("CONNECTED");
  const [latencyMs, setLatencyMs] = useState<number>(8.2);

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
          } catch (err) {}
        });

        eventSource.addEventListener("telemetry_update", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setLatencyMs(data.streamLatencyMs || 8.2);
            dispatchEvent({ type: "telemetry_update", payload: data });
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
    subscribe,
  };
}
