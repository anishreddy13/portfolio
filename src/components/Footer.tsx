"use client";

import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const footerLinks = {
  Navigation: ["About", "Projects", "Contact"],
  Connect: ["GitHub", "LinkedIn", "Twitter", "Dribbble"],
  Legal: ["Privacy", "Terms"],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.04] pt-16 pb-8 px-6">
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00f5ff]/20 to-transparent" />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand col */}
          <div className="md:col-span-1">
            <ScrollReveal>
              <motion.div
                className="font-display text-3xl tracking-widest gradient-text-blue mb-4"
                whileHover={{ scale: 1.02 }}
              >
                ALEX.DEV
              </motion.div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="font-body text-white/30 text-sm leading-relaxed max-w-xs">
                Full-stack developer crafting immersive digital experiences at the intersection of
                design and technology.
              </p>
            </ScrollReveal>
          </div>

          {/* Link cols */}
          {Object.entries(footerLinks).map(([section, links], i) => (
            <ScrollReveal key={section} delay={0.1 * (i + 1)} direction="up">
              <div>
                <h4 className="font-mono text-[10px] tracking-[0.3em] text-white/20 uppercase mb-4">
                  {section}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <motion.a
                        href="#"
                        className="font-body text-sm text-white/40 hover:text-white transition-colors duration-300"
                        whileHover={{ x: 4 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {link}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.04] mb-8" />

        {/* Bottom bar */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase">
              © {currentYear} Alex.Dev — All rights reserved
            </p>

            {/* Status badge */}
            <motion.div
              className="flex items-center gap-2 glass border border-white/[0.06] rounded-full px-4 py-2"
              whileHover={{ scale: 1.05 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">
                Available for projects
              </span>
            </motion.div>

            <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase">
              Built with Next.js + Framer Motion
            </p>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
