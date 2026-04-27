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
    accent: "#00f5ff",
    year: "2024",
    link: "#",
  },
  {
    id: "02",
    title: "Axiom Platform",
    category: "SaaS Dashboard",
    tags: ["React", "D3.js", "FastAPI"],
    desc: "Real-time analytics platform processing 50M+ events daily with live data visualizations, custom charting engine, and predictive insights.",
    accent: "#8b5cf6",
    year: "2024",
    link: "#",
  },
  {
    id: "03",
    title: "Cortex AI",
    category: "ML Application",
    tags: ["Python", "PyTorch", "React"],
    desc: "Conversational AI interface with custom fine-tuned LLM, real-time streaming responses, and dynamic knowledge graph visualization.",
    accent: "#ec4899",
    year: "2023",
    link: "#",
  },
  {
    id: "04",
    title: "Stellar Commerce",
    category: "E-Commerce",
    tags: ["Next.js", "Stripe", "PostgreSQL"],
    desc: "High-performance e-commerce platform with server components, edge caching, and AI-powered product recommendations.",
    accent: "#3b82f6",
    year: "2023",
    link: "#",
  },
  {
    id: "05",
    title: "Pulse Monitor",
    category: "DevOps Tool",
    tags: ["Go", "Prometheus", "React"],
    desc: "Infrastructure monitoring dashboard with anomaly detection, automated alerting, and distributed tracing visualization.",
    accent: "#00f5ff",
    year: "2023",
    link: "#",
  },
  {
    id: "06",
    title: "Void Messenger",
    category: "Real-time App",
    tags: ["WebSockets", "Redis", "Next.js"],
    desc: "End-to-end encrypted messaging platform with real-time collaboration, ephemeral rooms, and zero-knowledge architecture.",
    accent: "#8b5cf6",
    year: "2022",
    link: "#",
  },
];

function ProjectCard({ project, index }: { project: (typeof projects)[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-100, 100], [5, -5]);
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  };

  return (
    <ScrollReveal delay={index * 0.1}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative group h-full"
      >
        <div
          className="relative h-full glass rounded-2xl p-6 md:p-8 border border-white/[0.05] overflow-hidden transition-all duration-500 hover:border-white/[0.12]"
          style={{
            boxShadow: hovered
              ? `0 20px 60px ${project.accent}15, 0 0 0 1px ${project.accent}20`
              : "none",
          }}
        >
          {/* Top: ID + category */}
          <div className="flex items-start justify-between mb-6">
            <span className="font-mono text-[10px] tracking-[0.3em] text-white/20 uppercase">
              {project.id}
            </span>
            <span
              className="font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border"
              style={{
                color: project.accent,
                borderColor: `${project.accent}30`,
                background: `${project.accent}10`,
              }}
            >
              {project.category}
            </span>
          </div>

          {/* Animated glow blob */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                style={{ background: `${project.accent}20` }}
              />
            )}
          </AnimatePresence>

          {/* Title */}
          <h3 className="font-display text-4xl md:text-5xl tracking-tight text-white mb-4 leading-none">
            {project.title}
          </h3>

          {/* Description */}
          <p className="font-body text-white/40 text-sm leading-relaxed mb-6 line-clamp-3">
            {project.desc}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] tracking-wider text-white/30 border border-white/10 rounded-full px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
            <span className="font-mono text-xs text-white/20">{project.year}</span>
            <motion.a
              href={project.link}
              className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase group/link"
              style={{ color: project.accent }}
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              View Project
              <span className="group-hover/link:translate-x-1 transition-transform duration-200">
                →
              </span>
            </motion.a>
          </div>
        </div>
      </motion.div>
    </ScrollReveal>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Web Application", "SaaS Dashboard", "ML Application", "E-Commerce"];

  const filtered =
    filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <section id="projects" className="relative py-40 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <ScrollReveal>
              <span className="font-mono text-xs tracking-[0.3em] text-[#00f5ff]/60 uppercase mb-4 block">
                02 / Work
              </span>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="font-display text-[clamp(3rem,7vw,6rem)] leading-none tracking-tight">
                <span className="text-white">SELECTED</span>
                <br />
                <span className="gradient-text">PROJECTS</span>
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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`font-mono text-[10px] tracking-widest uppercase rounded-full px-4 py-2 border transition-all duration-300 ${
                    filter === cat
                      ? "bg-[#00f5ff] text-[#03040a] border-[#00f5ff]"
                      : "text-white/40 border-white/10 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* Project grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <ProjectCard project={project} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* More work CTA */}
        <ScrollReveal delay={0.3}>
          <div className="text-center mt-16">
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 font-mono text-sm tracking-widest uppercase text-white/40 hover:text-white border-b border-white/10 hover:border-white/40 pb-1 transition-all duration-300"
              whileHover={{ x: 4 }}
            >
              More on GitHub
              <span>↗</span>
            </motion.a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
