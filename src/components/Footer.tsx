"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import ScrollReveal from "./ScrollReveal";

const footerLinks = {
  Navigation: [
    { label: "About",    href: "#about"    },
    { label: "Projects", href: "#projects" },
    { label: "Contact",  href: "#contact"  },
  ],
  Connect: [
    { label: "GitHub",   href: "https://github.com"   },
    { label: "LinkedIn", href: "https://linkedin.com"  },
    { label: "Twitter",  href: "https://twitter.com"   },
    { label: "Dribbble", href: "https://dribbble.com"  },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms",   href: "/terms"   },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  const navigateTo = (href: string) => {
    if (href.startsWith("/")) {
      router.push(href);
      return;
    }
    if (href.startsWith("#")) {
      if (!isHome) {
        router.push(`/${href}`);
        return;
      }
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: "var(--surface-1)",
        borderTop:  "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Top red accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, #FF2D2D, #FF6B35, transparent)",
        }}
      />

      {/* Background glow */}
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at bottom left, rgba(255,45,45,0.05) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute top-0 right-0 w-[400px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(200,255,0,0.03) 0%, transparent 65%)",
        }}
      />

      {/* Large background wordmark */}
      <div
        className="absolute bottom-0 left-0 right-0 flex justify-center
                   pointer-events-none overflow-hidden select-none"
      >
        <span
          className="font-display tracking-[0.12em] leading-none"
          style={{
            fontSize:         "clamp(5rem, 18vw, 14rem)",
            color:            "transparent",
            WebkitTextStroke: "1px rgba(255,255,255,0.03)",
            transform:        "translateY(25%)",
          }}
        >
          ANISH.DEV
        </span>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pt-14 pb-8">

        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="md:col-span-1">
            <ScrollReveal>
              <motion.button
                onClick={() => {
                  if (isHome) {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    router.push("/");
                  }
                }}
                className="flex items-center gap-2 mb-4 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span
                  className="w-1 h-5 rounded-full"
                  style={{ background: "linear-gradient(to bottom, #FF2D2D, #FF6B35)" }}
                />
                <span
                  className="font-display text-xl tracking-[0.16em]"
                  style={{ color: "#F0F0F0" }}
                >
                  ANISH
                  <span style={{ color: "#FF2D2D" }}>.</span>
                  DEV
                </span>
              </motion.button>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <p className="font-body text-sm leading-relaxed" style={{ color: "#606060" }}>
                Full-stack developer crafting bold digital experiences at the
                intersection of{" "}
                <span style={{ color: "#A0A0A0" }}>design and engineering.</span>
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <div
                className="mt-5"
                style={{
                  width:      "40px",
                  height:     "2px",
                  background: "linear-gradient(90deg, #FF2D2D, transparent)",
                }}
              />
            </ScrollReveal>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links], i) => (
            <ScrollReveal key={section} delay={0.07 * (i + 1)} direction="up">
              <div>
                <h4
                  className="font-mono text-[0.58rem] tracking-[0.32em] uppercase mb-5"
                  style={{ color: "#FF2D2D" }}
                >
                  {section}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <motion.a
                        href={link.href}
                        onClick={(e) => {
                          if (!link.href.startsWith("http")) {
                            e.preventDefault();
                            navigateTo(link.href);
                          }
                        }}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="group flex items-center gap-2 font-body text-sm transition-colors duration-200"
                        style={{ color: "#606060" }}
                        whileHover={{ x: 4, color: "#F0F0F0" }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <span
                          className="w-0 h-px group-hover:w-3 transition-all duration-200"
                          style={{ background: "#FF2D2D" }}
                        />
                        {link.label}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Divider */}
        <div className="mb-7" style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

        {/* Bottom bar */}
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Copyright */}
            <p
              className="font-mono text-[0.58rem] tracking-[0.22em] uppercase order-2 sm:order-1"
              style={{ color: "#606060" }}
            >
              © {currentYear} Anish.Dev — All rights reserved
            </p>

            {/* Status badge */}
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-sm order-1 sm:order-2"
              style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.2)" }}
              whileHover={{ scale: 1.04, borderColor: "rgba(255,45,45,0.4)", boxShadow: "0 0 20px rgba(255,45,45,0.15)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#FF2D2D", boxShadow: "0 0 6px #FF2D2D" }}
              />
              <span
                className="font-mono text-[0.58rem] tracking-[0.2em] uppercase"
                style={{ color: "#FF2D2D" }}
              >
                Available for projects
              </span>
            </motion.div>

            {/* Stack */}
            <p
              className="font-mono text-[0.58rem] tracking-[0.22em] uppercase order-3"
              style={{ color: "#606060" }}
            >
              Built with{" "}
              <span style={{ color: "#A0A0A0" }}>Next.js</span>
              {" + "}
              <span style={{ color: "#A0A0A0" }}>Framer Motion</span>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}