"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import HeadlessFinancialAnalyst from "@/components/HeadlessFinancialAnalyst";
import {
  financialProductStats,
  financialTechBadges,
  agentDetails,
  workflowSteps,
  architectureCards,
} from "@/lib/financialAnalystContent";

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
                    originY: 0
                  }}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 + 0.15 }}
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
  return (
    <div className="space-y-4">
      <p
        className="font-mono text-[0.52rem] tracking-[0.28em] uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        Specialized Agent Nodes
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agentDetails.map((agent, i) => (
          <motion.div
            key={agent.name}
            className="rounded-sm p-5 h-full flex flex-col"
            style={{
              background: "var(--surface-1)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            whileHover={{ y: -4, boxShadow: `0 8px 30px ${agent.color}15` }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{agent.icon}</span>
              <div>
                <p className="font-mono text-xs tracking-wider" style={{ color: agent.color }}>
                  {agent.name}
                </p>
                <p className="font-mono text-[0.5rem] tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  {agent.role}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {agent.tools.map((tool) => (
                <span
                  key={tool}
                  className="font-mono text-[0.5rem] tracking-wider px-2 py-0.5 rounded-sm"
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

            <p className="font-body text-sm leading-relaxed mt-auto" style={{ color: "var(--text-secondary)" }}>
               {agent.description}
            </p>
          </motion.div>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {architectureCards.map((card, i) => (
          <motion.div
            key={card.title}
            className="rounded-sm p-5"
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
              className="font-mono text-[0.5rem] tracking-[0.25em] uppercase mb-2"
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

/* ═════════════════════════════════════════════
   Main Page Component
   ═════════════════════════════════════════════ */
export default function AIFinancialAnalystPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main
      className="relative min-h-screen pt-32 pb-24"
      style={{ background: "var(--surface-0)" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
         {/* Top Navigation */}
         <div className="flex flex-wrap gap-4 mb-16">
            <Link href="/">
               <motion.span 
                  whileHover={{ x: -2 }}
                  className="font-mono text-[0.55rem] uppercase tracking-widest px-3 py-1.5 rounded-sm flex items-center gap-2 transition-colors"
                  style={{ background: "var(--surface-1)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.06)" }}
               >
                  ← Home
               </motion.span>
            </Link>
            <Link href="/ml">
               <motion.span 
                  whileHover={{ x: -2 }}
                  className="font-mono text-[0.55rem] uppercase tracking-widest px-3 py-1.5 rounded-sm flex items-center gap-2 transition-colors"
                  style={{ background: "rgba(200,255,0,0.08)", color: "#C8FF00", border: "1px solid rgba(200,255,0,0.2)" }}
               >
                  ← ML Lab
               </motion.span>
            </Link>
         </div>

         {/* Header */}
         <ScrollReveal>
            <div className="mb-16">
               <h1 className="font-display leading-none tracking-tight mb-6" style={{ fontSize: "clamp(3.5rem, 8vw, 6rem)", color: "var(--text-primary)" }}>
                  MULTI-AGENT <br/>
                  <span style={{ background: "linear-gradient(135deg, #C8FF00 0%, #FF6B35 55%, #A855F7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                     FINANCIAL AI
                  </span>
               </h1>
               <p className="font-body text-lg sm:text-xl leading-relaxed max-w-2xl mb-8" style={{ color: "var(--text-secondary)" }}>
                  An enterprise-grade digital workforce showcasing deterministic AI orchestration. A state machine router directs a team of specialized Llama-3 agents to execute quantitative analysis, web research, and editorial synthesis.
               </p>
               
               <div className="flex flex-wrap gap-2 mb-10">
                  {financialTechBadges.map((badge) => (
                    <span
                      key={badge}
                      className="font-mono text-[0.58rem] tracking-wider rounded-sm px-2.5 py-1"
                      style={{ color: "#C8FF00", border: "1px solid rgba(200,255,0,0.18)", background: "rgba(200,255,0,0.06)" }}
                    >
                      {badge}
                    </span>
                  ))}
               </div>
            </div>
         </ScrollReveal>

         {/* Live Demo Headless Component */}
         <ScrollReveal delay={0.1}>
            <div className="mb-24">
               <div className="flex items-center gap-3 mb-6">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#C8FF00", boxShadow: "0 0 10px #C8FF00" }} />
                  <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase" style={{ color: "#C8FF00" }}>Live Inference Interface</p>
               </div>
               <HeadlessFinancialAnalyst />
            </div>
         </ScrollReveal>

         <div className="space-y-20">
            <ScrollReveal direction="up" delay={0.1}>
               <WorkflowPipeline />
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2}>
               <AgentCards />
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
               <ArchitectureSection />
            </ScrollReveal>
         </div>

      </div>
    </main>
  );
}
