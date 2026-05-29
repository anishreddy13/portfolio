"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getMarketSnapshot, getScrapeLogs, getScrapeStatus, triggerScrapeAll } from "../../../lib/careerApi";
import type { MarketSnapshot, ScraperLog } from "@/types/career";

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }} style={{ backgroundColor: color }} />
    </div>
  );
}

export default function MarketIntelligence() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [queueLength, setQueueLength] = useState(0);
  const [lastRun, setLastRun] = useState<string>("");
  const [lastLog, setLastLog] = useState<ScraperLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [market, status, logs] = await Promise.all([getMarketSnapshot(), getScrapeStatus(), getScrapeLogs()]);
      setSnapshot(market);
      setQueueLength(status.queue_length);
      setLastRun(status.last_run || market.last_scraped);
      setLastLog(logs.logs?.[0] || null);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load market intelligence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startScrape = async () => {
    setScraping(true);
    try {
      await triggerScrapeAll();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not trigger scrape.");
    } finally {
      setScraping(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <motion.div key={index} className="h-28 rounded-sm" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }} animate={{ opacity: [0.35, 0.75, 0.35] }} transition={{ repeat: Infinity, duration: 1.4, delay: index * 0.05 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-sm p-5" style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)", color: "#FF2D2D" }}>{error}</div>;
  }

  const skills = snapshot?.top_skills || [];
  const declining = snapshot?.declining_skills || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <div>
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em]" style={{ color: "#FF6B35" }}>Market Intelligence</p>
          <p className="font-body text-xs mt-1" style={{ color: "#606060" }}>Last updated: {updatedAt ? updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}</p>
        </div>
        <button onClick={load} className="rounded-sm px-3 py-2 font-mono text-[0.55rem] uppercase tracking-widest" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)", color: "#C8FF00" }}>Refresh</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: "Jobs Scraped", value: snapshot?.total_jobs || 0, color: "#C8FF00" },
          { label: "Skills Tracked", value: skills.length, color: "#FF6B35" },
          { label: "Last Scrape", value: lastRun ? new Date(lastRun).toLocaleDateString() : "--", color: "#A855F7" },
          { label: "Queue", value: queueLength, color: queueLength ? "#FF6B35" : "#C8FF00" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-sm p-3" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-display text-2xl leading-none truncate" style={{ color: stat.color }}>{stat.value}</p>
            <p className="font-mono text-[0.48rem] uppercase tracking-widest mt-1" style={{ color: "#606060" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-4" style={{ color: "#C8FF00" }}>Top Skills</p>
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {skills.map((skill, index) => (
              <div key={skill.skill} className="grid grid-cols-[36px_1fr] gap-3 items-center">
                <span className="font-display text-xl" style={{ color: "#606060" }}>{index + 1}</span>
                <div>
                  <div className="flex justify-between gap-3 mb-1">
                    <span className="font-mono text-[0.6rem] uppercase" style={{ color: "#A0A0A0" }}>{skill.skill}</span>
                    <span className="font-mono text-[0.55rem]" style={{ color: skill.ai_risk > 0.6 ? "#FF2D2D" : "#606060" }}>{skill.ai_risk > 0.6 ? "risk" : "ok"}</span>
                  </div>
                  <MiniBar value={skill.demand_score} color="#C8FF00" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-4" style={{ color: "#A855F7" }}>Scraper Status</p>
            <div className="space-y-3">
              <div className="rounded-sm p-3" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="font-mono text-[0.5rem] uppercase tracking-widest" style={{ color: "#606060" }}>Last Run</p>
                <p className="font-body text-sm mt-1" style={{ color: "#A0A0A0" }}>{lastRun || "No scrape logged"}</p>
              </div>
              <div className="rounded-sm p-3" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="font-mono text-[0.5rem] uppercase tracking-widest" style={{ color: "#606060" }}>Jobs Fetched</p>
                <p className="font-display text-2xl leading-none mt-1" style={{ color: "#FF6B35" }}>{lastLog?.jobs_fetched ?? "--"}</p>
              </div>
              <button onClick={startScrape} disabled={scraping} className="w-full rounded-sm py-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] disabled:opacity-50" style={{ background: "#C8FF00", color: "#0A0A0A" }}>
                {scraping ? "Scraping..." : "Trigger Scrape"}
              </button>
            </div>
          </div>

          <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-4" style={{ color: "#FF6B35" }}>GitHub Languages</p>
            <div className="flex flex-wrap gap-2">
              {(snapshot?.github_languages || []).map((language) => (
                <span key={language} className="rounded-sm px-2.5 py-1.5 font-mono text-[0.55rem] uppercase tracking-wider" style={{ color: "#FF6B35", background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.18)" }}>{language}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-sm p-5" style={{ background: "rgba(255,45,45,0.06)", border: "1px solid rgba(255,45,45,0.2)" }}>
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-2" style={{ color: "#FF2D2D" }}>Declining Skills</p>
        <p className="font-body text-xs mb-4" style={{ color: "#A0A0A0" }}>Consider transitioning away from these skills.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {declining.map((skill) => (
            <div key={skill.skill}>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[0.58rem] uppercase" style={{ color: "#A0A0A0" }}>{skill.skill}</span>
                <span className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>{(skill.decay_score * 100).toFixed(0)}%</span>
              </div>
              <MiniBar value={skill.decay_score * 100} color="#FF2D2D" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
