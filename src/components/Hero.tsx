"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

const words = ["BUILDER", "ENGINEER", "RESEARCHER", "CREATOR"];

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.8 }}
    >
      {target}{suffix}
    </motion.span>
  );
}

function WordCycle() {
  return (
    <div className="relative overflow-hidden" style={{ height: "1em" }}>
      {words.map((word, i) => (
        <motion.span
          key={word}
          className="absolute inset-0 flex items-center"
          initial={{ y: "110%" }}
          animate={{ y: ["110%", "0%", "0%", "-110%"] }}
          transition={{
            duration: 3,
            delay: i * 3,
            repeat: Infinity,
            repeatDelay: (words.length - 1) * 3,
            ease: [0.16, 1, 0.3, 1],
            times: [0, 0.15, 0.85, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y       = useTransform(scrollY, [0, 600], [0, -80]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  const charVariants = {
    hidden:  { opacity: 0, y: 60, skewY: 4 },
    visible: (i: number) => ({
      opacity: 1, y: 0, skewY: 0,
      transition: { delay: i * 0.05, duration: 0.9, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "var(--surface-0)" }}
    >
      {/* ── Red grid overlay ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,45,45,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,45,1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* ── Corner accents ── */}
      <div
        className="absolute top-0 left-0 w-72 h-72 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,45,45,0.12) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at bottom right, rgba(200,255,0,0.07) 0%, transparent 65%)",
        }}
      />

      {/* ── Horizontal red rule — desktop only ── */}
      <div
        className="absolute left-0 right-0 hidden lg:block pointer-events-none"
        style={{ top: "50%", height: "1px", background: "rgba(255,45,45,0.06)" }}
      />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12
                   pt-24 pb-24 md:pt-28 md:pb-28"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12 xl:gap-20">

          {/* ── LEFT: text block ── */}
          <div className="flex-1 min-w-0">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 mb-4 md:mb-5"
            >
              <span className="w-8 h-px" style={{ background: "#FF2D2D" }} />
              <span
                className="font-mono text-[0.62rem] tracking-[0.35em] uppercase"
                style={{ color: "#FF2D2D" }}
              >
                Available for work · 2026
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#FF2D2D", boxShadow: "0 0 8px #FF2D2D" }}
              />
            </motion.div>

            {/* ML & AI — character stagger */}
            <div className="overflow-visible mb-0">
              <div className="flex flex-wrap">
                {"ML & AI".split("").map((char, i) => (
                  <motion.span
                    key={i}
                    custom={i}
                    variants={charVariants}
                    initial="hidden"
                    animate="visible"
                    className="font-display leading-[0.88] tracking-tight"
                    style={{
                      fontSize: "clamp(3.2rem, 10vw, 8.5rem)",
                      color: "#F0F0F0",
                      display: "inline-block",
                      width: char === " " ? "0.22em" : "auto",
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Cycling word — red gradient */}
            <div className="overflow-hidden mb-3 md:mb-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="font-display leading-[0.88] tracking-tight"
                style={{
                  fontSize: "clamp(3.2rem, 10vw, 8.5rem)",
                  background:
                    "linear-gradient(135deg, #FF2D2D 0%, #FF6B35 50%, #C8FF00 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                <WordCycle />
              </motion.div>
            </div>

            {/* Red divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.0, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="origin-left mb-4 md:mb-5"
              style={{
                width: "56px",
                height: "2px",
                background: "linear-gradient(90deg, #FF2D2D, #FF6B35, transparent)",
              }}
            />

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-body text-base md:text-lg max-w-lg mb-6 md:mb-7 leading-relaxed"
              style={{ color: "#A0A0A0" }}
            >
              Building intelligent systems where{" "}
              <span style={{ color: "#F0F0F0" }}>machine learning meets real products</span>{" "}
              — from model training to production deployment.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-8 lg:mb-0"
            >
              {/* Primary */}
              <motion.button
                onClick={() =>
                  document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
                }
                className="relative overflow-hidden px-7 py-3.5 rounded-sm
                           font-mono text-[0.7rem] tracking-[0.2em] uppercase
                           min-w-[160px] text-center"
                style={{ background: "#FF2D2D", color: "#fff", border: "none" }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ background: "#FF6B35" }}
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                />
                <span className="relative z-10">View My Work</span>
              </motion.button>

              {/* Secondary */}
              <motion.button
                onClick={() =>
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
                }
                className="group flex items-center gap-3 px-7 py-3.5 rounded-sm
                           font-mono text-[0.7rem] tracking-[0.2em] uppercase
                           transition-all duration-300 min-w-[160px] text-center justify-center"
                style={{
                  color: "#A0A0A0",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                }}
                whileHover={{
                  color: "#F0F0F0",
                  borderColor: "rgba(255,45,45,0.4)",
                  scale: 1.03,
                }}
                whileTap={{ scale: 0.97 }}
              >
                Get in Touch
                <span className="group-hover:translate-x-1 transition-transform duration-300">
                  →
                </span>
              </motion.button>
            </motion.div>

            {/* Stats — desktop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.9, duration: 0.8 }}
              className="hidden lg:flex items-center gap-10 mt-7 pt-7"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                { value: 50, suffix: "+", label: "Students Mentored",   sub: "mentorship · ml"         },
                { value: 2,  suffix: "+", label: "Yrs Dev & ML",        sub: "3mo industry · frontend" },
                { value: 4,  suffix: "y", label: "Teaching B.Tech Era", sub: "academia · labs"         },
              ].map((stat, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div>
                    <div
                      className="font-display text-3xl leading-none"
                      style={{ color: "#F0F0F0" }}
                    >
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div
                      className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mt-1"
                      style={{ color: "#606060" }}
                    >
                      {stat.label}
                    </div>
                    <div
                      className="font-mono text-[0.62rem] tracking-widest uppercase mt-1"
                      style={{
                        color: "#FF6B35",
                        textShadow: "0 0 8px rgba(255,107,53,0.5)",
                        letterSpacing: "0.2em",
                      }}
                    >
                      {stat.sub}
                    </div>
                  </div>
                  {i < 2 && (
                    <div
                      className="w-px h-10 mt-1 ml-3"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: profile photo ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0 mx-auto lg:mx-0
                       w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96
                       mt-8 lg:mt-0"
          >
            {/* Rotating border ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background:
                  "conic-gradient(from 0deg, #FF2D2D, #FF6B35, #C8FF00, #A855F7, #FF2D2D)",
                padding: "2px",
                borderRadius: "18px",
              }}
            >
              <div
                className="w-full h-full"
                style={{ background: "var(--surface-0)", borderRadius: "16px" }}
              />
            </motion.div>

            {/* Photo container */}
            <div
              className="absolute inset-[3px] overflow-hidden"
              style={{ borderRadius: "15px" }}
            >
              <Image
                src="/profile.jpeg"
                alt="Anish — ML & AI Developer"
                fill
                className="object-cover object-top"
                priority
              />
              <div
                className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, rgba(255,45,45,0.25) 0%, transparent 100%)",
                }}
              />
            </div>

            {/* Floating badge — top right */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-3 -right-3 z-10"
            >
              <div
                className="font-mono text-[0.58rem] tracking-[0.15em] uppercase
                           px-2.5 py-1.5 rounded-sm"
                style={{
                  background: "rgba(10,10,10,0.95)",
                  border:     "1px solid rgba(255,45,45,0.4)",
                  color:      "#FF2D2D",
                  boxShadow:  "0 0 16px rgba(255,45,45,0.25)",
                }}
              >
                Open to work
              </div>
            </motion.div>

            {/* Floating badge — bottom left */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-3 -left-3 z-10"
            >
              <div
                className="font-mono text-[0.58rem] tracking-[0.15em] uppercase
                           px-2.5 py-1.5 rounded-sm"
                style={{
                  background: "rgba(10,10,10,0.95)",
                  border:     "1px solid rgba(200,255,0,0.35)",
                  color:      "#C8FF00",
                  boxShadow:  "0 0 16px rgba(200,255,0,0.15)",
                }}
              >
                ML & AI
              </div>
            </motion.div>

            {/* Red glow behind photo */}
            <div
              className="absolute inset-0 -z-10 blur-2xl opacity-30"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,45,45,0.4) 0%, transparent 70%)",
                transform: "scale(1.2)",
              }}
            />
          </motion.div>
        </div>

        {/* ── Stats mobile ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9, duration: 0.8 }}
          className="flex lg:hidden items-center justify-center gap-8 mt-8 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {[
            { value: 50, suffix: "+", label: "Students Mentored",   sub: "mentorship · ml"         },
            { value: 2,  suffix: "+", label: "Yrs Dev & ML",        sub: "3mo industry · frontend" },
            { value: 4,  suffix: "y", label: "Teaching B.Tech Era", sub: "academia · labs"         },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div
                className="font-display text-2xl sm:text-3xl leading-none"
                style={{ color: "#F0F0F0" }}
              >
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div
                className="w-4 h-px mx-auto my-1.5"
                style={{ background: "#FF2D2D" }}
              />
              <div
                className="font-mono text-[0.58rem] tracking-[0.22em] uppercase"
                style={{ color: "#606060" }}
              >
                {stat.label}
              </div>
              <div
                className="font-mono text-[0.62rem] tracking-widest uppercase mt-1"
                style={{
                  color: "#FF6B35",
                  textShadow: "0 0 8px rgba(255,107,53,0.5)",
                  letterSpacing: "0.2em",
                }}
              >
                {stat.sub}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator — pushed further down to avoid overlap ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2
                   flex flex-col items-center gap-1"
      >
        <span
          className="font-mono text-[0.55rem] tracking-[0.4em] uppercase"
          style={{ color: "#606060" }}
        >
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: "1px",
            height: "28px",
            background: "linear-gradient(to bottom, #FF2D2D, transparent)",
          }}
        />
      </motion.div>
    </section>
  );
}