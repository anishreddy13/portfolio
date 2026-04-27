"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";

const floatingParticles = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 10 + 8,
  delay: Math.random() * 5,
}));

export default function MLPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < 60; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,245,255,${0.15 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
        ctx.beginPath();
        ctx.arc(a.x, a.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,245,255,0.6)";
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  const features = [
    {
      icon: "⬡",
      title: "Neural Networks",
      desc: "Deep learning architectures for complex pattern recognition and prediction tasks.",
    },
    {
      icon: "◈",
      title: "NLP Models",
      desc: "Large language model fine-tuning and custom text classification pipelines.",
    },
    {
      icon: "⬢",
      title: "Computer Vision",
      desc: "Real-time object detection, segmentation, and visual understanding systems.",
    },
    {
      icon: "◆",
      title: "Reinforcement Learning",
      desc: "Autonomous agents trained via reward optimization for sequential decision-making.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#03040a] overflow-hidden">
      {/* Neural network canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent" />

      {/* Nav back link */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-8 left-8 z-20"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-mono text-white/40 hover:text-[#00f5ff] transition-colors duration-300 group"
        >
          <motion.span
            className="inline-block"
            whileHover={{ x: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            ←
          </motion.span>
          <span className="tracking-widest uppercase text-xs">Back to Portfolio</span>
        </Link>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl w-full mx-auto text-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8 inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00f5ff] animate-pulse" />
            <span className="font-mono text-xs tracking-[0.3em] text-[#00f5ff] uppercase">
              ML Laboratory — Coming Soon
            </span>
            <span className="w-2 h-2 rounded-full bg-[#00f5ff] animate-pulse" />
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-[clamp(4rem,12vw,10rem)] leading-none tracking-tight mb-6"
          >
            <span className="gradient-text">MACHINE</span>
            <br />
            <span className="text-white/10 [-webkit-text-stroke:1px_rgba(255,255,255,0.15)]">
              INTELLIGENCE
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={itemVariants}
            className="font-body text-white/40 text-lg max-w-2xl mx-auto mb-16 leading-relaxed"
          >
            This section will house interactive ML model demos, real-time inference experiments,
            and hands-on tools built at the edge of artificial intelligence research.
          </motion.p>

          {/* Feature grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="glass rounded-2xl p-6 text-left group hover:border-[#00f5ff]/20 transition-all duration-500"
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="text-3xl mb-4 text-[#00f5ff] group-hover:scale-110 transition-transform duration-300 inline-block">
                  {f.icon}
                </div>
                <h3 className="font-mono text-white text-sm tracking-widest uppercase mb-2">
                  {f.title}
                </h3>
                <p className="font-body text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Notify CTA */}
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase">
              Get notified when live
            </p>
            <div className="flex gap-3 w-full max-w-sm">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 glass rounded-xl px-4 py-3 text-sm font-body text-white/70 placeholder:text-white/20 border border-white/10 focus:border-[#00f5ff]/40 transition-colors duration-300"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl bg-[#00f5ff] text-[#03040a] font-mono text-sm font-medium tracking-wider hover:bg-white transition-colors duration-300"
              >
                Notify
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Corner decoration */}
      <div className="absolute bottom-8 right-8 font-mono text-xs text-white/10 tracking-widest">
        ML_LAB / v0.1.0
      </div>
    </div>
  );
}
