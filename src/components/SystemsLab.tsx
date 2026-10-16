"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { projects } from "@/data/projects";
import ScrollReveal from "./ScrollReveal";
import { useTranslations } from "next-intl";

const systems = [
  {
    code: "01",
    title: "Multi-agent AI",
    detail: "LangGraph orchestration, tool use, research and synthesis.",
    accent: "#C8FF00",
  },
  {
    code: "02",
    title: "Computer vision",
    detail: "PyTorch inference, EfficientNet-B0 and Grad-CAM explanations.",
    accent: "#FF6B35",
  },
  {
    code: "03",
    title: "Real-time systems",
    detail: "Streaming dashboards, provider health and consensus signals.",
    accent: "#FF2D2D",
  },
  {
    code: "04",
    title: "ML applications",
    detail: "FastAPI services and Next.js interfaces that make models useful.",
    accent: "#A855F7",
  },
];

const architecture = [
  ["RESEARCH", "Questions, datasets and evaluation protocols"],
  ["MODEL", "PyTorch, scikit-learn and task-specific inference"],
  ["INFERENCE API", "FastAPI services, validation and safe boundaries"],
  ["APPLICATION", "Next.js products with clear operator workflows"],
  ["DEPLOYMENT", "Hugging Face Spaces, Docker and cloud-ready services"],
  ["OBSERVABILITY", "Health panels, telemetry and drift-aware feedback"],
];

const stack = [
  ["AI / ML", "PyTorch · scikit-learn · LangGraph · Hugging Face"],
  ["FRONTEND", "Next.js · React · TypeScript · Framer Motion"],
  ["BACKEND", "FastAPI · Python · Node.js"],
  ["DATA", "PostgreSQL · Supabase · Redis"],
  ["INFRASTRUCTURE", "Docker · Kubernetes · Terraform"],
];

const sourceProjects = [
  { name: "AI Financial Analyst", href: "/projects/ai-financial-analyst", note: "multi-agent intelligence" },
  { name: "AI Trading CoPilot", href: "/trading-copilot", note: "event-driven strategy workflows" },
  { name: "ML Lab", href: "/ml", note: "six interactive model experiences" },
];

export default function SystemsLab() {
  const t = useTranslations("LabHome");
  const featured = projects.filter((project) => project.featured).slice(0, 4);

  return (
    <>
      <section id="systems" className="relative border-y border-[var(--border)] bg-[var(--surface-1)]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="border-b border-[var(--border)] p-6 sm:p-10 lg:border-b-0 lg:border-r lg:p-14">
            <span className="section-tag">{t("systemsTag")}</span>
            <h2 className="mt-5 max-w-sm font-display text-5xl leading-[0.92] tracking-tight text-[var(--text-primary)] sm:text-6xl">
              {t("systemsTitle")}
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-[var(--text-secondary)]">
              {t("systemsDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {systems.map((system) => (
              <div key={system.code} className="group border-b border-[var(--border)] p-6 transition-colors hover:bg-[var(--surface-2)] sm:p-8 sm:even:border-l">
                <div className="flex items-center justify-between font-mono text-[0.6rem] tracking-[0.25em] text-[var(--text-tertiary)]">
                  <span>{system.code}</span>
                  <span className="h-2 w-2 rounded-full" style={{ background: system.accent, boxShadow: `0 0 12px ${system.accent}` }} />
                </div>
                <h3 className="mt-10 font-display text-3xl uppercase leading-none text-[var(--text-primary)]">{system.title}</h3>
                <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--text-secondary)]">{system.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="relative overflow-hidden px-4 py-[clamp(5rem,12vw,9rem)] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <span className="section-tag">{t("architectureTag")}</span>
                <h2 className="mt-5 font-display text-6xl leading-none tracking-tight text-[var(--text-primary)] sm:text-8xl">{t("architectureTitle")}</h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-[var(--text-secondary)]">{t("architectureDescription")}</p>
            </div>
          </ScrollReveal>

          <div className="relative grid gap-3 md:grid-cols-6">
            <div className="absolute left-0 right-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-[var(--red)] to-transparent md:block" />
            {architecture.map(([title, detail], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.06 }}
                className="relative z-10 border border-[var(--border)] bg-[var(--surface-1)] p-5 transition-colors hover:border-[var(--border-red)] hover:bg-[var(--surface-2)] md:min-h-40"
              >
                <span className="font-mono text-[0.58rem] tracking-[0.2em] text-[var(--red)]">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-8 font-display text-2xl leading-none text-[var(--text-primary)]">{title}</h3>
                <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">{detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="selected-systems" className="border-y border-[var(--border)] bg-[var(--surface-1)] px-4 py-[clamp(5rem,12vw,9rem)] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <span className="section-tag">{t("selectedTag")}</span>
                <h2 className="mt-5 font-display text-6xl leading-none tracking-tight text-[var(--text-primary)] sm:text-8xl">{t("selectedTitle")}</h2>
              </div>
              <p className="max-w-sm text-sm leading-7 text-[var(--text-secondary)]">{t("selectedDescription")}</p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-px overflow-hidden border border-[var(--border)] bg-[var(--border)] md:grid-cols-2">
            {featured.map((project, index) => (
              <Link key={project.id} href={project.route} className="group relative min-h-64 bg-[var(--surface-0)] p-6 transition-colors hover:bg-[var(--surface-2)] sm:p-8">
                <span className="font-mono text-[0.6rem] tracking-[0.25em] text-[var(--text-tertiary)]">0{index + 1} / {project.category}</span>
                <h3 className="mt-12 max-w-sm font-display text-4xl leading-none text-[var(--text-primary)] sm:text-5xl">{project.title}</h3>
                <p className="mt-4 max-w-md text-sm leading-6 text-[var(--text-secondary)]">{project.description}</p>
                <span className="absolute bottom-7 right-7 font-mono text-xs tracking-[0.18em] text-[var(--red)] transition-transform group-hover:translate-x-1">OPEN SYSTEM →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="stack" className="px-4 py-[clamp(5rem,12vw,9rem)] sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <span className="section-tag">{t("stackTag")}</span>
            <h2 className="mt-5 font-display text-6xl leading-none text-[var(--text-primary)] sm:text-8xl">{t("stackTitle")}</h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-[var(--text-secondary)]">{t("stackDescription")}</p>
          </div>
          <div className="border-t border-[var(--border)]">
            {stack.map(([category, tools]) => (
              <div key={category} className="grid gap-3 border-b border-[var(--border)] py-5 sm:grid-cols-[0.35fr_1fr] sm:items-center">
                <span className="font-mono text-[0.62rem] tracking-[0.2em] text-[var(--red)]">{category}</span>
                <span className="text-lg text-[var(--text-primary)]">{tools}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="research" className="border-t border-[var(--border)] bg-[var(--surface-1)] px-4 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="section-tag">{t("proofTag")}</span>
            <h2 className="mt-4 max-w-3xl font-display text-5xl leading-none text-[var(--text-primary)] sm:text-7xl">{t("proofTitle")}</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{t("proofDescription")}</p>
          </div>
          <div className="grid grid-cols-2 gap-px border border-[var(--border)] bg-[var(--border)]">
            {[
              ["09", t("proofProjects")],
              ["198+", t("proofModules")],
              ["85+", t("proofComponents")],
              ["06", t("proofModels")],
            ].map(([value, label]) => (
              <div key={label} className="min-w-32 bg-[var(--surface-0)] p-5">
                <div className="font-display text-4xl leading-none text-[var(--lime)]">{value}</div>
                <div className="mt-2 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-10 grid max-w-7xl gap-3 md:grid-cols-3">
          {sourceProjects.map((project) => (
            <Link key={project.name} href={project.href} className="border border-[var(--border)] p-5 transition-colors hover:border-[var(--border-red)] hover:bg-[var(--surface-2)]">
              <span className="font-mono text-[0.6rem] tracking-[0.18em] text-[var(--red)]">SOURCE / SYSTEM</span>
              <h3 className="mt-8 font-display text-2xl text-[var(--text-primary)]">{project.name}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{project.note}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
