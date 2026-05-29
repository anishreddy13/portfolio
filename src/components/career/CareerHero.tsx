"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "10K+", label: "Jobs Analyzed", color: "#C8FF00" },
  { value: "50+", label: "Skills Tracked", color: "#FF6B35" },
  { value: "6mo", label: "Roadmap Depth", color: "#A855F7" },
];

export default function CareerHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-sm p-5 sm:p-7 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(200,255,0,0.08), rgba(255,107,53,0.045) 55%, var(--surface-1))",
        border: "1px solid rgba(200,255,0,0.2)",
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-7">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#C8FF00", boxShadow: "0 0 8px #C8FF00" }}
            />
            <span
              className="font-mono text-[0.56rem] sm:text-[0.6rem] tracking-[0.24em] sm:tracking-[0.28em] uppercase"
              style={{ color: "#C8FF00" }}
            >
              AI Career Intelligence · Live Market Data
            </span>
          </div>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-none tracking-tight">
            <span
              style={{
                background: "linear-gradient(135deg, #C8FF00 0%, #FF6B35 52%, #A855F7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Know What The
            </span>
            <br />
            <span style={{ color: "#F0F0F0" }}>Market Wants</span>
          </h2>
          <p className="font-body text-sm sm:text-base mt-4 max-w-2xl leading-relaxed" style={{ color: "#A0A0A0" }}>
            Upload your resume. Get real-time skill gap analysis, salary predictions, and a personalized
            6-month career roadmap powered by live job market data.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full lg:w-[360px] shrink-0">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -3 }}
              className="rounded-sm px-3 py-4 text-center"
              style={{ background: "rgba(10,10,10,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="font-display text-2xl sm:text-3xl leading-none" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="font-mono text-[0.48rem] sm:text-[0.52rem] uppercase tracking-widest mt-2" style={{ color: "#606060" }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
