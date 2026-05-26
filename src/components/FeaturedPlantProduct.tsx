"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";
import { plantProductStats, plantTechBadges } from "../lib/plantDiseaseContent";

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
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(200,255,0,0.25), transparent)" }}
      />
      <div
        className="absolute top-0 right-0 w-[520px] h-[360px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top right, rgba(200,255,0,0.08) 0%, transparent 65%)" }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
        <ScrollReveal>
          <motion.div
            className="relative rounded-sm overflow-hidden group"
            style={{
              background: "linear-gradient(135deg, rgba(200,255,0,0.075), rgba(255,107,53,0.045) 48%, var(--surface-1))",
              border: "1px solid rgba(200,255,0,0.2)",
              boxShadow: "0 18px 70px rgba(0,0,0,0.35)",
            }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, #C8FF00, #FF6B35, transparent)" }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 p-5 sm:p-7 lg:p-9">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-5">
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
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#C8FF00", boxShadow: "0 0 8px #C8FF00" }} />
                    Live API
                  </span>
                </div>

                <h2
                  className="font-display leading-none tracking-tight mb-4"
                  style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", color: "#F0F0F0" }}
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

                <p className="font-body text-sm sm:text-base leading-relaxed max-w-2xl mb-6" style={{ color: "#A0A0A0" }}>
                  A production-style computer vision demo that classifies plant leaf diseases using an EfficientNet-B0 model served through FastAPI on Hugging Face Spaces.
                </p>

                <div className="flex flex-wrap gap-2 mb-7">
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

                <Link href="/ml?tab=plant">
                  <motion.span
                    className="inline-flex items-center justify-center gap-3 rounded-sm px-6 py-3 font-mono text-[0.68rem] uppercase tracking-[0.22em]"
                    style={{ background: "#C8FF00", color: "#0A0A0A" }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Try Plant AI
                    <span>→</span>
                  </motion.span>
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div
                  className="rounded-sm p-4 sm:p-5"
                  style={{ background: "rgba(10,10,10,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-4" style={{ color: "#606060" }}>
                    Inference Stack
                  </p>
                  {["Next.js upload", "HF Spaces API", "FastAPI model server", "EfficientNet-B0 classifier"].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 py-2">
                      <span className="font-display text-xl leading-none" style={{ color: index === 3 ? "#C8FF00" : "#606060" }}>
                        0{index + 1}
                      </span>
                      <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                      <span className="font-body text-xs sm:text-sm text-right" style={{ color: "#A0A0A0" }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {plantProductStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-sm p-3 text-center"
                      style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <p className="font-display text-2xl sm:text-3xl leading-none" style={{ color: stat.color }}>
                        {stat.value}
                      </p>
                      <p className="font-mono text-[0.5rem] uppercase tracking-widest mt-2" style={{ color: "#606060" }}>
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
