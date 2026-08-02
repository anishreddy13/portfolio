"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sparkles,
  Clock,
  ArrowRight,
  FileText,
  BarChart2,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { predictFinancialAnalyst, getFinancialAnalystServiceMessage } from "@/lib/financialAnalystClient";

// ── Types for Unified Backend Response ───────────────────────

interface StrategySummary {
  name: string;
  asset: string;
  timeframe: string;
  indicators: string[];
}

interface ValidationData {
  valid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
}

interface MarketContextData {
  trend: string;
  volatility: string;
  regime: string;
  support?: number;
  resistance?: number;
}

interface BacktestSummaryData {
  total_return_percent: number;
  win_rate: number;
  max_drawdown_percent: number;
  sharpe_ratio: number;
  total_trades: number;
}

interface PaperTradingSummaryData {
  session_id?: string;
  status?: string;
  trade_count?: number;
  session_return_percent?: number;
  ending_capital?: number;
}

interface CoachAnalysisData {
  executive_summary: string;
  strengths: string[];
  weaknesses: string[];
  risk_observations: string[];
  validation_summary: string;
  backtest_interpretation: string;
  health_interpretation: string;
  drift_interpretation: string;
  behavior_summary: string;
  next_operational_steps: string[];
  generation_method: string;
}

interface ExecutionTraceItem {
  node: string;
  duration_ms: number;
  status: string;
  timestamp: string;
}

interface UnifiedResponse {
  status: string;
  strategy_summary?: StrategySummary;
  validation?: ValidationData;
  market_context?: MarketContextData;
  backtest_summary?: BacktestSummaryData;
  paper_trading_summary?: PaperTradingSummaryData;
  health_score?: number;
  health_state?: string;
  drift_status?: string;
  coach_analysis?: CoachAnalysisData;
  warnings?: string[];
  errors?: string[];
  suggested_next_actions?: string[];
  execution_trace?: ExecutionTraceItem[];
  message?: string;
}

const EXAMPLE_PROMPTS = [
  "Buy AAPL when RSI drops below 30. Use 15 minute timeframe. Stop loss 2%.",
  "Buy TSLA when EMA 20 crosses above EMA 50 on 1d timeframe. Take profit 5%.",
  "Buy NVDA on breakout above highest high of 20 bars with Volume SMA confirmation.",
];

export default function TradingCoPilot() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UnifiedResponse | null>(null);

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      setError("Please enter a strategy prompt before running analysis.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call existing Gradio backend endpoint api_name="trading_copilot"
      const res = await predictFinancialAnalyst("/trading_copilot", [prompt.trim()]);
      
      let rawData = "";
      if (Array.isArray(res?.data) && res.data.length > 0) {
        rawData = res.data[0];
      } else if (typeof res === "string") {
        rawData = res;
      } else if (res?.data) {
        rawData = String(res.data);
      }

      if (!rawData) {
        throw new Error("No data returned from Trading CoPilot backend.");
      }

      const parsed: UnifiedResponse = JSON.parse(rawData);
      setResult(parsed);
    } catch (err: unknown) {
      console.error("Trading CoPilot error:", err);
      setError(getFinancialAnalystServiceMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#050505] text-[#F0F0F0] pt-16 pb-24">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Projects", href: "/#projects" },
            { label: "AI Trading CoPilot" },
          ]}
          backToHref="/"
          backToLabel="Back to Home"
        />
      </div>

      {/* Top Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8FF00]/10 border border-[#C8FF00]/30 text-[#C8FF00] font-mono text-xs uppercase tracking-widest mb-3">
              <Sparkles size={13} /> Standalone Algorithmic Product
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
              AI Trading CoPilot
            </h1>
            <p className="font-body text-base sm:text-lg text-[var(--text-tertiary)] mt-2 max-w-2xl">
              Natural Language Trading Strategy Analysis & Operational Health Engine
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded.md bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] font-mono text-xs text-[var(--text-secondary)]">
              Engine Status: <span className="text-[#C8FF00] font-semibold">9-Node Active</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Large Prompt Input Section */}
        <section className="bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 sm:p-8 mb-10 shadow-2xl">
          <label htmlFor="strategy-prompt" className="block font-mono text-xs uppercase tracking-widest text-[#C8FF00] mb-3">
            Describe Your Trading Strategy
          </label>
          
          <textarea
            id="strategy-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Buy AAPL when RSI drops below 30. Use 15 minute timeframe. Stop loss 2%."
            className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.12)] rounded-md p-4 text-white placeholder-[var(--text-tertiary)] font-mono text-sm focus:outline-none focus:border-[#C8FF00] transition-colors resize-y"
          />

          {/* Quick Example Chips */}
          <div className="mt-4">
            <span className="font-mono text-xs text-[var(--text-tertiary)] uppercase tracking-wider block mb-2">
              Try Example Prompts:
            </span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(ex)}
                  className="text-xs font-mono text-[var(--text-secondary)] bg-[#141414] hover:bg-[#C8FF00]/10 hover:text-[#C8FF00] border border-[rgba(255,255,255,0.08)] hover:border-[#C8FF00]/30 rounded px-3 py-1.5 transition-all text-left truncate max-w-full"
                >
                  "{ex}"
                </button>
              ))}
            </div>
          </div>

          {/* Action Button & Validation Alert */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-md bg-[#C8FF00] text-[#0A0A0A] font-mono text-sm font-bold uppercase tracking-wider hover:bg-[#d4ff33] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Running 9-Node Pipeline...
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  Analyze Strategy
                </>
              )}
            </button>

            {error && (
              <div className="flex items-center gap-2 text-red-400 font-mono text-xs bg-red-950/30 border border-red-500/30 px-4 py-2 rounded-md">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--surface-1)] border border-[#C8FF00]/20 rounded-lg p-10 text-center mb-10"
          >
            <Loader2 size={40} className="animate-spin text-[#C8FF00] mx-auto mb-4" />
            <h3 className="font-display text-xl text-white font-semibold">
              Executing Trading CoPilot LangGraph Workflow...
            </h3>
            <p className="font-mono text-xs text-[var(--text-tertiary)] mt-2">
              Parsing natural language &rarr; Validating rules &rarr; Market data &rarr; Event backtest &rarr; Paper trade &rarr; Strategy health &rarr; Drift engine
            </p>
          </motion.div>
        )}

        {/* Results Area */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Top Stat Overview Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] p-5 rounded-lg">
                <span className="font-mono text-xs text-[var(--text-tertiary)] uppercase block">Validation Status</span>
                <span className={`font-mono text-lg font-bold mt-1 inline-flex items-center gap-1.5 ${result.validation?.valid ? 'text-[#C8FF00]' : 'text-red-400'}`}>
                  {result.validation?.valid ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  {result.validation?.valid ? "VALID" : "INVALID"}
                </span>
              </div>

              <div className="bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] p-5 rounded-lg">
                <span className="font-mono text-xs text-[var(--text-tertiary)] uppercase block">Health Score</span>
                <span className="font-mono text-lg font-bold text-[#C8FF00] mt-1 block">
                  {result.health_score ?? 100} / 100 ({result.health_state ?? "Healthy"})
                </span>
              </div>

              <div className="bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] p-5 rounded-lg">
                <span className="font-mono text-xs text-[var(--text-tertiary)] uppercase block">Drift Status</span>
                <span className="font-mono text-lg font-bold text-sky-400 mt-1 block">
                  {result.drift_status ?? "No Drift"}
                </span>
              </div>

              <div className="bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] p-5 rounded-lg">
                <span className="font-mono text-xs text-[var(--text-tertiary)] uppercase block">Backtest Return</span>
                <span className={`font-mono text-lg font-bold mt-1 block ${(result.backtest_summary?.total_return_percent ?? 0) >= 0 ? 'text-[#C8FF00]' : 'text-red-400'}`}>
                  {(result.backtest_summary?.total_return_percent ?? 0) >= 0 ? '+' : ''}
                  {result.backtest_summary?.total_return_percent ?? 0}%
                </span>
              </div>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Strategy Summary */}
              <div className="bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4 text-[#C8FF00]">
                  <FileText size={18} />
                  <h3 className="font-display text-lg font-semibold text-white">1. Strategy Summary</h3>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Strategy Name:</span>
                    <span className="text-white font-bold">{result.strategy_summary?.name ?? "Custom Strategy"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Target Asset:</span>
                    <span className="text-[#C8FF00] font-bold">{result.strategy_summary?.asset ?? "AAPL"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Timeframe:</span>
                    <span className="text-white font-bold">{result.strategy_summary?.timeframe ?? "1d"}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block mb-1.5">Indicators Used:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(result.strategy_summary?.indicators ?? []).map((ind, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] text-white">
                          {ind}
                        </span>
                      ))}
                      {(!result.strategy_summary?.indicators || result.strategy_summary.indicators.length === 0) && (
                        <span className="text-gray-500">None specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Validation Engine */}
              <div className="bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4 text-[#C8FF00]">
                  <ShieldCheck size={18} />
                  <h3 className="font-display text-lg font-semibold text-white">2. Strategy Validation</h3>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Validation Score:</span>
                    <span className="text-white font-bold">{result.validation?.score ?? 100} / 100</span>
                  </div>
                  {result.validation?.errors && result.validation.errors.length > 0 && (
                    <div>
                      <span className="text-red-400 font-bold block mb-1">Errors:</span>
                      <ul className="list-disc list-inside text-red-300 space-y-1">
                        {result.validation.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.validation?.warnings && result.validation.warnings.length > 0 && (
                    <div>
                      <span className="text-yellow-400 font-bold block mb-1">Warnings:</span>
                      <ul className="list-disc list-inside text-yellow-300 space-y-1">
                        {result.validation.warnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(!result.validation?.errors?.length && !result.validation?.warnings?.length) && (
                    <p className="text-emerald-400">Zero constraint errors or rule warnings detected.</p>
                  )}
                </div>
              </div>

              {/* Card 3: Market Context */}
              <div className="bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4 text-[#C8FF00]">
                  <Activity size={18} />
                  <h3 className="font-display text-lg font-semibold text-white">3. Market Context</h3>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Trend:</span>
                    <span className="text-white font-bold">{result.market_context?.trend ?? "Sideways"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Volatility:</span>
                    <span className="text-white font-bold">{result.market_context?.volatility ?? "Medium"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Market Regime:</span>
                    <span className="text-white font-bold">{result.market_context?.regime ?? "Ranging"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Support / Resistance:</span>
                    <span className="text-[#C8FF00] font-bold">
                      {result.market_context?.support ? `$${result.market_context.support}` : "N/A"} / {result.market_context?.resistance ? `$${result.market_context.resistance}` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Backtest Summary */}
              <div className="bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4 text-[#C8FF00]">
                  <BarChart2 size={18} />
                  <h3 className="font-display text-lg font-semibold text-white">4. Event-Driven Backtest</h3>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Win Rate:</span>
                    <span className="text-white font-bold">{result.backtest_summary?.win_rate ?? 0}%</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Max Drawdown:</span>
                    <span className="text-red-400 font-bold">{result.backtest_summary?.max_drawdown_percent ?? 0}%</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Sharpe Ratio:</span>
                    <span className="text-white font-bold">{result.backtest_summary?.sharpe_ratio ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Total Trades:</span>
                    <span className="text-white font-bold">{result.backtest_summary?.total_trades ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Paper Trading Summary */}
              <div className="bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4 text-[#C8FF00]">
                  <TrendingUp size={18} />
                  <h3 className="font-display text-lg font-semibold text-white">5. Paper Trading Simulation</h3>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Session ID:</span>
                    <span className="text-gray-400 truncate max-w-[180px]">{result.paper_trading_summary?.session_id ?? "SIM_SESSION_01"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Session Status:</span>
                    <span className="text-emerald-400 font-bold">{result.paper_trading_summary?.status ?? "STOPPED"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Executed Trades:</span>
                    <span className="text-white font-bold">{result.paper_trading_summary?.trade_count ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Session Return:</span>
                    <span className="text-[#C8FF00] font-bold">
                      {(result.paper_trading_summary?.session_return_percent ?? 0) >= 0 ? '+' : ''}
                      {result.paper_trading_summary?.session_return_percent ?? 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 6: Strategy Health & Drift */}
              <div className="bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4 text-[#C8FF00]">
                  <Zap size={18} />
                  <h3 className="font-display text-lg font-semibold text-white">6. Health & Drift Detection</h3>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">10-Dim Health Score:</span>
                    <span className="text-[#C8FF00] font-bold">{result.health_score ?? 100} / 100</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <span className="text-[var(--text-tertiary)]">Health State:</span>
                    <span className="text-white font-bold">{result.health_state ?? "Healthy"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Drift Status:</span>
                    <span className="text-sky-400 font-bold">{result.drift_status ?? "No Drift"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Card 7: AI Strategy Coach Analysis */}
            {result.coach_analysis && (
              <div className="bg-[var(--surface-1)] border border-[#C8FF00]/30 rounded-lg p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-6 text-[#C8FF00]">
                  <BrainCircuit size={22} />
                  <h3 className="font-display text-xl font-bold text-white">7. AI Strategy Coach Analysis</h3>
                  <span className="ml-auto font-mono text-xs px-2.5 py-1 rounded bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00]">
                    Method: {result.coach_analysis.generation_method}
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div>
                    <h4 className="font-mono text-xs uppercase tracking-wider text-[#C8FF00] mb-2">Executive Summary</h4>
                    <p className="font-body text-sm text-gray-200 leading-relaxed bg-[#0A0A0A] p-4 rounded border border-[rgba(255,255,255,0.06)]">
                      {result.coach_analysis.executive_summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    {result.coach_analysis.strengths?.length > 0 && (
                      <div className="bg-[#0A0A0A] p-4 rounded border border-emerald-500/20">
                        <h4 className="font-mono text-xs uppercase tracking-wider text-emerald-400 mb-2 font-bold">Key Strengths</h4>
                        <ul className="space-y-1.5 font-body text-xs text-gray-300">
                          {result.coach_analysis.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-400 mt-0.5">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {result.coach_analysis.weaknesses?.length > 0 && (
                      <div className="bg-[#0A0A0A] p-4 rounded border border-yellow-500/20">
                        <h4 className="font-mono text-xs uppercase tracking-wider text-yellow-400 mb-2 font-bold">Identified Bottlenecks</h4>
                        <ul className="space-y-1.5 font-body text-xs text-gray-300">
                          {result.coach_analysis.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-yellow-400 mt-0.5">•</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Next Operational Steps */}
                  {(result.suggested_next_actions?.length ?? 0) > 0 && (
                    <div className="bg-[#0A0A0A] p-4 rounded border border-[#C8FF00]/20">
                      <h4 className="font-mono text-xs uppercase tracking-wider text-[#C8FF00] mb-2 font-bold">Suggested Operational Next Steps</h4>
                      <ul className="space-y-2 font-mono text-xs text-gray-300">
                        {result.suggested_next_actions?.map((act, i) => (
                          <li key={i} className="flex items-center gap-2 text-white">
                            <ArrowRight size={14} className="text-[#C8FF00] shrink-0" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Card 8: Execution Trace */}
            {result.execution_trace && result.execution_trace.length > 0 && (
              <div className="bg-[var(--surface-1)] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4 text-[#C8FF00]">
                  <Clock size={18} />
                  <h3 className="font-display text-lg font-semibold text-white">8. Execution Trace Log</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.08)] text-[var(--text-tertiary)] uppercase">
                        <th className="pb-2">Node</th>
                        <th className="pb-2">Duration (ms)</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-gray-300">
                      {result.execution_trace.map((t, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 font-bold text-white">{t.node}</td>
                          <td className="py-2.5 text-[#C8FF00]">{t.duration_ms} ms</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${t.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-gray-500">{t.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </motion.div>
        )}

      </div>
    </main>
  );
}
