"use client";

import React from "react";
import { Box, Layers, Cpu, ShieldCheck, RefreshCw, Activity, ArrowUpRight, CheckCircle2, RotateCcw } from "lucide-react";
import { usePlatform, ServiceDeploymentData } from "@/hooks/usePlatform";

function statusBadge(status: string) {
  if (status === "RUNNING") return "bg-lime-500/10 text-lime-400 border-lime-500/30 font-bold";
  if (status === "DEPLOYING") return "bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse font-bold";
  return "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold";
}

export default function PlatformPanel() {
  const { services, environment, statistics, deployService, rollbackService } = usePlatform();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Box className="w-4 h-4 text-sky-400" />
            Enterprise Platform Deployment Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deployment Metadata • Kubernetes/Docker/Helm Orchestration • HorizontalPodAutoscaler • Zero-Downtime Rollouts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
            Environment: {environment.envName} ({environment.clusterRegion})
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
            Namespace: <strong className="text-white">{environment.k8sNamespace}</strong>
          </span>
        </div>
      </div>

      {/* Summary Resource Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-sky-500/30">
          <div className="text-slate-400 text-[11px] mb-1">Active Microservices</div>
          <div className="text-lg font-bold text-sky-400">{statistics.activeServicesCount} Running</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Total Running Pods</div>
          <div className="text-lg font-bold text-lime-400">{statistics.totalRunningPods} Pods</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">HPA Scaling Limits</div>
          <div className="text-lg font-bold text-amber-400">{statistics.minHpaReplicas} - {statistics.maxHpaReplicas} Replicas</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Total Deployments</div>
          <div className="text-lg font-bold text-white">{statistics.totalDeployments} Releases</div>
        </div>
      </div>

      {/* Microservice Pod Deployments Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          Kubernetes Microservice Deployment Registry
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-medium">Service Name</th>
                <th className="pb-2 font-medium">Image Tag</th>
                <th className="pb-2 font-medium">Replicas (Ready/Desired)</th>
                <th className="pb-2 font-medium">CPU / Memory Limits</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {services.map((srv: ServiceDeploymentData) => (
                <tr key={srv.serviceId} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 font-bold text-white flex items-center gap-2">
                    <Box className="w-3.5 h-3.5 text-slate-400" />
                    {srv.serviceName}
                  </td>
                  <td className="py-3 text-sky-400 font-bold">{srv.imageTag}</td>
                  <td className="py-3 text-slate-200">{srv.replicaCount} / {srv.desiredReplicas} Pods</td>
                  <td className="py-3 text-slate-400">{srv.cpuLimit} | {srv.memoryLimit}</td>
                  <td className="py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${statusBadge(srv.status)}`}>
                      {srv.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => deployService(srv.serviceName, "v1.29.0")}
                        className="px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold transition flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Deploy v1.29
                      </button>
                      <button
                        onClick={() => rollbackService(srv.serviceName, "v1.27.9")}
                        className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Rollback
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orchestration Artifact Badges */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-lime-400" />
          Production Infrastructure Artifacts (deployment/)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-sky-400 font-bold block">Docker</span>
            <span className="text-slate-400">Dockerfile & docker-compose.yml</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-lime-400 font-bold block">Kubernetes</span>
            <span className="text-slate-400">Deployment, Service, Ingress</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-amber-400 font-bold block">Autoscaling (HPA)</span>
            <span className="text-slate-400">3 - 15 Replicas @ 70% CPU</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-violet-400 font-bold block">Helm Package</span>
            <span className="text-slate-400">Chart.yaml & values.yaml</span>
          </div>
        </div>
      </div>
    </div>
  );
}
