"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import ScrollReveal from "@/components/ScrollReveal";
import PortfolioDashboard from "@/components/PortfolioDashboard";
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
              transition={{
                delay: i * 0.12,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <motion.div
                className="w-12 h-12 rounded-sm flex items-center justify-center text-xl"
                style={{
                  background: `${step.color}10`,
                  border: `1px solid ${step.color}35`,
                  boxShadow: `0 0 20px ${step.color}15`,
                }}
                whileHover={{
                  scale: 1.1,
                  boxShadow: `0 0 30px ${step.color}30`,
                }}
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
                transition={{
                  delay: i * 0.12 + 0.2,
                  duration: 0.4,
                }}
                style={{ originX: 0 }}
              >
                <div
                  className="h-px w-6 lg:w-10"
                  style={{
                    background: `linear-gradient(90deg, ${step.color}60, ${workflowSteps[i + 1].color}60)`,
                  }}
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
              transition={{
                delay: i * 0.08,
                duration: 0.4,
              }}
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
                <p
                  className="font-mono text-[0.6rem] tracking-wider"
                  style={{ color: step.color }}
                >
                  {step.label}
                </p>

                <p
                  className="font-mono text-[0.48rem] tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
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
                    originY: 0,
                  }}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: i * 0.08 + 0.15,
                  }}
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
            whileHover={{
              y: -4,
              boxShadow: `0 8px 30px ${agent.color}15`,
            }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: i * 0.1,
              duration: 0.5,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{agent.icon}</span>

              <div>
                <p
                  className="font-mono text-xs tracking-wider"
                  style={{ color: agent.color }}
                >
                  {agent.name}
                </p>

                <p
                  className="font-mono text-[0.5rem] tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
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

            <p
              className="font-body text-sm leading-relaxed mt-auto"
              style={{ color: "var(--text-secondary)" }}
            >
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
            transition={{
              delay: i * 0.1,
              duration: 0.5,
            }}
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
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AIFinancialAnalystPage() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pageUrl = `https://www.anishreddy.online${pathname}`;

  const projectSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: "AI Financial Analyst — Anish Reddy",
    description:
      "Enterprise-grade AI financial intelligence platform built with specialized AI agents for research, quantitative analysis, auditing, competitor analysis, and editorial synthesis.",
    isPartOf: {
      "@id": "https://www.anishreddy.online/#profile",
    },
    about: {
      "@type": "CreativeWork",
      name: "AI Financial Analyst",
      creator: {
        "@id": "https://www.anishreddy.online/#person",
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.anishreddy.online/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Projects",
        item: "https://www.anishreddy.online/#projects",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "AI Financial Analyst",
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(projectSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <main className="relative min-h-screen bg-[#050505] pt-16">
        <Breadcrumbs
          items={[
            { label: "Projects", href: "/#projects" },
            { label: "AI Financial Analyst" },
          ]}
          backToHref="/#projects"
          backToLabel="Back to Projects"
        />

        <PortfolioDashboard />
      </main>
    </>
  );
}