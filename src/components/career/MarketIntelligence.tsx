"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getGithubTrending,
  getMarketSnapshot,
  getScrapeLogs,
  getScrapeStatus,
  getSkillTrends,
  recomputeTrends,
  triggerScrapeAll,
} from "../../../lib/careerApi";
import type { GithubRepo, MarketSnapshot, ScraperLog, SkillTrend } from "@/types/career";

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(value || 0, 100)}%` }} transition={{ duration: 0.7 }} style={{ backgroundColor: color }} />
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-28 rounded-sm animate-pulse" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }} />
      ))}
    </div>
  );
}

export default function MarketIntelligence() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [skills, setSkills] = useState<SkillTrend[]>([]);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [queueLength, setQueueLength] = useState(0);
  const [lastRun, setLastRun] = useState<string>("");
  const [lastLog, setLastLog] = useState<ScraperLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [market, status, logs, trendData, github] = await Promise.all([
        getMarketSnapshot(),
        getScrapeStatus(),
        getScrapeLogs(),
        getSkillTrends(50),
        getGithubTrending(),
      ]);
      setSnapshot(market);
      setSkills(trendData.skills.length ? trendData.skills : market.top_skills || []);
      setQueueLength(status.queue_length);
      setLastRun(status.last_run || market.last_scraped);
      setLastLog(logs.logs?.[0] || null);
      setRepos(github.repos || []);
      setLanguages(github.languages || market.github_languages || []);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load market intelligence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const startScrape = async () => {
    setScraping(true);
    setError(null);
    try {
      setScrapeMessage("Scraping jobs... (this takes 60-90 seconds)");
      await triggerScrapeAll();
      await new Promise((resolve) => window.setTimeout(resolve, 90000));
      setScrapeMessage("Recomputing skill trends from scraped jobs...");
      await recomputeTrends();
      setScrapeMessage("Refreshing market dashboard...");
      await load();
      setScrapeMessage("Market data refreshed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not trigger scrape.");
    } finally {
      setScraping(false);
      window.setTimeout(() => setScrapeMessage(""), 4000);
    }
  };

  if (loading) return <LoadingCards />;

  const declining = snapshot?.declining_skills || [];
  const hasSkills = skills.length > 0;
  const hasGithub = repos.length > 0 || languages.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em]" style={{ color: "#FF6B35" }}>Market Intelligence</p>
          <p className="font-body text-xs mt-1" style={{ color: "#606060" }}>Last updated: {updatedAt ? updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-sm px-3 py-2 font-mono text-[0.55rem] uppercase tracking-widest" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)", color: "#C8FF00" }}>Refresh</button>
          <button onClick={startScrape} disabled={scraping} className="rounded-sm px-3 py-2 font-mono text-[0.55rem] uppercase tracking-widest disabled:opacity-50" style={{ background: "#C8FF00", color: "#0A0A0A" }}>{scraping ? "Scraping..." : "Trigger Scrape"}</button>
        </div>
      </div>

      {scrapeMessage && (
        <div className="rounded-sm p-4" style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.18)" }}>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em]" style={{ color: "#C8FF00" }}>{scrapeMessage}</p>
          {scraping && <MiniBar value={65} color="#C8FF00" />}
        </div>
      )}

      {error && (
        <div className="rounded-sm p-5" style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)", color: "#FF2D2D" }}>
          <p className="font-mono text-[0.62rem]">{error}</p>
        </div>
      )}

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
          {hasSkills ? (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {skills.slice(0, 20).map((skill, index) => (
                <div key={skill.skill} className="grid grid-cols-[36px_1fr] gap-3 items-center">
                  <span className="font-display text-xl" style={{ color: "#606060" }}>{index + 1}</span>
                  <div>
                    <div className="flex justify-between gap-3 mb-1">
                      <span className="font-mono text-[0.6rem] uppercase" style={{ color: "#A0A0A0" }}>{skill.skill}</span>
                      <span className="font-mono text-[0.55rem]" style={{ color: skill.ai_risk > 0.6 ? "#FF2D2D" : "#606060" }}>{skill.ai_risk > 0.6 ? "risk" : `${skill.demand_score.toFixed(0)}%`}</span>
                    </div>
                    <MiniBar value={skill.demand_score} color="#C8FF00" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-sm p-6 text-center" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em]" style={{ color: "#606060" }}>No data yet.</p>
              <p className="font-body text-xs mt-2" style={{ color: "#A0A0A0" }}>Click Trigger Scrape to populate market data.</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-4" style={{ color: "#A855F7" }}>Scraper Status</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-sm p-3" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="font-mono text-[0.5rem] uppercase tracking-widest" style={{ color: "#606060" }}>Last Run</p>
                <p className="font-body text-sm mt-1" style={{ color: "#A0A0A0" }}>{lastRun || "No scrape logged"}</p>
              </div>
              <div className="rounded-sm p-3" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="font-mono text-[0.5rem] uppercase tracking-widest" style={{ color: "#606060" }}>Jobs Fetched</p>
                <p className="font-display text-2xl leading-none mt-1" style={{ color: "#FF6B35" }}>{lastLog?.jobs_fetched ?? "--"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-4" style={{ color: "#FF6B35" }}>GitHub Languages</p>
            {hasGithub ? (
              <div className="space-y-3">
                {(repos.length ? repos.slice(0, 8) : languages.map((language, index) => ({ repo_name: language, language, stars: 0, trend_score: 90 - index * 8 }))).map((repo) => (
                  <div key={`${repo.repo_name}-${repo.language}`}>
                    <div className="flex justify-between gap-3 mb-1">
                      <span className="font-mono text-[0.58rem] uppercase" style={{ color: "#A0A0A0" }}>{repo.language || repo.repo_name}</span>
                      <span className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>{repo.trend_score.toFixed(1)}</span>
                    </div>
                    <MiniBar value={repo.trend_score} color="#FF6B35" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "#606060" }}>Scrape GitHub data to see trends.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-sm p-5" style={{ background: "rgba(255,45,45,0.06)", border: "1px solid rgba(255,45,45,0.2)" }}>
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-2" style={{ color: "#FF2D2D" }}>Declining Skills</p>
        <p className="font-body text-xs mb-4" style={{ color: "#A0A0A0" }}>Consider transitioning away from these skills.</p>
        {declining.length ? (
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
        ) : (
          <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "#606060" }}>No declining skills detected yet.</p>
        )}
      </div>
    </div>
  );
}
