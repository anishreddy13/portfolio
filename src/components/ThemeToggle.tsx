"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      onClick={(e) => {
        // Stop propagation to prevent double-firing if wrapped in another clickable element
        e.stopPropagation();
        toggleTheme();
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Toggle theme"
      className="relative flex items-center shrink-0 cursor-pointer rounded-full overflow-hidden"
      style={{
        width: "52px",
        height: "28px",
        background: isDark ? "var(--border)" : "rgba(0,0,0,0.08)",
        border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.15)",
      }}
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 flex justify-between items-center px-1.5 pointer-events-none">
        {/* Sun Icon */}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#404040" : "#FF6B35"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>

        {/* Moon Icon */}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#FFFFFF" : "var(--text-secondary)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>

      <motion.div
        initial={false}
        animate={{ x: isDark ? 26 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className="w-[22px] h-[22px] rounded-full shadow-md z-10"
        style={{
          background: isDark ? "#C8FF00" : "#FF6B35",
        }}
      />
    </motion.button>
  );
}

export function MobileThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <div
      onClick={toggleTheme}
      className="w-full h-[48px] rounded-sm flex items-center justify-between px-4 transition-colors cursor-pointer"
      style={{
        background: "var(--surface-2)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-3">
        {isDark ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
        <span className="font-mono text-[0.62rem] tracking-[0.2em] uppercase" style={{ color: "var(--text-secondary)" }}>
          {isDark ? "DARK MODE" : "LIGHT MODE"}
        </span>
      </div>
      
      <div style={{ transform: "scale(0.85)", pointerEvents: "none" }}>
        <ThemeToggle />
      </div>
    </div>
  );
}
