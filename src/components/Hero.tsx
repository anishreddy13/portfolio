"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

const words = ["DEVELOPER", "DESIGNER", "ENGINEER", "CREATOR"];

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
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative overflow-hidden h-[1em]">
      {words.map((word, i) => (
        <motion.span
          key={word}
          className="absolute inset-0 flex items-center"
          initial={{ y: "100%" }}
          animate={{
            y: ["100%", "0%", "0%", "-100%"],
          }}
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
  const y = useTransform(scrollY, [0, 600], [0, -120]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  const charVariants = {
    hidden: { opacity: 0, y: 60, skewY: 5 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      skewY: 0,
      transition: {
        delay: i * 0.06,
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  const title = "FULL STACK";

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      id="hero"
    >
      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,245,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-[#00f5ff]/5 via-purple-900/5 to-transparent" />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 text-center px-6 max-w-7xl mx-auto"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <span className="w-8 h-px bg-[#00f5ff]/50" />
          <span className="font-mono text-xs tracking-[0.4em] text-[#00f5ff]/70 uppercase">
            Available for work · 2025
          </span>
          <span className="w-8 h-px bg-[#00f5ff]/50" />
        </motion.div>

        {/* Main heading */}
        <div className="overflow-hidden mb-2">
          <div className="flex justify-center flex-wrap gap-x-6">
            {title.split("").map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={charVariants}
                initial="hidden"
                animate="visible"
                className="font-display text-[clamp(4rem,14vw,12rem)] leading-none tracking-tight text-white"
                style={{ display: char === " " ? "inline-block" : "inline-block", width: char === " " ? "0.3em" : "auto" }}
              >
                {char}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Gradient cycling word */}
        <div className="overflow-hidden mb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="font-display text-[clamp(4rem,14vw,12rem)] leading-none tracking-tight gradient-text"
          >
            <WordCycle />
          </motion.div>
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-body text-white/40 text-lg md:text-xl max-w-lg mx-auto mb-12 leading-relaxed"
        >
          Crafting immersive digital experiences where{" "}
          <span className="text-white/70">design meets engineering</span> — pixel perfect,
          performance obsessed.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            onClick={() => {
              document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="relative group px-8 py-4 rounded-full overflow-hidden font-mono text-sm tracking-widest uppercase text-[#03040a] bg-[#00f5ff]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">View My Work</span>
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.4 }}
            />
          </motion.button>

          <motion.button
            onClick={() => {
              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group flex items-center gap-3 px-8 py-4 rounded-full font-mono text-sm tracking-widest uppercase text-white/60 border border-white/10 hover:border-white/30 hover:text-white transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get in Touch
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="mt-20 flex items-center justify-center gap-12 md:gap-20"
        >
          {[
            { value: 5, suffix: "+", label: "Years Exp." },
            { value: 40, suffix: "+", label: "Projects" },
            { value: 99, suffix: "%", label: "Satisfaction" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-3xl md:text-4xl gradient-text-blue">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="font-mono text-xs text-white/30 tracking-widest uppercase mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-mono text-[10px] tracking-[0.3em] text-white/20 uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-10 bg-gradient-to-b from-[#00f5ff]/50 to-transparent"
        />
      </motion.div>
    </section>
  );
}
