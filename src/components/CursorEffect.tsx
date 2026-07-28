"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

/* ── Particle type ── */
interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  color: string;
}

const COLORS = ["#FF2D2D", "#FF6B35", "#C8FF00", "#A855F7", "#ffffff"];

export default function CursorEffect() {
  const [isVisible, setIsVisible]   = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [cursorColor, setCursorColor] = useState("#FF2D2D");
  const [particles, setParticles]   = useState<Particle[]>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const particleIdRef = useRef(0);

  /* ── Motion values ── */
  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);

  /* ── Dot: instant ── */
  const dotX = useSpring(cursorX, { damping: 28, stiffness: 900 });
  const dotY = useSpring(cursorY, { damping: 28, stiffness: 900 });

  /* ── Ring: lagging ── */
  const ringX = useSpring(cursorX, { damping: 22, stiffness: 180 });
  const ringY = useSpring(cursorY, { damping: 22, stiffness: 180 });

  /* ── Aura: very slow ── */
  const auraX = useSpring(cursorX, { damping: 40, stiffness: 80 });
  const auraY = useSpring(cursorY, { damping: 40, stiffness: 80 });

  /* ── Spawn click particles ── */
  const spawnParticles = useCallback((x: number, y: number) => {
    const count = 8;
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: particleIdRef.current++,
      x,
      y,
      angle: (360 / count) * i,
      speed: 40 + Math.random() * 40,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev =>
        prev.filter(p => !newParticles.find(np => np.id === p.id))
      );
    }, 600);
  }, []);

  /* ── Color-react to element type ── */
  const getElementColor = useCallback((target: HTMLElement): string => {
    if (target.closest("a"))       return "#C8FF00";
    if (target.closest("button"))  return "#FF6B35";
    if (target.closest("input") || target.closest("textarea")) return "#A855F7";
    if (target.closest("[data-cursor-red]"))  return "#FF2D2D";
    if (target.closest("[data-cursor-lime]")) return "#C8FF00";
    return "#FF2D2D";
  }, []);

  useEffect(() => {
    const checkTouchOrReducedMotion = () => {
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setIsTouchDevice(isTouch || reducedMotion);
    };
    checkTouchOrReducedMotion();
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

    let rafId: number | null = null;
    let lastHovering = false;
    let lastColor = "#FF2D2D";

    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        setIsVisible(true);

        const target = e.target as HTMLElement;
        if (!target) return;

        const interactive =
          target.closest("a") ||
          target.closest("button") ||
          target.closest("input") ||
          target.closest("textarea") ||
          target.closest("[data-cursor-hover]");

        const nextHovering = !!interactive;
        const nextColor = interactive ? getElementColor(target) : "#FF2D2D";

        if (nextHovering !== lastHovering) {
          lastHovering = nextHovering;
          setIsHovering(nextHovering);
        }
        if (nextColor !== lastColor) {
          lastColor = nextColor;
          setCursorColor(nextColor);
        }
      });
    };

    const onDown = (e: MouseEvent) => {
      setIsClicking(true);
      spawnParticles(e.clientX, e.clientY);
    };
    const onUp   = () => setIsClicking(false);
    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);

    window.addEventListener("mousemove",  onMove, { passive: true });
    window.addEventListener("mousedown",  onDown, { passive: true });
    window.addEventListener("mouseup",    onUp,   { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("mousedown",  onDown);
      window.removeEventListener("mouseup",    onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [isTouchDevice, cursorX, cursorY, spawnParticles, getElementColor]);

  if (isTouchDevice) return null;

  return (
    <>
      {/* ── Aura: slow large glow ── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none"
        style={{
          x: auraX,
          y: auraY,
          translateX: "-50%",
          translateY: "-50%",
          zIndex: 99994,
        }}
        animate={{ opacity: isVisible ? (isHovering ? 0.6 : 0.2) : 0 }}
        transition={{ opacity: { duration: 0.4 } }}
      >
        <div
          className="w-24 h-24 rounded-full"
          style={{
            background: `radial-gradient(circle, ${cursorColor}22 0%, transparent 70%)`,
            filter: "blur(8px)",
            transition: "background 0.3s ease",
          }}
        />
      </motion.div>

      {/* ── Ring: morphing outline ── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          zIndex: 99995,
        }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: isHovering ? 1.8 : isClicking ? 0.6 : 1,
        }}
        transition={{
          opacity: { duration: 0.2 },
          scale: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] },
        }}
      >
        <motion.div
          className="w-9 h-9 rounded-full"
          style={{
            border: `1.5px solid ${cursorColor}`,
            boxShadow: `0 0 10px ${cursorColor}55`,
            transition: "border-color 0.25s ease, box-shadow 0.25s ease",
          }}
          animate={{
            borderRadius: isHovering ? "6px" : "50%",
            rotate: isHovering ? 45 : 0,
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>

      {/* ── Dot: sharp core ── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          zIndex: 99999,
        }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: isClicking ? 0.4 : isHovering ? 0 : 1,
        }}
        transition={{
          opacity: { duration: 0.15 },
          scale: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
        }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: cursorColor,
            boxShadow: `0 0 6px ${cursorColor}, 0 0 14px ${cursorColor}88`,
            transition: "background 0.2s ease, box-shadow 0.2s ease",
          }}
        />
      </motion.div>

      {/* ── Click Particles ── */}
      <AnimatePresence>
        {particles.map(p => {
          const rad  = (p.angle * Math.PI) / 180;
          const endX = Math.cos(rad) * p.speed;
          const endY = Math.sin(rad) * p.speed;
          return (
            <motion.div
              key={p.id}
              className="fixed pointer-events-none rounded-full"
              style={{
                left: p.x,
                top:  p.y,
                zIndex: 99998,
                width:  4,
                height: 4,
                background: p.color,
                boxShadow: `0 0 6px ${p.color}`,
                translateX: "-50%",
                translateY: "-50%",
              }}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: endX,
                y: endY,
                scale: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
      </AnimatePresence>
    </>
  );
}