"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import {
  financialProductStats,
  financialTechBadges,
  agentDetails,
  workflowSteps,
  architectureCards,
  HF_SPACE_URL,
  HF_SPACE_PAGE_URL,
} from "../lib/financialAnalystContent";

/* ─────────────────────────────────────────────
   Animated Workflow Pipeline
   ───────────────────────────────────────────── */

function WorkflowPipeline() {
  return (
    <div className="space-y-4">
      <p
        className="font-mono text-[0.52rem] tracking-[0.28em] uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        Agent Workflow Pipeline
      </p>

      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-center justify-between gap-1">
        {workflowSteps.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <motion.div
              className="flex flex-col items-center gap-2 flex-1 min-w-0"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="w-12 h-12 rounded-sm flex items-center justify-center text-xl"
                style={{
                  background: `${step.color}10`,
                  border: `1px solid ${step.color}35`,
                  boxShadow: `0 0 20px ${step.color}15`,
                }}
                whileHover={{ scale: 1.1, boxShadow: `0 0 30px ${step.color}30` }}
              >
                {step.icon}
              </motion.div>
              <p
                className="font-mono text-[0.6rem] tracking-wider text-center"
                style={{ color: step.color }}
              >
                {step.label}
              </p>
              <p
                className="font-mono text-[0.48rem] tracking-wider text-center"
                style={{ color: "var(--text-tertiary)" }}
              >
                {step.sublabel}
              </p>
            </motion.div>

            {/* Arrow connector */}
            {i < workflowSteps.length - 1 && (
              <motion.div
                className="flex items-center mx-1 shrink-0"
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 + 0.2, duration: 0.4 }}
                style={{ originX: 0 }}
              >
                <div
                  className="h-px w-6 lg:w-10"
                  style={{ background: `linear-gradient(90deg, ${step.color}60, ${workflowSteps[i + 1].color}60)` }}
                />
                <div
                  className="w-0 h-0"
                  style={{
                    borderTop: "4px solid transparent",
                    borderBottom: "4px solid transparent",
                    borderLeft: `6px solid ${workflowSteps[i + 1].color}60`,
                  }}
                />
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: vertical */}
      <div className="sm:hidden space-y-3">
        {workflowSteps.map((step, i) => (
          <div key={step.id}>
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <div
                className="w-10 h-10 rounded-sm flex items-center justify-center text-base shrink-0"
                style={{
                  background: `${step.color}10`,
                  border: `1px solid ${step.color}35`,
                }}
              >
                {step.icon}
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[0.6rem] tracking-wider" style={{ color: step.color }}>
                  {step.label}
                </p>
                <p className="font-mono text-[0.48rem] tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  {step.sublabel}
                </p>
              </div>
            </motion.div>

            {/* Vertical connector */}
            {i < workflowSteps.length - 1 && (
              <div className="flex justify-start ml-[18px] py-1">
                <motion.div
                  className="w-px h-4"
                  style={{
                    background: `linear-gradient(180deg, ${step.color}40, ${workflowSteps[i + 1].color}40)`,
                  }}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 + 0.15 }}
                  //@ts-expect-error valid motion style
                  style2={{ originY: 0 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Agent Detail Cards
   ───────────────────────────────────────────── */

function AgentCards() {
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <p
        className="font-mono text-[0.52rem] tracking-[0.28em] uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        Specialized Agent Nodes
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {agentDetails.map((agent, i) => (
          <motion.button
            key={agent.name}
            type="button"
            onClick={() => setExpandedAgent(expandedAgent === i ? null : i)}
            className="rounded-sm p-4 text-left w-full"
            style={{
              background: expandedAgent === i
                ? `linear-gradient(135deg, ${agent.color}12, var(--surface-1))`
                : "var(--surface-1)",
              border: `1px solid ${expandedAgent === i ? `${agent.color}35` : "rgba(255,255,255,0.06)"}`,
              cursor: "pointer",
            }}
            whileHover={{ y: -2, boxShadow: `0 8px 30px ${agent.color}15` }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-xl">{agent.icon}</span>
              <div>
                <p className="font-mono text-[0.6rem] tracking-wider" style={{ color: agent.color }}>
                  {agent.name}
                </p>
                <p
                  className="font-mono text-[0.48rem] tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {agent.role}
                </p>
              </div>
            </div>

            {/* Tool badges */}
            <div className="flex flex-wrap gap-1 mb-2">
              {agent.tools.map((tool) => (
                <span
                  key={tool}
                  className="font-mono text-[0.48rem] tracking-wider px-1.5 py-0.5 rounded-sm"
                  style={{
                    border: `1px solid ${agent.color}22`,
                    color: agent.color,
                    background: `${agent.color}08`,
                  }}
                >
                  {tool}
                </span>
              ))}
            </div>

            {/* Expandable description */}
            <motion.div
              initial={false}
              animate={{ height: expandedAgent === i ? "auto" : 0, opacity: expandedAgent === i ? 1 : 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p
                className="font-body text-xs leading-relaxed pt-2"
                style={{
                  color: "var(--text-secondary)",
                  borderTop: `1px solid ${agent.color}15`,
                }}
              >
                {agent.description}
              </p>
            </motion.div>

            <p
              className="font-mono text-[0.44rem] tracking-widest uppercase mt-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              {expandedAgent === i ? "▲ Collapse" : "▼ Details"}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Architecture Overview Cards
   ───────────────────────────────────────────── */

function ArchitectureSection() {
  return (
    <div className="space-y-4">
      <p
        className="font-mono text-[0.52rem] tracking-[0.28em] uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        System Architecture
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {architectureCards.map((card, i) => (
          <motion.div
            key={card.title}
            className="rounded-sm p-4"
            style={{
              background: "var(--surface-1)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -2 }}
          >
            <p
              className="font-mono text-[0.48rem] tracking-[0.25em] uppercase mb-2"
              style={{ color: card.accent }}
            >
              {card.eyebrow}
            </p>
            <p
              className="font-mono text-sm tracking-wide mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {card.title}
            </p>
            <p
              className="font-body text-xs leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {card.summary}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Embedded HF Space Demo
   ───────────────────────────────────────────── */

function LiveDemo() {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p
          className="font-mono text-[0.52rem] tracking-[0.28em] uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Live Demo
        </p>
        <a
          href={HF_SPACE_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[0.52rem] tracking-wider uppercase px-2.5 py-1 rounded-sm"
          style={{
            color: "#C8FF00",
            border: "1px solid rgba(200,255,0,0.22)",
            background: "rgba(200,255,0,0.06)",
            textDecoration: "none",
          }}
        >
          Open in New Tab ↗
        </a>
      </div>

      <div
        className="relative rounded-sm overflow-hidden"
        style={{
          background: "var(--surface-1)",
          border: "1px solid rgba(255,255,255,0.06)",
          minHeight: "500px",
        }}
      >
        {/* Loading state */}
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <motion.div
              className="w-8 h-8 rounded-full"
              style={{ border: "2px solid rgba(200,255,0,0.3)", borderTopColor: "#C8FF00" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p
              className="font-mono text-[0.58rem] tracking-[0.28em] uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              Loading Hugging Face Space…
            </p>
          </div>
        )}

        <iframe
          src={HF_SPACE_URL}
          title="AI Financial Analyst — Live Demo"
          className="w-full border-0"
          style={{
            height: "560px",
            opacity: iframeLoaded ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
          onLoad={() => setIframeLoaded(true)}
          allow="clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   Main Export: FeaturedFinancialAnalyst
   ═════════════════════════════════════════════ */

export default function FeaturedFinancialAnalyst() {
  return (
    <section
      id="featured-financial-analyst"
      className="relative overflow-hidden"
      style={{
        background: "var(--surface-0)",
        paddingTop: "clamp(4rem, 9vw, 7rem)",
        paddingBottom: "clamp(4rem, 9vw, 7rem)",
      }}
    >
      {/* Top rule */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(200,255,0,0.25), transparent)" }}
      />
      {/* BG glow */}
      <div
        className="absolute top-0 right-0 w-[520px] h-[360px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top right, rgba(200,255,0,0.08) 0%, transparent 65%)" }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
        <ScrollReveal>
          <motion.div
            className="relative rounded-sm overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(200,255,0,0.075), rgba(255,107,53,0.045) 48%, var(--surface-1))",
              border: "1px solid rgba(200,255,0,0.2)",
              boxShadow: "0 18px 70px rgba(0,0,0,0.35)",
            }}
          >
            {/* Animated top border */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, #C8FF00, #FF6B35, transparent)" }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            />

            <div className="p-5 sm:p-7 lg:p-9 space-y-8">

              {/* ── Section header ── */}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="section-tag" style={{ color: "#C8FF00" }}>
                      Featured AI Product
                    </span>
                    <span
                      className="inline-flex items-center gap-2 rounded-sm px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-widest"
                      style={{
                        color: "#C8FF00",
                        background: "rgba(200,255,0,0.08)",
                        border: "1px solid rgba(200,255,0,0.22)",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: "#C8FF00", boxShadow: "0 0 8px #C8FF00" }}
                      />
                      Live API
                    </span>
                  </div>

                  <h2
                    className="font-display leading-none tracking-tight mb-4"
                    style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", color: "var(--text-primary)" }}
                  >
                    MULTI-AGENT
                    <br />
                    <span
                      style={{
                        background: "linear-gradient(135deg, #C8FF00 0%, #FF6B35 55%, #A855F7 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      FINANCIAL AI
                    </span>
                  </h2>

                  <p
                    className="font-body text-sm sm:text-base leading-relaxed max-w-xl"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Enterprise-grade digital workforce — enter a{" "}
                    <span style={{ color: "var(--text-primary)" }}>stock ticker</span> and watch{" "}
                    <span style={{ color: "#C8FF00" }}>3 specialized AI agents</span> orchestrate research,
                    quantitative analysis, and editorial synthesis into a polished investment brief.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 shrink-0 lg:min-w-[260px]">
                  {financialProductStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-sm p-3 text-center"
                      style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <p className="font-display text-2xl sm:text-3xl leading-none" style={{ color: stat.color }}>
                        {stat.value}
                      </p>
                      <p className="font-mono text-[0.5rem] uppercase tracking-widest mt-2" style={{ color: "var(--text-tertiary)" }}>
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech badges */}
              <div className="flex flex-wrap gap-2">
                {financialTechBadges.map((badge) => (
                  <span
                    key={badge}
                    className="font-mono text-[0.58rem] tracking-wider rounded-sm px-2.5 py-1"
                    style={{
                      color: "#C8FF00",
                      border: "1px solid rgba(200,255,0,0.18)",
                      background: "rgba(200,255,0,0.06)",
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* ── Workflow Pipeline ── */}
              <div
                className="rounded-sm p-4 sm:p-5"
                style={{
                  background: "rgba(var(--color-overlay-base), 0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <WorkflowPipeline />
              </div>

              {/* ── Agent Detail Cards ── */}
              <div
                className="rounded-sm p-4 sm:p-5"
                style={{
                  background: "rgba(var(--color-overlay-base), 0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <AgentCards />
              </div>

              {/* ── Architecture Overview ── */}
              <div
                className="rounded-sm p-4 sm:p-5"
                style={{
                  background: "rgba(var(--color-overlay-base), 0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <ArchitectureSection />
              </div>

              {/* ── Live Demo ── */}
              <div
                className="rounded-sm p-4 sm:p-5"
                style={{
                  background: "rgba(var(--color-overlay-base), 0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <LiveDemo />
              </div>

            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
