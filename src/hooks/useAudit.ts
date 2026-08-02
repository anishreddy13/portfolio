"use client";

import { useState } from "react";

export interface AuditEventData {
  eventId: string;
  timestamp: string;
  subsystem: string;
  eventType: string;
  severity: "INFO" | "WARNING" | "HIGH" | "CRITICAL";
  symbol: string;
  portfolioId: string;
  orderId: string;
  strategyName: string;
  hashSignature: string;
  previousHash: string;
  payloadDescription: string;
}

export interface AuditFilterState {
  subsystem: string;
  severity: string;
  symbol: string;
  searchQuery: string;
}

const INITIAL_EVENTS: AuditEventData[] = [
  {
    eventId: "evt-001",
    timestamp: "10:00:00 AM",
    subsystem: "SYSTEM",
    eventType: "GENESIS_BOOT",
    severity: "INFO",
    symbol: "",
    portfolioId: "",
    orderId: "",
    strategyName: "",
    hashSignature: "8f9a2b1c4e7d3f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a",
    previousHash: "GENESIS",
    payloadDescription: "Enterprise Audit Engine initialized.",
  },
  {
    eventId: "evt-002",
    timestamp: "10:14:00 AM",
    subsystem: "SIGNAL_ENGINE",
    eventType: "SIGNAL_SUBMITTED",
    severity: "INFO",
    symbol: "AAPL",
    portfolioId: "default",
    orderId: "",
    strategyName: "EMA_CROSSOVER",
    hashSignature: "7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b",
    previousHash: "8f9a2b1c4e7d3f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a",
    payloadDescription: "Signal sig-501 (BUY AAPL) approved by conflict rules.",
  },
  {
    eventId: "evt-003",
    timestamp: "10:14:02 AM",
    subsystem: "PORTFOLIO_CONSTRUCTION",
    eventType: "ALLOCATION_DECISION_CREATED",
    severity: "INFO",
    symbol: "AAPL",
    portfolioId: "default",
    orderId: "",
    strategyName: "",
    hashSignature: "1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
    previousHash: "7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b",
    payloadDescription: "Allocation decision alloc-001 (45 shares, $8,100 capital) calculated via Risk Parity.",
  },
  {
    eventId: "evt-004",
    timestamp: "10:14:05 AM",
    subsystem: "COMPLIANCE_ENGINE",
    eventType: "COMPLIANCE_APPROVED",
    severity: "INFO",
    symbol: "AAPL",
    portfolioId: "default",
    orderId: "",
    strategyName: "",
    hashSignature: "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
    previousHash: "1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
    payloadDescription: "Allocation alloc-001 passed all 10 pre-trade compliance mandates.",
  },
  {
    eventId: "evt-005",
    timestamp: "10:14:06 AM",
    subsystem: "ORDER_MANAGEMENT",
    eventType: "ORDER_CREATED",
    severity: "INFO",
    symbol: "AAPL",
    portfolioId: "default",
    orderId: "pord-101",
    strategyName: "",
    hashSignature: "2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
    previousHash: "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
    payloadDescription: "ParentOrder pord-101 (BUY 45 AAPL @ $180.00) created.",
  },
  {
    eventId: "evt-006",
    timestamp: "10:14:08 AM",
    subsystem: "EXECUTION_MANAGER",
    eventType: "EXECUTION_FILLED",
    severity: "INFO",
    symbol: "AAPL",
    portfolioId: "default",
    orderId: "pord-101",
    strategyName: "",
    hashSignature: "3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c",
    previousHash: "2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
    payloadDescription: "Execution filled 45 shares @ $179.85 via NASDAQ venue.",
  },
  {
    eventId: "evt-007",
    timestamp: "10:14:10 AM",
    subsystem: "PORTFOLIO_MANAGER",
    eventType: "POSITION_ADDED",
    severity: "INFO",
    symbol: "AAPL",
    portfolioId: "default",
    orderId: "",
    strategyName: "",
    hashSignature: "4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
    previousHash: "3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c",
    payloadDescription: "Updated position AAPL: 45 shares, avg cost $179.85.",
  },
  {
    eventId: "evt-008",
    timestamp: "10:35:10 AM",
    subsystem: "COMPLIANCE_ENGINE",
    eventType: "COMPLIANCE_REJECTED",
    severity: "HIGH",
    symbol: "LMT",
    portfolioId: "default",
    orderId: "",
    strategyName: "",
    hashSignature: "5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
    previousHash: "4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
    payloadDescription: "Compliance rejected LMT: Security is on the firm restricted list.",
  },
];

export function useAudit() {
  const [events] = useState<AuditEventData[]>(INITIAL_EVENTS);
  const [filter, setFilter] = useState<AuditFilterState>({
    subsystem: "ALL",
    severity: "ALL",
    symbol: "",
    searchQuery: "",
  });
  const [isChainValid] = useState<boolean>(true);

  const filteredEvents = events.filter((e) => {
    if (filter.subsystem !== "ALL" && e.subsystem !== filter.subsystem) return false;
    if (filter.severity !== "ALL" && e.severity !== filter.severity) return false;
    if (filter.symbol && e.symbol.toLowerCase() !== filter.symbol.toLowerCase()) return false;
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      const match =
        e.eventId.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q) ||
        e.symbol.toLowerCase().includes(q) ||
        e.payloadDescription.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return {
    events: filteredEvents,
    rawCount: events.length,
    filter,
    setFilter,
    isChainValid,
  };
}
