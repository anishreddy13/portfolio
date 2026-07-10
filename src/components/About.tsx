"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import ScrollReveal from "./ScrollReveal";
import { useTranslations } from "next-intl";

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const skills = [
  { category: "Frontend",       items: ["React", "Next.js", "TypeScript", "Framer Motion", "Three.js"],         accent: "#FF2D2D" },
  { category: "Backend",        items: ["Node.js", "Python", "FastAPI", "PostgreSQL", "Redis"],                 accent: "#FF6B35" },
  { category: "Cloud & DevOps", items: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"],                   accent: "#C8FF00" },
  { category: "ML & AI",        items: ["PyTorch", "TensorFlow", "LangChain", "OpenAI", "HuggingFace"],         accent: "#A855F7" },
];

// Data moved inside component for translation support

/* ─────────────────────────────────────────
   NEURAL NET CANVAS
───────────────────────────────────────── */
// Layers: input(4) → hidden1(6) → hidden2(6) → output(3)
const LAYERS = [4, 6, 6, 3];

function NeuralNetCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse     = useRef({ x: 0.5, y: 0.5 });
  const rafRef    = useRef<number>(0);

  const buildNodes = useCallback((w: number, h: number) => {
    const nodes: { x: number; y: number; layer: number; idx: number; phase: number }[] = [];
    LAYERS.forEach((count, li) => {
      const xFrac = 0.12 + (li / (LAYERS.length - 1)) * 0.76;
      for (let ni = 0; ni < count; ni++) {
        const yFrac = 0.15 + (ni / (count - 1 || 1)) * 0.70;
        nodes.push({ x: xFrac * w, y: yFrac * h, layer: li, idx: ni, phase: Math.random() * Math.PI * 2 });
      }
    });
    return nodes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let nodes = buildNodes(canvas.width, canvas.height);

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width  = rect.width;
      canvas.height = rect.height;
      nodes = buildNodes(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = (e.clientX - rect.left) / rect.width;
      mouse.current.y = (e.clientY - rect.top)  / rect.height;
    };
    canvas.addEventListener("mousemove", onMove);

    // Accent palette matching the heading gradient
    const ACCENT = ["#FF2D2D", "#FF6B35", "#FF9A1F", "#C8FF00"];

    let t = 0;
    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Mouse-driven parallax offset (subtle)
      const ox = (mouse.current.x - 0.5) * 18;
      const oy = (mouse.current.y - 0.5) * 10;

      // ── EDGES ──
      for (let li = 0; li < LAYERS.length - 1; li++) {
        const fromNodes = nodes.filter(n => n.layer === li);
        const toNodes   = nodes.filter(n => n.layer === li + 1);
        fromNodes.forEach(from => {
          toNodes.forEach(to => {
            const pulse = (Math.sin(t * 1.4 + from.phase + to.phase) + 1) / 2; // 0-1
            const alpha = 0.04 + pulse * 0.10;
            const color = ACCENT[li];
            ctx.beginPath();
            ctx.moveTo(from.x + ox, from.y + oy);
            ctx.lineTo(to.x + ox,   to.y + oy);
            ctx.strokeStyle = color + Math.round(alpha * 255).toString(16).padStart(2, "0");
            ctx.lineWidth = 0.6 + pulse * 0.6;
            ctx.stroke();
          });
        });
      }

      // ── SIGNAL PULSES traveling along edges ──
      for (let li = 0; li < LAYERS.length - 1; li++) {
        const fromNodes = nodes.filter(n => n.layer === li);
        const toNodes   = nodes.filter(n => n.layer === li + 1);
        fromNodes.forEach((from, fi) => {
          toNodes.forEach((to, ti) => {
            const speed  = 0.7 + ((fi + ti) % 3) * 0.2;
            const offset = (fi * 0.31 + ti * 0.17 + li * 0.5);
            const frac   = ((t * speed + offset) % 1.0);
            const px = from.x + ox + (to.x - from.x) * frac;
            const py = from.y + oy + (to.y - from.y) * frac;
            const alpha = Math.sin(frac * Math.PI) * 0.55;
            if (alpha < 0.05) return;
            const color = ACCENT[li];
            const grd = ctx.createRadialGradient(px, py, 0, px, py, 5);
            grd.addColorStop(0, color + Math.round(alpha * 255).toString(16).padStart(2, "0"));
            grd.addColorStop(1, color + "00");
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
          });
        });
      }

      // ── NODES ──
      nodes.forEach(n => {
        const activation = (Math.sin(t * 1.1 + n.phase) + 1) / 2;
        const color = ACCENT[n.layer];
        const r = 4 + activation * 2.5;
        const glow = ctx.createRadialGradient(n.x + ox, n.y + oy, 0, n.x + ox, n.y + oy, r * 4);
        glow.addColorStop(0, color + Math.round((0.18 + activation * 0.22) * 255).toString(16).padStart(2, "0"));
        glow.addColorStop(1, color + "00");
        ctx.beginPath();
        ctx.arc(n.x + ox, n.y + oy, r * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(n.x + ox, n.y + oy, r, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.round((0.55 + activation * 0.45) * 255).toString(16).padStart(2, "0");
        ctx.fill();

        // Ring
        ctx.beginPath();
        ctx.arc(n.x + ox, n.y + oy, r + 3, 0, Math.PI * 2);
        ctx.strokeStyle = color + Math.round(0.15 * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // ── LAYER LABELS ──
      const labels = ["INPUT", "HIDDEN", "HIDDEN", "OUTPUT"];
      LAYERS.forEach((_, li) => {
        const xFrac = 0.12 + (li / (LAYERS.length - 1)) * 0.76;
        const x = xFrac * canvas.width + ox;
        ctx.font = `500 9px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = ACCENT[li] + "55";
        ctx.fillText(labels[li], x, canvas.height * 0.06);
      });

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, [buildNodes]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}

/* ─────────────────────────────────────────
   MAIN SECTION
───────────────────────────────────────── */
export default function About() {
  const t = useTranslations("About");
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.6], ["0%", "100%"]);

  const timeline = [
    { year: "2024", role: t('timeline_2024_role'), company: t('timeline_2024_company'),    current: true  },
    { year: "2022", role: t('timeline_2022_role'), company: t('timeline_2022_company'), current: false },
    { year: "2020", role: t('timeline_2020_role'), company: t('timeline_2020_company'),  current: false },
    { year: "2019", role: t('timeline_2019_role'), company: t('timeline_2019_company'),      current: false },
  ];

  const stats = [
    { val: "50+", lbl: t('stats_students') },
    { val: "2+",  lbl: t('stats_years') },
    { val: "4y",  lbl: t('stats_teaching') },
    { val: "3mo", lbl: t('stats_industry') },
  ];

  // Parallax on the visualization panel
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current!.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width  - 0.5) * 20);
    mouseY.set(((e.clientY - rect.top)  / rect.height - 0.5) * 12);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        background:    "var(--surface-0)",
        paddingTop:    "clamp(5rem, 12vw, 9rem)",
        paddingBottom: "clamp(5rem, 12vw, 9rem)",
      }}
    >
      {/* ── Ambient background glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: "50%", height: "60%",
          background: "radial-gradient(ellipse, rgba(255,45,45,0.04) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "0%", right: "0%",
          width: "55%", height: "55%",
          background: "radial-gradient(ellipse, rgba(200,255,0,0.03) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", top: "30%", right: "20%",
          width: "40%", height: "40%",
          background: "radial-gradient(ellipse, rgba(255,107,53,0.03) 0%, transparent 70%)",
        }} />
      </div>

      {/* ── Vertical side label ── */}
      <div className="absolute top-40 right-6 hidden xl:flex flex-col items-center gap-3" style={{ zIndex: 10 }}>
        <span className="font-mono text-[9px] tracking-[0.45em] uppercase"
          style={{ color: "var(--text-tertiary)", writingMode: "vertical-rl" }}>About Me</span>
        <div className="w-px h-16" style={{
          background: "linear-gradient(to bottom, rgba(255,45,45,0.3), transparent)",
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">

        {/* ════════ SPLIT HERO ════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 xl:gap-16 mb-20 md:mb-28 lg:items-center">

          {/* ── LEFT: Text content ── */}
          <div className="flex flex-col justify-center">
            <ScrollReveal>
              <span className="section-tag block mb-5">{t('tag')}</span>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <h2
                className="font-display leading-none tracking-tight mb-8"
                style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", color: "var(--text-primary)" }}
              >
                {t('heading1')}
                <br />
                <span style={{
                  background: "linear-gradient(135deg, #FF2D2D 0%, #FF6B35 50%, #C8FF00 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {t('heading_highlight')}
                </span>
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.18}>
              <p
                className="font-body text-base leading-relaxed mb-8"
                style={{ color: "var(--text-secondary)", maxWidth: "38ch" }}
              >
                {t('p1')}
                <span style={{ color: "var(--text-primary)" }}>
                  {t('p1_highlight')}
                </span>
              </p>
            </ScrollReveal>

            {/* Red divider */}
            <ScrollReveal delay={0.22}>
              <div className="mb-8" style={{
                width: "56px", height: "2px",
                background: "linear-gradient(90deg, #FF2D2D, transparent)",
              }} />
            </ScrollReveal>

            {/* Stats — 2×2 grid */}
            <ScrollReveal delay={0.28}>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6 w-fit">
                {stats.map((f) => (
                  <div key={f.lbl}>
                    <div className="font-display text-4xl leading-none mb-1"
                      style={{ color: "var(--text-primary)" }}>
                      {f.val}
                    </div>
                    <div className="font-mono text-[0.58rem] tracking-[0.22em] uppercase leading-tight"
                      style={{ color: "var(--text-tertiary)", whiteSpace: "pre-line" }}>
                      {f.lbl}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* ── RIGHT: Neural Network Visualization ── */}
          <ScrollReveal delay={0.15} direction="up">
            <motion.div
              className="relative w-full"
              style={{
                height: "clamp(320px, 45vw, 520px)",
                x: springX,
                y: springY,
              }}
            >
              {/* Outer glow halo */}
              <div className="absolute inset-0 rounded-sm pointer-events-none" style={{
                background: "radial-gradient(ellipse at 50% 50%, rgba(255,45,45,0.06) 0%, transparent 70%)",
                filter: "blur(24px)",
              }} />

              {/* Glass panel */}
              <div
                className="absolute inset-0 rounded-sm overflow-hidden"
                style={{
                  background:  "rgba(255,255,255,0.015)",
                  border:      "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(1px)",
                }}
              >
                {/* Top bar */}
                <div className="flex items-center gap-2 px-4 py-3" style={{
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: "#FF2D2D", boxShadow: "0 0 6px rgba(255,45,45,0.7)" }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: "#FF6B35", opacity: 0.6 }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: "#C8FF00", opacity: 0.4 }} />
                  <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase ml-3" style={{ color: "#404040" }}>
                    inference · live
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 font-mono text-[0.58rem]" style={{ color: "#FF2D2D" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF2D2D" }} />
                    active
                  </span>
                </div>

                {/* Canvas */}
                <div className="w-full" style={{ height: "calc(100% - 44px)" }}>
                  <NeuralNetCanvas />
                </div>
              </div>

              {/* Corner accents */}
              {[
                { top: 0, left: 0, borderTop: "1px solid rgba(255,45,45,0.4)", borderLeft: "1px solid rgba(255,45,45,0.4)" },
                { top: 0, right: 0, borderTop: "1px solid rgba(255,45,45,0.4)", borderRight: "1px solid rgba(255,45,45,0.4)" },
                { bottom: 0, left: 0, borderBottom: "1px solid rgba(255,45,45,0.4)", borderLeft: "1px solid rgba(255,45,45,0.4)" },
                { bottom: 0, right: 0, borderBottom: "1px solid rgba(255,45,45,0.4)", borderRight: "1px solid rgba(255,45,45,0.4)" },
              ].map((s, i) => (
                <div key={i} className="absolute w-4 h-4 pointer-events-none" style={{ ...s, borderRadius: 0 }} />
              ))}

              {/* Bottom readout strip */}
              <motion.div
                className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}
              >
                {["PyTorch", "LangChain", "FastAPI", "Next.js"].map((label, i) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <motion.div
                      className="w-0.5 rounded-full"
                      style={{ background: ["#FF2D2D", "#FF6B35", "#FF9A1F", "#C8FF00"][i] }}
                      animate={{ height: [8, 20, 12, 24, 8] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatType: "mirror", delay: i * 0.4 }}
                    />
                    <span className="font-mono text-[0.5rem] tracking-widest uppercase"
                      style={{ color: "#404040" }}>{label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </ScrollReveal>
        </div>

        {/* ════════ SKILLS GRID ════════ */}
        <ScrollReveal delay={0.05}>
          <div className="mb-4">
            <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase" style={{ color: "var(--text-tertiary)" }}>
              {t('tech_stack')}
            </span>
            <p className="font-body text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              {t('tech_subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-20 md:mb-28">
          {skills.map((group, i) => (
            <ScrollReveal key={group.category} delay={i * 0.08} direction="up">
              <motion.div
                className="rounded-sm p-5 h-full cursor-default"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
                whileHover={{
                  borderColor: `${group.accent}33`,
                  background: "var(--surface-2)",
                  y: -4,
                  boxShadow: `0 8px 40px ${group.accent}18`,
                }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-4" style={{
                  width: "28px", height: "2px",
                  background: group.accent,
                  boxShadow: `0 0 8px ${group.accent}88`,
                }} />
                <h3 className="font-mono text-[0.6rem] tracking-[0.28em] uppercase mb-4"
                  style={{ color: group.accent }}>
                  {group.category}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="w-1 h-1 rounded-full shrink-0"
                        style={{ background: group.accent, opacity: 0.6 }} />
                      <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* ════════ EXPERIENCE TIMELINE ════════ */}
        <div className="relative">
          <ScrollReveal>
            <div className="flex items-center gap-4 mb-10">
              <h3 className="font-display tracking-[0.18em]" style={{
                fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
                color: "rgba(240,240,240,0.12)",
              }}>
                EXPERIENCE
              </h3>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>
          </ScrollReveal>

          <div className="relative pl-6 sm:pl-10">
            <div className="absolute left-0 top-0 w-px overflow-hidden" style={{
              height: "100%", background: "rgba(255,255,255,0.05)",
            }}>
              <motion.div className="w-full" style={{
                height: lineHeight,
                background: "linear-gradient(to bottom, #FF2D2D, #FF6B35, #C8FF00)",
              }} />
            </div>

            <div className="space-y-4">
              {timeline.map((item, i) => (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <div className="relative group">
                    <motion.div
                      className="absolute"
                      style={{
                        left: "-6px", top: "50%", translateY: "-50%",
                        width: "12px", height: "12px", borderRadius: "50%",
                        border: `2px solid ${item.current ? "#FF2D2D" : "rgba(255,255,255,0.15)"}`,
                        background: item.current ? "rgba(255,45,45,0.2)" : "var(--surface-0)",
                        boxShadow: item.current ? "0 0 12px rgba(255,45,45,0.5)" : "none",
                      }}
                      whileHover={{ scale: 1.4, borderColor: "#FF2D2D", boxShadow: "0 0 16px rgba(255,45,45,0.6)" }}
                    />
                    <motion.div
                      className="ml-4 sm:ml-8 rounded-sm p-4 sm:p-5"
                      style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
                      whileHover={{ background: "var(--surface-2)", borderColor: "rgba(255,45,45,0.2)", x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="font-body font-medium text-sm sm:text-base" style={{ color: "var(--text-primary)" }}>
                            {item.role}
                          </h4>
                          <p className="font-mono text-[0.62rem] tracking-wide mt-1" style={{ color: "#FF6B35" }}>
                            {item.company}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-[0.62rem]" style={{ color: "var(--text-tertiary)" }}>{item.year}</span>
                          {item.current && (
                            <span className="flex items-center gap-1.5 font-mono text-[0.58rem] tracking-wide rounded-sm px-2 py-0.5"
                              style={{ color: "#FF2D2D", border: "1px solid rgba(255,45,45,0.3)", background: "rgba(255,45,45,0.08)" }}>
                              <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: "#FF2D2D" }} />
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