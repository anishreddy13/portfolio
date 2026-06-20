"use client";

import { motion } from "framer-motion";

interface StatCardsProps {
  stats: {
    label: string;
    value: string | number;
    sub: string;
    color?: string;
  }[];
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-sm p-4 sm:p-5"
          style={{
            background: "var(--surface-1)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p
            className="font-mono text-[0.55rem] sm:text-[0.6rem] tracking-[0.2em] uppercase mb-2"
            style={{ color: "#606060" }}
          >
            {stat.label}
          </p>
          <p
            className="font-display text-2xl sm:text-3xl leading-none truncate"
            style={{ color: stat.color || "#C8FF00" }}
          >
            {stat.value}
          </p>
          <p
            className="font-mono text-[0.55rem] sm:text-[0.6rem] mt-1.5 truncate"
            style={{ color: "#A0A0A0" }}
          >
            {stat.sub}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
