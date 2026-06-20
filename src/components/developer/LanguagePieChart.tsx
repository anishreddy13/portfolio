"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LanguagePieChartProps {
  data: { name: string; value: number; color: string }[];
}

export function LanguagePieChart({ data }: LanguagePieChartProps) {
  return (
    <div
      className="rounded-sm p-4 sm:p-5 h-full flex flex-col"
      style={{
        background: "var(--surface-1)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p
        className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-4 sm:mb-5 shrink-0"
        style={{ color: "#A855F7" }}
      >
        Language Distribution
      </p>
      
      <div className="flex-1 min-h-[220px]" style={{ minWidth: 0, overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      className="rounded-sm px-3 py-2"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <p
                        className="font-mono text-[0.65rem] uppercase"
                        style={{ color: payload[0].payload.color }}
                      >
                        {payload[0].name}
                      </p>
                      <p
                        className="font-mono text-[0.65rem]"
                        style={{ color: "#F0F0F0" }}
                      >
                        {payload[0].value}% of time
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-3 mt-4 shrink-0">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: item.color }}
            />
            <span
              className="font-mono text-[0.55rem] uppercase"
              style={{ color: "#A0A0A0" }}
            >
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
