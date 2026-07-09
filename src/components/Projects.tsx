"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { projectCategories, projects } from "@/data/projects";
import type { PortfolioProject, ProjectStatus } from "@/data/projects";
import ScrollReveal from "./ScrollReveal";
import { useTranslations } from "next-intl";

const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  live: { label: "Live", color: "#C8FF00" },
  beta: { label: "Beta", color: "#FF6B35" },
  local: { label: "Local", color: "#A855F7" },
  monitoring: { label: "Monitoring", color: "#FF2D2D" },
};

function ProjectCard({
  project,
  index,
}: {
  project: PortfolioProject;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const status = statusConfig[project.status];
  const t = useTranslations("Projects");

  const rotateX = useTransform(mouseY, [-100, 100], [5, -5]);
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
      <motion.a
        ref={cardRef}
        href={project.route}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative group h-full min-h-[640px] sm:min-h-[690px] lg:min-h-[720px] block focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D2D]"
        aria-label={`Open ${project.title}`}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 -z-10 rounded-sm blur-xl"
              style={{ background: `${project.accentColor}20` }}
            />
          )}
        </AnimatePresence>

        <div
          className="relative h-full rounded-sm overflow-hidden flex flex-col"
          style={{
            background: hovered ? "var(--surface-2)" : "var(--surface-1)",
            border: `1px solid ${
              hovered ? project.accentColor + "40" : "var(--border)"
            }`,
            transition: "background 0.3s ease, border-color 0.3s ease",
          }}
        >
          <motion.div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: project.accentColor }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: hovered ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />

          <div className="p-5 sm:p-6 flex flex-col flex-1 min-h-0">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="space-y-2">
                <span
                  className="font-mono text-[0.58rem] tracking-[0.3em] uppercase block"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {project.id}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[0.55rem] tracking-widest uppercase">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: status.color,
                      boxShadow: project.status === "live" ? `0 0 8px ${status.color}` : "none",
                    }}
                  />
                  <span style={{ color: status.color }}>{status.label}</span>
                </span>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span
                  className="font-mono text-[0.58rem] tracking-widest uppercase px-2.5 py-1 rounded-sm border text-right"
                  style={{
                    color: project.accentColor,
                    borderColor: `${project.accentColor}35`,
                    background: `${project.accentColor}10`,
                  }}
                >
                  {project.category}
                </span>
                <span
                  className="font-mono text-[0.5rem] tracking-[0.18em] uppercase"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {project.section}
                </span>
              </div>
            </div>

            <h3
              className="font-display leading-none tracking-tight mb-3"
              style={{
                fontSize: "clamp(1.65rem, 3.2vw, 2.25rem)",
                minHeight: "4.5rem",
                color: hovered ? "var(--text-primary)" : "#D0D0D0",
                transition: "color 0.2s ease",
              }}
            >
              {t(`items.${project.id}.title`)}
            </h3>

            <motion.div
              className="mb-4"
              style={{
                height: "1.5px",
                background: `linear-gradient(90deg, ${project.accentColor}, transparent)`,
              }}
              animate={{ width: hovered ? "48px" : "24px" }}
              transition={{ duration: 0.3 }}
            />

            <p className="font-body text-sm leading-relaxed mb-5 flex-1 min-h-[9.5rem]" style={{ color: "var(--text-secondary)" }}>
              {t(`items.${project.id}.desc`)}
            </p>

            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {project.metrics.map((metric) => (
                <div
                  key={`${project.id}-${metric.label}`}
                  className="rounded-sm px-2 py-2 min-w-0"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <p
                    className="font-display text-base leading-none truncate"
                    style={{ color: project.accentColor }}
                    title={metric.value}
                  >
                    {metric.value}
                  </p>
                  <p
                    className="font-mono text-[0.48rem] tracking-widest uppercase truncate mt-1"
                    style={{ color: "var(--text-tertiary)" }}
                    title={metric.label}
                  >
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap content-start gap-1.5 mb-4 min-h-[3.9rem]">
              {project.complexityTags.slice(0, 5).map((tag) => (
                <span
                  key={`${project.id}-${tag}`}
                  className="font-mono text-[0.52rem] tracking-wider rounded-sm px-2 py-0.5"
                  style={{
                    color: project.accentColor,
                    border: `1px solid ${project.accentColor}24`,
                    background: `${project.accentColor}0D`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap content-start gap-1.5 mb-5 min-h-[4.4rem]">
              {project.technologies.map((technology) => (
                <span
                  key={`${project.id}-${technology}`}
                  className="font-mono text-[0.58rem] tracking-wider rounded-sm px-2 py-0.5"
                  style={{
                    color: "var(--text-secondary)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "var(--surface-3)",
                  }}
                >
                  {technology}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="font-mono text-[0.58rem] tracking-widest uppercase" style={{ color: "var(--text-tertiary)" }}>
                Priority {project.priority.toString().padStart(2, "0")}
              </span>
              <motion.span
                className="flex items-center gap-1.5 font-mono text-[0.62rem] tracking-widest uppercase text-right"
                style={{ color: project.accentColor }}
                animate={{ x: hovered ? 4 : 0 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Open System
                <motion.span animate={{ x: hovered ? 2 : 0 }} transition={{ duration: 0.2 }}>
                  →
                </motion.span>
              </motion.span>
            </div>
          </div>
        </div>
      </motion.a>
    </ScrollReveal>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState("All");
  const t = useTranslations("Projects");

  const filtered =
    filter === "All" ? projects : projects.filter((project) => project.category === filter);

  return (
    <section
      id="projects"
      className="relative overflow-hidden"
      style={{
        background: "var(--surface-0)",
        paddingTop: "clamp(5rem, 12vw, 9rem)",
        paddingBottom: "clamp(5rem, 12vw, 9rem)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,45,45,0.2), transparent)",
        }}
      />

      <div
        className="absolute top-0 right-0 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(255,45,45,0.05) 0%, transparent 65%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16">
          <div className="mb-14 md:mb-20 max-w-2xl">
            <ScrollReveal>
              <span className="section-tag block mb-5">{t('tag')}</span>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2
                className="font-display leading-none tracking-tight mb-6"
                style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", color: "var(--text-primary)" }}
              >
                {t('heading1')}
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #FF2D2D 0%, #FF6B35 50%, #C8FF00 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {t('heading_highlight')}
                </span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <p
                className="font-body text-base md:text-lg leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {t('description')}
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal direction="left" delay={0.2}>
            <div className="flex flex-wrap gap-2">
              {projectCategories.map((category) => (
                <motion.button
                  key={category}
                  onClick={() => setFilter(category)}
                  whileTap={{ scale: 0.95 }}
                  className="relative font-mono text-[0.6rem] tracking-widest uppercase rounded-sm px-3 py-1.5 border transition-colors duration-200 overflow-hidden"
                  style={
                    filter === category
                      ? {
                          background: "#FF2D2D",
                          color: "#fff",
                          borderColor: "#FF2D2D",
                          boxShadow: "0 0 16px rgba(255,45,45,0.4)",
                        }
                      : {
                          background: "transparent",
                          color: "var(--text-tertiary)",
                          borderColor: "var(--border)",
                        }
                  }
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </ScrollReveal>
        </div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                <ProjectCard project={project} index={index} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <ScrollReveal delay={0.3}>
          <div className="flex justify-center mt-14">
            <motion.a
              href="/ml?tab=plant"
              className="group inline-flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.22em] uppercase px-6 py-3 rounded-sm border transition-all duration-300"
              style={{
                color: "var(--text-secondary)",
                borderColor: "var(--border)",
                background: "transparent",
              }}
              whileHover={{
                color: "var(--text-primary)",
                borderColor: "rgba(255,45,45,0.35)",
                x: 0,
              }}
              whileTap={{ scale: 0.97 }}
            >
              Open ML Lab
              <motion.span className="group-hover:translate-x-1 transition-transform duration-300">
                ↗
              </motion.span>
            </motion.a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
