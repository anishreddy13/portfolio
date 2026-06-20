"use client";

import { useMemo, useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ActivityGraphProps {
  data: { date: string; commits: number }[];
}

export function ActivityGraph({ data }: ActivityGraphProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // Calculate moving average for a smoother line alongside raw data if needed
  const chartData = useMemo(() => {
    return data.map((d, i) => {
      const windowSize = 3;
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        sum += data[j].commits;
        count++;
      }
      return {
        ...d,
        avg: sum / count,
      };
    });
  }, [data]);

  const maxCommits = Math.max(...data.map((d) => d.commits), 10);

  return (
    <div
      className="rounded-sm p-4 sm:p-5 h-full"
      style={{
        background: "var(--surface-1)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <p
          className="font-mono text-[0.58rem] tracking-[0.25em] uppercase shrink-0"
          style={{ color: "#FF6B35" }}
        >
          Activity Pulse
        </p>
        <p className="font-mono text-[0.5rem] sm:text-[0.55rem]" style={{ color: "var(--text-tertiary)" }}>
          Last 30 Days
        </p>
      </div>

      <div style={{ minWidth: 0, overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-tertiary)", fontSize: 9, fontFamily: "DM Mono" }}
              tickFormatter={(val) => {
                const date = new Date(val);
                return `${date.getDate()} ${date.toLocaleString("default", { month: "short" })}`;
              }}
              minTickGap={20}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-tertiary)", fontSize: 9, fontFamily: "DM Mono" }}
              domain={[0, maxCommits + 2]}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1, strokeDasharray: "4 4" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div
                      className="rounded-sm px-3 py-2"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <p className="font-mono text-[0.65rem] mb-1" style={{ color: "var(--text-secondary)" }}>
                        {new Date(data.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="font-mono text-[0.7rem]" style={{ color: "#FF6B35" }}>
                        {data.commits} commits
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="commits"
              stroke="#FF6B35"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCommits)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
