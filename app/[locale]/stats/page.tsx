"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CursorEffect from "@/components/CursorEffect";
import AnimatedBackground from "@/components/AnimatedBackground";
import PlatformShell from "@/components/PlatformShell";
import { StatCards } from "@/components/developer/StatCards";
import { LanguagePieChart } from "@/components/developer/LanguagePieChart";
import { ActivityGraph } from "@/components/developer/ActivityGraph";

// Mock Data Generators for V1
function generateMockActivity() {
  const data = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    
    // Create realistic-looking commit patterns (fewer on weekends)
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseCommits = isWeekend ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 8) + 2;
    // Occasional spikes
    const spike = Math.random() > 0.85 ? Math.floor(Math.random() * 10) : 0;

    data.push({
      date: d.toISOString(),
      commits: baseCommits + spike,
    });
  }
  return data;
}

const MOCK_LANGUAGES = [
  { name: "TypeScript", value: 45.2, color: "#3178c6" },
  { name: "Python", value: 30.5, color: "#3572A5" },
  { name: "Rust", value: 12.8, color: "#dea584" },
  { name: "CSS", value: 6.5, color: "#563d7c" },
  { name: "Other", value: 5.0, color: "var(--text-secondary)" },
];

const MOCK_STATS = [
  { label: "Total Commits (30d)", value: 142, sub: "+12% from last month", color: "#FF6B35" },
  { label: "Hours Coded (30d)", value: "118h", sub: "Avg 3.9h / day", color: "#C8FF00" },
  { label: "Longest Streak", value: "14 days", sub: "Current: 3 days", color: "#A855F7" },
  { label: "Top Language", value: "TypeScript", sub: "45.2% of coding time", color: "#3178c6" },
];

export default function StatsPage() {
  const activityData = generateMockActivity();

  return (
    <main className="relative z-10 pt-24 sm:pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-10 sm:mb-16">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6" style={{ color: "var(--text-primary)" }}>
            Developer <span style={{ color: "#A855F7" }}>Metrics</span>
          </h1>
          <p className="font-mono text-[0.65rem] sm:text-[0.75rem] max-w-2xl leading-relaxed uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Real-time insights into my coding activity, language distribution, and open-source contributions. Powered by GitHub & WakaTime data.
          </p>
        </div>

        {/* Top Stat Cards */}
        <div className="mb-6 sm:mb-8">
          <StatCards stats={MOCK_STATS} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
          <div className="lg:col-span-2">
            <ActivityGraph data={activityData} />
          </div>
          <div className="lg:col-span-1">
            <LanguagePieChart data={MOCK_LANGUAGES} />
          </div>
        </div>
        
        {/* Footer note for V1 */}
        <div className="flex justify-center mb-10">
          <p className="font-mono text-[0.55rem] sm:text-[0.6rem] tracking-widest uppercase" style={{ color: "var(--text-tertiary)" }}>
            Note: displaying realistic mock data for V1 demonstration purposes.
          </p>
        </div>

      </div>
    </main>
  );
}
