"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { ThemeToggle, MobileThemeToggle } from "@/components/ThemeToggle";

const navLinks = [
  { labelDesktop: "About",   labelMobile: "About",        href: "#about" },
  { labelDesktop: "Edu",     labelMobile: "Education",    href: "#education" },
  { labelDesktop: "Work",    labelMobile: "Work",         href: "#projects" },
  { labelDesktop: "Certs",   labelMobile: "Certificates", href: "#certificates" },
  { labelDesktop: "Contact", labelMobile: "Contact",      href: "#contact" },
];

export default function Navbar() {
  const [scrolled,       setScrolled]       = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [activeSection,  setActiveSection]  = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      if (!isHome) {
        setActiveSection("");
        return;
      }

      const sections = ["about", "education", "projects", "certificates", "contact"];
      for (const sec of [...sections].reverse()) {
        const el = document.getElementById(sec);
        if (el && window.scrollY >= el.offsetTop - 200) {
          setActiveSection(sec);
          break;
        }
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navigateTo = (href: string) => {
    setMobileOpen(false);
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
    <>
      {/* ── Fixed navbar bar ── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{ height: scrolled ? "56px" : "68px", transition: "height 0.4s ease" }}
      >
        {/* backdrop */}
        <div
          className="absolute inset-0 transition-all duration-500"
          style={{
            background: scrolled
              ? "rgba(var(--color-overlay-base), 0.92)"
              : "linear-gradient(to bottom, rgba(var(--color-overlay-base), 0.85), transparent)",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(255,45,45,0.12)" : "none",
          }}
        />

        {/* content row */}
        <div className="relative h-full flex items-center justify-between px-4 md:px-8 lg:px-12">

          {/* ── Logo ── */}
          <motion.button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              if (isHome) {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                router.push("/");
              }
            }}
            className="flex items-center gap-1 shrink-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span
              className="hidden sm:block w-1 h-5 rounded-full mr-1"
              style={{ background: "linear-gradient(to bottom, #FF2D2D, #FF6B35)" }}
            />
            <span
              className="font-display tracking-[0.16em] leading-none select-none transition-colors"
              style={{ fontSize: "clamp(1.1rem, 3vw, 1.4rem)", color: isDark ? "var(--text-primary)" : "#0A0A0A" }}
            >
              ANISH
              <span style={{ color: "#FF2D2D" }}>.</span>
              DEV
            </span>
          </motion.button>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.slice(1);
              return (
                <button
                  key={link.href}
                  onClick={() => navigateTo(link.href)}
                  className={`relative group font-mono text-[0.65rem] tracking-[0.2em] uppercase transition-colors duration-300 ${isActive ? "" : "hover:text-[#0A0A0A] dark:hover:text-[var(--text-primary)]"}`}
                  style={{ color: isActive ? "#FF2D2D" : (isDark ? "var(--text-tertiary)" : "#1E293B") }}
                >
                  {link.labelDesktop}
                  <span
                    className="absolute -bottom-1 left-0 h-px transition-all duration-300 group-hover:w-full"
                    style={{
                      width: isActive ? "100%" : "0%",
                      background: "linear-gradient(to right, #FF2D2D, #FF6B35)",
                    }}
                  />
                </button>
              );
            })}

            {/* ── Theme Toggle Desktop ── */}
            <span style={{
              width: "1px",
              height: "16px",
              background: "rgba(255,255,255,0.1)",
              margin: "0 12px"
            }} />
            <ThemeToggle />

            {/* ── Dashboard button ── */}
            <Link href="/dashboard">
              <motion.span
                className="inline-flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.18em] uppercase rounded-sm px-3 py-1.5 border transition-all duration-300"
                style={{
                  background:  "rgba(200,255,0,0.08)",
                  borderColor: "rgba(200,255,0,0.3)",
                  color: isDark ? "#C8FF00" : "#0F172A",
                }}
                whileHover={{
                  background:  "rgba(200,255,0,0.16)",
                  borderColor: "rgba(200,255,0,0.6)",
                  scale: 1.03,
                }}
                whileTap={{ scale: 0.97 }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#C8FF00", boxShadow: "0 0 6px #C8FF00" }}
                />
                Dashboard
              </motion.span>
            </Link>

            {/* ── Stats button ── */}
            <Link href="/stats">
              <motion.span
                className="inline-flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.18em] uppercase rounded-sm px-3 py-1.5 border transition-all duration-300"
                style={{
                  background:   "rgba(168,85,247,0.08)",
                  borderColor:  "rgba(168,85,247,0.3)",
                  color: isDark ? "#A855F7" : "#0F172A",
                }}
                whileHover={{
                  background:  "rgba(168,85,247,0.16)",
                  borderColor: "rgba(168,85,247,0.6)",
                  scale: 1.03,
                }}
                whileTap={{ scale: 0.97 }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#A855F7", boxShadow: "0 0 6px #A855F7" }}
                />
                Stats
              </motion.span>
            </Link>



            {/* ── ML Lab button ── */}
            <Link href="/ml">
              <motion.span
                className="inline-flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.18em] uppercase rounded-sm px-3 py-1.5 border transition-all duration-300"
                style={{
                  background:   "rgba(255,45,45,0.08)",
                  borderColor:  "rgba(255,45,45,0.3)",
                  color: isDark ? "#FF2D2D" : "#0F172A",
                }}
                whileHover={{
                  background:  "rgba(255,45,45,0.16)",
                  borderColor: "rgba(255,45,45,0.6)",
                  scale: 1.03,
                }}
                whileTap={{ scale: 0.97 }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#FF2D2D", boxShadow: "0 0 6px #FF2D2D" }}
                />
                ML Lab
              </motion.span>
            </Link>
          </div>

          {/* ── Mobile: buttons + hamburger ── */}
          <div className="flex md:hidden items-center gap-1">

            <button
              onClick={toggleTheme}
              className="w-12 h-12 flex items-center justify-center p-2"
              aria-label="Toggle theme"
            >
              {isDark ? (
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              ) : (
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              )}
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className="relative flex flex-col justify-center items-center w-10 h-10 gap-[5px]"
            >
              <motion.span
                className="block h-[1.5px] rounded-full origin-center transition-colors"
                style={{ background: isDark ? "var(--text-primary)" : "#0A0A0A", width: "22px" }}
                animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 6.5 : 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.span
                className="block h-[1.5px] rounded-full transition-colors"
                style={{ background: isDark ? "var(--text-primary)" : "#0A0A0A", width: "22px" }}
                animate={{ opacity: mobileOpen ? 0 : 1, scaleX: mobileOpen ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="block h-[1.5px] rounded-full origin-center"
                style={{ background: "#FF2D2D", width: "14px", alignSelf: "flex-end" }}
                animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -6.5 : 0, width: mobileOpen ? "22px" : "14px" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </button>
          </div>
        </div>

        {/* ── Red accent line ── */}
        <AnimatePresence>
          {scrolled && (
            <motion.div
              className="absolute bottom-0 left-0 h-px"
              style={{ background: "linear-gradient(to right, #FF2D2D, transparent)" }}
              initial={{ width: "0%" }}
              animate={{ width: "40%" }}
              exit={{ width: "0%" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Mobile full-screen menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 flex flex-col"
            style={{ background: isDark ? "rgba(var(--color-overlay-base), 0.98)" : "rgba(248,248,248,0.98)", backdropFilter: "blur(24px)" }}
          >
            <div
              className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
              style={{
                background: "radial-gradient(circle at top right, rgba(255,45,45,0.15) 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none"
              style={{
                background: "radial-gradient(circle at bottom left, rgba(200,255,0,0.06) 0%, transparent 70%)",
              }}
            />

            <div className="flex flex-col items-start justify-center h-full px-8 gap-2">
              <motion.p
                className="font-mono text-[0.6rem] tracking-[0.3em] uppercase mb-6"
                style={{ color: "#FF2D2D" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                — Navigation
              </motion.p>

              {navLinks.map((link, i) => {
                const isActive = activeSection === link.href.slice(1);
                return (
                  <motion.button
                    key={link.href}
                    onClick={() => navigateTo(link.href)}
                    initial={{ opacity: 0, x: -32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: 0.15 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="group flex items-center gap-4 py-3 w-full"
                  >
                    <span
                      className="font-mono text-[0.6rem] tracking-widest w-6 shrink-0 transition-colors"
                      style={{ color: isDark ? "var(--text-tertiary)" : "var(--text-secondary)" }}
                    >
                      0{i + 1}
                    </span>
                    <span
                      className="font-display tracking-[0.1em] transition-colors duration-200"
                      style={{
                        fontSize: "clamp(2.4rem, 10vw, 3.5rem)",
                        color: isActive ? "#FF2D2D" : (isDark ? "var(--text-primary)" : "#0A0A0A"),
                        lineHeight: 1,
                      }}
                    >
                      {link.labelMobile}
                    </span>
                    <motion.span
                      className="ml-auto font-mono text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#FF2D2D" }}
                    >
                      →
                    </motion.span>
                  </motion.button>
                );
              })}

              {/* ── Appearance mobile ── */}
              <motion.div
                initial={{ opacity: 0, x: -32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.35, duration: 0.45 }}
                className="mt-4 w-full"
              >
                <div className="font-mono text-[0.6rem] tracking-[0.3em] uppercase mb-3" style={{ color: "#FF2D2D" }}>
                  — Appearance
                </div>
                <MobileThemeToggle />
              </motion.div>

              {/* ── ML Lab mobile ── */}
              <motion.div
                initial={{ opacity: 0, x: -32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.38, duration: 0.45 }}
                className="mt-6"
              >
                <Link href="/ml" onClick={() => setMobileOpen(false)}>
                  <span
                    className="inline-flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.2em] uppercase px-4 py-2.5 rounded-sm border"
                    style={{
                      background:  "rgba(255,45,45,0.1)",
                      borderColor: "rgba(255,45,45,0.35)",
                      color:       "#FF2D2D",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: "#FF2D2D", boxShadow: "0 0 8px #FF2D2D" }}
                    />
                    ML Lab
                    <span className="opacity-50">↗</span>
                  </span>
                </Link>
              </motion.div>



              {/* ── Dashboard mobile ── */}
              <motion.div
                initial={{ opacity: 0, x: -32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.44, duration: 0.45 }}
                className="mt-2"
              >
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <span
                    className="inline-flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.2em] uppercase px-4 py-2.5 rounded-sm border"
                    style={{
                      background:  "rgba(200,255,0,0.08)",
                      borderColor: "rgba(200,255,0,0.25)",
                      color:       "#C8FF00",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: "#C8FF00", boxShadow: "0 0 8px #C8FF00" }}
                    />
                    Dashboard
                    <span className="opacity-50">↗</span>
                  </span>
                </Link>
              </motion.div>

              {/* ── Stats mobile ── */}
              <motion.div
                initial={{ opacity: 0, x: -32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.47, duration: 0.45 }}
                className="mt-2"
              >
                <Link href="/stats" onClick={() => setMobileOpen(false)}>
                  <span
                    className="inline-flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.2em] uppercase px-4 py-2.5 rounded-sm border"
                    style={{
                      background:  "rgba(168,85,247,0.08)",
                      borderColor: "rgba(168,85,247,0.25)",
                      color:       "#A855F7",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: "#A855F7", boxShadow: "0 0 8px #A855F7" }}
                    />
                    Stats
                    <span className="opacity-50">↗</span>
                  </span>
                </Link>
              </motion.div>
            </div>

            <motion.div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(to right, #FF2D2D, transparent)" }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
