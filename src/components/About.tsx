"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const skills = [
  { category: "Frontend", items: ["React", "Next.js", "TypeScript", "Framer Motion", "Three.js"] },
  { category: "Backend", items: ["Node.js", "Python", "FastAPI", "PostgreSQL", "Redis"] },
  { category: "Cloud & DevOps", items: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"] },
  { category: "ML & AI", items: ["PyTorch", "TensorFlow", "LangChain", "OpenAI", "HuggingFace"] },
];

const timeline = [
  { year: "2024", role: "Senior Full-Stack Engineer", company: "Nexus Labs", current: true },
  { year: "2022", role: "Lead Frontend Developer", company: "Orbital Studio" },
  { year: "2020", role: "Full-Stack Developer", company: "Pixel Foundry" },
  { year: "2019", role: "Junior Developer", company: "CodeVault" },
];

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.5], ["0%", "100%"]);

  return (
    <section ref={sectionRef} id="about" className="relative py-40 px-6">
      {/* Section label */}
      <div className="absolute top-40 right-8 md:right-16 hidden md:flex flex-col items-center gap-4">
        <span className="font-mono text-[10px] tracking-[0.4em] text-white/20 uppercase [writing-mode:vertical-rl]">
          About Me
        </span>
        <div className="w-px h-20 bg-gradient-to-b from-white/10 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Top row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          {/* Left: Heading */}
          <div>
            <ScrollReveal>
              <span className="font-mono text-xs tracking-[0.3em] text-[#00f5ff]/60 uppercase mb-4 block">
                01 / About
              </span>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="font-display text-[clamp(3rem,7vw,6rem)] leading-none tracking-tight text-white mb-6">
                BUILT ON
                <br />
                <span className="gradient-text">CURIOSITY</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="font-body text-white/40 text-lg leading-relaxed">
                I'm a full-stack developer with a passion for building digital experiences that
                balance technical precision with aesthetic beauty. I believe the best interfaces are
                invisible — they just work, seamlessly and beautifully.
              </p>
            </ScrollReveal>
          </div>

          {/* Right: Image/visual */}
          <ScrollReveal direction="left" delay={0.3}>
            <div className="relative aspect-square max-w-sm mx-auto lg:mx-0 lg:ml-auto">
              {/* Abstract avatar */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden glass border border-white/[0.06]">
                {/* Gradient orb placeholder for photo */}
                <div className="w-full h-full bg-gradient-to-br from-[#00f5ff]/10 via-purple-900/20 to-pink-900/10 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00f5ff]/20 to-purple-500/20 border border-[#00f5ff]/20 flex items-center justify-center">
                      <span className="font-display text-6xl text-white/20">A</span>
                    </div>
                    {/* Orbiting ring */}
                    <motion.div
                      className="absolute inset-[-20px] rounded-full border border-dashed border-[#00f5ff]/20"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-[-40px] rounded-full border border-dashed border-purple-500/10"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Dot on ring */}
                    <motion.div
                      className="absolute w-2 h-2 rounded-full bg-[#00f5ff]"
                      style={{ top: "-21px", left: "50%", translateX: "-50%" }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-4 glass border border-white/[0.06] rounded-2xl px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-mono text-xs text-white/60">Open to work</span>
                </div>
              </motion.div>
            </div>
          </ScrollReveal>
        </div>

        {/* Skills grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
          {skills.map((group, i) => (
            <ScrollReveal key={group.category} delay={i * 0.1} direction="up">
              <div className="glass border border-white/[0.04] rounded-2xl p-6 hover:border-[#00f5ff]/20 transition-all duration-500 group">
                <h3 className="font-mono text-[10px] tracking-[0.3em] text-[#00f5ff]/60 uppercase mb-4">
                  {group.category}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#00f5ff]/50 transition-colors duration-300" />
                      <span className="font-body text-sm text-white/50 group-hover:text-white/70 transition-colors duration-300">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative">
          <ScrollReveal>
            <h3 className="font-display text-3xl text-white/20 tracking-widest mb-10">
              EXPERIENCE
            </h3>
          </ScrollReveal>

          <div className="relative pl-8">
            {/* Animated vertical line */}
            <div className="absolute left-0 top-0 w-px h-full bg-white/5 overflow-hidden">
              <motion.div
                className="w-full bg-gradient-to-b from-[#00f5ff] to-purple-500"
                style={{ height: lineHeight }}
              />
            </div>

            <div className="space-y-8">
              {timeline.map((item, i) => (
                <ScrollReveal key={i} delay={i * 0.15}>
                  <div className="relative flex items-start gap-6 group">
                    {/* Dot */}
                    <div className="absolute -left-[33px] top-1.5 w-2 h-2 rounded-full border border-[#00f5ff]/40 bg-[#03040a] group-hover:border-[#00f5ff] group-hover:bg-[#00f5ff]/20 transition-all duration-300" />

                    <div className="flex-1 glass border border-white/[0.04] rounded-xl p-5 hover:border-white/10 transition-all duration-300">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="font-body font-medium text-white/80 group-hover:text-white transition-colors duration-300">
                            {item.role}
                          </h4>
                          <p className="font-mono text-xs text-[#00f5ff]/50 mt-1">{item.company}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-white/20">{item.year}</span>
                          {item.current && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-green-400/70 border border-green-400/20 rounded-full px-2 py-0.5">
                              <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
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
