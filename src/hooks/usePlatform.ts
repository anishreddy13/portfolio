"use client";

import { useState } from "react";

export interface ServiceDeploymentData {
  serviceId: string;
  serviceName: string;
  imageTag: string;
  replicaCount: number;
  desiredReplicas: number;
  cpuLimit: string;
  memoryLimit: string;
  status: "RUNNING" | "DEPLOYING" | "FAILED" | "ROLLED_BACK";
  updatedAt: string;
}

export interface PlatformEnvironmentData {
  envName: string;
  clusterRegion: string;
  k8sNamespace: string;
  domainUrl: string;
}

export interface PlatformStatisticsData {
  totalDeployments: number;
  activeServicesCount: number;
  totalRunningPods: number;
  minHpaReplicas: number;
  maxHpaReplicas: number;
  clusterUtilizationPct: number;
}

const INITIAL_SERVICES: ServiceDeploymentData[] = [
  { serviceId: "srv-marketdata", serviceName: "EnterpriseMarketDataService", imageTag: "v1.28.0", replicaCount: 3, desiredReplicas: 3, cpuLimit: "500m", memoryLimit: "1Gi", status: "RUNNING", updatedAt: "10:14:00 AM" },
  { serviceId: "srv-consensus", serviceName: "StreamingConsensusEngine", imageTag: "v1.28.0", replicaCount: 3, desiredReplicas: 3, cpuLimit: "500m", memoryLimit: "1Gi", status: "RUNNING", updatedAt: "10:14:00 AM" },
  { serviceId: "srv-oms", serviceName: "OrderManagementSystem", imageTag: "v1.28.0", replicaCount: 3, desiredReplicas: 3, cpuLimit: "1000m", memoryLimit: "2Gi", status: "RUNNING", updatedAt: "10:14:00 AM" },
  { serviceId: "srv-execution", serviceName: "ExecutionManager", imageTag: "v1.28.0", replicaCount: 3, desiredReplicas: 3, cpuLimit: "1000m", memoryLimit: "2Gi", status: "RUNNING", updatedAt: "10:14:00 AM" },
  { serviceId: "srv-audit", serviceName: "AuditEngine", imageTag: "v1.28.0", replicaCount: 2, desiredReplicas: 2, cpuLimit: "500m", memoryLimit: "1Gi", status: "RUNNING", updatedAt: "10:14:00 AM" },
];

const INITIAL_ENV: PlatformEnvironmentData = {
  envName: "PRODUCTION",
  clusterRegion: "us-east-1",
  k8sNamespace: "trading-platform",
  domainUrl: "https://trading.enterprise.com",
};

const INITIAL_STATS: PlatformStatisticsData = {
  totalDeployments: 12,
  activeServicesCount: 5,
  totalRunningPods: 14,
  minHpaReplicas: 3,
  maxHpaReplicas: 15,
  clusterUtilizationPct: 42.5,
};

export function usePlatform() {
  const [services, setServices] = useState<ServiceDeploymentData[]>(INITIAL_SERVICES);
  const [environment] = useState<PlatformEnvironmentData>(INITIAL_ENV);
  const [stats, setStats] = useState<PlatformStatisticsData>(INITIAL_STATS);

  const deployService = (serviceName: string, targetTag: string = "v1.29.0") => {
    const now = new Date().toLocaleTimeString();
    setServices((prev) =>
      prev.map((s) => {
        if (s.serviceName === serviceName) {
          return { ...s, imageTag: targetTag, status: "RUNNING", updatedAt: now };
        }
        return s;
      })
    );

    setStats((prev) => ({ ...prev, totalDeployments: prev.totalDeployments + 1 }));
  };

  const rollbackService = (serviceName: string, targetTag: string = "v1.27.9") => {
    const now = new Date().toLocaleTimeString();
    setServices((prev) =>
      prev.map((s) => {
        if (s.serviceName === serviceName) {
          return { ...s, imageTag: targetTag, status: "ROLLED_BACK", updatedAt: now };
        }
        return s;
      })
    );
  };

  return {
    services,
    environment,
    statistics: stats,
    deployService,
    rollbackService,
  };
}
