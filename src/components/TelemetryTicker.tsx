"use client";

import { motion } from "framer-motion";

const telemetryItems = [
  { label: "AI FINANCIAL ANALYST", status: "5 AGENTS ACTIVE", color: "#C8FF00" },
  { label: "NEURAL CHART VISION", status: "CNN + TRANSFORMER READY", color: "#FF2D2D" },
  { label: "PLANT DISEASE MODEL", status: "EFFICIENTNET-B0 ONLINE", color: "#C8FF00" },
  { label: "ML PRODUCTION BACKEND", status: "FASTAPI / 45ms LATENCY", color: "#FF6B35" },
  { label: "PIPELINE LOGS", status: "SUPABASE REALTIME SYNCED", color: "#A855F7" },
];

export default function TelemetryTicker() {
  return (
    <div
      className="w-full overflow-hidden border-y py-2 transition-colors duration-300"
      style={{
        background: "rgba(10, 10, 10, 0.75)",
        borderColor: "rgba(255, 255, 255, 0.06)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#C8FF00", boxShadow: "0 0 8px #C8FF00" }} />
          <span className="font-mono text-[0.6rem] tracking-[0.25em] uppercase font-semibold" style={{ color: "#F0F0F0" }}>
            SYSTEM TELEMETRY
          </span>
        </div>

        <div className="flex items-center gap-8 shrink-0">
          {telemetryItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="flex items-center gap-2 px-3 py-1 rounded-sm border"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                borderColor: "rgba(255, 255, 255, 0.06)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
              <span className="font-mono text-[0.58rem] tracking-wider uppercase opacity-70" style={{ color: "#A0A0A0" }}>
                {item.label}:
              </span>
              <span className="font-mono text-[0.58rem] tracking-wider uppercase font-medium" style={{ color: item.color }}>
                {item.status}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
