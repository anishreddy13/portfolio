"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Cpu } from "lucide-react";
import { getFinancialAnalystServiceMessage, predictFinancialAnalyst } from "@/lib/financialAnalystClient";

interface HealthPayload {
  status: "online" | "degraded";
  phase: number;
  created_at: string;
  python: string;
  checks: Record<string, boolean>;
  features: Record<string, boolean>;
}

function parseHealth(response: unknown): HealthPayload | null {
  const raw = (response as { data?: unknown[] } | null)?.data?.[0];
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as HealthPayload;
  } catch {
    return null;
  }
}

export default function FinancialAnalystHealthStrip() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadHealth = async () => {
      try {
        const response = await predictFinancialAnalyst("/get_service_health", [], 1);
        const parsed = parseHealth(response);
        if (mounted) {
          setHealth(parsed);
          setError(parsed ? null : "Health payload unavailable.");
        }
      } catch (err) {
        if (mounted) {
          setError(getFinancialAnalystServiceMessage(err));
          setHealth(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadHealth();
    const interval = setInterval(loadHealth, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const online = health?.status === "online";
  const neuralReady = Boolean(health?.features?.neural_chart_vision);
  const dlReady = Boolean(health?.features?.deep_learning_bundle);

  return (
    <div className="w-full border-b border-[rgba(255,255,255,0.06)] bg-[#050505] px-4 py-2">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          {loading ? (
            <Activity size={14} className="animate-spin text-[#C8FF00]" />
          ) : online ? (
            <CheckCircle2 size={14} className="text-[#C8FF00]" />
          ) : (
            <AlertTriangle size={14} className="text-[#FFB020]" />
          )}
          <span className="font-mono text-[0.62rem] uppercase tracking-widest text-[var(--text-secondary)]">
            AI Services {loading ? "checking" : online ? "online" : "degraded"}
          </span>
          {health && (
            <span className="font-mono text-[0.58rem] uppercase tracking-widest text-[var(--text-tertiary)]">
              Phase {health.phase} · Python {health.python}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-sm border px-2 py-1 font-mono text-[0.55rem] uppercase tracking-widest ${neuralReady ? "border-[#4DA3FF]/40 text-[#4DA3FF]" : "border-[#FFB020]/40 text-[#FFB020]"}`}>
            Neural Vision {neuralReady ? "ready" : "warming"}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 font-mono text-[0.55rem] uppercase tracking-widest ${dlReady ? "border-[#C8FF00]/40 text-[#C8FF00]" : "border-[rgba(255,255,255,0.12)] text-[var(--text-tertiary)]"}`}>
            <Cpu size={11} />
            DL Bundle {dlReady ? "loaded" : "fallback"}
          </span>
          {error && (
            <span className="font-mono text-[0.55rem] uppercase tracking-widest text-[#FFB020]">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
