"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "./ScrollReveal";
import { useTranslations } from "next-intl";

export default function ArchitectureViz() {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const t = useTranslations("ArchitectureViz");

  const layers = [
    { id: 0, color: "#FF2D2D", icon: "01" },
    { id: 1, color: "#FF6B35", icon: "02" },
    { id: 2, color: "#FF9A1F", icon: "03" },
    { id: 3, color: "#C8FF00", icon: "04" },
    { id: 4, color: "#38BDF8", icon: "05" },
    { id: 5, color: "#A855F7", icon: "06" },
  ];

  const layerKeys = [
    { label: "layer1", tech: "layer1_tech", desc: "layer1_desc" },
    { label: "layer2", tech: "layer2_tech", desc: "layer2_desc" },
    { label: "layer3", tech: "layer3_tech", desc: "layer3_desc" },
    { label: "layer4", tech: "layer4_tech", desc: "layer4_desc" },
    { label: "layer5", tech: "layer5_tech", desc: "layer5_desc" },
    { label: "layer6", tech: "layer6_tech", desc: "layer6_desc" },
  ] as const;

  return (
    <section
      id="how-i-build"
      className="relative overflow-hidden"
      style={{
        background: "var(--surface-0)",
        paddingTop: "clamp(5rem, 10vw, 8rem)",
        paddingBottom: "clamp(5rem, 10vw, 8rem)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,45,45,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,45,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.02,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative">
        <ScrollReveal>
          <div className="mb-12">
            <span className="section-tag mb-3 block">{t("tag")}</span>
            <h2
              className="font-display tracking-tight mb-4"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                color: "var(--text-primary)",
              }}
            >
              {t("heading")}
            </h2>
            <p
              className="font-body text-base max-w-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("desc")}
            </p>
          </div>
        </ScrollReveal>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Stack layers */}
          <div className="flex-1 space-y-2">
            {layers.map((layer, i) => {
              const isActive = activeLayer === i;
              const keys = layerKeys[i];
              return (
                <ScrollReveal key={layer.id} delay={i * 0.07}>
                  <motion.div
                    onMouseEnter={() => setActiveLayer(i)}
                    onMouseLeave={() => setActiveLayer(null)}
                    className="relative flex items-stretch gap-4 rounded-sm overflow-hidden cursor-default"
                    style={{
                      background: isActive
                        ? `linear-gradient(90deg, ${layer.color}0f, transparent)`
                        : "var(--surface-1)",
                      border: `1px solid ${isActive ? layer.color + "35" : "rgba(255,255,255,0.05)"}`,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {/* Left accent */}
                    <motion.div
                      animate={{ width: isActive ? 3 : 2, opacity: isActive ? 1 : 0.4 }}
                      transition={{ duration: 0.2 }}
                      style={{ background: layer.color, flexShrink: 0 }}
                    />

                    <div className="flex-1 py-4 pr-4">
                      <div className="flex items-center gap-3 mb-1">
                        <span
                          className="font-mono text-[0.55rem] tracking-[0.3em]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {layer.icon}
                        </span>
                        <span
                          className="font-display tracking-[0.06em]"
                          style={{
                            fontSize: "clamp(0.9rem, 2vw, 1.15rem)",
                            color: isActive ? layer.color : "var(--text-primary)",
                            transition: "color 0.3s ease",
                          }}
                        >
                          {t(keys.label)}
                        </span>
                      </div>

                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <p
                              className="font-body text-sm leading-relaxed mt-1.5 mb-2"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {t(keys.desc)}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {t(keys.tech).split(" · ").map((tech) => (
                                <span
                                  key={tech}
                                  className="font-mono text-[0.58rem] tracking-[0.1em] uppercase px-2 py-0.5 rounded-sm"
                                  style={{
                                    background: `${layer.color}12`,
                                    border: `1px solid ${layer.color}25`,
                                    color: layer.color,
                                  }}
                                >
                                  {tech.trim()}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!isActive && (
                        <p
                          className="font-mono text-[0.6rem] tracking-[0.1em] mt-1"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {t(keys.tech)}
                        </p>
                      )}
                    </div>

                    {/* Arrow connector */}
                    {i < layers.length - 1 && (
                      <div
                        className="absolute -bottom-px left-6 right-6 flex justify-center"
                        style={{ zIndex: 1 }}
                      >
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                          <path
                            d="M6 8L0 0H12L6 8Z"
                            fill={isActive ? layer.color : "rgba(255,255,255,0.08)"}
                            style={{ transition: "fill 0.3s ease" }}
                          />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Right: info panel */}
          <div className="hidden lg:flex flex-col justify-center min-w-[260px] max-w-[300px]">
            <ScrollReveal delay={0.3} direction="left">
              <AnimatePresence mode="wait">
                {activeLayer !== null ? (
                  <motion.div
                    key={activeLayer}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="p-6 rounded-sm"
                    style={{
                      background: "var(--surface-1)",
                      border: `1px solid ${layers[activeLayer].color}25`,
                    }}
                  >
                    <div
                      className="font-mono text-[0.58rem] tracking-[0.3em] uppercase mb-3"
                      style={{ color: layers[activeLayer].color }}
                    >
                      LAYER {String(activeLayer + 1).padStart(2, "0")}
                    </div>
                    <div
                      className="font-display text-xl tracking-[0.04em] mb-3"
                      style={{ color: layers[activeLayer].color }}
                    >
                      {t(layerKeys[activeLayer].label)}
                    </div>
                    <p
                      className="font-body text-sm leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {t(layerKeys[activeLayer].desc)}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 rounded-sm flex flex-col items-center justify-center text-center gap-3"
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      minHeight: "140px",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,45,45,0.1)", border: "1px solid rgba(255,45,45,0.2)" }}
                    >
                      <span style={{ color: "#FF2D2D", fontSize: "1rem" }}>↑</span>
                    </div>
                    <span
                      className="font-mono text-[0.6rem] tracking-[0.2em] uppercase"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t("hover_hint")}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
