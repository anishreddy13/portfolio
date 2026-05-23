"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const projects = [
  {
    id: "01",
    title: "Nebula OS",
    category: "Web Application",
    tags: ["Next.js", "Three.js", "WebGL"],
    desc: "A browser-based operating system simulation with 3D spatial navigation, multi-window management, and immersive WebGL environments.",
    accent: "#FF2D2D",
    year: "2024",
    link: "#",
  },
  {
    id: "02",
    title: "Axiom Platform",
    category: "SaaS Dashboard",
    tags: ["React", "D3.js", "FastAPI"],
    desc: "Real-time analytics platform processing 50M+ events daily with live data visualizations, custom charting engine, and predictive insights.",
    accent: "#FF6B35",
    year: "2024",
    link: "#",
  },
  {
    id: "03",
    title: "Cortex AI",
    category: "ML Application",
    tags: ["Python", "PyTorch", "React"],
    desc: "Conversational AI interface with custom fine-tuned LLM, real-time streaming responses, and dynamic knowledge graph visualization.",
    accent: "#C8FF00",
    year: "2023",
    link: "#",
  },
  {
    id: "04",
    title: "Stellar Commerce",
    category: "E-Commerce",
    tags: ["Next.js", "Stripe", "PostgreSQL"],
    desc: "High-performance e-commerce platform with server components, edge caching, and AI-powered product recommendations.",
    accent: "#A855F7",
    year: "2023",
    link: "#",
  },
  {
    id: "05",
    title: "Pulse Monitor",
    category: "DevOps Tool",
    tags: ["Go", "Prometheus", "React"],
    desc: "Infrastructure monitoring dashboard with anomaly detection, automated alerting, and distributed tracing visualization.",
    accent: "#FF2D2D",
    year: "2023",
    link: "#",
  },
  {
    id: "06",
    title: "Void Messenger",
    category: "Real-time App",
    tags: ["WebSockets", "Redis", "Next.js"],
    desc: "End-to-end encrypted messaging platform with real-time collaboration, ephemeral rooms, and zero-knowledge architecture.",
    accent: "#FF6B35",
    year: "2022",
    link: "#",
  },
];

function ProjectCard({
  project,
  index,
}: {
  project: (typeof projects)[0];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-100, 100], [5, -5]);
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  };

  return (
    <ScrollReveal delay={index * 0.07}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative group h-full"
      >
        {/* Glow behind card */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 -z-10 rounded-sm blur-xl"
              style={{ background: `${project.accent}20` }}
            />
          )}
        </AnimatePresence>

        <div
          className="relative h-full rounded-sm overflow-hidden flex flex-col"
          style={{
            background: hovered ? "var(--surface-2)" : "var(--surface-1)",
            border: `1px solid ${hovered ? project.accent + "40" : "rgba(255,255,255,0.06)"}`,
            transition: "background 0.3s ease, border-color 0.3s ease",
          }}
        >
          {/* Top accent bar — animates in on hover */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: project.accent }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: hovered ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />

          <div className="p-5 sm:p-6 flex flex-col flex-1">
            {/* Top row */}
            <div className="flex items-start justify-between mb-5">
              <span
                className="font-mono text-[0.58rem] tracking-[0.3em] uppercase"
                style={{ color: "#606060" }}
              >
                {project.id}
              </span>
              <span
                className="font-mono text-[0.58rem] tracking-widest uppercase
                           px-2.5 py-1 rounded-sm border"
                style={{
                  color:        project.accent,
                  borderColor:  `${project.accent}35`,
                  background:   `${project.accent}10`,
                }}
              >
                {project.category}
              </span>
            </div>

            {/* Title */}
            <h3
              className="font-display leading-none tracking-tight mb-3"
              style={{
                fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
                color: hovered ? "#F0F0F0" : "#D0D0D0",
                transition: "color 0.2s ease",
              }}
            >
              {project.title}
            </h3>

            {/* Accent line */}
            <motion.div
              className="mb-4"
              style={{
                height: "1.5px",
                background: `linear-gradient(90deg, ${project.accent}, transparent)`,
              }}
              animate={{ width: hovered ? "48px" : "24px" }}
              transition={{ duration: 0.3 }}
            />

            {/* Description */}
            <p
              className="font-body text-sm leading-relaxed mb-5 flex-1"
              style={{ color: "#A0A0A0" }}
            >
              {project.desc}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[0.58rem] tracking-wider
                             rounded-sm px-2 py-0.5"
                  style={{
                    color:       "#A0A0A0",
                    border:      "1px solid rgba(255,255,255,0.08)",
                    background:  "var(--surface-3)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between pt-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span
                className="font-mono text-[0.58rem] tracking-widest"
                style={{ color: "#606060" }}
              >
                {project.year}
              </span>
              <motion.a
                href={project.link}
                className="flex items-center gap-1.5 font-mono
                           text-[0.62rem] tracking-widest uppercase"
                style={{ color: project.accent }}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                View Project
                <motion.span
                  animate={{ x: hovered ? 2 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  →
                </motion.span>
              </motion.a>
            </div>
          </div>
        </div>
      </motion.div>
    </ScrollReveal>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState("All");

  const categories = [
    "All",
    "Web Application",
    "SaaS Dashboard",
    "ML Application",
    "E-Commerce",
  ];

  const filtered =
    filter === "All"
      ? projects
      : projects.filter((p) => p.category === filter);

  return (
    <section
      id="projects"
      className="relative overflow-hidden"
      style={{
        background:    "var(--surface-0)",
        paddingTop:    "clamp(5rem, 12vw, 9rem)",
        paddingBottom: "clamp(5rem, 12vw, 9rem)",
      }}
    >
      {/* Top divider */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,45,45,0.2), transparent)",
        }}
      />

      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(255,45,45,0.05) 0%, transparent 65%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16">
          <div>
            <ScrollReveal>
              <span className="section-tag block mb-5">02 / Work</span>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2
                className="font-display leading-none tracking-tight"
                style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", color: "#F0F0F0" }}
              >
                SELECTED
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
                  PROJECTS
                </span>
              </h2>
            </ScrollReveal>
          </div>

          {/* Filter pills */}
          <ScrollReveal direction="left" delay={0.2}>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  whileTap={{ scale: 0.95 }}
                  className="relative font-mono text-[0.6rem] tracking-widest
                             uppercase rounded-sm px-3 py-1.5 border
                             transition-colors duration-200 overflow-hidden"
                  style={
                    filter === cat
                      ? {
                          background:  "#FF2D2D",
                          color:       "#fff",
                          borderColor: "#FF2D2D",
                          boxShadow:   "0 0 16px rgba(255,45,45,0.4)",
                        }
                      : {
                          background:  "transparent",
                          color:       "#606060",
                          borderColor: "rgba(255,255,255,0.08)",
                        }
                  }
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* ── Grid ── */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1,    y: 0  }}
                exit={{    opacity: 0, scale: 0.94, y: -8  }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                <ProjectCard project={project} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* ── GitHub CTA ── */}
        <ScrollReveal delay={0.3}>
          <div className="flex justify-center mt-14">
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 font-mono
                         text-[0.7rem] tracking-[0.22em] uppercase
                         px-6 py-3 rounded-sm border transition-all duration-300"
              style={{
                color:       "#A0A0A0",
                borderColor: "rgba(255,255,255,0.08)",
                background:  "transparent",
              }}
              whileHover={{
                color:       "#F0F0F0",
                borderColor: "rgba(255,45,45,0.35)",
                x: 0,
              }}
              whileTap={{ scale: 0.97 }}
            >
              More on GitHub
              <motion.span
                className="group-hover:translate-x-1 transition-transform duration-300"
              >
                ↗
              </motion.span>
            </motion.a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}