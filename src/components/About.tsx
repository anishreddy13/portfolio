"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const skills = [
  { category: "Frontend",      items: ["React", "Next.js", "TypeScript", "Framer Motion", "Three.js"],            accent: "#FF2D2D" },
  { category: "Backend",       items: ["Node.js", "Python", "FastAPI", "PostgreSQL", "Redis"],                    accent: "#FF6B35" },
  { category: "Cloud & DevOps",items: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"],                      accent: "#C8FF00" },
  { category: "ML & AI",       items: ["PyTorch", "TensorFlow", "LangChain", "OpenAI", "HuggingFace"],            accent: "#A855F7" },
];

const timeline = [
  { year: "2024", role: "Senior Full-Stack Engineer", company: "Nexus Labs",    current: true  },
  { year: "2022", role: "Lead Frontend Developer",    company: "Orbital Studio", current: false },
  { year: "2020", role: "Full-Stack Developer",       company: "Pixel Foundry",  current: false },
  { year: "2019", role: "Junior Developer",           company: "CodeVault",      current: false },
];

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.6], ["0%", "100%"]);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative overflow-hidden"
      style={{
        background: "var(--surface-0)",
        paddingTop:    "clamp(5rem, 12vw, 9rem)",
        paddingBottom: "clamp(5rem, 12vw, 9rem)",
      }}
    >
      {/* ── Background accents ── */}
      <div
        className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,45,45,0.05) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at bottom right, rgba(200,255,0,0.04) 0%, transparent 65%)",
        }}
      />

      {/* ── Vertical side label ── */}
      <div className="absolute top-40 right-6 hidden xl:flex flex-col items-center gap-3">
        <span
          className="font-mono text-[9px] tracking-[0.45em] uppercase"
          style={{ color: "#606060", writingMode: "vertical-rl" }}
        >
          About Me
        </span>
        <div
          className="w-px h-16"
          style={{
            background: "linear-gradient(to bottom, rgba(255,45,45,0.3), transparent)",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">

        {/* ════════════ HEADER ROW ════════════ */}
        <div className="mb-16 md:mb-20">
          <ScrollReveal>
            <span className="section-tag block mb-5">01 / About</span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h2
              className="font-display leading-none tracking-tight"
              style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", color: "#F0F0F0" }}
            >
              BUILT ON
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #FF2D2D 0%, #FF6B35 50%, #C8FF00 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                CURIOSITY
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-16 mt-8">
              <p
                className="font-body text-base md:text-lg leading-relaxed max-w-xl"
                style={{ color: "#A0A0A0" }}
              >
                I'm a full-stack developer with a passion for building digital
                experiences that balance technical precision with aesthetic boldness.
                I believe the best interfaces are{" "}
                <span style={{ color: "#F0F0F0" }}>
                  electric — they make you feel something.
                </span>
              </p>

              {/* Quick facts */}
              <div className="flex gap-8 shrink-0">
                {[
                  { val: "5+",  lbl: "Years" },
                  { val: "40+", lbl: "Projects" },
                ].map((f) => (
                  <div key={f.lbl}>
                    <div
                      className="font-display text-3xl leading-none"
                      style={{ color: "#F0F0F0" }}
                    >
                      {f.val}
                    </div>
                    <div
                      className="font-mono text-[0.6rem] tracking-[0.25em] uppercase mt-1"
                      style={{ color: "#606060" }}
                    >
                      {f.lbl}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Red divider */}
          <ScrollReveal delay={0.25}>
            <div
              className="mt-8"
              style={{
                width: "56px",
                height: "2px",
                background: "linear-gradient(90deg, #FF2D2D, transparent)",
              }}
            />
          </ScrollReveal>
        </div>

        {/* ════════════ SKILLS GRID ════════════ */}
        <ScrollReveal delay={0.05}>
          <div className="mb-4">
            <span
              className="font-mono text-[0.6rem] tracking-[0.3em] uppercase"
              style={{ color: "#606060" }}
            >
              — Tech Stack
            </span>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-20 md:mb-28">
          {skills.map((group, i) => (
            <ScrollReveal key={group.category} delay={i * 0.08} direction="up">
              <motion.div
                className="rounded-sm p-5 h-full transition-all duration-300 group cursor-default"
                style={{
                  background:  "var(--surface-1)",
                  border:      "1px solid rgba(255,255,255,0.06)",
                }}
                whileHover={{
                  borderColor: `${group.accent}33`,
                  background:  "var(--surface-2)",
                  y: -4,
                  boxShadow: `0 8px 40px ${group.accent}18`,
                }}
                transition={{ duration: 0.25 }}
              >
                {/* Accent top bar */}
                <div
                  className="mb-4"
                  style={{
                    width: "28px",
                    height: "2px",
                    background: group.accent,
                    boxShadow: `0 0 8px ${group.accent}88`,
                  }}
                />

                {/* Category label */}
                <h3
                  className="font-mono text-[0.6rem] tracking-[0.28em] uppercase mb-4"
                  style={{ color: group.accent }}
                >
                  {group.category}
                </h3>

                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{ background: group.accent, opacity: 0.6 }}
                      />
                      <span
                        className="font-body text-sm"
                        style={{ color: "#A0A0A0" }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* ════════════ EXPERIENCE TIMELINE ════════════ */}
        <div className="relative">
          <ScrollReveal>
            <div className="flex items-center gap-4 mb-10">
              <h3
                className="font-display tracking-[0.18em]"
                style={{
                  fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
                  color: "rgba(240,240,240,0.12)",
                }}
              >
                EXPERIENCE
              </h3>
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>
          </ScrollReveal>

          <div className="relative pl-6 sm:pl-10">
            {/* Animated vertical line */}
            <div
              className="absolute left-0 top-0 w-px overflow-hidden"
              style={{
                height: "100%",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <motion.div
                className="w-full"
                style={{
                  height: lineHeight,
                  background:
                    "linear-gradient(to bottom, #FF2D2D, #FF6B35, #C8FF00)",
                }}
              />
            </div>

            <div className="space-y-4">
              {timeline.map((item, i) => (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <div className="relative group">
                    {/* Timeline dot */}
                    <motion.div
                      className="absolute"
                      style={{
                        left:   "-6px",
                        top:    "50%",
                        translateY: "-50%",
                        width:  "12px",
                        height: "12px",
                        borderRadius: "50%",
                        border: `2px solid ${item.current ? "#FF2D2D" : "rgba(255,255,255,0.15)"}`,
                        background: item.current
                          ? "rgba(255,45,45,0.2)"
                          : "var(--surface-0)",
                        boxShadow: item.current
                          ? "0 0 12px rgba(255,45,45,0.5)"
                          : "none",
                      }}
                      whileHover={{
                        scale: 1.4,
                        borderColor: "#FF2D2D",
                        boxShadow: "0 0 16px rgba(255,45,45,0.6)",
                      }}
                    />

                    <motion.div
                      className="ml-4 sm:ml-8 rounded-sm p-4 sm:p-5"
                      style={{
                        background: "var(--surface-1)",
                        border:     "1px solid rgba(255,255,255,0.06)",
                      }}
                      whileHover={{
                        background:  "var(--surface-2)",
                        borderColor: "rgba(255,45,45,0.2)",
                        x: 4,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <h4
                            className="font-body font-medium text-sm sm:text-base"
                            style={{ color: "#F0F0F0" }}
                          >
                            {item.role}
                          </h4>
                          <p
                            className="font-mono text-[0.62rem] tracking-wide mt-1"
                            style={{ color: "#FF6B35" }}
                          >
                            {item.company}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="font-mono text-[0.62rem]"
                            style={{ color: "#606060" }}
                          >
                            {item.year}
                          </span>
                          {item.current && (
                            <span
                              className="flex items-center gap-1.5 font-mono
                                         text-[0.58rem] tracking-wide
                                         rounded-sm px-2 py-0.5"
                              style={{
                                color:       "#FF2D2D",
                                border:      "1px solid rgba(255,45,45,0.3)",
                                background:  "rgba(255,45,45,0.08)",
                              }}
                            >
                              <span
                                className="w-1 h-1 rounded-full animate-pulse"
                                style={{ background: "#FF2D2D" }}
                              />
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}