"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "financial-analyst-announcement-seen";

export default function FinancialAnalystAnnouncement() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, "true");
      setVisible(true);
    }, 900);

    return () => window.clearTimeout(timer);
  }, []);

  const close = () => setVisible(false);

  const tryNow = () => {
    close();
    const section = document.getElementById("featured-financial-analyst");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 sm:w-[390px] z-[9997] rounded-sm overflow-hidden"
          style={{
            background: "rgba(17,17,17,0.92)",
            border: "1px solid rgba(200,255,0,0.24)",
            boxShadow: "0 20px 70px rgba(0,0,0,0.55), 0 0 34px rgba(200,255,0,0.08)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(200,255,0,0.08)",
                  border: "1px solid rgba(200,255,0,0.22)",
                }}
              >
                <motion.span
                  animate={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-lg"
                >
                  🏦
                </motion.span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-mono text-[0.52rem] tracking-[0.25em] uppercase mb-1" style={{ color: "#C8FF00" }}>
                  New Multi-Agent AI
                </p>
                <p className="font-body text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                  🏦 AI Financial Analyst — Multi-Agent System
                </p>
                <p className="font-body text-xs mt-1 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                  Enter a stock ticker and watch 3 AI agents generate an investment brief in real-time.
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                className="font-mono text-sm leading-none px-1"
                style={{ color: "var(--text-tertiary)" }}
                aria-label="Dismiss financial analyst announcement"
              >
                x
              </button>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <motion.button
                type="button"
                onClick={tryNow}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2.5 rounded-sm font-mono text-[0.62rem] uppercase tracking-[0.2em]"
                style={{ background: "#C8FF00", color: "#0A0A0A" }}
              >
                Try Now
              </motion.button>
              <button
                type="button"
                onClick={close}
                className="px-3 py-2.5 rounded-sm font-mono text-[0.58rem] uppercase tracking-widest"
                style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-tertiary)" }}
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
