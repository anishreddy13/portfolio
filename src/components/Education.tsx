"use client";

import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const educationData = [
  {
    institution: "Teegala Krishna Reddy Engineering College (TKREC)",
    degree: "Bachelor of Technology - BTech, Artificial Intelligence and Machine Learning",
    timeline: "Jan 2021 – Jun 2025",
    focus: "Communication, Artificial Intelligence (AI)",
    accent: "#C8FF00",
  },
  {
    institution: "Narayana Junior College - India",
    degree: "Intermediate, MPC (Mathematics, Physics, Chemistry)",
    timeline: "Jul 2019 – Mar 2021",
    focus: "Mathematics, Physics, Chemistry",
    accent: "#FF2D2D",
  },
];

export default function Education() {
  return (
    <section id="education" className="relative py-32 overflow-hidden bg-[var(--surface-0)]">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[rgba(200,255,0,0.1)] to-transparent" />
      
      <div className="max-w-6xl mx-auto px-6 lg:px-12 relative z-10">
        <ScrollReveal>
          <div className="mb-16">
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
              Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C8FF00] to-[#00FF88]">Journey</span>
            </h2>
            <p className="font-body text-sm sm:text-base max-w-xl" style={{ color: "var(--text-secondary)" }}>
              Formal education laying the foundation for advanced machine learning, artificial intelligence, and software engineering.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative border-l ml-3 sm:ml-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {educationData.map((edu, idx) => (
            <ScrollReveal key={idx} delay={idx * 0.1}>
              <div className="relative pl-8 sm:pl-12 pb-16 last:pb-0 group">
                {/* Timeline Dot */}
                <div 
                  className="absolute left-[-5px] top-1 w-[9px] h-[9px] rounded-full transition-transform duration-500 group-hover:scale-150"
                  style={{ background: edu.accent, boxShadow: `0 0 10px ${edu.accent}` }}
                />
                
                {/* Timeline Line Highlight on Hover */}
                <div 
                  className="absolute left-[-1px] top-3 bottom-0 w-[1px] origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-700 ease-out"
                  style={{ background: `linear-gradient(to bottom, ${edu.accent}, transparent)` }}
                />

                {/* Content Card */}
                <div 
                  className="relative p-6 sm:p-8 rounded-sm overflow-hidden transition-colors duration-300"
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${edu.accent}, transparent)` }} />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h3 className="font-display text-xl sm:text-2xl" style={{ color: "var(--text-primary)" }}>
                      {edu.institution}
                    </h3>
                    <span 
                       className="font-mono text-[0.65rem] tracking-widest uppercase px-3 py-1 rounded-sm whitespace-nowrap"
                       style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}
                    >
                      {edu.timeline}
                    </span>
                  </div>

                  <h4 className="font-mono text-sm tracking-wide mb-6" style={{ color: edu.accent }}>
                    {edu.degree}
                  </h4>

                  <div 
                     className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border"
                     style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Core Focus:</span>
                    <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>{edu.focus}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
