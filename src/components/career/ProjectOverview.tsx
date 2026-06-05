"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const stats = [
  { value: 6, suffix: "+", label: "Intelligence modules", color: "#C8FF00" },
  { value: 50, suffix: "+", label: "Skills tracked", color: "#FF6B35" },
  { value: 100, suffix: "%", label: "API driven", color: "#A855F7" },
];

const flow = [
  { step: "01", title: "Resume Intake", copy: "The student uploads a PDF or pastes resume text." },
  { step: "02", title: "Skill Extraction", copy: "The system identifies skills, projects, education, and experience." },
  { step: "03", title: "Market Match", copy: "Live job-market signals are compared against the profile." },
  { step: "04", title: "AI Planning", copy: "A six-month roadmap and salary outlook are generated." },
  { step: "05", title: "Mentor Loop", copy: "The mentor chat turns the analysis into practical next steps." },
];

const stack = ["Next.js", "FastAPI", "Supabase", "Groq", "Hugging Face", "Redis", "scikit-learn", "XGBoost"];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 36;
    const id = window.setInterval(() => {
      frame += 1;
      setCount(Math.round((value * frame) / totalFrames));
      if (frame >= totalFrames) window.clearInterval(id);
    }, 24);
    return () => window.clearInterval(id);
  }, [value]);

  return <>{count}{suffix}</>;
}

export default function ProjectOverview() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.55 }}
      className="mb-8 rounded-sm overflow-hidden"
      style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.35fr]">
        <div className="p-5 sm:p-6" style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#C8FF00", boxShadow: "0 0 8px #C8FF00" }} />
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em]" style={{ color: "#C8FF00" }}>
              Recruiter System Overview
            </p>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl leading-none mb-4" style={{ color: "#F0F0F0" }}>
            A real career intelligence product, not a static demo.
          </h2>
          <p className="font-body text-sm leading-relaxed mb-5" style={{ color: "#A0A0A0" }}>
            This dashboard connects a live FastAPI backend, market-data scraping, resume analysis, ML scoring,
            salary prediction, and an AI mentor into one workflow that helps students understand where they stand
            and what to learn next.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-sm p-3" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="font-display text-2xl leading-none" style={{ color: stat.color }}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="font-mono text-[0.48rem] uppercase tracking-wider mt-2 leading-relaxed" style={{ color: "#606060" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {flow.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 + index * 0.06 }}
                className="relative rounded-sm p-3 min-h-[132px]"
                style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="font-display text-2xl" style={{ color: index === 0 ? "#C8FF00" : index === 3 ? "#A855F7" : "#FF6B35" }}>
                  {item.step}
                </span>
                <h3 className="font-mono text-[0.56rem] uppercase tracking-wider mt-3 mb-2" style={{ color: "#F0F0F0" }}>
                  {item.title}
                </h3>
                <p className="font-body text-[0.68rem] leading-relaxed" style={{ color: "#606060" }}>
                  {item.copy}
                </p>
              </motion.div>
            ))}
          </div>

          <div>
            <p className="font-mono text-[0.55rem] uppercase tracking-[0.22em] mb-3" style={{ color: "#606060" }}>
              Technology Stack
            </p>
            <div className="flex flex-wrap gap-2">
              {stack.map((item) => (
                <span
                  key={item}
                  className="rounded-sm px-3 py-2 font-mono text-[0.52rem] uppercase tracking-wider"
                  style={{ background: "rgba(200,255,0,0.07)", color: "#C8FF00", border: "1px solid rgba(200,255,0,0.16)" }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
