"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1, borderColor: "#FF2D2D", boxShadow: "0 0 20px rgba(255, 45, 45, 0.4)" }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2.5 rounded-sm border cursor-pointer select-none"
          style={{
            background: "rgba(10, 10, 10, 0.85)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(255, 45, 45, 0.3)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          }}
          aria-label="Back to top"
          title="Back to top"
        >
          <span className="font-mono text-xs font-bold" style={{ color: "#FF2D2D" }}>
            ↑
          </span>
          <span
            className="hidden sm:inline-block font-mono text-[0.6rem] tracking-[0.25em] uppercase font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            TOP
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
            style={{ background: "#FF2D2D", boxShadow: "0 0 6px #FF2D2D" }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
