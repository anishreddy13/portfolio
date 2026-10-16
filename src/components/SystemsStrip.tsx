"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";
import { useTranslations } from "next-intl";

const categories = [
  {
    id: "cat1",
    color: "#FF2D2D",
    glow: "rgba(255,45,45,0.08)",
    tech: ["LangGraph", "OpenAI", "Tool Use", "Memory"],
    project: "AI Financial Analyst",
  },
  {
    id: "cat2",
    color: "#C8FF00",
    glow: "rgba(200,255,0,0.07)",
    tech: ["PyTorch", "EfficientNet-B0", "Grad-CAM", "CNN"],
    project: "Plant Disease Detection",
  },
  {
    id: "cat3",
    color: "#FF6B35",
    glow: "rgba(255,107,53,0.08)",
    tech: ["WebSockets", "Supabase Realtime", "FastAPI", "Redis"],
    project: "Live Trading Dashboard",
  },
  {
    id: "cat4",
    color: "#A855F7",
    glow: "rgba(168,85,247,0.08)",
    tech: ["FastAPI", "Next.js", "Docker", "Gradio"],
    project: "ML Production Backend",
  },
  {
    id: "cat5",
    color: "#38BDF8",
    glow: "rgba(56,189,248,0.07)",
    tech: ["React", "TypeScript", "Framer Motion", "Next.js"],
    project: "Portfolio Platform",
  },
];

export default function SystemsStrip() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const t = useTranslations("SystemsStrip");

  const catLabels = [
    t("cat1_label"),
    t("cat2_label"),
    t("cat3_label"),
    t("cat4_label"),
    t("cat5_label"),
  ];
  const catDescs = [
    t("cat1_desc"),
    t("cat2_desc"),
    t("cat3_desc"),
    t("cat4_desc"),
    t("cat5_desc"),
  ];

  return (
    <section
      id="systems"
      className="relative overflow-hidden"
      style={{
        background: "var(--surface-0)",
        paddingTop: "clamp(4rem, 8vw, 6rem)",
        paddingBottom: "clamp(4rem, 8vw, 6rem)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,45,45,0.2), rgba(200,255,0,0.12), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <ScrollReveal>
          <div className="flex items-center gap-4 mb-10">
            <span className="section-tag">{t("tag")}</span>
            <span
              className="w-12 h-px"
              style={{ background: "rgba(255,45,45,0.3)" }}
            />
            <h2
              className="font-display tracking-[0.08em]"
              style={{
                fontSize: "clamp(1.6rem, 4vw, 2.8rem)",
                color: "var(--text-primary)",
              }}
            >
              {t("heading")}
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-px">
          {categories.map((cat, i) => {
            const isActive = activeIdx === i;
            return (
              <ScrollReveal key={cat.id} delay={i * 0.06}>
                <motion.div
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                  className="group relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 py-5 px-5 sm:px-6 rounded-sm cursor-default"
                  style={{
                    background: isActive ? cat.glow : "transparent",
                    border: `1px solid ${isActive ? cat.color + "22" : "rgba(255,255,255,0.04)"}`,
                    transition: "background 0.3s ease, border-color 0.3s ease",
                  }}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span
                      className="font-mono text-[0.58rem] tracking-[0.3em] shrink-0"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      0{i + 1}
                    </span>
                    <motion.div
                      className="shrink-0 rounded-full"
                      animate={{
                        height: isActive ? 32 : 20,
                        boxShadow: isActive ? `0 0 12px ${cat.color}` : "0 0 0 transparent",
                      }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        width: "3px",
                        background: cat.color,
                      }}
                    />
                    <div className="min-w-0">
                      <div
                        className="font-display tracking-[0.06em] leading-none"
                        style={{
                          fontSize: "clamp(1rem, 2.5vw, 1.45rem)",
                          color: isActive ? cat.color : "var(--text-primary)",
                          transition: "color 0.3s ease",
                        }}
                      >
                        {catLabels[i]}
                      </div>
                      <div
                        className="font-body text-sm mt-1 leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {catDescs[i]}
                      </div>
                    </div>
                  </div>

                  <motion.div
                    className="flex flex-wrap gap-2 sm:justify-end"
                    animate={{
                      opacity: isActive ? 1 : 0.35,
                      x: isActive ? 0 : 6,
                    }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {cat.tech.map((tech) => (
                      <span
                        key={tech}
                        className="font-mono text-[0.6rem] tracking-[0.1em] uppercase px-2.5 py-1 rounded-sm"
                        style={{
                          background: `${cat.color}12`,
                          border: `1px solid ${cat.color}28`,
                          color: cat.color,
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </motion.div>

                  <motion.div
                    className="hidden lg:flex items-center gap-2 shrink-0 min-w-[140px]"
                    animate={{ opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: cat.color }}
                    />
                    <span
                      className="font-mono text-[0.58rem] tracking-[0.15em] uppercase"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {cat.project}
                    </span>
                  </motion.div>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,45,45,0.12), transparent)",
        }}
      />
    </section>
  );
}
