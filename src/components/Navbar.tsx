"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const navLinks = [
  { label: "About",   href: "#about" },
  { label: "Work",    href: "#projects" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled,       setScrolled]       = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [activeSection,  setActiveSection]  = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      const sections = ["about", "projects", "contact"];
      for (const sec of [...sections].reverse()) {
        const el = document.getElementById(sec);
        if (el && window.scrollY >= el.offsetTop - 200) {
          setActiveSection(sec);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
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
              ? "rgba(10,10,10,0.92)"
              : "linear-gradient(to bottom, rgba(10,10,10,0.85), transparent)",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(255,45,45,0.12)" : "none",
          }}
        />

        {/* content row — single line, never wraps */}
        <div className="relative h-full flex items-center justify-between px-4 md:px-8 lg:px-12">

          {/* ── Logo ── */}
          <motion.a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="flex items-center gap-1 shrink-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* red accent bar */}
            <span
              className="hidden sm:block w-1 h-5 rounded-full mr-1"
              style={{ background: "linear-gradient(to bottom, #FF2D2D, #FF6B35)" }}
            />
            <span
              className="font-display tracking-[0.16em] leading-none select-none"
              style={{
                fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                color: "#F0F0F0",
              }}
            >
              ANISH
              <span style={{ color: "#FF2D2D" }}>.</span>
              DEV
            </span>
          </motion.a>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.slice(1);
              return (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="relative group font-mono text-[0.65rem] tracking-[0.2em] uppercase transition-colors duration-300"
                  style={{ color: isActive ? "#FF2D2D" : "#A0A0A0" }}
                >
                  {link.label}
                  {/* animated underline */}
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

            {/* ML Lab button */}
            <Link href="/ml">
              <motion.span
                className="inline-flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.18em] uppercase rounded-sm px-3 py-1.5 border transition-all duration-300"
                style={{
                  background:   "rgba(255,45,45,0.08)",
                  borderColor:  "rgba(255,45,45,0.3)",
                  color:        "#FF2D2D",
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

          {/* ── Mobile: ML Lab + hamburger ── */}
          <div className="flex md:hidden items-center gap-3">
            <Link href="/ml">
              <span
                className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] tracking-[0.15em] uppercase px-2.5 py-1 rounded-sm border"
                style={{
                  background:  "rgba(255,45,45,0.08)",
                  borderColor: "rgba(255,45,45,0.3)",
                  color:       "#FF2D2D",
                }}
              >
                <span className="w-1 h-1 rounded-full bg-[#FF2D2D] animate-pulse" />
                ML
              </span>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className="relative flex flex-col justify-center items-center w-10 h-10 gap-[5px]"
            >
              <motion.span
                className="block h-[1.5px] rounded-full origin-center"
                style={{ background: "#F0F0F0", width: "22px" }}
                animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 6.5 : 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.span
                className="block h-[1.5px] rounded-full"
                style={{ background: "#F0F0F0", width: "22px" }}
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

        {/* ── Red accent line at bottom of scrolled nav ── */}
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
            style={{ background: "rgba(10,10,10,0.98)", backdropFilter: "blur(24px)" }}
          >
            {/* decorative red corner accent */}
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

            {/* nav items — centered */}
            <div className="flex flex-col items-start justify-center h-full px-8 gap-2">

              {/* section label */}
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
                    onClick={() => scrollTo(link.href)}
                    initial={{ opacity: 0, x: -32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: 0.15 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="group flex items-center gap-4 py-3 w-full"
                  >
                    {/* index number */}
                    <span
                      className="font-mono text-[0.6rem] tracking-widest w-6 shrink-0"
                      style={{ color: "#FF2D2D" }}
                    >
                      0{i + 1}
                    </span>

                    {/* label */}
                    <span
                      className="font-display tracking-[0.1em] transition-colors duration-200"
                      style={{
                        fontSize: "clamp(2.4rem, 10vw, 3.5rem)",
                        color: isActive ? "#FF2D2D" : "#F0F0F0",
                        lineHeight: 1,
                      }}
                    >
                      {link.label}
                    </span>

                    {/* arrow — appears on hover */}
                    <motion.span
                      className="ml-auto font-mono text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#FF2D2D" }}
                    >
                      →
                    </motion.span>
                  </motion.button>
                );
              })}

              {/* ML Lab — mobile full menu */}
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
            </div>

            {/* bottom strip */}
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