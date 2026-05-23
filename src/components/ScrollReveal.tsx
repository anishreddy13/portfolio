"use client";

import { useRef, ReactNode } from "react";
import { motion, useInView, Variant } from "framer-motion";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  once?: boolean;
}

const directionMap: Record<string, { hidden: Variant; visible: Variant }> = {
  up: {
    hidden:  { opacity: 0, y: 48, skewY: 1.5 },
    visible: { opacity: 1, y: 0,  skewY: 0   },
  },
  down: {
    hidden:  { opacity: 0, y: -48, skewY: -1.5 },
    visible: { opacity: 1, y: 0,   skewY: 0    },
  },
  left: {
    hidden:  { opacity: 0, x: 64, skewX: -2 },
    visible: { opacity: 1, x: 0,  skewX: 0  },
  },
  right: {
    hidden:  { opacity: 0, x: -64, skewX: 2 },
    visible: { opacity: 1, x: 0,   skewX: 0 },
  },
  none: {
    hidden:  { opacity: 0, scale: 0.97 },
    visible: { opacity: 1, scale: 1    },
  },
};

export default function ScrollReveal({
  children,
  delay     = 0,
  duration  = 0.75,
  className = "",
  direction = "up",
  once      = true,
}: ScrollRevealProps) {
  const ref      = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-72px 0px" });
  const variants = directionMap[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}