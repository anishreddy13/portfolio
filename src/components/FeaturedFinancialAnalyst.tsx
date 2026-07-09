"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ScrollReveal from "./ScrollReveal";
import {
  financialProductStats,
  financialTechBadges,
} from "../lib/financialAnalystContent";
import { useTranslations } from "next-intl";

/* ═════════════════════════════════════════════
   Main Export: FeaturedFinancialAnalyst (Teaser)
   ═════════════════════════════════════════════ */

export default function FeaturedFinancialAnalyst() {
  const t = useTranslations("FeaturedFinancial");
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
            whileHover={{ y: -4, boxShadow: "0 25px 80px rgba(0,0,0,0.45)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
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

            <div className="p-6 sm:p-10 lg:p-12">

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="section-tag" style={{ color: "#C8FF00" }}>
                      {t('tag')}
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
                      {t('live_api')}
                    </span>
                  </div>

                  <h2
                    className="font-display leading-none tracking-tight mb-5"
                    style={{ fontSize: "clamp(3.5rem, 8vw, 6.5rem)", color: "var(--text-primary)" }}
                  >
                    {t('heading1')}
                    <br />
                    <span
                      style={{
                        background: "linear-gradient(135deg, #C8FF00 0%, #FF6B35 55%, #A855F7 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {t('heading2')}
                    </span>
                  </h2>

                  <p
                    className="font-body text-base sm:text-lg leading-relaxed max-w-xl mb-8"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {t('description')}
                    <span style={{ color: "#C8FF00" }}> {t('description_highlight1')}</span>{t('description2')}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-10">
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

                  <Link href="/projects/ai-financial-analyst">
                     <motion.div
                        className="inline-block px-8 py-4 rounded-sm font-mono text-[0.7rem] uppercase tracking-widest relative overflow-hidden"
                        style={{
                           background: "#C8FF00",
                           color: "#0A0A0A",
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                     >
                        {t('case_study')}
                     </motion.div>
                  </Link>

                </div>

                {/* Stats Right Side */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 shrink-0 lg:min-w-[280px]">
                  {financialProductStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-sm p-5 text-center flex flex-col items-center justify-center h-28"
                      style={{ background: "rgba(17,17,17,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <p className="font-display text-4xl sm:text-5xl leading-none" style={{ color: stat.color }}>
                        {stat.value}
                      </p>
                      <p className="font-mono text-[0.55rem] uppercase tracking-widest mt-2" style={{ color: "var(--text-tertiary)" }}>
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
