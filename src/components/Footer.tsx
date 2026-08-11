"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import ScrollReveal from "./ScrollReveal";
import { useTranslations } from "next-intl";

// Links moved inside component for translation support

export default function Footer() {
  const t = useTranslations("Footer");
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  const footerLinks = {
    [t('nav')]: [
      { label: t('about'),    href: "#about"    },
      { label: t('projects'), href: "#projects" },
      { label: t('contact'),  href: "#contact"  },
    ],
    [t('connect')]: [
      { label: "GitHub",   href: "https://github.com/anishreddy13"   },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/anishreddy5676"  },
      { label: "Twitter",  href: "https://x.com/anishreddy1373"   },
      { label: "Dribbble", href: "https://dribbble.com"  },
    ],
    [t('legal')]: [
      { label: t('privacy'), href: "/privacy" },
      { label: t('terms'),   href: "/terms"   },
    ],
  };

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
          ANISHREDDY.ONLINE
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
                  style={{ color: "var(--text-primary)" }}
                >
                  ANISHREDDY
                  <span style={{ color: "#FF2D2D" }}>.</span>
                  ONLINE
                </span>
              </motion.button>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                {t('description')}
                <span style={{ color: "var(--text-secondary)" }}>{t('description_highlight')}</span>
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
                        style={{ color: "var(--text-tertiary)" }}
                        whileHover={{ x: 4, color: "var(--text-primary)" }}
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
              style={{ color: "var(--text-tertiary)" }}
            >
              © {currentYear} AnishReddy.Online — All rights reserved
            </p>

            {/* Status badge & PDF Action */}
            <div className="flex items-center gap-3 order-1 sm:order-2">
              <motion.a
                href="/docs/PalReddy_AnishReddy_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04, borderColor: "#38BDF8", color: "#38BDF8" }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border font-mono text-[0.58rem] tracking-[0.2em] uppercase transition-colors cursor-pointer"
                style={{
                  background: "rgba(56, 189, 248, 0.06)",
                  borderColor: "rgba(56, 189, 248, 0.25)",
                  color: "var(--text-secondary)",
                }}
                title="Open Resume PDF"
              >
                CV Resume
              </motion.a>

              <motion.a
                href="/docs/anish-portfolio-system-architecture.pdf"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04, borderColor: "#C8FF00", color: "#C8FF00" }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border font-mono text-[0.58rem] tracking-[0.2em] uppercase transition-colors cursor-pointer"
                style={{
                  background: "rgba(200, 255, 0, 0.06)",
                  borderColor: "rgba(200, 255, 0, 0.25)",
                  color: "var(--text-secondary)",
                }}
                title="Open Technical System Architecture PDF"
              >
                <span>🖨️</span> OPEN PDF
              </motion.a>

              <motion.div
                className="flex items-center gap-2 px-4 py-2 rounded-sm"
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
                  {t('available')}
                </span>
              </motion.div>
            </div>

            {/* Stack */}
            <p
              className="font-mono text-[0.58rem] tracking-[0.22em] uppercase order-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              Built with{" "}
              <span style={{ color: "var(--text-secondary)" }}>Next.js</span>
              {" + "}
              <span style={{ color: "var(--text-secondary)" }}>Framer Motion</span>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
