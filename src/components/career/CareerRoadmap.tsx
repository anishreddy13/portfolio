"use client";

import { motion } from "framer-motion";
import type { CareerRoadmap as CareerRoadmapType, SkillTrend } from "@/types/career";

export default function CareerRoadmap({
  roadmap,
  marketSkills = [],
}: {
  roadmap: CareerRoadmapType | null;
  marketSkills?: SkillTrend[];
}) {
  const monthlyPlan = roadmap?.monthly_plan ?? [];
  const keyProjects = roadmap?.key_projects ?? [];
  const skillPriorityOrder = roadmap?.skill_priority_order ?? [];

  if (!roadmap) {
    return (
      <div className="rounded-sm p-10 text-center min-h-[360px] flex items-center justify-center" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div className="text-4xl opacity-30 mb-4">🗺️</div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em]" style={{ color: "var(--text-tertiary)" }}>
            Complete resume analysis to generate roadmap. Make sure Career API is online.
          </p>
        </div>
      </div>
    );
  }

  const demandBySkill = new Map(marketSkills.map((skill) => [skill.skill?.toLowerCase(), skill.demand_score]));

  return (
    <div className="space-y-4">
      <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-2" style={{ color: "#A855F7" }}>Career Path</p>
            <h3 className="font-display text-4xl leading-none" style={{ color: "var(--text-primary)" }}>{roadmap.target_role || "Career Roadmap"}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-sm px-3 py-2 font-mono text-[0.55rem] uppercase tracking-widest" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", color: "#A855F7" }}>{roadmap.total_months || 6} Months</span>
            <span className="rounded-sm px-3 py-2 font-mono text-[0.55rem] uppercase tracking-widest" style={{ background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.2)", color: "#C8FF00" }}>{roadmap.estimated_salary_range || "Market competitive"}</span>
          </div>
        </div>
      </div>

      {monthlyPlan.length ? (
      <div className="overflow-x-auto pb-2">
        <div className="flex flex-col md:flex-row gap-3 md:min-w-[980px]">
          {monthlyPlan.map((month, index) => {
            const skillsToLearn = month.skills_to_learn ?? [];
            const resources = month.resources ?? [];
            return (
            <motion.div
              key={`${month.month}-${month.focus || index}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="relative rounded-sm p-4 md:w-1/6 min-w-0"
              style={{
                background: "var(--surface-1)",
                border: index === 0 ? "1px solid rgba(200,255,0,0.35)" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex md:block items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-sm font-display text-xl shrink-0" style={{ background: index === 0 ? "#C8FF00" : "var(--surface-2)", color: index === 0 ? "#0A0A0A" : "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {month.month}
                </span>
                <p className="font-mono text-[0.58rem] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{month.focus}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {skillsToLearn.map((skill) => (
                  <span key={skill} className="rounded-sm px-2 py-1 font-mono text-[0.5rem] uppercase" style={{ background: "rgba(200,255,0,0.07)", color: "#C8FF00", border: "1px solid rgba(200,255,0,0.15)" }}>{skill}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {resources.map((resource) => (
                  <a key={resource} href={`https://www.google.com/search?q=${encodeURIComponent(resource)}`} target="_blank" rel="noreferrer" className="font-body text-[0.65rem] underline-offset-2 hover:underline" style={{ color: "var(--text-tertiary)" }}>{resource}</a>
                ))}
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>{month.milestone}</p>
            </motion.div>
          )})}
        </div>
      </div>
      ) : (
        <div className="rounded-sm p-5" style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-3" style={{ color: "#A855F7" }}>Detailed roadmap requires Groq API to be responsive</p>
          <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{roadmap.market_context || "Complete resume analysis to generate roadmap. Make sure Career API is online."}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-4" style={{ color: "#C8FF00" }}>Skill Priority</p>
          <div className="space-y-2">
            {skillPriorityOrder.length ? skillPriorityOrder.map((skill, index) => (
              <motion.div key={skill} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} className="flex items-center gap-3 rounded-sm p-2.5" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="font-display text-xl w-8" style={{ color: "#C8FF00" }}>{index + 1}</span>
                <span className="font-mono text-[0.6rem] uppercase tracking-wider flex-1" style={{ color: "var(--text-secondary)" }}>{skill}</span>
                <span className="font-mono text-[0.55rem]" style={{ color: "var(--text-tertiary)" }}>{(demandBySkill.get(skill.toLowerCase()) || 0).toFixed(0)}%</span>
              </motion.div>
            )) : <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Skill priorities appear after roadmap generation.</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-4" style={{ color: "#FF6B35" }}>Key Projects</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {keyProjects.length ? keyProjects.map((project) => (
                <div key={project} className="rounded-sm p-3" style={{ background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.18)" }}>
                  <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{project}</p>
                </div>
              )) : <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Project recommendations appear after roadmap generation.</p>}
            </div>
          </div>
          <div className="rounded-sm p-5" style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)" }}>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-3" style={{ color: "#A855F7" }}>Market Context</p>
            <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{roadmap.market_context}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
