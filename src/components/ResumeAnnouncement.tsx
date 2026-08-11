"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const RESUME_URL = "/docs/PalReddy_AnishReddy_Resume.pdf";
const STORAGE_KEY = "anish-resume-announcement-seen";

export default function ResumeAnnouncement() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;

    const timer = window.setTimeout(() => setVisible(true), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
    setVisible(false);
  };

  const openResume = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
      window.open(RESUME_URL, "_blank", "noopener,noreferrer");
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, y: -18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-4 right-4 top-20 z-[9996] sm:left-auto sm:right-5 sm:w-[360px]"
          aria-label="Resume available notification"
        >
          <div
            className="rounded-sm border p-4 backdrop-blur-xl"
            style={{
              background: "rgba(8, 10, 14, 0.92)",
              borderColor: "rgba(56, 189, 248, 0.34)",
              boxShadow: "0 18px 60px rgba(0, 0, 0, 0.35), 0 0 28px rgba(56, 189, 248, 0.14)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className="font-mono text-[0.62rem] tracking-[0.22em] uppercase"
                  style={{ color: "#38BDF8" }}
                >
                  Resume available
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  View Anish Reddy&apos;s latest frontend, ML, and AI engineering resume.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-sm px-2 py-1 font-mono text-xs transition-colors hover:bg-white/10"
                style={{ color: "var(--text-tertiary)" }}
                aria-label="Close resume notification"
              >
                X
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={openResume}
                className="rounded-sm px-4 py-2 font-mono text-[0.62rem] tracking-[0.2em] uppercase transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "#38BDF8",
                  color: "#020617",
                  boxShadow: "0 0 22px rgba(56, 189, 248, 0.32)",
                }}
              >
                View Resume
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-sm border px-4 py-2 font-mono text-[0.62rem] tracking-[0.2em] uppercase transition-colors hover:bg-white/10"
                style={{
                  borderColor: "rgba(255,255,255,0.14)",
                  color: "var(--text-tertiary)",
                }}
              >
                Later
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
