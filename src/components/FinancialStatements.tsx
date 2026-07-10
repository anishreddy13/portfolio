"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, DollarSign, Activity } from "lucide-react";

interface FinancialRow {
  metric: string;
  [date: string]: string | number | null;
}

interface FinancialData {
  income_statement: FinancialRow[];
  balance_sheet: FinancialRow[];
  cash_flow: FinancialRow[];
}

interface FinancialStatementsProps {
  data: string; // JSON string from Gradio backend
}

const formatNumber = (num: number | null) => {
  if (num === null) return "-";
  
  const absNum = Math.abs(num);
  let formatted = "";
  
  if (absNum >= 1_000_000_000) {
    formatted = (num / 1_000_000_000).toFixed(2) + "B";
  } else if (absNum >= 1_000_000) {
    formatted = (num / 1_000_000).toFixed(2) + "M";
  } else if (absNum >= 1_000) {
    formatted = (num / 1_000).toFixed(2) + "K";
  } else {
    formatted = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return num < 0 ? `(${formatted.replace("-", "")})` : formatted;
};

const formatMetricLabel = (label: string) => {
  // Add spaces before capital letters and capitalize
  return label
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

export default function FinancialStatements({ data }: FinancialStatementsProps) {
  const [activeTab, setActiveTab] = useState<"income" | "balance" | "cash">("income");

  let parsedData: FinancialData | null = null;
  try {
    parsedData = JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse financial data:", e);
    return null;
  }

  if (!parsedData || ('error' in parsedData)) {
    return (
      <div className="rounded-sm p-5 bg-[rgba(255,45,45,0.08)] border border-[rgba(255,45,45,0.25)] text-[#FF2D2D] font-mono text-sm mt-4">
        ⚠️ Financial statements unavailable.
      </div>
    );
  }

  const tabs = [
    { id: "income", label: "Income Statement", icon: FileText, dataKey: "income_statement" },
    { id: "balance", label: "Balance Sheet", icon: DollarSign, dataKey: "balance_sheet" },
    { id: "cash", label: "Cash Flow", icon: Activity, dataKey: "cash_flow" },
  ] as const;

  const currentTabData = parsedData[tabs.find(t => t.id === activeTab)!.dataKey as keyof FinancialData];
  
  if (!currentTabData || currentTabData.length === 0) {
    return null;
  }

  // Extract date columns from the first row (filtering out 'metric')
  const dateColumns = Object.keys(currentTabData[0])
    .filter(key => key !== 'metric')
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Sort newest to oldest

  return (
    <div 
      className="mt-6 rounded-sm overflow-hidden flex flex-col"
      style={{ 
        background: "var(--surface-1)", 
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Tabs Header */}
      <div className="flex border-b border-[#222] bg-[#050505]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-mono text-[0.65rem] sm:text-xs tracking-wider uppercase transition-colors relative
              ${activeTab === tab.id ? 'text-[#C8FF00]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}
            `}
          >
            <tab.icon size={14} className={activeTab === tab.id ? 'text-[#C8FF00]' : ''} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C8FF00]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Table Content */}
      <div className="p-0 overflow-x-auto max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-w-[600px]"
          >
            <table className="w-full text-left font-mono text-sm relative">
              <thead className="bg-[#0A0A0A] border-b border-[#222] sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-3 px-4 text-[var(--text-secondary)] font-normal uppercase tracking-wider text-xs">Metric (USD)</th>
                  {dateColumns.map(date => (
                    <th key={date} className="py-3 px-4 text-right text-[var(--text-tertiary)] font-normal tracking-wide text-xs">
                      {date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {currentTabData.map((row, i) => (
                  <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="py-2.5 px-4 text-[var(--text-primary)] font-medium">
                      {formatMetricLabel(row.metric)}
                    </td>
                    {dateColumns.map(date => (
                      <td key={date} className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                        {formatNumber(row[date] as number | null)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
