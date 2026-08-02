"use client";

import { useState } from "react";

export interface ServiceNodeData {
  nodeId: string;
  nodeName: string;
  role: "PRIMARY" | "STANDBY" | "REPLICA";
  status: "ONLINE" | "OFFLINE" | "DEGRADED";
  ipAddress: string;
  region: string;
  lastSeen: string;
}

export interface RecoveryPlanData {
  planId: string;
  targetSubsystem: string;
  steps: string[];
  priority: number;
  status: "IDLE" | "EXECUTING" | "COMPLETED" | "FAILED";
}

export interface FailoverDecisionData {
  decisionId: string;
  failedNodeId: string;
  electedNodeId: string;
  reason: string;
  timestamp: string;
}

export interface HAStatisticsData {
  totalNodes: number;
  activePrimaryNode: string;
  standbyNodesCount: number;
  clusterUptimePct: number;
  totalFailovers: number;
  totalRecoveries: number;
}

const INITIAL_NODES: ServiceNodeData[] = [
  {
    nodeId: "node-us-east-1a",
    nodeName: "Primary Compute Node (us-east-1a)",
    role: "PRIMARY",
    status: "ONLINE",
    ipAddress: "10.0.1.10",
    region: "us-east-1",
    lastSeen: "10:14:00 AM",
  },
  {
    nodeId: "node-us-east-1b",
    nodeName: "Hot Standby Node (us-east-1b)",
    role: "STANDBY",
    status: "ONLINE",
    ipAddress: "10.0.2.20",
    region: "us-east-1",
    lastSeen: "10:14:00 AM",
  },
  {
    nodeId: "node-us-west-2a",
    nodeName: "DR Standby Node (us-west-2a)",
    role: "REPLICA",
    status: "ONLINE",
    ipAddress: "10.1.1.30",
    region: "us-west-2",
    lastSeen: "10:14:00 AM",
  },
];

const INITIAL_PLANS: RecoveryPlanData[] = [
  {
    planId: "plan-rec-01",
    targetSubsystem: "REQUEST_COORDINATOR",
    steps: [
      "Isolate degraded subsystem",
      "Flush in-flight SingleFlight map",
      "Verify MarketCache connectivity",
      "Restart worker pool",
    ],
    priority: 4,
    status: "COMPLETED",
  },
];

const INITIAL_DECISIONS: FailoverDecisionData[] = [
  {
    decisionId: "failover-101",
    failedNodeId: "node-legacy-01",
    electedNodeId: "node-us-east-1a",
    reason: "Scheduled cluster migration to multi-region topology",
    timestamp: "09:00:00 AM",
  },
];

const INITIAL_STATS: HAStatisticsData = {
  totalNodes: 3,
  activePrimaryNode: "Primary Compute Node (us-east-1a)",
  standbyNodesCount: 2,
  clusterUptimePct: 99.99,
  totalFailovers: 1,
  totalRecoveries: 1,
};

export function useHighAvailability() {
  const [nodes, setNodes] = useState<ServiceNodeData[]>(INITIAL_NODES);
  const [plans, setPlans] = useState<RecoveryPlanData[]>(INITIAL_PLANS);
  const [decisions, setDecisions] = useState<FailoverDecisionData[]>(INITIAL_DECISIONS);
  const [stats, setStats] = useState<HAStatisticsData>(INITIAL_STATS);

  const triggerFailover = () => {
    const now = new Date().toLocaleTimeString();
    setNodes((prev) =>
      prev.map((node) => {
        if (node.role === "PRIMARY") {
          return { ...node, role: "STANDBY", status: "DEGRADED" };
        }
        if (node.nodeId === "node-us-east-1b") {
          return { ...node, role: "PRIMARY", status: "ONLINE" };
        }
        return node;
      })
    );

    setDecisions((prev) => [
      ...prev,
      {
        decisionId: `failover-${Date.now()}`,
        failedNodeId: "node-us-east-1a",
        electedNodeId: "node-us-east-1b",
        reason: "Manual HA failover triggered via Dashboard",
        timestamp: now,
      },
    ]);

    setStats((prev) => ({
      ...prev,
      activePrimaryNode: "Hot Standby Node (us-east-1b)",
      totalFailovers: prev.totalFailovers + 1,
    }));
  };

  const triggerRecovery = (subsystem: string) => {
    const newPlan: RecoveryPlanData = {
      planId: `plan-${Date.now()}`,
      targetSubsystem: subsystem,
      steps: [
        `Isolate degraded subsystem ${subsystem}`,
        "Flush in-flight queues",
        "Verify state persistence integrity",
        `Restart ${subsystem} process pool`,
      ],
      priority: 1,
      status: "COMPLETED",
    };

    setPlans((prev) => [...prev, newPlan]);
    setStats((prev) => ({ ...prev, totalRecoveries: prev.totalRecoveries + 1 }));
  };

  return {
    nodes,
    plans,
    decisions,
    statistics: stats,
    triggerFailover,
    triggerRecovery,
  };
}
