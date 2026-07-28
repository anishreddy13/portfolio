"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart2,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Edit3,
  ExternalLink,
  Eye,
  GitBranch,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  RefreshCw,
  ScanLine,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA STRUCTURES & CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const NAV_SECTIONS = [
  { id: "overview", label: "01. Product Overview" },
  { id: "run-stepper", label: "02. Execution Flow" },
  { id: "multi-agent", label: "03. LangGraph Agents" },
  { id: "signal-feed", label: "04. Market Signals" },
  { id: "watchlist", label: "05. Watchlist & Portfolio" },
  { id: "rebalancer", label: "06. Rebalancer Engine" },
  { id: "financials", label: "07. Financials & ML Forecast" },
  { id: "sentiment", label: "08. Social Sentiment" },
  { id: "explainability", label: "09. XAI & Trust" },
  { id: "neural-vision", label: "10. Neural Chart Vision" },
  { id: "reliability", label: "11. Health & Resilience" },
  { id: "tech-matrix", label: "12. Tech & Endpoint Matrix" },
  { id: "portfolio-value", label: "13. Engineering Case Study" },
];

const TECH_BADGES = [
  { name: "Next.js 14", category: "Frontend", color: "#F0F0F0" },
  { name: "React 18", category: "Frontend", color: "#61DAFB" },
  { name: "TypeScript", category: "Language", color: "#3178C6" },
  { name: "Tailwind CSS", category: "Styling", color: "#38BDF8" },
  { name: "Framer Motion", category: "Animation", color: "#F43F5E" },
  { name: "Recharts", category: "Data Vis", color: "#22C55E" },
  { name: "@gradio/client", category: "API Integration", color: "#FF7C00" },
  { name: "LangGraph", category: "Agent Framework", color: "#C8FF00" },
  { name: "LangChain", category: "LLM Tooling", color: "#3B82F6" },
  { name: "Groq (Llama-3.3 70B)", category: "LLM Inference", color: "#F97316" },
  { name: "PyTorch", category: "Deep Learning", color: "#EE4C2C" },
  { name: "yfinance", category: "Market Data", color: "#10B981" },
  { name: "pandas & numpy", category: "Data Analytics", color: "#A855F7" },
  { name: "Prophet", category: "Forecasting", color: "#EC4899" },
  { name: "Gradio SDK", category: "Backend Microservice", color: "#FF7C00" },
  { name: "Hugging Face Spaces", category: "Cloud Hosting", color: "#FFD21E" },
];

const ENDPOINTS_DATA = [
  {
    endpoint: "/analyze_stock",
    method: "POST / predict",
    input: "ticker: string",
    output: "Markdown Investment Brief",
    service: "LangGraph (5 Agents) + Groq Llama-3",
    pattern: "Sequential LLM",
  },
  {
    endpoint: "/get_neural_chart_vision",
    method: "POST / predict",
    input: "ticker: string",
    output: "JSON (Patterns, OHLCV, Attention, Evidence)",
    service: "PyTorch CNN+Transformer / Heuristic Fallback",
    pattern: "Parallel Non-LLM",
  },
  {
    endpoint: "/get_forecast",
    method: "POST / predict",
    input: "ticker: string",
    output: "JSON (Price Array, Bounds, Accuracy)",
    service: "yfinance + Prophet TS Model",
    pattern: "Parallel Non-LLM",
  },
  {
    endpoint: "/get_xai_explanation",
    method: "POST / predict",
    input: "ticker: string",
    output: "JSON (Feature Importance, Direction)",
    service: "SHAP-like LLM Feature Engine",
    pattern: "Sequential LLM",
  },
  {
    endpoint: "/rebalance_portfolio",
    method: "POST / predict",
    input: "payload: JSON weights",
    output: "Markdown Reallocation Strategy",
    service: "LangGraph Rebalancer + Groq Llama-3",
    pattern: "Async On-Demand",
  },
  {
    endpoint: "/get_market_signals",
    method: "GET / predict",
    input: "none",
    output: "JSON Signal Array (Valuation, Risk, Catalyst)",
    service: "yfinance + Signal Engine",
    pattern: "Periodic Marquee",
  },
  {
    endpoint: "/get_social_sentiment",
    method: "POST / predict",
    input: "ticker: string, page: int, limit: int",
    output: "JSON Sentiment News Array",
    service: "News Scraper + Sentiment NLP Engine",
    pattern: "Parallel Non-LLM",
  },
  {
    endpoint: "/get_financials_tables",
    method: "POST / predict",
    input: "ticker: string",
    output: "HTML/Markdown 3-Statement Tables",
    service: "yfinance Statement Extractor",
    pattern: "Parallel Non-LLM",
  },
  {
    endpoint: "/get_portfolio_data",
    method: "POST / predict",
    input: "payload: JSON weights",
    output: "JSON Aggregated Portfolio Metrics",
    service: "yfinance Portfolio Aggregator",
    pattern: "Sidebar Polling",
  },
  {
    endpoint: "/get_service_health",
    method: "GET / predict",
    input: "none",
    output: "JSON Health & Module Readiness Payload",
    service: "Phase 5 Light Diagnostic Engine",
    pattern: "Health Strip Polling",
  },
  {
    endpoint: "/search_ticker",
    method: "POST / predict",
    input: "query: string",
    output: "JSON Search Suggestions List",
    service: "yahooquery Search API",
    pattern: "Debounced Autocomplete",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function FinancialAnalystExplainer() {
  const [activeSection, setActiveSection] = useState("overview");
  const [viewPerspective, setViewPerspective] = useState<"recruiter" | "technical" | "deep">("recruiter");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of NAV_SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[var(--text-primary)] font-body selection:bg-[#C8FF00] selection:text-black">
      
      {/* ── Top Header Navigation Bar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-[rgba(255,255,255,0.08)] bg-[#050505]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/projects/ai-financial-analyst"
              className="inline-flex items-center gap-2 rounded-sm border border-[rgba(255,255,255,0.1)] bg-[var(--surface-1)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:border-[#C8FF00]/40 hover:text-[#C8FF00]"
            >
              <span aria-hidden="true">&larr;</span>
              Launch Live Dashboard
            </Link>
            <span className="hidden text-[rgba(255,255,255,0.2)] md:inline">|</span>
            <span className="hidden font-mono text-xs uppercase tracking-widest text-[#C8FF00] md:inline flex items-center gap-1.5">
              <BrainCircuit size={14} />
              AI Financial Analyst System Explainer
            </span>
          </div>

          {/* Perspective Selector */}
          <div className="flex items-center gap-1 rounded-sm border border-[rgba(255,255,255,0.08)] bg-[#0A0A0A] p-1">
            <button
              onClick={() => setViewPerspective("recruiter")}
              className={`rounded-sm px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-wider transition-all ${
                viewPerspective === "recruiter"
                  ? "bg-[#C8FF00] text-[#0A0A0A] font-bold shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-white"
              }`}
            >
              Recruiter Summary
            </button>
            <button
              onClick={() => setViewPerspective("technical")}
              className={`rounded-sm px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-wider transition-all ${
                viewPerspective === "technical"
                  ? "bg-[#C8FF00] text-[#0A0A0A] font-bold shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-white"
              }`}
            >
              Technical Breakdown
            </button>
            <button
              onClick={() => setViewPerspective("deep")}
              className={`rounded-sm px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-wider transition-all ${
                viewPerspective === "deep"
                  ? "bg-[#C8FF00] text-[#0A0A0A] font-bold shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-white"
              }`}
            >
              Deep ML & Architecture
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] gap-8 px-4 py-8 sm:px-6">
        
        {/* ── Desktop Sticky Sidebar Nav ── */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 rounded-sm border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-4 shadow-xl">
            <p className="mb-3 font-mono text-[0.58rem] uppercase tracking-[0.25em] text-[#C8FF00]">
              Case Study Navigation
            </p>
            <nav className="space-y-1">
              {NAV_SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left font-mono text-[0.68rem] tracking-wider py-1.5 px-2.5 rounded-sm transition-all flex items-center justify-between ${
                      isActive
                        ? "bg-[#C8FF00]/10 text-[#C8FF00] border-l-2 border-[#C8FF00] font-semibold"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className="truncate">{sec.label}</span>
                    {isActive && <ChevronRight size={12} className="shrink-0" />}
                  </button>
                );
              })}
            </nav>
            <div className="mt-6 border-t border-[rgba(255,255,255,0.06)] pt-4">
              <Link
                href="/projects/ai-financial-analyst"
                className="flex items-center justify-center gap-2 rounded-sm bg-[#C8FF00] px-3 py-2 text-center font-mono text-[0.65rem] font-bold uppercase tracking-wider text-[#0A0A0A] transition-transform hover:scale-[1.02]"
              >
                <Activity size={13} />
                Try Live System
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main className="flex-1 space-y-16 min-w-0">

          {/* ═════════════════════════════════════════════════════════════════
             HERO BANNER & HIGHLIGHT STATEMENT
             ═════════════════════════════════════════════════════════════════ */}
          <section className="rounded-sm border border-[rgba(200,255,0,0.25)] bg-gradient-to-br from-[var(--surface-1)] to-[#0A0A0A] p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-sm border border-[#C8FF00]/40 bg-[#C8FF00]/10 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-widest text-[#C8FF00]">
              <Sparkles size={13} /> Production Portfolio Case Study
            </div>
            
            <h1 className="font-display text-3xl sm:text-5xl tracking-wide text-white leading-tight">
              AI Financial Analyst
            </h1>
            <p className="mt-2 font-mono text-xs sm:text-sm text-[var(--text-secondary)] tracking-wider">
              Multi-Agent LangGraph Reasoning • Neural Chart Vision • Production Resilience Layer
            </p>

            {/* Standout Prompt Quote */}
            <div className="mt-6 rounded-sm border-l-4 border-[#C8FF00] bg-black/60 p-4 sm:p-5 font-mono text-xs sm:text-sm leading-relaxed text-[var(--text-primary)]">
              &ldquo;This project is not just a chatbot. It is a full-stack AI financial intelligence system combining multi-agent reasoning, live market data, portfolio analytics, sentiment feeds, explainability, and custom chart-vision ML.&rdquo;
            </div>

            {/* Quick Metrics Cards Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] p-3">
                <p className="font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-tertiary)]">Architecture</p>
                <p className="font-mono text-sm font-bold text-[#C8FF00]">LangGraph StateGraph</p>
                <p className="font-mono text-[0.55rem] text-[var(--text-tertiary)]">5 Agent Pipeline</p>
              </div>
              <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] p-3">
                <p className="font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-tertiary)]">Vision Engine</p>
                <p className="font-mono text-sm font-bold text-[#4DA3FF]">Neural Chart Vision</p>
                <p className="font-mono text-[0.55rem] text-[var(--text-tertiary)]">CNN + Transformer</p>
              </div>
              <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] p-3">
                <p className="font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-tertiary)]">API Endpoints</p>
                <p className="font-mono text-sm font-bold text-[#A855F7]">11 Gradio Endpoints</p>
                <p className="font-mono text-[0.55rem] text-[var(--text-tertiary)]">Hugging Face Space</p>
              </div>
              <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] p-3">
                <p className="font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-tertiary)]">Reliability</p>
                <p className="font-mono text-sm font-bold text-[#10B981]">Phase 5 Health Layer</p>
                <p className="font-mono text-[0.55rem] text-[var(--text-tertiary)]">Graceful Fallbacks</p>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 1: PRODUCT OVERVIEW
             ═════════════════════════════════════════════════════════════════ */}
          <section id="overview" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <BookOpen size={18} className="text-[#C8FF00]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide">01. Product Overview</h2>
            </div>

            <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-6 space-y-4">
              <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
                The <strong className="text-white">AI Financial Analyst</strong> transforms complex Wall Street research routines into an automated, interactive intelligence dashboard. Instead of forcing a user to manually cross-reference SEC EDGAR filings, Bloomberg terminals, Yahoo Finance statistics, and technical chart patterns, the platform coordinates multiple specialized autonomous AI agents to collect data, analyze risk, predict chart dynamics, and output formatted investment briefs.
              </p>

              {viewPerspective === "recruiter" && (
                <div className="rounded-sm border border-[#C8FF00]/30 bg-[#C8FF00]/5 p-4 text-xs font-mono leading-relaxed text-[var(--text-primary)]">
                  <span className="text-[#C8FF00] font-bold">RECRUITER SUMMARY:</span> Designed as a complete end-to-end full-stack portfolio piece demonstrating modern frontend UI architecture (Next.js/React/TypeScript), microservice integration (@gradio/client), multi-agent LLM orchestration (LangGraph/Groq), and deep learning computer vision (PyTorch CNN/Transformer).
                </div>
              )}

              {viewPerspective === "technical" && (
                <div className="rounded-sm border border-[#4DA3FF]/30 bg-[#4DA3FF]/5 p-4 text-xs font-mono leading-relaxed text-[var(--text-primary)]">
                  <span className="text-[#4DA3FF] font-bold">TECHNICAL SUMMARY:</span> Built as a decoupled architecture. The frontend is hosted on Vercel running Next.js App Router, while heavy AI inference, data scraping, and ML pattern matching run as Python microservices on Hugging Face Spaces using Gradio SDK. Communication is maintained over a resilient client layer with automatic retry logic.
                </div>
              )}

              {viewPerspective === "deep" && (
                <div className="rounded-sm border border-[#A855F7]/30 bg-[#A855F7]/5 p-4 text-xs font-mono leading-relaxed text-[var(--text-primary)]">
                  <span className="text-[#A855F7] font-bold">DEEP ARCHITECTURE:</span> Implements a deterministic LangGraph StateGraph schema with shared TypedDict context (`AgentState`), preventing infinite LLM loop hallucinations. Integrates yfinance live data feeds, YahooQuery autocomplete, Prophet time-series price models, and a PyTorch CNN-Transformer model for chart pattern identification.
                </div>
              )}

              {/* User Journey Diagram */}
              <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                  Visual User Journey & Platform Interaction Flow
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center font-mono text-xs">
                  <div className="rounded-sm border border-[rgba(255,255,255,0.1)] bg-[#050505] p-3 flex flex-col items-center justify-center gap-1">
                    <span className="text-[#C8FF00] text-[0.6rem] uppercase">Step 1</span>
                    <span className="font-bold text-white">Load Dashboard</span>
                    <span className="text-[0.58rem] text-[var(--text-tertiary)]">Health & Signal Feed Scan</span>
                  </div>
                  <div className="rounded-sm border border-[rgba(255,255,255,0.1)] bg-[#050505] p-3 flex flex-col items-center justify-center gap-1">
                    <span className="text-[#C8FF00] text-[0.6rem] uppercase">Step 2</span>
                    <span className="font-bold text-white">Enter Ticker</span>
                    <span className="text-[0.58rem] text-[var(--text-tertiary)]">Autocomplete & Watchlist</span>
                  </div>
                  <div className="rounded-sm border border-[rgba(255,255,255,0.1)] bg-[#050505] p-3 flex flex-col items-center justify-center gap-1">
                    <span className="text-[#C8FF00] text-[0.6rem] uppercase">Step 3</span>
                    <span className="font-bold text-white">Run Analysis</span>
                    <span className="text-[0.58rem] text-[var(--text-tertiary)]">Parallel + Sequential APIs</span>
                  </div>
                  <div className="rounded-sm border border-[rgba(255,255,255,0.1)] bg-[#050505] p-3 flex flex-col items-center justify-center gap-1">
                    <span className="text-[#4DA3FF] text-[0.6rem] uppercase">Step 4</span>
                    <span className="font-bold text-white">Neural Vision</span>
                    <span className="text-[0.58rem] text-[var(--text-tertiary)]">Chart ML & Stream Brief</span>
                  </div>
                  <div className="rounded-sm border border-[rgba(255,255,255,0.1)] bg-[#050505] p-3 flex flex-col items-center justify-center gap-1">
                    <span className="text-[#A855F7] text-[0.6rem] uppercase">Step 5</span>
                    <span className="font-bold text-white">Rebalance</span>
                    <span className="text-[0.58rem] text-[var(--text-tertiary)]">Portfolio Risk Rebalance</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 2: RUN ANALYSIS EXECUTION STEPPER
             ═════════════════════════════════════════════════════════════════ */}
          <section id="run-stepper" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <Workflow size={18} className="text-[#C8FF00]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide">02. &ldquo;Run Analysis&rdquo; Execution Stepper</h2>
            </div>

            <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-6 space-y-4">
              <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
                To maximize responsiveness and prevent Groq 429 rate limit errors, the system splits backend calls into two distinct execution phases: <strong className="text-[#4DA3FF]">Parallel Non-LLM Calls</strong> (fast data fetching) and <strong className="text-[#C8FF00]">Sequential LLM Calls</strong> (heavy agent reasoning).
              </p>

              <div className="space-y-3 font-mono text-xs">
                {/* Phase 1 */}
                <div className="rounded-sm border border-[#4DA3FF]/30 bg-[#4DA3FF]/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#4DA3FF] font-bold uppercase tracking-wider">Phase 1: Concurrent Parallel Execution (Non-LLM APIs)</span>
                    <span className="text-[0.58rem] px-2 py-0.5 rounded-sm bg-[#4DA3FF]/20 text-[#4DA3FF]">Fast (~1.2s - 2.5s)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[0.65rem] text-[var(--text-secondary)]">
                    <div className="bg-[#050505] p-2 rounded-sm border border-[rgba(255,255,255,0.05)]">
                      <span className="text-white font-bold block mb-1">/get_forecast</span>
                      Fetches yfinance OHLCV & fits Prophet time-series model.
                    </div>
                    <div className="bg-[#050505] p-2 rounded-sm border border-[rgba(255,255,255,0.05)]">
                      <span className="text-white font-bold block mb-1">/get_financials_tables</span>
                      Extracts 3-statement tables & calculates balance metrics.
                    </div>
                    <div className="bg-[#050505] p-2 rounded-sm border border-[rgba(255,255,255,0.05)]">
                      <span className="text-white font-bold block mb-1">/get_social_sentiment</span>
                      Scrapes news items & scores narrative sentiment.
                    </div>
                    <div className="bg-[#050505] p-2 rounded-sm border border-[rgba(255,255,255,0.05)]">
                      <span className="text-white font-bold block mb-1">/get_neural_chart_vision</span>
                      Computes indicators & invokes PyTorch / Fallback engine.
                    </div>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="rounded-sm border border-[#C8FF00]/30 bg-[#C8FF00]/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#C8FF00] font-bold uppercase tracking-wider">Phase 2: Sequential LLM Execution (LangGraph Pipeline)</span>
                    <span className="text-[0.58rem] px-2 py-0.5 rounded-sm bg-[#C8FF00]/20 text-[#C8FF00]">Reasoning (~5s - 8s)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[0.65rem] text-[var(--text-secondary)]">
                    <div className="bg-[#050505] p-2 rounded-sm border border-[rgba(255,255,255,0.05)]">
                      <span className="text-white font-bold block mb-1">1. /analyze_stock</span>
                      Invokes 5-agent LangGraph graph: Researcher → Quant → SEC Auditor → Competitor → Editor.
                    </div>
                    <div className="bg-[#050505] p-2 rounded-sm border border-[rgba(255,255,255,0.05)]">
                      <span className="text-white font-bold block mb-1">2. /get_xai_explanation</span>
                      Awaits graph completion before generating SHAP-like feature contributions.
                    </div>
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="rounded-sm border border-[#A855F7]/30 bg-[#A855F7]/5 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#A855F7] font-bold uppercase tracking-wider">Phase 3: Real-Time Stream & Metric Extraction</span>
                    <span className="text-[0.58rem] px-2 py-0.5 rounded-sm bg-[#A855F7]/20 text-[#A855F7]">Render</span>
                  </div>
                  <p className="text-[0.65rem] text-[var(--text-secondary)]">
                    The frontend receives the markdown brief, parses key performance indicators (Price, P/E, Market Cap, 52-Wk Range) using regular expressions, and streams formatted cards to the DOM.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 3: MULTI-AGENT LANGGRAPH WORKFLOW
             ═════════════════════════════════════════════════════════════════ */}
          <section id="multi-agent" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <GitBranch size={18} className="text-[#C8FF00]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide">03. Multi-Agent LangGraph Workflow</h2>
            </div>

            <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-6 space-y-4">
              <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
                The core analytical engine is compiled as a <strong className="text-white">LangGraph StateGraph</strong>. Shared state flows through 5 specialized nodes, ensuring structured synthesis without state loss or unbounded agent loops.
              </p>

              {/* Agent Flowchart Diagram */}
              <div className="rounded-sm border border-[rgba(255,255,255,0.08)] bg-[#050505] p-5 my-4">
                <p className="font-mono text-[0.58rem] uppercase tracking-widest text-[#C8FF00] mb-4">
                  LangGraph Pipeline Flowchart (StateGraph Execution)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
                  
                  {/* Researcher */}
                  <div className="rounded-sm border border-[#C8FF00]/40 bg-[#C8FF00]/5 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#C8FF00] font-bold mb-1">
                        <Search size={14} /> Researcher
                      </div>
                      <p className="text-[0.6rem] text-[var(--text-tertiary)]">DDG Search + News</p>
                    </div>
                    <p className="text-[0.58rem] text-[var(--text-secondary)] mt-2">Scrapes web news & market sentiment context.</p>
                  </div>

                  {/* Quant */}
                  <div className="rounded-sm border border-[#FF6B35]/40 bg-[#FF6B35]/5 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#FF6B35] font-bold mb-1">
                        <BarChart2 size={14} /> Quant Analyst
                      </div>
                      <p className="text-[0.6rem] text-[var(--text-tertiary)]">yfinance API</p>
                    </div>
                    <p className="text-[0.58rem] text-[var(--text-secondary)] mt-2">Pulls hard financial metrics, P/E, margins & cap.</p>
                  </div>

                  {/* Auditor */}
                  <div className="rounded-sm border border-[#3B82F6]/40 bg-[#3B82F6]/5 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#3B82F6] font-bold mb-1">
                        <ShieldAlert size={14} /> SEC Auditor
                      </div>
                      <p className="text-[0.6rem] text-[var(--text-tertiary)]">SEC EDGAR RAG</p>
                    </div>
                    <p className="text-[0.58rem] text-[var(--text-secondary)] mt-2">Extracts regulatory risks & 10-K disclosures.</p>
                  </div>

                  {/* Competitor */}
                  <div className="rounded-sm border border-[#EAB308]/40 bg-[#EAB308]/5 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#EAB308] font-bold mb-1">
                        <UsersIcon size={14} /> Competitor
                      </div>
                      <p className="text-[0.6rem] text-[var(--text-tertiary)]">Peer Benchmarking</p>
                    </div>
                    <p className="text-[0.58rem] text-[var(--text-secondary)] mt-2">Compares valuation against sector rivals.</p>
                  </div>

                  {/* Editor */}
                  <div className="rounded-sm border border-[#A855F7]/40 bg-[#A855F7]/5 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#A855F7] font-bold mb-1">
                        <Edit3 size={14} /> Chief Editor
                      </div>
                      <p className="text-[0.6rem] text-[var(--text-tertiary)]">Groq Llama-3 (70B)</p>
                    </div>
                    <p className="text-[0.58rem] text-[var(--text-secondary)] mt-2">Synthesizes data into final investment brief.</p>
                  </div>

                </div>
              </div>

              {/* State Schema Card */}
              <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] p-4 font-mono text-xs">
                <p className="text-[0.6rem] uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                  LangGraph AgentState Schema (python/state.py)
                </p>
                <pre className="text-[0.65rem] text-[#C8FF00] overflow-x-auto p-2 bg-[#0A0A0A] rounded-sm">
{`class AgentState(TypedDict):
    ticker: str
    news_summary: str
    sentiment: str
    financial_metrics: str
    sec_risk_factors: str
    competitor_analysis: str
    final_report: str
    error: str`}
                </pre>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 4: LIVE MARKET SIGNAL FEED
             ═════════════════════════════════════════════════════════════════ */}
          <section id="signal-feed" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <Zap size={18} className="text-[#C8FF00]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide">04. Live Market Signal Feed</h2>
            </div>

            <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-6 space-y-4">
              <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
                The dashboard header features an infinite animated signal ticker (`SignalFeed.tsx`). It periodically calls `/get_market_signals` to scan popular assets and surface live/recent market signal alerts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="rounded-sm border border-[#C8FF00]/30 bg-[#050505] p-4">
                  <span className="text-[#C8FF00] font-bold block mb-1">VALUATION_ALERT</span>
                  <p className="text-[0.62rem] text-[var(--text-tertiary)]">Triggers when P/E or price moves significantly beyond historical bands.</p>
                </div>
                <div className="rounded-sm border border-[#FF6B35]/30 bg-[#050505] p-4">
                  <span className="text-[#FF6B35] font-bold block mb-1">REGULATORY_RISK</span>
                  <p className="text-[0.62rem] text-[var(--text-tertiary)]">Detects pending SEC litigations, antitrust probes, or compliance warnings.</p>
                </div>
                <div className="rounded-sm border border-[#A855F7]/30 bg-[#050505] p-4">
                  <span className="text-[#A855F7] font-bold block mb-1">CATALYST & FALLBACK</span>
                  <p className="text-[0.62rem] text-[var(--text-tertiary)]">Identifies earnings dates or displays service status fallback if backend is warming up.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 5: WATCHLIST AND PORTFOLIO METRICS
             ═════════════════════════════════════════════════════════════════ */}
          <section id="watchlist" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <LayoutDashboard size={18} className="text-[#C8FF00]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide">05. Watchlist and Portfolio Metrics</h2>
            </div>

            <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-6 space-y-4">
              <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
                The sidebar component (`WatchlistSidebar.tsx`) manages client portfolio state using browser LocalStorage and periodically syncs with `/get_portfolio_data`.
              </p>

              {/* Visual mini diagram */}
              <div className="rounded-sm border border-[rgba(255,255,255,0.08)] bg-[#050505] p-4 font-mono text-xs">
                <p className="text-[0.58rem] uppercase tracking-widest text-[#C8FF00] mb-3">
                  Watchlist Data Flow Pipeline
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-[0.65rem]">
                  <div className="bg-[var(--surface-1)] px-3 py-2 rounded-sm border border-[rgba(255,255,255,0.1)] w-full">
                    Watchlist Tickers (LocalStorage)
                  </div>
                  <ArrowRight size={14} className="text-[#C8FF00] shrink-0 rotate-90 sm:rotate-0" />
                  <div className="bg-[var(--surface-1)] px-3 py-2 rounded-sm border border-[rgba(255,255,255,0.1)] w-full text-[#4DA3FF]">
                    Gradio /get_portfolio_data
                  </div>
                  <ArrowRight size={14} className="text-[#C8FF00] shrink-0 rotate-90 sm:rotate-0" />
                  <div className="bg-[var(--surface-1)] px-3 py-2 rounded-sm border border-[rgba(255,255,255,0.1)] w-full text-[#10B981]">
                    yfinance Aggregate Metrics
                  </div>
                  <ArrowRight size={14} className="text-[#C8FF00] shrink-0 rotate-90 sm:rotate-0" />
                  <div className="bg-[var(--surface-1)] px-3 py-2 rounded-sm border border-[rgba(255,255,255,0.1)] w-full text-[#A855F7]">
                    Dashboard Summary Cards
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 6: PORTFOLIO REBALANCER
             ═════════════════════════════════════════════════════════════════ */}
          <section id="rebalancer" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <RefreshCw size={18} className="text-[#C8FF00]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide">06. Portfolio Rebalancer Engine</h2>
            </div>

            <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-6 space-y-4">
              <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
                The Rebalancer (`RebalancerCard.tsx` & `rebalancer.py`) evaluates asset allocation weights. Users adjust weight sliders in the UI, sending a JSON payload (&#123;&quot;AAPL&quot;: 0.4, &quot;TSLA&quot;: 0.3&#125;) to `/rebalance_portfolio`.
              </p>

              <div className="rounded-sm border border-[#C8FF00]/30 bg-[#C8FF00]/5 p-4 text-xs font-mono text-[var(--text-primary)]">
                <span className="text-[#C8FF00] font-bold">IMPLEMENTATION FACT:</span> The rebalancer backend uses `analyzer_node` to query yfinance for sector concentration, sector mapping, and aggregate portfolio beta. Next, `optimizer_node` calls Llama-3 (70B with 8B instant fallback) to output a structured markdown reallocation strategy. It is an AI risk & exposure analysis engine (not a quadratic optimizer).
              </div>

              {/* Rebalancer Flow */}
              <div className="rounded-sm border border-[rgba(255,255,255,0.08)] bg-[#050505] p-4 font-mono text-xs">
                <p className="text-[0.58rem] uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Rebalancer Execution Pipeline</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-[0.62rem]">
                  <div className="p-2 border border-[rgba(255,255,255,0.1)] bg-[#0A0A0A] rounded-sm">
                    1. JSON Payload (&#123;&quot;AAPL&quot;: 0.5&#125;)
                  </div>
                  <div className="p-2 border border-[#C8FF00]/40 bg-[#0A0A0A] text-[#C8FF00] rounded-sm">
                    2. Sector & Beta Analysis (yfinance)
                  </div>
                  <div className="p-2 border border-[#4DA3FF]/40 bg-[#0A0A0A] text-[#4DA3FF] rounded-sm">
                    3. Rebalancer Agent (Llama-3 70B/8B)
                  </div>
                  <div className="p-2 border border-[#10B981]/40 bg-[#0A0A0A] text-[#10B981] rounded-sm">
                    4. Reallocation Strategy Output
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 7: FINANCIAL STATEMENTS AND FORECASTING
             ═════════════════════════════════════════════════════════════════ */}
          <section id="financials" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <LineChart size={18} className="text-[#C8FF00]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide">07. Financial Statements & ML Forecast</h2>
            </div>

            <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-6 space-y-4">
              <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
                Renders structured 3-statement tables (`FinancialStatements.tsx`) and an interactive price forecast model (`/get_forecast`).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] p-4">
                  <span className="text-[#C8FF00] font-bold block mb-1">Financial Statements Table</span>
                  <p className="text-[0.62rem] text-[var(--text-tertiary)]">Pulls income statement, balance sheet, and cash flow data via yfinance to allow deep fundamental comparison.</p>
                </div>
                <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] p-4">
                  <span className="text-[#4DA3FF] font-bold block mb-1">Prophet Time-Series Forecasting</span>
                  <p className="text-[0.62rem] text-[var(--text-tertiary)]">Fits a Meta Prophet additive model to historical daily prices, calculating upper/lower confidence bounds and historical backtest accuracy scoring.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 8: SOCIAL AND NEWS SENTIMENT
             ═════════════════════════════════════════════════════════════════ */}
          <section id="sentiment" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <MessageSquare size={18} className="text-[#C8FF00]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide">08. Social and News Sentiment Feed</h2>
            </div>

            <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-6 space-y-4">
              <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
                The `SocialSentinel.tsx` component fetches market news and social narratives for the active ticker via `/get_social_sentiment`.
              </p>

              <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] p-4 font-mono text-xs">
                <p className="text-[0.6rem] uppercase tracking-widest text-[#C8FF00] mb-2">Sentiment Scoring & Pagination</p>
                <p className="text-[0.65rem] text-[var(--text-tertiary)] leading-relaxed">
                  Supports paginated fetching (`page=1`, `limit=20`), tagging items with sentiment polarity badges (Positive, Negative, Neutral) to help investors evaluate market narrative momentum surrounding earnings or product launches.
                </p>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 9: XAI / EXPLAINABILITY
             ═════════════════════════════════════════════════════════════════ */}
          <section id="explainability" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <Eye size={18} className="text-[#C8FF00]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide">09. XAI / Explainability Layer</h2>
            </div>

            <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-6 space-y-4">
              <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
                To remove black-box uncertainty, the platform includes an Explainable AI module (`ExplainabilityCard.tsx` & `/get_xai_explanation`).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="rounded-sm border border-[#C8FF00]/30 bg-[#050505] p-4">
                  <span className="text-[#C8FF00] font-bold block mb-1">SHAP-Like Feature Importance</span>
                  <p className="text-[0.62rem] text-[var(--text-tertiary)]">Breaks down which metrics (e.g., P/E ratio, revenue growth, RSI) positively or negatively pushed the final recommendation.</p>
                </div>
                <div className="rounded-sm border border-[#4DA3FF]/30 bg-[#050505] p-4">
                  <span className="text-[#4DA3FF] font-bold block mb-1">Transparent Drivers</span>
                  <p className="text-[0.62rem] text-[var(--text-tertiary)]">Provides clear visual impact bars showing why the model leans Buy, Hold, or Sell.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 10: NEURAL CHART VISION
             ═════════════════════════════════════════════════════════════════ */}
          <section id="neural-vision" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <ScanLine size={18} className="text-[#4DA3FF]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide text-white">10. Neural Chart Vision (Deep Learning Engine)</h2>
            </div>

            <div className="rounded-sm border border-[#4DA3FF]/30 bg-[var(--surface-1)] p-6 space-y-5">
              <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
                <strong className="text-[#4DA3FF]">Neural Chart Vision</strong> reads recent market chart structures to evaluate bullish/bearish technical setups, pattern probabilities, model attention timelines, support/resistance key levels, and evidence cards.
              </p>

              {/* Data Clarity Note */}
              <div className="rounded-sm border border-[#FFB020]/40 bg-[#FFB020]/5 p-4 font-mono text-xs text-[var(--text-primary)]">
                <span className="text-[#FFB020] font-bold">DATA SOURCE ACCURACY:</span> Neural Chart Vision processes <strong className="text-white">live recent OHLCV daily market data from yfinance</strong> (60 to 120 session windows), not millisecond tick-by-tick trading data.
              </div>

              {/* Deep Learning Architecture Diagram */}
              <div className="rounded-sm border border-[rgba(255,255,255,0.08)] bg-[#050505] p-5 font-mono text-xs space-y-4">
                <p className="text-[0.6rem] uppercase tracking-widest text-[#4DA3FF] font-bold">
                  Neural Chart Vision Dual-Branch ML Architecture
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[0.62rem]">
                  
                  <div className="rounded-sm border border-[rgba(255,255,255,0.1)] bg-[#0A0A0A] p-3 space-y-2">
                    <span className="text-[#C8FF00] font-bold block">1. Input Pipeline</span>
                    <ul className="space-y-1 text-[var(--text-tertiary)]">
                      <li>• Fetch 18mo yfinance OHLCV daily data</li>
                      <li>• Compute indicators (RSI-14, MACD, BB width, Returns, Volume ratio)</li>
                      <li>• Render 224x224 Candlestick chart image</li>
                      <li>• Construct numeric sequence tensor</li>
                    </ul>
                  </div>

                  <div className="rounded-sm border border-[#4DA3FF]/40 bg-[#0A0A0A] p-3 space-y-2">
                    <span className="text-[#4DA3FF] font-bold block">2. Dual-Branch Model</span>
                    <ul className="space-y-1 text-[var(--text-tertiary)]">
                      <li>• <strong className="text-white">CNN Branch:</strong> Reads rendered candlestick image</li>
                      <li>• <strong className="text-white">Transformer Branch:</strong> Reads time-series numeric tensor</li>
                      <li>• <strong className="text-white">Fusion Head:</strong> Combines visual + sequence features</li>
                    </ul>
                  </div>

                  <div className="rounded-sm border border-[#10B981]/40 bg-[#0A0A0A] p-3 space-y-2">
                    <span className="text-[#10B981] font-bold block">3. Payload Outputs</span>
                    <ul className="space-y-1 text-[var(--text-tertiary)]">
                      <li>• 5-Day Return Prediction (% move)</li>
                      <li>• Pattern Probabilities (6 Technical Setups)</li>
                      <li>• Attention Timeline & Key Support/Resistance</li>
                      <li>• Evidence Cards (Momentum, Vol Squeeze)</li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* Supported Technical Patterns */}
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                  Recognized Chart Patterns (6 Binary Logit Heads)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  <div className="p-2 border border-[rgba(255,255,255,0.06)] bg-[#050505] rounded-sm text-[var(--text-secondary)]">Breakout Setup</div>
                  <div className="p-2 border border-[rgba(255,255,255,0.06)] bg-[#050505] rounded-sm text-[var(--text-secondary)]">Double Bottom</div>
                  <div className="p-2 border border-[rgba(255,255,255,0.06)] bg-[#050505] rounded-sm text-[var(--text-secondary)]">Volatility Squeeze</div>
                  <div className="p-2 border border-[rgba(255,255,255,0.06)] bg-[#050505] rounded-sm text-[var(--text-secondary)]">Trend Exhaustion</div>
                  <div className="p-2 border border-[rgba(255,255,255,0.06)] bg-[#050505] rounded-sm text-[var(--text-secondary)]">Head and Shoulders</div>
                  <div className="p-2 border border-[rgba(255,255,255,0.06)] bg-[#050505] rounded-sm text-[var(--text-secondary)]">Cup and Handle</div>
                </div>
              </div>

              {/* DL Mode vs Fallback Explanation */}
              <div className="rounded-sm border border-[rgba(255,255,255,0.08)] bg-[#050505] p-4 font-mono text-xs space-y-2">
                <span className="text-[#C8FF00] font-bold uppercase tracking-wider block">
                  Model Deployment Modes: Full DL vs DL Bundle Fallback
                </span>
                <p className="text-[0.65rem] text-[var(--text-tertiary)] leading-relaxed">
                  • <strong className="text-[#C8FF00]">Full Deep Learning Mode:</strong> Activates automatically when <code className="text-white">models/neural_chart_vision/v1/model.pt</code> exists (or <code className="text-white">NEURAL_CHART_MODEL_PATH</code> is configured). The PyTorch model weights execute inference.
                </p>
                <p className="text-[0.65rem] text-[var(--text-tertiary)] leading-relaxed">
                  • <strong className="text-[#FFB020]">DL Bundle Fallback Mode:</strong> If the trained model file is not deployed/configured, the backend switches to <code className="text-white">heuristic_fallback</code>. In this mode, live market data and technical indicator evidence logic generate the exact same production JSON payload schema so the visual product card functions seamlessly without errors.
                </p>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 11: SERVICE HEALTH AND RELIABILITY
             ═════════════════════════════════════════════════════════════════ */}
          <section id="reliability" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <ShieldCheck size={18} className="text-[#10B981]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide">11. Service Health & Reliability Layer</h2>
            </div>

            <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-6 space-y-4">
              <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
                Hugging Face CPU Spaces can sleep or rebuild when idle. To ensure a resilient user experience, the system includes a dedicated Phase 5 health & reliability layer (`FinancialAnalystHealthStrip.tsx` & `service_health.py`).
              </p>

              {/* Service Reliability Circuit Diagram */}
              <div className="rounded-sm border border-[rgba(255,255,255,0.08)] bg-[#050505] p-5 font-mono text-xs">
                <p className="text-[0.58rem] uppercase tracking-widest text-[#10B981] mb-3">
                  Service Reliability & Resilience Circuit
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-[0.62rem]">
                  <div className="p-3 border border-[rgba(255,255,255,0.1)] bg-[#0A0A0A] rounded-sm">
                    <span className="text-white font-bold block mb-1">1. Frontend Call</span>
                    Initiates via shared client `predictFinancialAnalyst`.
                  </div>
                  <div className="p-3 border border-[#3B82F6]/40 bg-[#0A0A0A] text-[#3B82F6] rounded-sm">
                    <span className="font-bold block mb-1">2. Connection Fallback</span>
                    Tries direct HuggingFace Space ID, then direct URL.
                  </div>
                  <div className="p-3 border border-[#EAB308]/40 bg-[#0A0A0A] text-[#EAB308] rounded-sm">
                    <span className="font-bold block mb-1">3. Retry Backoff</span>
                    Retries up to 2 times with exponential delay (900ms + attempt * 1400ms).
                  </div>
                  <div className="p-3 border border-[#10B981]/40 bg-[#0A0A0A] text-[#10B981] rounded-sm">
                    <span className="font-bold block mb-1">4. Graceful UI State</span>
                    Displays warming message if cold; never crashes app shell.
                  </div>
                </div>
              </div>

              <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] p-4 font-mono text-xs">
                <p className="text-[0.6rem] uppercase tracking-widest text-[#10B981] mb-2">Phase 5 Health Check Endpoint (/get_service_health)</p>
                <p className="text-[0.65rem] text-[var(--text-tertiary)] leading-relaxed">
                  Checks runtime module imports (`gradio`, `yfinance`, `pandas`, `torch`, `langchain_groq`) without making expensive external API queries. Returns readiness flags for market signals, watchlist, rebalancer, neural chart vision, and deep learning bundle.
                </p>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 12: TECH STACK AND ENDPOINT MATRIX
             ═════════════════════════════════════════════════════════════════ */}
          <section id="tech-matrix" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <Server size={18} className="text-[#C8FF00]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide">12. Tech Stack & Endpoint Matrix</h2>
            </div>

            {/* Tech Badges Grid */}
            <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-6 space-y-4">
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)]">Complete Technology Stack</p>
              
              <div className="flex flex-wrap gap-2">
                {TECH_BADGES.map((b) => (
                  <span
                    key={b.name}
                    className="inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-mono text-xs font-semibold"
                    style={{
                      borderColor: `${b.color}40`,
                      background: `${b.color}0D`,
                      color: b.color,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
                    {b.name}
                    <span className="text-[0.55rem] text-[var(--text-tertiary)] font-normal uppercase">({b.category})</span>
                  </span>
                ))}
              </div>

              {/* Endpoint Table */}
              <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)] overflow-x-auto">
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                  Gradio Microservice Endpoint Matrix (11 Endpoints)
                </p>

                <table className="w-full text-left font-mono text-[0.65rem] border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.1)] text-[#C8FF00]">
                      <th className="py-2 px-3">Endpoint Path</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Input</th>
                      <th className="py-2 px-3">Output Payload</th>
                      <th className="py-2 px-3">Backing Service</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]">
                    {ENDPOINTS_DATA.map((row) => (
                      <tr key={row.endpoint} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-bold text-white">{row.endpoint}</td>
                        <td className="py-2.5 px-3 text-[var(--text-tertiary)]">{row.method}</td>
                        <td className="py-2.5 px-3 text-[#4DA3FF]">{row.input}</td>
                        <td className="py-2.5 px-3">{row.output}</td>
                        <td className="py-2.5 px-3 text-[#10B981]">{row.service}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
             SECTION 13: WHY THIS IS PORTFOLIO-WORTHY
             ═════════════════════════════════════════════════════════════════ */}
          <section id="portfolio-value" className="space-y-4 scroll-mt-24 pb-12">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <AwardIcon size={18} className="text-[#C8FF00]" />
              <h2 className="font-display text-xl sm:text-2xl tracking-wide">13. Engineering Case Study: Why This Is Portfolio-Worthy</h2>
            </div>

            <div className="rounded-sm border border-[rgba(200,255,0,0.3)] bg-[var(--surface-1)] p-6 space-y-6">
              <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
                Most AI portfolio demos are simple wrappers around a single ChatGPT completion API. The <strong className="text-white">AI Financial Analyst</strong> is designed to showcase engineering depth across full-stack system boundaries.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                
                <div className="rounded-sm border border-[rgba(255,255,255,0.08)] bg-[#050505] p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[#C8FF00] font-bold text-sm block mb-2">1. Multi-Agent Reasoning</span>
                    <p className="text-[0.65rem] text-[var(--text-tertiary)] leading-relaxed">
                      Implements deterministic state machines via LangGraph. Synthesizes unstructured web news, structured 10-K SEC filings, and numerical market ratios into cohesive Bloomberg-style briefs.
                    </p>
                  </div>
                  <span className="mt-4 text-[0.58rem] text-[#C8FF00] uppercase">LangGraph • Groq Llama-3</span>
                </div>

                <div className="rounded-sm border border-[rgba(255,255,255,0.08)] bg-[#050505] p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[#4DA3FF] font-bold text-sm block mb-2">2. Custom Vision & ML</span>
                    <p className="text-[0.65rem] text-[var(--text-tertiary)] leading-relaxed">
                      Goes beyond language models by incorporating PyTorch deep learning computer vision to evaluate candlestick chart images alongside sequential time-series indicators.
                    </p>
                  </div>
                  <span className="mt-4 text-[0.58rem] text-[#4DA3FF] uppercase">PyTorch CNN+Transformer</span>
                </div>

                <div className="rounded-sm border border-[rgba(255,255,255,0.08)] bg-[#050505] p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[#10B981] font-bold text-sm block mb-2">3. Production Resilience</span>
                    <p className="text-[0.65rem] text-[var(--text-tertiary)] leading-relaxed">
                      Includes exponential retry backoffs, health check polling, non-blocking parallel execution, and heuristic fallback engines so the UI never breaks.
                    </p>
                  </div>
                  <span className="mt-4 text-[0.58rem] text-[#10B981] uppercase">Phase 5 Health • Resilient Fallbacks</span>
                </div>

              </div>

              {/* Action Link Footer */}
              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-tertiary)]">
                  <span>Built by Anish Reddy</span>
                  <span>•</span>
                  <a
                    href="https://huggingface.co/spaces/Anishreddy13/ai-financial-analyst"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#C8FF00] hover:underline flex items-center gap-1"
                  >
                    View Hugging Face Space <ExternalLink size={12} />
                  </a>
                </div>

                <Link
                  href="/projects/ai-financial-analyst"
                  className="rounded-sm bg-[#C8FF00] px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[#0A0A0A] transition-transform hover:scale-[1.02] shadow-lg flex items-center gap-2"
                >
                  <Activity size={14} />
                  Launch Live Dashboard Demo
                </Link>
              </div>
            </div>
          </section>

        </main>
      </div>

    </div>
  );
}

/* Helper Icon Components */
function UsersIcon(props: { size?: number; className?: string }) {
  return (
    <svg
      width={props.size || 14}
      height={props.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AwardIcon(props: { size?: number; className?: string }) {
  return (
    <svg
      width={props.size || 14}
      height={props.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
