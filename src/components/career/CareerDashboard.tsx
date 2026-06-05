"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { getCareerApiHealth } from "../../../lib/careerApi";
import { trackActivity } from "../../../lib/trackActivity";
import type { StudentAnalysisResult, SkillTrend } from "@/types/career";
import CareerHero from "./CareerHero";
import ResumeAnalyzer from "./ResumeAnalyzer";
import SkillTrendChart from "./SkillTrendChart";
import CareerRoadmap from "./CareerRoadmap";
import EmployabilityScore from "./EmployabilityScore";
import MarketIntelligence from "./MarketIntelligence";
import MentorChat from "./MentorChat";
import RegionalInsights from "./RegionalInsights";
import ProjectOverview from "./ProjectOverview";

type CareerTab = "analyze" | "market" | "roadmap" | "mentor" | "salary";

const tabs: Array<{ id: CareerTab; label: string; icon: string; color: string; desc: string }> = [
  { id: "analyze", label: "Analyze", icon: "📄", color: "#C8FF00", desc: "Resume AI" },
  { id: "market", label: "Market", icon: "📊", color: "#FF6B35", desc: "Live Trends" },
  { id: "roadmap", label: "Roadmap", icon: "🗺️", color: "#A855F7", desc: "Career Path" },
  { id: "mentor", label: "Mentor", icon: "🤖", color: "#FF2D2D", desc: "AI Chat" },
  { id: "salary", label: "Salary", icon: "💰", color: "#C8FF00", desc: "Predictions" },
];

function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const nodes = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
    }));
    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });
      nodes.forEach((a, index) => {
        nodes.slice(index + 1).forEach((b) => {
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(200,255,0,${0.08 * (1 - distance / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
        ctx.beginPath();
        ctx.arc(a.x, a.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(200,255,0,0.35)";
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ opacity: 0.22, zIndex: 0 }} />;
}

export default function CareerDashboard() {
  const [activeTab, setActiveTab] = useState<CareerTab>("analyze");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [analysisResult, setAnalysisResult] = useState<StudentAnalysisResult | null>(null);

  useEffect(() => {
    trackActivity("career_page", "page_visit");
  }, []);

  useEffect(() => {
    const validTabs = tabs.map((tab) => tab.id);
    const activateFromUrl = () => {
      const tab = new URLSearchParams(window.location.search).get("tab") as CareerTab | null;
      if (tab && validTabs.includes(tab)) setActiveTab(tab);
    };
    activateFromUrl();
    window.addEventListener("popstate", activateFromUrl);
    return () => window.removeEventListener("popstate", activateFromUrl);
  }, []);

  useEffect(() => {
    const check = async () => {
      setApiStatus("checking");
      try {
        const response = await getCareerApiHealth();
        setApiStatus(response.status === "ok" ? "online" : "offline");
      } catch {
        setApiStatus("offline");
      }
    };
    check();
    const id = setInterval(check, 20000);
    return () => clearInterval(id);
  }, []);

  const selectTab = (tab: CareerTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url.toString());
  };

  const marketSkills = (analysisResult?.data.market_snapshot.top_skills || []) as SkillTrend[];
  const content = {
    analyze: <ResumeAnalyzer onAnalysisComplete={setAnalysisResult} onOpenMarketTab={() => selectTab("market")} />,
    market: (
      <div className="space-y-4">
        <MarketIntelligence />
        <SkillTrendChart />
      </div>
    ),
    roadmap: <CareerRoadmap roadmap={analysisResult?.data.roadmap || null} marketSkills={marketSkills} />,
    mentor: <MentorChat studentSkills={analysisResult?.data.parsed_resume.skills || []} hasProfile={Boolean(analysisResult)} />,
    salary: (
      <div className="space-y-4">
        <EmployabilityScore employability={analysisResult?.data.employability || null} skillGaps={analysisResult?.data.skill_gaps || []} />
        <RegionalInsights analysisResult={analysisResult} />
      </div>
    ),
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--surface-0)" }}>
      <NeuralCanvas />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(circle at top left, rgba(200,255,0,0.06) 0%, transparent 65%)" }} />
      <div className="absolute bottom-0 right-0 w-[420px] h-[420px] pointer-events-none" style={{ background: "radial-gradient(circle at bottom right, rgba(168,85,247,0.05) 0%, transparent 65%)" }} />

      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="fixed top-20 left-4 sm:left-5 z-30">
        <Link href="/" className="flex items-center gap-2 font-mono text-[0.58rem] sm:text-[0.62rem] tracking-[0.18em] sm:tracking-[0.2em] uppercase px-2.5 sm:px-3 py-2 rounded-sm transition-all" style={{ background: "rgba(10,10,10,0.8)", border: "1px solid rgba(255,255,255,0.08)", color: "#606060" }}>
          BACK
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="fixed top-20 right-4 sm:right-5 z-30 flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-sm" style={{ background: "rgba(10,10,10,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: apiStatus === "online" ? "#C8FF00" : apiStatus === "offline" ? "#FF2D2D" : "#FF6B35", boxShadow: apiStatus === "online" ? "0 0 6px #C8FF00" : "none", animation: apiStatus !== "offline" ? "pulse 2s infinite" : "none" }} />
        <span className="font-mono text-[0.52rem] sm:text-[0.58rem] tracking-[0.16em] sm:tracking-[0.2em] uppercase" style={{ color: "#606060" }}>
          {apiStatus === "online" ? "Career API Online" : apiStatus === "offline" ? "Career API Offline" : "Career AI is warming up... (30s)"}
        </span>
        {apiStatus === "checking" && (
          <span className="hidden sm:block w-16 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.span
              className="block h-full rounded-full"
              style={{ background: "#FF6B35" }}
              initial={{ width: "12%" }}
              animate={{ width: ["12%", "82%", "12%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        )}
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pt-36 sm:pt-40 pb-24">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#C8FF00", boxShadow: "0 0 8px #C8FF00" }} />
            <span className="font-mono text-[0.62rem] tracking-[0.3em] uppercase" style={{ color: "#C8FF00" }}>
              Career Intelligence — Live AI System
            </span>
          </div>
          <h1 className="font-display leading-none tracking-tight mb-4" style={{ fontSize: "clamp(3.5rem, 12vw, 9rem)" }}>
            <span style={{ background: "linear-gradient(135deg, #C8FF00 0%, #FF6B35 50%, #A855F7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              CAREER
            </span>
            <br />
            <span style={{ color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.1)" }}>INTELLIGENCE</span>
          </h1>
          <p className="font-body text-base max-w-xl leading-relaxed" style={{ color: "#A0A0A0" }}>
            Resume parsing, market trends, salary modeling, and AI mentoring through one production career dashboard.
          </p>
        </motion.div>

        <div className="mb-6">
          <CareerHero />
        </div>

        <ProjectOverview />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-8">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <motion.button key={tab.id} onClick={() => selectTab(tab.id)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="relative rounded-sm p-3 text-left transition-all" style={{ background: active ? `${tab.color}10` : "var(--surface-1)", border: `1px solid ${active ? `${tab.color}40` : "rgba(255,255,255,0.06)"}` }}>
                <div className="text-base mb-2" style={{ color: active ? tab.color : "#404040" }}>{tab.icon}</div>
                <p className="font-mono text-[0.58rem] tracking-wider uppercase leading-tight" style={{ color: active ? tab.color : "#606060" }}>{tab.label}</p>
                <p className="font-body text-[0.55rem] mt-0.5 hidden sm:block" style={{ color: "#404040" }}>{tab.desc}</p>
                {active && <motion.div layoutId="career-active-tab" className="absolute bottom-0 left-0 right-0 h-px" style={{ background: tab.color }} />}
              </motion.button>
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
            {content[activeTab]}
          </motion.div>
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-12 rounded-sm p-6" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-6" style={{ color: "#C8FF00" }}>— How It Works</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { step: "01", title: "Parse", desc: "Extract skills, education, projects, and experience from resume text" },
              { step: "02", title: "Compare", desc: "Match profile against live market skill trend intelligence" },
              { step: "03", title: "Predict", desc: "Estimate employability, career risk, and salary trajectory" },
              { step: "04", title: "Plan", desc: "Generate a personalized roadmap and mentor guidance" },
            ].map((item) => (
              <div key={item.step}>
                <div className="font-display text-2xl mb-2" style={{ background: "linear-gradient(135deg, #C8FF00, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{item.step}</div>
                <h4 className="font-mono text-[0.62rem] uppercase tracking-wider mb-1" style={{ color: "#A0A0A0" }}>{item.title}</h4>
                <p className="font-body text-xs leading-relaxed" style={{ color: "#606060" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
