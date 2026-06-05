"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { analyzeStudentFull } from "../../../lib/careerApi";
import type { SkillGap, SkillTrend, StudentAnalysisResult } from "@/types/career";
import EmployabilityScore from "./EmployabilityScore";
import PdfResumeUploader from "./PdfResumeUploader";

const sampleResume = `Software Engineer with 3 years experience.
Skills: Python, React, Node.js, Docker, PostgreSQL.
Experience: Built REST APIs with FastAPI. Deployed ML models. Used PyTorch for deep learning projects.
Education: B.Tech Computer Science 2021.
Projects: E-commerce platform, ML dashboard, chatbot using LangChain.`;

const analysisSteps = [
  "Parsing resume...",
  "Fetching market data...",
  "Computing employability...",
  "Generating roadmap...",
  "Analysis complete!",
];

type ResultTab = "score" | "gaps" | "skills" | "profile";

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `career-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function LoadingProgress({ stepIndex }: { stepIndex: number }) {
  const progress = ((stepIndex + 1) / analysisSteps.length) * 100;
  return (
    <div className="rounded-sm px-6 py-16 flex flex-col items-center justify-center min-h-[520px]" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <motion.div className="grid grid-cols-5 gap-1 mb-6">
        {Array.from({ length: 15 }).map((_, index) => (
          <motion.span key={index} className="w-2 h-8 rounded-full" style={{ background: "#C8FF00" }} animate={{ scaleY: [0.25, 1, 0.25], opacity: [0.25, 1, 0.25] }} transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.04 }} />
        ))}
      </motion.div>
      <p className="font-mono text-[0.62rem] tracking-[0.22em] uppercase mb-4" style={{ color: "#C8FF00" }}>
        {analysisSteps[Math.min(stepIndex, analysisSteps.length - 1)]}
      </p>
      <div className="w-full max-w-sm h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full" style={{ background: "#C8FF00" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.45 }} />
      </div>
      <p className="font-body text-xs mt-4 text-center max-w-xs" style={{ color: "#606060" }}>
        Career AI is warming up if the Space was asleep. First runs can take around 30 seconds.
      </p>
    </div>
  );
}

function DemandBar({ value, color = "#C8FF00" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(value || 0, 100)}%` }} transition={{ duration: 0.75 }} style={{ background: color }} />
    </div>
  );
}

function priorityColor(priority: string) {
  if (priority === "critical") return "#FF2D2D";
  if (priority === "high") return "#FF6B35";
  return "#A855F7";
}

function experienceColor(level?: string) {
  const normalized = (level || "").toLowerCase();
  if (normalized.includes("senior")) return "#C8FF00";
  if (normalized.includes("mid")) return "#FF6B35";
  return "#A855F7";
}

function educationLine(education: Record<string, string>) {
  const degree = education.degree || education.qualification || education.education || "";
  const field = education.field || education.major || education.specialization || "";
  const institution = education.institution || education.university || education.school || "";
  return { degree, field, institution };
}

function GapsPanel({ gaps, quickWins }: { gaps: SkillGap[]; quickWins: StudentAnalysisResult["data"]["quick_wins"] }) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {gaps.length ? gaps.map((gap) => (
          <motion.div key={gap.skill} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-sm p-3" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex justify-between gap-3 mb-2">
              <span className="font-mono text-[0.62rem] uppercase" style={{ color: "#F0F0F0" }}>{gap.skill}</span>
              <span className="font-mono text-[0.5rem] uppercase px-2 py-1 rounded-sm" style={{ color: priorityColor(gap.priority), background: `${priorityColor(gap.priority)}12`, border: `1px solid ${priorityColor(gap.priority)}33` }}>{gap.priority}</span>
            </div>
            <DemandBar value={gap.demand_score} />
            <p className="font-body text-xs leading-relaxed mt-2" style={{ color: "#606060" }}>{gap.reason}</p>
          </motion.div>
        )) : (
          <div className="rounded-sm p-5 text-center" style={{ background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.16)" }}>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: "#C8FF00" }}>No critical gaps found.</p>
            <p className="font-body text-xs mt-2" style={{ color: "#A0A0A0" }}>Your skills align well with market demand.</p>
          </div>
        )}
      </div>

      <div>
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-3" style={{ color: "#C8FF00" }}>Quick Wins</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickWins.length ? quickWins.map((win) => (
            <div key={`${win.skill}-${win.relates_to}`} className="rounded-sm p-3" style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.16)" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-mono text-[0.6rem] uppercase" style={{ color: "#C8FF00" }}>{win.skill}</p>
                <span className="shrink-0 rounded-sm px-2 py-1 font-mono text-[0.48rem] uppercase" style={{ color: "#0A0A0A", background: "#C8FF00" }}>{win.time_to_learn}</span>
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "#A0A0A0" }}>{win.why}</p>
              <p className="font-mono text-[0.5rem] uppercase tracking-widest mt-2" style={{ color: "#606060" }}>Relates to {win.relates_to || "your current stack"}</p>
            </div>
          )) : (
            <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "#606060" }}>Quick wins appear after market skills are available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResumeAnalyzer({
  onAnalysisComplete,
  onOpenMarketTab,
}: {
  onAnalysisComplete: (result: StudentAnalysisResult) => void;
  onOpenMarketTab?: () => void;
}) {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<StudentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>("score");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("career_user_id");
    if (stored) setUserId(stored);
    else {
      const id = makeId();
      localStorage.setItem("career_user_id", id);
      setUserId(id);
    }
  }, []);

  useEffect(() => {
    if (!loading) return;
    setStepIndex(0);
    const timers = analysisSteps.map((_, index) => window.setTimeout(() => setStepIndex(index), index * 800));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [loading]);

  const fillExample = () => {
    setName("Alex Kumar");
    setTargetRole("ML Engineer");
    setGithubUrl("");
    setResumeText(sampleResume);
  };

  const analyze = async () => {
    if (!resumeText.trim()) {
      setError("Please upload a PDF or paste resume text first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await analyzeStudentFull({
        user_id: userId || makeId(),
        name: name || "Anonymous Student",
        resume_text: resumeText.slice(0, 5000),
        github_url: githubUrl,
        target_role: targetRole || "software engineer",
      });
      setStepIndex(analysisSteps.length - 1);
      setResult(data);
      onAnalysisComplete(data);
      setActiveResultTab("score");
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze resume.");
    } finally {
      window.setTimeout(() => setLoading(false), 250);
    }
  };

  const data = result?.data;
  const marketSkills = useMemo(() => new Set((data?.market_snapshot?.top_skills || []).map((skill) => skill.skill.toLowerCase())), [data]);
  const score = Number(data?.employability?.overall_score || 0);
  const scoreUnavailable = !data?.employability || score <= 0;
  const education = educationLine(data?.parsed_resume.education || {});
  const contact = data?.parsed_resume.contact || {};

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="rounded-sm p-4 sm:p-5 space-y-3" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em]" style={{ color: "#C8FF00" }}>Resume Input</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="w-full rounded-sm px-3 py-3 bg-transparent font-mono text-sm focus:outline-none" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "#F0F0F0" }} />
          <input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="e.g. ML Engineer, Frontend Dev" className="w-full rounded-sm px-3 py-3 bg-transparent font-mono text-sm focus:outline-none" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "#F0F0F0" }} />
        </div>
        <input value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} placeholder="https://github.com/username" className="w-full rounded-sm px-3 py-3 bg-transparent font-mono text-sm focus:outline-none" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "#F0F0F0" }} />

        <PdfResumeUploader value={resumeText} onChange={setResumeText} onTextExtracted={setResumeText} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button onClick={fillExample} className="rounded-sm py-3 font-mono text-[0.62rem] uppercase tracking-[0.18em]" style={{ background: "var(--surface-2)", color: "#A0A0A0", border: "1px solid rgba(255,255,255,0.06)" }}>Example Resume</button>
          <button onClick={analyze} disabled={loading || !resumeText.trim()} className="rounded-sm py-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] disabled:opacity-40" style={{ background: "#C8FF00", color: "#0A0A0A" }}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-sm px-4 py-3" style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)" }}>
              <p className="font-mono text-[0.62rem]" style={{ color: "#FF2D2D" }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div ref={resultRef} className="min-h-[520px] scroll-mt-28">
        <AnimatePresence mode="wait">
          {loading ? <LoadingProgress stepIndex={stepIndex} /> : data ? (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-sm overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="grid grid-cols-4 gap-1 p-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {(["score", "gaps", "skills", "profile"] as ResultTab[]).map((tab) => (
                  <button key={tab} onClick={() => setActiveResultTab(tab)} className="rounded-sm py-2 font-mono text-[0.55rem] uppercase tracking-wider" style={{ background: activeResultTab === tab ? "rgba(200,255,0,0.12)" : "transparent", color: activeResultTab === tab ? "#C8FF00" : "#606060" }}>{tab}</button>
                ))}
              </div>
              <div className="p-4">
                {activeResultTab === "score" && (
                  <div className="space-y-4">
                    {scoreUnavailable && (
                      <div className="rounded-sm p-4" style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.25)" }}>
                        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: "#FF6B35" }}>
                          Trigger a job scrape first for accurate scoring.
                        </p>
                        <button onClick={onOpenMarketTab} className="mt-3 rounded-sm px-3 py-2 font-mono text-[0.55rem] uppercase tracking-widest" style={{ background: "#FF6B35", color: "#0A0A0A" }}>
                          Open Market Tab
                        </button>
                      </div>
                    )}
                    {data.market_data_source === "fallback" && (
                      <div className="rounded-sm p-3" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.22)" }}>
                        <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "#A855F7" }}>Using fallback market data until live scrape results are available.</p>
                      </div>
                    )}
                    <EmployabilityScore employability={data.employability} skillGaps={data.skill_gaps} />
                  </div>
                )}
                {activeResultTab === "gaps" && <GapsPanel gaps={data.skill_gaps} quickWins={data.quick_wins} />}
                {activeResultTab === "skills" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-3" style={{ color: "#C8FF00" }}>Your Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {data.parsed_resume.skills.length ? data.parsed_resume.skills.map((skill) => {
                          const inMarket = marketSkills.has(skill.toLowerCase());
                          return <span key={skill} className="rounded-sm px-2.5 py-1.5 font-mono text-[0.55rem] uppercase tracking-wider" style={{ color: inMarket ? "#C8FF00" : "#606060", background: inMarket ? "rgba(200,255,0,0.07)" : "var(--surface-2)", border: `1px solid ${inMarket ? "rgba(200,255,0,0.18)" : "rgba(255,255,255,0.05)"}` }}>{skill}</span>;
                        }) : <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "#606060" }}>No skills detected. Add a skills section and rerun analysis.</p>}
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-3" style={{ color: "#FF6B35" }}>Market Match</p>
                      <div className="space-y-3">
                        {data.matching_skills.length ? data.matching_skills.map((skill: SkillTrend) => (
                          <div key={skill.skill}>
                            <div className="flex justify-between mb-1">
                              <span className="font-mono text-[0.6rem] uppercase" style={{ color: "#A0A0A0" }}>{skill.skill}</span>
                              <span className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>{Number(skill.demand_score || 0).toFixed(0)}%</span>
                            </div>
                            <DemandBar value={Number(skill.demand_score || 0)} color="#FF6B35" />
                          </div>
                        )) : <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "#606060" }}>No market matches yet. Trigger scrape to populate trends.</p>}
                      </div>
                    </div>
                  </div>
                )}
                {activeResultTab === "profile" && (
                  <div className="space-y-3">
                    <div className="rounded-sm p-4" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <p className="font-mono text-[0.55rem] uppercase mb-2" style={{ color: "#606060" }}>Experience Level</p>
                      <span className="inline-flex rounded-sm px-3 py-2 font-display text-2xl uppercase tracking-wider" style={{ color: experienceColor(data.parsed_resume.experience_level), background: `${experienceColor(data.parsed_resume.experience_level)}10`, border: `1px solid ${experienceColor(data.parsed_resume.experience_level)}28` }}>
                        {data.parsed_resume.experience_level || "Unknown"}
                      </span>
                    </div>
                    <div className="rounded-sm p-4" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <p className="font-mono text-[0.55rem] uppercase mb-3" style={{ color: "#606060" }}>Education</p>
                      <p className="font-body text-sm" style={{ color: "#F0F0F0" }}>{[education.degree, education.field].filter(Boolean).join(" in ") || "Education not detected"}</p>
                      {education.institution && <p className="font-body text-xs mt-1" style={{ color: "#A0A0A0" }}>{education.institution}</p>}
                    </div>
                    <div className="rounded-sm p-4" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <p className="font-mono text-[0.55rem] uppercase mb-3" style={{ color: "#606060" }}>Projects</p>
                      <div className="space-y-2">
                        {data.parsed_resume.projects.length ? data.parsed_resume.projects.map((project) => <p key={project} className="font-body text-xs leading-relaxed" style={{ color: "#A0A0A0" }}>• {project}</p>) : <p className="font-body text-xs" style={{ color: "#606060" }}>No projects detected.</p>}
                      </div>
                    </div>
                    <div className="rounded-sm p-4" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <p className="font-mono text-[0.55rem] uppercase mb-3" style={{ color: "#606060" }}>Contact</p>
                      <div className="space-y-2">
                        {Object.entries(contact).filter(([, value]) => value).length ? Object.entries(contact).filter(([, value]) => value).map(([key, value]) => {
                          const href = key.includes("email") ? `mailto:${value}` : value.startsWith("http") ? value : undefined;
                          return href ? (
                            <a key={key} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="block font-body text-xs hover:underline" style={{ color: "#C8FF00" }}>{key}: {value}</a>
                          ) : (
                            <p key={key} className="font-body text-xs" style={{ color: "#A0A0A0" }}>{key}: {value}</p>
                          );
                        }) : <p className="font-body text-xs" style={{ color: "#606060" }}>No contact fields detected.</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" className="rounded-sm px-6 py-16 flex flex-col items-center justify-center text-center min-h-[520px]" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-4xl opacity-30 mb-4">📄</div>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] mb-2" style={{ color: "#606060" }}>Results appear here</p>
              <p className="font-body text-xs max-w-xs" style={{ color: "#404040" }}>Upload a PDF or paste resume text to see score, gaps, skills, profile parsing, roadmap, and salary predictions.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
