"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getDecliningSkills, getGithubTrending, getSkillTrends, getTopSkills } from "../../../lib/careerApi";
import type { GithubRepo, SkillTrend } from "@/types/career";

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }} className="h-full rounded-full" style={{ backgroundColor: color }} />
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-28 rounded-sm animate-pulse" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }} />
      ))}
    </div>
  );
}

export default function SkillTrendChart() {
  const [skills, setSkills] = useState<SkillTrend[]>([]);
  const [rising, setRising] = useState<SkillTrend[]>([]);
  const [declining, setDeclining] = useState<SkillTrend[]>([]);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [skillData, topData, decliningData, githubData] = await Promise.all([
        getSkillTrends(50),
        getTopSkills(),
        getDecliningSkills(),
        getGithubTrending(),
      ]);
      setSkills(skillData.skills);
      setRising(topData.rising_skills.length ? topData.rising_skills : skillData.skills.slice(0, 12));
      setDeclining(decliningData.declining_skills);
      setRepos(githubData.repos);
      setLanguages(githubData.languages);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load trends.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const avgDemand = useMemo(() => skills.length ? skills.reduce((sum, item) => sum + item.demand_score, 0) / skills.length : 0, [skills]);
  const topSkill = skills[0];
  const velocityLabel = (skill: SkillTrend) => {
    if (skill.decay_score > 0.6) return { icon: "↓", label: "declining", color: "#FF2D2D" };
    if (skill.velocity > 0.5) return { icon: "↑", label: "rising", color: "#C8FF00" };
    return { icon: "→", label: "stable", color: "#A0A0A0" };
  };

  if (loading) return <LoadingGrid />;

  if (error) {
    return (
      <div className="rounded-sm p-5" style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)" }}>
        <p className="font-mono text-[0.62rem]" style={{ color: "#FF2D2D" }}>{error}</p>
      </div>
    );
  }

  if (!skills.length) {
    return (
      <div className="rounded-sm p-8 text-center" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-4xl opacity-30 mb-4">📊</div>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em]" style={{ color: "#C8FF00" }}>No market data yet.</p>
        <p className="font-body text-xs mt-2 max-w-md mx-auto" style={{ color: "#A0A0A0" }}>
          Go to Market tab and click Trigger Scrape to populate skill trends.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em]" style={{ color: "#C8FF00" }}>Rising Skills</p>
          <p className="font-body text-xs mt-1" style={{ color: "#606060" }}>Last updated: {updatedAt ? `${Math.max(0, Math.round((Date.now() - updatedAt.getTime()) / 60000))} minutes ago` : "--"}</p>
        </div>
        <button onClick={load} className="rounded-sm px-3 py-2 font-mono text-[0.55rem] uppercase tracking-widest" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)", color: "#C8FF00" }}>Refresh</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rising.slice(0, 12).map((skill, index) => (
          <motion.div key={skill.skill} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-sm p-4" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="font-mono text-[0.7rem] uppercase tracking-wider truncate" style={{ color: "#F0F0F0" }}>{skill.skill}</p>
              <span className="font-mono text-[0.6rem] uppercase" style={{ color: velocityLabel(skill).color }}>
                {velocityLabel(skill).icon} {velocityLabel(skill).label}
              </span>
            </div>
            <Bar value={skill.demand_score} color="#C8FF00" />
            <div className="mt-3 space-y-2">
              <Bar value={skill.salary_momentum * 100} color="#A855F7" />
              {skill.ai_risk > 0.6 && <span className="inline-block rounded-sm px-2 py-1 font-mono text-[0.5rem] uppercase" style={{ color: "#FF2D2D", background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.2)" }}>AI Risk</span>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-4" style={{ color: "#FF2D2D" }}>Declining Skills</p>
          <div className="space-y-3">
            {declining.slice(0, 8).map((skill) => (
              <div key={skill.skill}>
                <div className="flex justify-between gap-3 mb-1">
                  <span className="font-mono text-[0.58rem] uppercase" style={{ color: "#A0A0A0" }}>DOWN {skill.skill}</span>
                  <span className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>{(skill.decay_score * 100).toFixed(0)}%</span>
                </div>
                <Bar value={skill.decay_score * 100} color="#FF2D2D" />
              </div>
            ))}
            {!declining.length && <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "#606060" }}>No declining skills detected</p>}
          </div>
        </div>

        <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-4" style={{ color: "#FF6B35" }}>GitHub Trending Languages</p>
          <div className="space-y-3">
            {(repos.length ? repos.slice(0, 8) : languages.map((language, index) => ({ repo_name: language, language, stars: 0, trend_score: 90 - index * 8 }))).map((repo) => (
              <div key={`${repo.repo_name}-${repo.language}`}>
                <div className="flex justify-between gap-3 mb-1">
                  <span className="font-mono text-[0.58rem] uppercase" style={{ color: "#A0A0A0" }}>{repo.language || repo.repo_name}</span>
                  <span className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>{repo.trend_score.toFixed(1)}</span>
                </div>
                <Bar value={repo.trend_score} color="#FF6B35" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: "Skills Tracked", value: skills.length, color: "#C8FF00" },
          { label: "Avg Demand", value: `${avgDemand.toFixed(1)}%`, color: "#FF6B35" },
          { label: "Top Skill", value: topSkill ? `${topSkill.skill} ${topSkill.demand_score.toFixed(0)}` : "--", color: "#A855F7" },
          { label: "Updated", value: updatedAt ? updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--", color: "#A0A0A0" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-sm p-3" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-display text-xl leading-none truncate" style={{ color: stat.color }}>{stat.value}</p>
            <p className="font-mono text-[0.48rem] uppercase tracking-widest mt-1" style={{ color: "#606060" }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
