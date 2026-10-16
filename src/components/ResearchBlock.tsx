"use client";

import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";
import { useTranslations } from "next-intl";

export default function ResearchBlock() {
  const t = useTranslations("ResearchBlock");

  const tags = [t("tag1"), t("tag2"), t("tag3"), t("tag4")];
  const tagColors = ["#FF2D2D", "#C8FF00", "#FF6B35", "#A855F7"];

  return (
    <section
      id="research"
      className="relative overflow-hidden"
      style={{
        background: "var(--surface-1)",
        paddingTop: "clamp(5rem, 10vw, 8rem)",
        paddingBottom: "clamp(5rem, 10vw, 8rem)",
      }}
    >
      {/* Background accent */}
      <div
        className="absolute top-0 left-0 w-[480px] h-[360px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(168,85,247,0.06) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.2), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-20 items-start">

          {/* LEFT: heading */}
          <div className="lg:w-2/5 shrink-0">
            <ScrollReveal>
              <span className="section-tag mb-4 block">{t("tag")}</span>
              <h2
                className="font-display leading-none tracking-tight mb-6"
                style={{ fontSize: "clamp(2.8rem, 7vw, 6rem)", color: "var(--text-primary)" }}
              >
                {t("heading1")}
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #A855F7 0%, #FF6B35 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {t("heading_highlight")}
                </span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.12}>
              <p
                className="font-body text-base lg:text-lg leading-relaxed max-w-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("desc")}
              </p>
            </ScrollReveal>
          </div>

          {/* RIGHT: research card */}
          <div className="flex-1 min-w-0">
            <ScrollReveal delay={0.18} direction="left">
              <motion.div
                className="relative p-8 rounded-sm overflow-hidden"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid rgba(168,85,247,0.15)",
                }}
                whileHover={{ borderColor: "rgba(168,85,247,0.3)" }}
                transition={{ duration: 0.3 }}
              >
                {/* Animated top border */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: "linear-gradient(90deg, #A855F7, #FF6B35, transparent)" }}
                  initial={{ scaleX: 0, originX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.4 }}
                />

                <div
                  className="font-mono text-[0.58rem] tracking-[0.3em] uppercase mb-4"
                  style={{ color: "#A855F7" }}
                >
                  {t("study_label")}
                </div>

                <h3
                  className="font-display tracking-[0.03em] mb-4 leading-tight"
                  style={{
                    fontSize: "clamp(1.3rem, 3vw, 1.8rem)",
                    color: "var(--text-primary)",
                  }}
                >
                  {t("study_title")}
                </h3>

                <p
                  className="font-body text-sm leading-relaxed mb-6 max-w-lg"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("study_desc")}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {tags.map((tag, i) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, y: 6 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.07, duration: 0.4 }}
                      className="font-mono text-[0.6rem] tracking-[0.12em] uppercase px-3 py-1.5 rounded-sm"
                      style={{
                        background: `${tagColors[i]}10`,
                        border: `1px solid ${tagColors[i]}28`,
                        color: tagColors[i],
                      }}
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3">
                  <motion.a
                    href="https://github.com/anishreddy13/ml_research"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.18em] uppercase px-5 py-2.5 rounded-sm"
                    style={{
                      background: "rgba(168,85,247,0.12)",
                      border: "1px solid rgba(168,85,247,0.3)",
                      color: "#A855F7",
                    }}
                    whileHover={{
                      background: "rgba(168,85,247,0.2)",
                      borderColor: "rgba(168,85,247,0.5)",
                      scale: 1.02,
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {t("cta_repo")} ↗
                  </motion.a>
                  <motion.a
                    href="https://github.com/anishreddy13/ml_research"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.18em] uppercase px-5 py-2.5 rounded-sm"
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--text-secondary)",
                    }}
                    whileHover={{
                      borderColor: "rgba(168,85,247,0.25)",
                      color: "var(--text-primary)",
                      scale: 1.02,
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {t("cta_read")}
                  </motion.a>
                </div>

                {/* Corner accent */}
                <div
                  className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle at bottom right, rgba(168,85,247,0.08) 0%, transparent 70%)",
                  }}
                />
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.15), transparent)",
        }}
      />
    </section>
  );
}
