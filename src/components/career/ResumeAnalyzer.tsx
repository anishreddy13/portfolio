"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { analyzeStudentFull } from "../../../lib/careerApi";
import type { StudentAnalysisResult } from "@/types/career";
import EmployabilityScore from "./EmployabilityScore";

const sampleResume = `Software Engineer with 3 years experience.
Skills: Python, React, Node.js, Docker, PostgreSQL.
Experience: Built REST APIs with FastAPI. Deployed ML models. Used PyTorch for deep learning projects.
Education: B.Tech Computer Science 2021.
Projects: E-commerce platform, ML dashboard, chatbot using LangChain.`;

type ResultTab = "score" | "gaps" | "skills" | "profile";

function LoadingBars() {
  return (
    <div className="rounded-sm px-6 py-16 flex flex-col items-center justify-center min-h-[420px]" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <motion.div className="grid grid-cols-5 gap-1 mb-5">
        {Array.from({ length: 15 }).map((_, index) => (
          <motion.span key={index} className="w-2 h-8 rounded-full" style={{ background: "#C8FF00" }} animate={{ scaleY: [0.25, 1, 0.25], opacity: [0.25, 1, 0.25] }} transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.04 }} />
        ))}
      </motion.div>
      <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase" style={{ color: "#606060" }}>Career AI is warming up... (30s)</p>
    </div>
  );
}

function DemandBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }} style={{ background: color }} />
    </div>
  );
}

export default function ResumeAnalyzer({
  onAnalysisComplete,
}: {
  onAnalysisComplete: (result: StudentAnalysisResult) => void;
}) {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>("score");

  useEffect(() => {
    const stored = localStorage.getItem("career_user_id");
    if (stored) setUserId(stored);
    else {
      const id = crypto.randomUUID();
      localStorage.setItem("career_user_id", id);
      setUserId(id);
    }
  }, []);

  const fillExample = () => {
    setName("Alex Kumar");
    setTargetRole("ML Engineer");
    setGithubUrl("");
    setResumeText(sampleResume);
  };

  const analyze = async () => {
    if (!resumeText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeStudentFull({
        user_id: userId || crypto.randomUUID(),
        name: name || "Anonymous Student",
        resume_text: resumeText.slice(0, 5000),
        github_url: githubUrl,
        target_role: targetRole || "software engineer",
      });
      setResult(data);
      onAnalysisComplete(data);
      setActiveResultTab("score");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze resume.");
    } finally {
      setLoading(false);
    }
  };

  const data = result?.data;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="rounded-sm p-4 sm:p-5 space-y-3" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em]" style={{ color: "#C8FF00" }}>Resume Input</p>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="w-full rounded-sm px-3 py-3 bg-transparent font-mono text-sm focus:outline-none" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "#F0F0F0" }} />
        <input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="e.g. ML Engineer, Frontend Dev" className="w-full rounded-sm px-3 py-3 bg-transparent font-mono text-sm focus:outline-none" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "#F0F0F0" }} />
        <input value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} placeholder="https://github.com/username" className="w-full rounded-sm px-3 py-3 bg-transparent font-mono text-sm focus:outline-none" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "#F0F0F0" }} />
        <div className="rounded-sm overflow-hidden" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex justify-between px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "#606060" }}>Resume</span>
            <span className="font-mono text-[0.55rem]" style={{ color: resumeText.length > 4500 ? "#FF2D2D" : "#606060" }}>{resumeText.length}/5000</span>
          </div>
          <textarea value={resumeText} onChange={(event) => setResumeText(event.target.value.slice(0, 5000))} rows={12} placeholder={"Paste your resume text here...\nInclude skills, experience, projects, education."} className="w-full bg-transparent px-3 py-3 font-body text-sm resize-none focus:outline-none leading-relaxed" style={{ color: "#F0F0F0" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button onClick={fillExample} className="rounded-sm py-3 font-mono text-[0.62rem] uppercase tracking-[0.18em]" style={{ background: "var(--surface-2)", color: "#A0A0A0", border: "1px solid rgba(255,255,255,0.06)" }}>Example Resume</button>
          <button onClick={analyze} disabled={loading || !resumeText.trim()} className="rounded-sm py-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] disabled:opacity-40" style={{ background: "#C8FF00", color: "#0A0A0A" }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-4 h-4 border-2 rounded-full"
                  style={{ borderColor: "rgba(10,10,10,0.3)", borderTopColor: "#0A0A0A" }}
                />
                Analyzing...
              </span>
            ) : "Analyze"}
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

      <div className="min-h-[520px]">
        <AnimatePresence mode="wait">
          {loading ? <LoadingBars /> : data ? (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-sm overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="grid grid-cols-4 gap-1 p-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {(["score", "gaps", "skills", "profile"] as ResultTab[]).map((tab) => (
                  <button key={tab} onClick={() => setActiveResultTab(tab)} className="rounded-sm py-2 font-mono text-[0.55rem] uppercase tracking-wider" style={{ background: activeResultTab === tab ? "rgba(200,255,0,0.12)" : "transparent", color: activeResultTab === tab ? "#C8FF00" : "#606060" }}>{tab}</button>
                ))}
              </div>
              <div className="p-4">
                {activeResultTab === "score" && <EmployabilityScore employability={data.employability} skillGaps={data.skill_gaps} />}
                {activeResultTab === "gaps" && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      {data.skill_gaps.map((gap) => (
                        <div key={gap.skill} className="rounded-sm p-3" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                          <div className="flex justify-between gap-3 mb-2">
                            <span className="font-mono text-[0.62rem] uppercase" style={{ color: "#A0A0A0" }}>{gap.skill}</span>
                            <span className="font-mono text-[0.5rem] uppercase px-2 py-1 rounded-sm" style={{ color: gap.priority === "critical" ? "#FF2D2D" : gap.priority === "high" ? "#FF6B35" : "#FFD166", background: "rgba(255,255,255,0.04)" }}>{gap.priority}</span>
                          </div>
                          <DemandBar value={gap.demand_score} color={gap.priority === "critical" ? "#FF2D2D" : "#FF6B35"} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-3" style={{ color: "#C8FF00" }}>Quick Wins</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {data.quick_wins.map((win) => (
                          <div key={win.skill} className="rounded-sm p-3" style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.16)" }}>
                            <p className="font-mono text-[0.6rem] uppercase" style={{ color: "#C8FF00" }}>{win.skill}</p>
                            <p className="font-body text-xs mt-2" style={{ color: "#A0A0A0" }}>{win.time_to_learn} · {win.why}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeResultTab === "skills" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-3" style={{ color: "#C8FF00" }}>Your Skills</p>
                      <div className="space-y-2">{data.parsed_resume.skills.map((skill) => <div key={skill} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#C8FF00" }} /><span className="font-mono text-[0.6rem] uppercase" style={{ color: "#A0A0A0" }}>{skill}</span></div>)}</div>
                    </div>
                    <div>
                      <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-3" style={{ color: "#FF6B35" }}>Market Match</p>
                      <div className="space-y-3">{data.matching_skills.map((skill) => <div key={skill.skill}><div className="flex justify-between mb-1"><span className="font-mono text-[0.6rem] uppercase" style={{ color: "#A0A0A0" }}>{skill.skill}</span><span className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>{skill.demand_score.toFixed(0)}%</span></div><DemandBar value={skill.demand_score} color="#FF6B35" /></div>)}</div>
                    </div>
                  </div>
                )}
                {activeResultTab === "profile" && (
                  <div className="space-y-3">
                    <div className="rounded-sm p-3" style={{ background: "var(--surface-2)" }}><span className="font-mono text-[0.55rem] uppercase" style={{ color: "#606060" }}>Experience </span><span className="font-display text-xl" style={{ color: "#C8FF00" }}>{data.parsed_resume.experience_level}</span></div>
                    <div className="rounded-sm p-3" style={{ background: "var(--surface-2)" }}><p className="font-mono text-[0.55rem] uppercase mb-2" style={{ color: "#606060" }}>Education</p><pre className="font-body text-xs whitespace-pre-wrap" style={{ color: "#A0A0A0" }}>{JSON.stringify(data.parsed_resume.education, null, 2)}</pre></div>
                    <div className="rounded-sm p-3" style={{ background: "var(--surface-2)" }}><p className="font-mono text-[0.55rem] uppercase mb-2" style={{ color: "#606060" }}>Projects</p><div className="space-y-1">{data.parsed_resume.projects.map((project) => <p key={project} className="font-body text-xs" style={{ color: "#A0A0A0" }}>{project}</p>)}</div></div>
                    <div className="rounded-sm p-3" style={{ background: "var(--surface-2)" }}><p className="font-mono text-[0.55rem] uppercase mb-2" style={{ color: "#606060" }}>Contact</p><pre className="font-body text-xs whitespace-pre-wrap" style={{ color: "#A0A0A0" }}>{JSON.stringify(data.parsed_resume.contact, null, 2)}</pre></div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" className="rounded-sm px-6 py-16 flex flex-col items-center justify-center text-center min-h-[520px]" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-4xl opacity-30 mb-4">📄</div>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] mb-2" style={{ color: "#606060" }}>Results appear here</p>
              <p className="font-body text-xs max-w-xs" style={{ color: "#404040" }}>Run the full analysis to see score, gaps, skills, profile parsing, roadmap, and salary predictions.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
