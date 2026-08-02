"use client";

import { useState } from "react";

export interface IncidentEventData {
  eventId: string;
  incidentId: string;
  timestamp: string;
  eventType: string;
  description: string;
  actor: string;
}

export interface IncidentData {
  incidentId: string;
  alertId: string;
  subsystem: string;
  title: string;
  description: string;
  severity: "INFO" | "WARNING" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "ESCALATED" | "RESOLVED";
  owner: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  escalationLevel: string;
  timeline: IncidentEventData[];
}

export interface IncidentStatisticsData {
  totalOpened: number;
  activeCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
  mttaSeconds: number;
  mttrSeconds: number;
}

const INITIAL_INCIDENTS: IncidentData[] = [
  {
    incidentId: "inc-101",
    alertId: "alt-01",
    subsystem: "REQUEST_COORDINATOR",
    title: "[HIGH] SingleFlight Request Coalescing Latency Spike",
    description: "Metric 'request_latency_ms' value 165.4ms breached threshold 150.0ms",
    severity: "HIGH",
    status: "ACKNOWLEDGED",
    owner: "Lead SRE (Alex)",
    createdAt: "10:14:00 AM",
    acknowledgedAt: "10:15:30 AM",
    escalationLevel: "LEVEL_2_QUANT_SRE",
    timeline: [
      { eventId: "evt-1", incidentId: "inc-101", timestamp: "10:14:00 AM", eventType: "OPENED", description: "Incident opened from alert alt-01", actor: "AUTOMATED_MONITOR" },
      { eventId: "evt-2", incidentId: "inc-101", timestamp: "10:15:30 AM", eventType: "ACKNOWLEDGED", description: "Incident acknowledged by Alex", actor: "Lead SRE (Alex)" },
    ],
  },
  {
    incidentId: "inc-102",
    alertId: "alt-03",
    subsystem: "COMPLIANCE_ENGINE",
    title: "[CRITICAL] Restricted Asset Trade Attempt Blocked",
    description: "Trade allocation for restricted ticker 'LMT' blocked by ComplianceEngine",
    severity: "CRITICAL",
    status: "OPEN",
    owner: "UNASSIGNED",
    createdAt: "10:35:10 AM",
    escalationLevel: "LEVEL_3_CHIEF_RISK_OFFICER",
    timeline: [
      { eventId: "evt-3", incidentId: "inc-102", timestamp: "10:35:10 AM", eventType: "OPENED", description: "Incident opened from alert alt-03", actor: "AUTOMATED_MONITOR" },
    ],
  },
];

const INITIAL_STATS: IncidentStatisticsData = {
  totalOpened: 2,
  activeCount: 2,
  acknowledgedCount: 1,
  resolvedCount: 0,
  mttaSeconds: 45.0,
  mttrSeconds: 320.0,
};

export function useIncidents() {
  const [incidents, setIncidents] = useState<IncidentData[]>(INITIAL_INCIDENTS);

  const activeIncidents = incidents.filter((i) => i.status !== "RESOLVED");
  const historyIncidents = incidents;

  const acknowledgeIncident = (incidentId: string, owner: string = "Lead SRE") => {
    const now = new Date().toLocaleTimeString();
    setIncidents((prev) =>
      prev.map((item) => {
        if (item.incidentId === incidentId) {
          return {
            ...item,
            status: "ACKNOWLEDGED",
            owner,
            acknowledgedAt: now,
            timeline: [
              ...item.timeline,
              {
                eventId: `evt-${Date.now()}`,
                incidentId,
                timestamp: now,
                eventType: "ACKNOWLEDGED",
                description: `Incident acknowledged by ${owner}`,
                actor: owner,
              },
            ],
          };
        }
        return item;
      })
    );
  };

  const resolveIncident = (incidentId: string, notes: string = "Resolved") => {
    const now = new Date().toLocaleTimeString();
    setIncidents((prev) =>
      prev.map((item) => {
        if (item.incidentId === incidentId) {
          return {
            ...item,
            status: "RESOLVED",
            resolvedAt: now,
            timeline: [
              ...item.timeline,
              {
                eventId: `evt-${Date.now()}`,
                incidentId,
                timestamp: now,
                eventType: "RESOLVED",
                description: notes,
                actor: item.owner || "SRE",
              },
            ],
          };
        }
        return item;
      })
    );
  };

  return {
    activeIncidents,
    historyIncidents,
    statistics: INITIAL_STATS,
    acknowledgeIncident,
    resolveIncident,
  };
}
