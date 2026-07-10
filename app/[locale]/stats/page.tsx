"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CursorEffect from "@/components/CursorEffect";
import AnimatedBackground from "@/components/AnimatedBackground";
import PlatformShell from "@/components/PlatformShell";
import { StatCards } from "@/components/developer/StatCards";
import { LanguagePieChart } from "@/components/developer/LanguagePieChart";
import { ActivityGraph } from "@/components/developer/ActivityGraph";
import { useTranslations } from "next-intl";

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

export default function StatsPage() {
  const t = useTranslations("Stats");
  const activityData = generateMockActivity();

  const MOCK_LANGUAGES = [
    { name: "TypeScript", value: 45.2, color: "#3178c6" },
    { name: "Python", value: 30.5, color: "#3572A5" },
    { name: "Rust", value: 12.8, color: "#dea584" },
    { name: "CSS", value: 6.5, color: "#563d7c" },
    { name: t('other_lang'), value: 5.0, color: "var(--text-secondary)" },
  ];

  const MOCK_STATS = [
    { label: t('commits_label'), value: 142, sub: t('commits_sub'), color: "#FF6B35" },
    { label: t('hours_label'), value: "118h", sub: t('hours_sub'), color: "#C8FF00" },
    { label: t('streak_label'), value: t('streak_val'), sub: t('streak_sub'), color: "#A855F7" },
    { label: t('top_lang_label'), value: "TypeScript", sub: t('top_lang_sub'), color: "#3178c6" },
  ];

  return (
    <main className="relative z-10 pt-24 sm:pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-10 sm:mb-16">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6" style={{ color: "var(--text-primary)" }}>
            {t('header1')}<span style={{ color: "#A855F7" }}>{t('header_highlight')}</span>
          </h1>
          <p className="font-mono text-[0.65rem] sm:text-[0.75rem] max-w-2xl leading-relaxed uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            {t('description')}
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
            {t('footer_note')}
          </p>
        </div>

      </div>
    </main>
  );
}
