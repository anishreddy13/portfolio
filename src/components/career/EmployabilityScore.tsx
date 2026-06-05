"use client";

import { motion } from "framer-motion";
import type { EmployabilityScore as EmployabilityScoreType, SkillGap } from "@/types/career";

function normalizePercent(value: number | null | undefined) {
  const raw = Number(value ?? 0);
  const scaled = raw > 0 && raw <= 1 ? raw * 100 : raw;
  return Math.max(0, Math.min(100, scaled));
}

function colorForScore(score: number) {
  if (score >= 90) return "#C8FF00";
  if (score >= 80) return "#C8FF00";
  if (score >= 70) return "#FF6B35";
  if (score >= 60) return "#FF6B35";
  if (score >= 50) return "#A855F7";
  return "#FF2D2D";
}

function gradeForScore(score: number) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  return "D";
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-sm p-3" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <p className="font-mono text-[0.5rem] uppercase tracking-widest" style={{ color: "#606060" }}>{label}</p>
      <p className="font-display text-2xl leading-none mt-2 truncate" style={{ color }}>{value}</p>
    </div>
  );
}

function BreakdownBar({ label, value, color }: { label: string; value: number; color: string }) {
  const percent = normalizePercent(value);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="font-mono text-[0.55rem] uppercase tracking-wider" style={{ color: "#606060" }}>{label}</span>
        <span className="font-mono text-[0.55rem]" style={{ color: "#A0A0A0" }}>{percent.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}55` }}
        />
      </div>
    </div>
  );
}

export default function EmployabilityScore({
  employability,
  skillGaps = [],
}: {
  employability: EmployabilityScoreType | null;
  skillGaps?: SkillGap[];
}) {
  if (!employability) {
    return (
      <div className="rounded-sm p-8 text-center" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em]" style={{ color: "#606060" }}>
          Analyze a resume to reveal the score dashboard
        </p>
      </div>
    );
  }

  const score = normalizePercent(employability.overall_score);
  const invalidScore = score < 10;
  const displayScore = invalidScore ? 0 : score;
  const color = invalidScore ? "#606060" : colorForScore(score);
  const grade = invalidScore ? "--" : gradeForScore(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference - (displayScore / 100) * circumference;
  const potential = Math.min(100, score + normalizePercent(employability.improvement_potential));
  const actions = skillGaps.slice(0, 3);
  const salary = employability.salary_prediction;

  return (
    <div className="space-y-4">
      <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-6 items-center">
          <div className="relative w-[150px] h-[150px] mx-auto">
            <svg width="150" height="150" className="-rotate-90">
              <circle cx="75" cy="75" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
              <motion.circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dash }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="font-display text-5xl leading-none"
                style={{ color }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {invalidScore ? "--" : score.toFixed(0)}
              </motion.span>
              <span className="font-mono text-[0.5rem] uppercase tracking-widest" style={{ color: "#606060" }}>Score</span>
              <span className="mt-2 px-2 py-1 rounded-sm font-mono text-[0.55rem] uppercase" style={{ color, background: `${color}12`, border: `1px solid ${color}33` }}>
                {grade}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {invalidScore && (
              <div className="rounded-sm px-4 py-3" style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)" }}>
                <p className="font-mono text-[0.58rem] uppercase tracking-wider" style={{ color: "#FF2D2D" }}>
                  Score data looks incomplete. Trigger a market scrape and rerun analysis.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Skill Match" value={`${normalizePercent(employability.skill_match_score).toFixed(0)}%`} color="#C8FF00" />
              <MetricCard label="Market Align" value={`${normalizePercent(employability.market_alignment).toFixed(0)}%`} color="#FF6B35" />
              <MetricCard label="Future Ready" value={`${normalizePercent(employability.future_readiness).toFixed(0)}%`} color="#A855F7" />
              <MetricCard label="GitHub Bonus" value={`+${normalizePercent(employability.github_bonus).toFixed(0)}`} color="#C8FF00" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-sm p-5 space-y-4" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase" style={{ color: "#606060" }}>Score Breakdown</p>
        <BreakdownBar label="Current Skills" value={employability.score_breakdown.current_skills} color="#C8FF00" />
        <BreakdownBar label="Trending Skills" value={employability.score_breakdown.trending_skills} color="#FF6B35" />
        <BreakdownBar label="Market Demand" value={employability.score_breakdown.market_demand} color="#A855F7" />
        <BreakdownBar label="GitHub Presence" value={employability.score_breakdown.github_presence} color="#C8FF00" />
      </div>

      <div className="rounded-sm p-5" style={{ background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.18)" }}>
        <p className="font-display text-2xl leading-none mb-2" style={{ color: "#C8FF00" }}>
          You could reach {invalidScore ? "--" : `${potential.toFixed(0)}%`}
        </p>
        <p className="font-body text-xs mb-4" style={{ color: "#A0A0A0" }}>with focused improvements in the next learning cycle.</p>
        <div className="space-y-2">
          {actions.length ? actions.map((gap) => (
            <div key={gap.skill} className="flex items-center justify-between gap-3 rounded-sm px-3 py-2" style={{ background: "rgba(10,10,10,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="font-mono text-[0.58rem] uppercase tracking-wider" style={{ color: "#A0A0A0" }}>{gap.skill}</span>
              <span className="font-mono text-[0.52rem]" style={{ color: "#606060" }}>{gap.priority}</span>
            </div>
          )) : (
            <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "#606060" }}>No critical gaps found</p>
          )}
        </div>
      </div>

      <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-3" style={{ color: "#FF6B35" }}>Salary Prediction</p>
        <p className="font-display text-3xl leading-none" style={{ color: "#F0F0F0" }}>
          {salary?.formatted || "Run analysis to see salary prediction"}
        </p>
        {salary && <BreakdownBar label="Confidence" value={salary.confidence} color="#FF6B35" />}
      </div>
    </div>
  );
}
