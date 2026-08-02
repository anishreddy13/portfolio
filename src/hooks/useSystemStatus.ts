"use client";

import { useState } from "react";

export interface SystemStatusData {
  buildStatus: "SUCCESS" | "BUILDING" | "FAILED";
  testCoveragePct: number;
  benchmarkStatus: "PASSED" | "DEGRADED" | "WARNING";
  deploymentEnvironment: string;
  systemVersion: string;
  releaseReadiness: "READY_FOR_RELEASE" | "IN_REVIEW" | "BLOCKED";
  subsystemCount: number;
  lastValidatedAt: string;
}

const INITIAL_STATUS: SystemStatusData = {
  buildStatus: "SUCCESS",
  testCoveragePct: 98.5,
  benchmarkStatus: "PASSED",
  deploymentEnvironment: "PRODUCTION (us-east-1)",
  systemVersion: "v1.28.0",
  releaseReadiness: "READY_FOR_RELEASE",
  subsystemCount: 37,
  lastValidatedAt: new Date().toLocaleTimeString(),
};

export function useSystemStatus() {
  const [status] = useState<SystemStatusData>(INITIAL_STATUS);

  return {
    status,
  };
}
