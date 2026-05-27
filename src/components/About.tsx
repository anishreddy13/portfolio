"use client";

import { useRef, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const skills = [
  { category: "Frontend", items: ["React", "Next.js", "TypeScript", "Framer Motion", "Three.js"], accent: "#FF2D2D" },
  { category: "Backend", items: ["Node.js", "Python", "FastAPI", "PostgreSQL", "Redis"], accent: "#FF6B35" },
  { category: "Cloud & DevOps", items: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"], accent: "#C8FF00" },
  { category: "ML & AI", items: ["PyTorch", "TensorFlow", "LangChain", "OpenAI", "HuggingFace"], accent: "#A855F7" },
];

const timeline = [
  { year: "2024", role: "Senior Full-Stack Engineer", company: "Nexus Labs", current: true },
  { year: "2022", role: "Lead Frontend Developer", company: "Orbital Studio", current: false },
  { year: "2020", role: "Full-Stack Developer", company: "Pixel Foundry", current: false },
  { year: "2019", role: "Junior Developer", company: "CodeVault", current: false },
];

const stats = [
  { val: "50+", lbl: "Students Mentored" },
  { val: "2+", lbl: "Yrs Building ML" },
  { val: "4Y", lbl: "Teaching B.Tech" },
  { val: "3MO", lbl: "Industry Frontend" },
];

/* ═══════════════════════════════════════════════════════
   ML VISUALIZATION
═══════════════════════════════════════════════════════ */

function MLVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-100, 100], [6, -6]), {
    stiffness: 80,
    damping: 20,
  });

  const rotateY = useSpring(useTransform(mouseX, [-100, 100], [-6, 6]), {
    stiffness: 80,
    damping: 20,
  });

  const nodes = useMemo(
    () => [
      { x: 18, y: 25, size: 7, color: "#FF2D2D" },
      { x: 42, y: 18, size: 5, color: "#FF6B35" },
      { x: 70, y: 28, size: 8, color: "#C8FF00" },
      { x: 82, y: 48, size: 5, color: "#FF6B35" },
      { x: 65, y: 68, size: 6, color: "#FF2D2D" },
      { x: 38, y: 74, size: 7, color: "#C8FF00" },
      { x: 16, y: 58, size: 5, color: "#FF6B35" },
      { x: 52, y: 48, size: 10, color: "#FF2D2D" },
    ],
    []
  );

  const lines = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 0],
    [0, 7],
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    mouseX.set(x / 8);
    mouseY.set(y / 8);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative h-[340px] sm:h-[420px] lg:h-[520px] w-full flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 rounded-[40px] blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,45,45,0.12) 0%, rgba(255,107,53,0.08) 30%, transparent 70%)",
        }}
      />

      {/* Rotating ring */}
      <motion.div
        className="absolute w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] rounded-full"
        style={{
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 0 80px rgba(255,45,45,0.08)",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Inner ring */}
      <motion.div
        className="absolute w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] rounded-full"
        style={{
          border: "1px solid rgba(255,255,255,0.04)",
        }}
        animate={{ rotate: -360 }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Neural Network */}
      <div className="relative w-full h-full">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {lines.map(([a, b], i) => {
            const nodeA = nodes[a];
            const nodeB = nodes[b];

            return (
              <motion.line
                key={i}
                x1={nodeA.x}
                y1={nodeA.y}
                x2={nodeB.x}
                y2={nodeB.y}
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="0.35"
                initial={{ opacity: 0.2 }}
                animate={{
                  opacity: [0.2, 0.55, 0.2],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </svg>

        {/* Floating particles */}
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 3 === 0 ? 4 : 2,
              height: i % 3 === 0 ? 4 : 2,
              background:
                i % 2 === 0
                  ? "rgba(255,45,45,0.55)"
                  : "rgba(200,255,0,0.45)",
              left: `${10 + ((i * 13) % 80)}%`,
              top: `${10 + ((i * 7) % 80)}%`,
              filter: "blur(0.3px)",
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: node.size,
              height: node.size,
              left: `${node.x}%`,
              top: `${node.y}%`,
              background: node.color,
              boxShadow: `0 0 18px ${node.color}`,
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Center core */}
        <motion.div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 90,
            height: 90,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(255,45,45,0.18) 0%, rgba(255,107,53,0.08) 40%, transparent 75%)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(10px)",
          }}
          animate={{
            scale: [1, 1.06, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Scanning line */}
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{
            top: "50%",
            background:
              "linear-gradient(90deg, transparent, rgba(255,45,45,0.7), transparent)",
          }}
          animate={{
            y: [-80, 80, -80],
            opacity: [0.1, 0.7, 0.1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </motion.div>
  );
}

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const lineHeight = useTransform(
    scrollYProgress,
    [0.1, 0.6],
    ["0%", "100%"]
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative overflow-hidden"
      style={{
        background: "var(--surface-0)",
        paddingTop: "clamp(5rem, 12vw, 9rem)",
        paddingBottom: "clamp(5rem, 12vw, 9rem)",
      }}
    >
      {/* Background accents */}
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

      {/* Vertical side label */}
      <div className="absolute top-40 right-6 hidden xl:flex flex-col items-center gap-3">
        <span
          className="font-mono text-[9px] tracking-[0.45em] uppercase"
          style={{
            color: "#606060",
            writingMode: "vertical-rl",
          }}
        >
          About Me
        </span>

        <div
          className="w-px h-16"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,45,45,0.3), transparent)",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">

        {/* ════════════ HEADER ROW ════════════ */}

        <div className="mb-20 lg:mb-28">

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-6 items-center">

            {/* LEFT CONTENT */}
            <div>

              <ScrollReveal>
                <span className="section-tag block mb-5">
                  01 / About
                </span>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <h2
                  className="font-display leading-[0.92] tracking-tight"
                  style={{
                    fontSize: "clamp(3.2rem, 8vw, 7rem)",
                    color: "#F0F0F0",
                  }}
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

              <ScrollReveal delay={0.18}>
                <p
                  className="mt-8 font-body text-base md:text-lg leading-relaxed max-w-[560px]"
                  style={{ color: "#A0A0A0" }}
                >
                  I'm an ML & AI developer who builds end-to-end intelligent
                  systems — from training models to shipping them into real
                  products. I spent 4 years tutoring 50+ students during my
                  B.Tech, which taught me how to break down complex problems
                  clearly.

                  <span style={{ color: "#F0F0F0" }}>
                    {" "}
                    Now I apply that same thinking to machine learning,
                    backend systems, and whatever I'm obsessed with building
                    next.
                  </span>
                </p>
              </ScrollReveal>

              {/* Stats */}
              <ScrollReveal delay={0.24}>
                <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[720px]">

                  {stats.map((item) => (
                    <motion.div
                      key={item.lbl}
                      className="relative rounded-sm p-4 overflow-hidden"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        backdropFilter: "blur(10px)",
                      }}
                      whileHover={{
                        y: -3,
                        borderColor: "rgba(255,45,45,0.18)",
                        boxShadow:
                          "0 10px 40px rgba(255,45,45,0.08)",
                      }}
                      transition={{ duration: 0.25 }}
                    >
                      <div
                        className="absolute inset-x-0 top-0 h-px"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent, rgba(255,45,45,0.6), transparent)",
                        }}
                      />

                      <div
                        className="font-display text-3xl leading-none"
                        style={{ color: "#F0F0F0" }}
                      >
                        {item.val}
                      </div>

                      <div
                        className="mt-2 font-mono text-[0.56rem] tracking-[0.24em] uppercase leading-relaxed"
                        style={{ color: "#606060" }}
                      >
                        {item.lbl}
                      </div>
                    </motion.div>
                  ))}

                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.3}>
                <div
                  className="mt-10"
                  style={{
                    width: "64px",
                    height: "2px",
                    background:
                      "linear-gradient(90deg, #FF2D2D, transparent)",
                  }}
                />
              </ScrollReveal>
            </div>

            {/* RIGHT VISUALIZATION */}
            <ScrollReveal delay={0.15} direction="up">
              <div className="relative flex items-center justify-center">
                <MLVisualization />
              </div>
            </ScrollReveal>

          </div>
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
            <ScrollReveal
              key={group.category}
              delay={i * 0.08}
              direction="up"
            >
              <motion.div
                className="rounded-sm p-5 h-full transition-all duration-300 group cursor-default"
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                whileHover={{
                  borderColor: `${group.accent}33`,
                  background: "var(--surface-2)",
                  y: -4,
                  boxShadow: `0 8px 40px ${group.accent}18`,
                }}
                transition={{ duration: 0.25 }}
              >
                <div
                  className="mb-4"
                  style={{
                    width: "28px",
                    height: "2px",
                    background: group.accent,
                    boxShadow: `0 0 8px ${group.accent}88`,
                  }}
                />

                <h3
                  className="font-mono text-[0.6rem] tracking-[0.28em] uppercase mb-4"
                  style={{ color: group.accent }}
                >
                  {group.category}
                </h3>

                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5"
                    >
                      <span
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{
                          background: group.accent,
                          opacity: 0.6,
                        }}
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
                style={{
                  background: "rgba(255,255,255,0.05)",
                }}
              />
            </div>
          </ScrollReveal>

          <div className="relative pl-6 sm:pl-10">

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

                    <motion.div
                      className="absolute"
                      style={{
                        left: "-6px",
                        top: "50%",
                        translateY: "-50%",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        border: `2px solid ${
                          item.current
                            ? "#FF2D2D"
                            : "rgba(255,255,255,0.15)"
                        }`,
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
                        boxShadow:
                          "0 0 16px rgba(255,45,45,0.6)",
                      }}
                    />

                    <motion.div
                      className="ml-4 sm:ml-8 rounded-sm p-4 sm:p-5"
                      style={{
                        background: "var(--surface-1)",
                        border:
                          "1px solid rgba(255,255,255,0.06)",
                      }}
                      whileHover={{
                        background: "var(--surface-2)",
                        borderColor:
                          "rgba(255,45,45,0.2)",
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
                              className="flex items-center gap-1.5 font-mono text-[0.58rem] tracking-wide rounded-sm px-2 py-0.5"
                              style={{
                                color: "#FF2D2D",
                                border:
                                  "1px solid rgba(255,45,45,0.3)",
                                background:
                                  "rgba(255,45,45,0.08)",
                              }}
                            >
                              <span
                                className="w-1 h-1 rounded-full animate-pulse"
                                style={{
                                  background: "#FF2D2D",
                                }}
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