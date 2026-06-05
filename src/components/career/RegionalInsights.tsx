"use client";

import { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { predictSalary } from "../../../lib/careerApi";
import type { SalaryPrediction, StudentAnalysisResult } from "@/types/career";

const commonSkills = ["python", "react", "typescript", "fastapi", "pytorch", "docker", "kubernetes", "aws", "postgresql", "langchain", "javascript", "mlops"];
const roles = ["ML Engineer", "Frontend Dev", "DevOps", "Data Scientist"];
const locations = ["Hyderabad", "Bangalore", "Remote India", "US Remote"];

export default function RegionalInsights({ analysisResult }: { analysisResult?: StudentAnalysisResult | null }) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["python", "react"]);
  const [experience, setExperience] = useState("mid");
  const [location, setLocation] = useState("india");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SalaryPrediction | null>(null);
  const parsedSkills = analysisResult?.data.parsed_resume.skills ?? [];
  const analysisSalary = analysisResult?.data.salary_prediction || analysisResult?.data.employability?.salary_prediction || null;

  useEffect(() => {
    if (!analysisResult) return;
    const resumeSkills = Array.from(new Set(parsedSkills.map((skill) => skill.toLowerCase()))).slice(0, 10);
    if (resumeSkills.length) setSelectedSkills(resumeSkills);
    const level = analysisResult.data.parsed_resume.experience_level?.toLowerCase();
    if (level === "junior" || level === "mid" || level === "senior") setExperience(level);
    if (analysisSalary) setResult(analysisSalary);
  }, [analysisResult, analysisSalary, parsedSkills]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((value) => value.includes(skill) ? value.filter((item) => item !== skill) : [...value, skill]);
  };

  const calculate = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await predictSalary({ skills: selectedSkills, experience_level: experience, location }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not predict salary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-4" style={{ color: "#C8FF00" }}>Salary Calculator</p>
        {parsedSkills.length ? (
          <div className="rounded-sm p-3 mb-4" style={{ background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.14)" }}>
            <p className="font-mono text-[0.52rem] uppercase tracking-widest" style={{ color: "#C8FF00" }}>Using resume skills from the latest analysis</p>
            <p className="font-body text-xs mt-1" style={{ color: "#606060" }}>{selectedSkills.slice(0, 8).join(", ")}</p>
          </div>
        ) : null}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <p className="font-mono text-[0.55rem] uppercase tracking-widest mb-2" style={{ color: "#606060" }}>Skills</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...commonSkills, ...parsedSkills.map((skill) => skill.toLowerCase()).slice(0, 10)])).map((skill) => {
                const active = selectedSkills.includes(skill);
                return (
                  <button key={skill} onClick={() => toggleSkill(skill)} className="rounded-sm px-3 py-2 font-mono text-[0.55rem] uppercase tracking-wider" style={{ background: active ? "rgba(200,255,0,0.12)" : "var(--surface-2)", border: `1px solid ${active ? "rgba(200,255,0,0.28)" : "rgba(255,255,255,0.06)"}`, color: active ? "#C8FF00" : "#606060" }}>{skill}</button>
                );
              })}
            </div>
          </div>
          <div className="space-y-3">
            <select value={experience} onChange={(event) => setExperience(event.target.value)} className="w-full rounded-sm px-3 py-3 font-mono text-[0.62rem] uppercase bg-transparent" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "#A0A0A0" }}>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
            </select>
            <select value={location} onChange={(event) => setLocation(event.target.value)} className="w-full rounded-sm px-3 py-3 font-mono text-[0.62rem] uppercase bg-transparent" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "#A0A0A0" }}>
              <option value="india">India</option>
              <option value="us">US</option>
              <option value="europe">Europe</option>
              <option value="remote">Remote</option>
            </select>
            <button onClick={calculate} disabled={loading || !selectedSkills.length} className="w-full rounded-sm py-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] disabled:opacity-50" style={{ background: "#C8FF00", color: "#0A0A0A" }}>{loading ? "Calculating..." : "Calculate"}</button>
          </div>
        </div>
        {error && <p className="font-mono text-[0.6rem] mt-4" style={{ color: "#FF2D2D" }}>{error}</p>}
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-sm p-4" style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.18)" }}>
            <p className="font-display text-4xl leading-none" style={{ color: "#C8FF00" }}>{result.formatted}</p>
            <p className="font-mono text-[0.55rem] uppercase tracking-widest mt-2" style={{ color: "#606060" }}>{result.currency} · median {Math.round(result.median_salary).toLocaleString()} · {(result.confidence * 100).toFixed(0)}% confidence</p>
          </motion.div>
        )}
      </div>

      <div className="rounded-sm p-5 overflow-x-auto" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-4" style={{ color: "#FF6B35" }}>Regional Comparison</p>
        <div className="min-w-[640px] grid grid-cols-5 gap-2">
          <div />
          {locations.map((loc) => <div key={loc} className="font-mono text-[0.55rem] uppercase tracking-wider" style={{ color: "#606060" }}>{loc}</div>)}
          {roles.map((role, row) => (
            <Fragment key={role}>
              <div key={`${role}-label`} className="font-mono text-[0.58rem] uppercase" style={{ color: "#A0A0A0" }}>{role}</div>
              {locations.map((loc, col) => (
                <div key={`${role}-${loc}`} className="rounded-sm p-2 font-mono text-[0.55rem]" style={{ background: col === 3 ? "rgba(168,85,247,0.1)" : "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)", color: row < 2 ? "#C8FF00" : "#FF6B35" }}>
                  {col === 3 ? "$110k-210k" : `₹${8 + row * 3 + col * 2}L-${16 + row * 4 + col * 3}L`}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-sm p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] mb-4" style={{ color: "#A855F7" }}>Experience Multiplier</p>
          {[
            { label: "Junior", value: 38, color: "#606060" },
            { label: "Mid", value: 68, color: "#FF6B35" },
            { label: "Senior", value: 100, color: "#C8FF00" },
          ].map((item) => (
            <div key={item.label} className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[0.58rem] uppercase" style={{ color: "#A0A0A0" }}>{item.label}</span>
                <span className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>{item.value}%</span>
              </div>
              <div className="h-3 rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} className="h-full" style={{ background: item.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            ["Hyderabad is India's fastest growing AI hub", "#C8FF00"],
            ["Remote roles pay 40% more than office roles", "#FF6B35"],
            ["MLOps skills add ₹3-5L to base salary", "#A855F7"],
            ["GitHub presence increases hire rate by 35%", "#FF2D2D"],
          ].map(([text, color]) => (
            <div key={text} className="rounded-sm p-4" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="block w-1.5 h-1.5 rounded-full mb-3" style={{ background: color }} />
              <p className="font-body text-xs leading-relaxed" style={{ color: "#A0A0A0" }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
