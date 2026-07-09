"use client";

import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";
import { plantProductStats, plantTechBadges } from "../lib/plantDiseaseContent";
import dynamic from "next/dynamic";

// Lazy-load the interactive demo so the homepage doesn't block on it
const HomePlantDemo = dynamic(() => import("./HomePlantDemo"), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-sm flex items-center justify-center"
      style={{
        minHeight: "340px",
        background: "var(--surface-2)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <p className="font-mono text-[0.58rem] tracking-[0.28em] uppercase" style={{ color: "var(--text-tertiary)" }}>
        Loading Plant AI…
      </p>
    </div>
  ),
});

export default function FeaturedPlantProduct() {
  return (
    <section
      id="featured-plant-ai"
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
                    PLANT
                    <br />
                    <span
                      style={{
                        background: "linear-gradient(135deg, #C8FF00 0%, #FF6B35 55%, #A855F7 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      DISEASE AI
                    </span>
                  </h2>

                  <p
                    className="font-body text-sm sm:text-base leading-relaxed max-w-xl"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Production computer vision demo — upload a leaf photo and watch an{" "}
                    <span style={{ color: "var(--text-primary)" }}>EfficientNet-B0 model</span> classify the disease
                    and generate a real-time{" "}
                    <span style={{ color: "#C8FF00" }}>Grad-CAM attention heatmap</span> in under a second.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 shrink-0 lg:min-w-[260px]">
                  {plantProductStats.map((stat) => (
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
                {plantTechBadges.map((badge) => (
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

              {/* ── Interactive demo ── */}
              <div
                className="rounded-sm p-4 sm:p-5"
                style={{
                  background: "rgba(var(--color-overlay-base), 0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <HomePlantDemo />
              </div>

            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
