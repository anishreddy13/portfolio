"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "../i18n/routing";
import ScrollReveal from "./ScrollReveal";
import { useTranslations } from "next-intl";

const AGENTS = [
  { label: "RESEARCHER", color: "#FF2D2D", delay: 0 },
  { label: "QUANT", color: "#FF6B35", delay: 0.08 },
  { label: "AUDITOR", color: "#C8FF00", delay: 0.16 },
  { label: "COMPETITOR", color: "#A855F7", delay: 0.24 },
  { label: "EDITOR", color: "#38BDF8", delay: 0.32 },
];

function AgentFlowDiagram() {
  return (
    <div className="relative flex flex-col items-center gap-0 select-none">
      {/* USER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col items-center gap-1 mb-1"
      >
        <div
          className="font-mono text-[0.62rem] tracking-[0.3em] uppercase px-4 py-2 rounded-sm"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--text-secondary)",
          }}
        >
          USER
        </div>
      </motion.div>

      {/* Connector */}
      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.35 }}
        style={{
          width: "1px",
          height: "28px",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.15), #FF2D2D)",
          transformOrigin: "top",
        }}
      />

      {/* ORCHESTRATOR */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="mb-1"
      >
        <div
          className="font-mono text-[0.62rem] tracking-[0.2em] uppercase px-5 py-2.5 rounded-sm"
          style={{
            background: "rgba(255,45,45,0.1)",
            border: "1px solid rgba(255,45,45,0.4)",
            color: "#FF2D2D",
            boxShadow: "0 0 20px rgba(255,45,45,0.15)",
          }}
        >
          ORCHESTRATOR
        </div>
      </motion.div>

      {/* Fan connector lines */}
      <div className="relative w-full flex justify-center mb-1" style={{ height: "40px" }}>
        <motion.svg
          width="320"
          height="40"
          viewBox="0 0 320 40"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {AGENTS.map((agent, i) => {
            const x = 32 + i * 64;
            return (
              <motion.line
                key={agent.label}
                x1="160" y1="0"
                x2={x} y2="40"
                stroke={agent.color}
                strokeWidth="1"
                strokeOpacity="0.5"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.65 + agent.delay }}
              />
            );
          })}
        </motion.svg>
      </div>

      {/* Agents row */}
      <div className="flex gap-2 mb-1">
        {AGENTS.map((agent) => (
          <motion.div
            key={agent.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.7 + agent.delay }}
            className="flex flex-col items-center gap-1"
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: agent.color, boxShadow: `0 0 6px ${agent.color}` }}
            />
            <div
              className="font-mono text-[0.5rem] tracking-[0.12em] uppercase px-2 py-1.5 rounded-sm"
              style={{
                background: `${agent.color}10`,
                border: `1px solid ${agent.color}30`,
                color: agent.color,
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: "rotate(180deg)",
                height: "60px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {agent.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Converge */}
      <div className="relative w-full flex justify-center mb-1" style={{ height: "40px" }}>
        <motion.svg
          width="320"
          height="40"
          viewBox="0 0 320 40"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          {AGENTS.map((agent, i) => {
            const x = 32 + i * 64;
            return (
              <motion.line
                key={agent.label}
                x1={x} y1="0"
                x2="160" y2="40"
                stroke={agent.color}
                strokeWidth="1"
                strokeOpacity="0.4"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 1.15 + agent.delay * 0.5 }}
              />
            );
          })}
        </motion.svg>
      </div>

      {/* INTELLIGENCE */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 1.35 }}
      >
        <div
          className="font-mono text-[0.62rem] tracking-[0.25em] uppercase px-6 py-2.5 rounded-sm"
          style={{
            background: "linear-gradient(135deg, rgba(200,255,0,0.12), rgba(255,45,45,0.08))",
            border: "1px solid rgba(200,255,0,0.4)",
            color: "#C8FF00",
            boxShadow: "0 0 24px rgba(200,255,0,0.12)",
          }}
        >
          INTELLIGENCE
        </div>
      </motion.div>
    </div>
  );
}

export default function FlagshipSystem() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const t = useTranslations("FlagshipSystem");

  const metrics = [
    { val: t("metric1_val"), label: t("metric1_label"), color: "#FF2D2D" },
    { val: t("metric2_val"), label: t("metric2_label"), color: "#C8FF00" },
    { val: t("metric3_val"), label: t("metric3_label"), color: "#FF6B35" },
    { val: t("metric4_val"), label: t("metric4_label"), color: "#A855F7" },
  ];

  return (
    <section
      ref={sectionRef}
      id="flagship"
      className="relative overflow-hidden"
      style={{
        background: "var(--surface-1)",
        paddingTop: "clamp(5rem, 10vw, 8rem)",
        paddingBottom: "clamp(5rem, 10vw, 8rem)",
      }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 70% 50%, rgba(200,255,0,0.04) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(255,45,45,0.05) 0%, transparent 50%)",
        }}
      />

      {/* Top rule */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(200,255,0,0.2), transparent)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-start gap-12 lg:gap-20">

          {/* LEFT: Editorial content */}
          <div className="flex-1 min-w-0">
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="font-mono text-[0.58rem] tracking-[0.35em] uppercase"
                  style={{ color: "#C8FF00" }}
                >
                  {t("label")}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest px-2 py-1 rounded-sm"
                  style={{
                    background: "rgba(200,255,0,0.08)",
                    border: "1px solid rgba(200,255,0,0.2)",
                    color: "#C8FF00",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "#C8FF00", boxShadow: "0 0 6px #C8FF00" }}
                  />
                  LIVE
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <h2
                className="font-display leading-none tracking-tight mb-6"
                style={{
                  fontSize: "clamp(2.4rem, 6vw, 5rem)",
                  color: "var(--text-primary)",
                }}
              >
                {t("title")}
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.18}>
              <p
                className="font-body text-base lg:text-lg leading-relaxed max-w-xl mb-8"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("desc")}
              </p>
            </ScrollReveal>

            {/* Metrics grid */}
            <ScrollReveal delay={0.26}>
              <div className="grid grid-cols-2 gap-4 mb-10 max-w-sm">
                {metrics.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="p-4 rounded-sm"
                    style={{
                      background: "var(--surface-2)",
                      border: `1px solid ${m.color}20`,
                    }}
                  >
                    <div
                      className="font-display leading-none mb-1"
                      style={{
                        fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
                        color: m.color,
                      }}
                    >
                      {m.val}
                    </div>
                    <div
                      className="font-mono text-[0.6rem] tracking-[0.15em] uppercase"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {m.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>

            {/* CTAs */}
            <ScrollReveal delay={0.34}>
              <div className="flex flex-wrap gap-3">
                <Link href="/projects/ai-financial-analyst">
                  <motion.span
                    className="inline-flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.18em] uppercase px-6 py-3 rounded-sm"
                    style={{
                      background: "#C8FF00",
                      color: "#0A0A0A",
                      fontWeight: 600,
                    }}
                    whileHover={{ scale: 1.03, boxShadow: "0 6px 30px rgba(200,255,0,0.25)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {t("cta_explore")} →
                  </motion.span>
                </Link>
                <motion.a
                  href="/docs/anish-portfolio-system-architecture.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.18em] uppercase px-6 py-3 rounded-sm"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--text-secondary)",
                  }}
                  whileHover={{
                    borderColor: "rgba(200,255,0,0.3)",
                    color: "var(--text-primary)",
                    scale: 1.02,
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {t("cta_architecture")} ↗
                </motion.a>
              </div>
            </ScrollReveal>
          </div>

          {/* RIGHT: Agent diagram */}
          <motion.div
            style={{ y }}
            className="shrink-0 flex flex-col items-center justify-start pt-8 lg:pt-0"
          >
            <ScrollReveal delay={0.2} direction="left">
              <div
                className="relative p-8 rounded-sm"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  minWidth: "340px",
                }}
              >
                <div
                  className="font-mono text-[0.58rem] tracking-[0.3em] uppercase mb-6 text-center"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  AGENT ARCHITECTURE
                </div>
                <AgentFlowDiagram />
              </div>
            </ScrollReveal>
          </motion.div>
        </div>
      </div>

      {/* Bottom rule */}
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(200,255,0,0.15), transparent)",
        }}
      />
    </section>
  );
}
