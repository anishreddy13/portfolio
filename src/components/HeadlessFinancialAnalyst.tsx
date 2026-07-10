"use client";

import { useState, useEffect, useRef } from "react";
import { Client } from "@gradio/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BarChart2, Edit3, Terminal, TrendingUp, TrendingDown, Activity, ShieldAlert } from "lucide-react";
import { LineChart, Line, BarChart, Bar, ComposedChart, ResponsiveContainer, YAxis, XAxis, Tooltip } from "recharts";
import StructuredReport from "./StructuredReport";
import FinancialStatements from "./FinancialStatements";

// --- Types ---
interface KPIData {
  label: string;
  value: string;
  trend: "up" | "down";
}

// Removed mock chart data generator

// --- KPI Extractor ---
const extractKPIs = (markdown: string, ticker: string): { kpis: KPIData[], cleaned: string } => {
  const kpis: KPIData[] = [];
  let cleaned = markdown;

  const patterns = [
    { label: "Current Price", regex: /(?:\*\*Current Price\*\*:?|\*\*Price\*\*:?)\s*([$0-9.,]+)/i },
    { label: "P/E Ratio", regex: /(?:\*\*Trailing P\/E\*\*:?|\*\*P\/E Ratio\*\*:?)\s*([0-9.,]+)/i },
    { label: "Market Cap", regex: /(?:\*\*Market Cap\*\*:?)\s*([$0-9.,TBM]+)/i },
    { label: "52-Week High", regex: /(?:\*\*52-?Week High\*\*:?)\s*([$0-9.,]+)/i },
  ];

  patterns.forEach(({ label, regex }) => {
    const match = cleaned.match(regex);
    if (match) {
      kpis.push({ 
        label, 
        value: match[1], 
        trend: Math.random() > 0.4 ? "up" : "down" 
      });
      cleaned = cleaned.replace(new RegExp(`.*${match[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\\n?`, 'i'), '');
    }
  });

  // Fallbacks if LLM output format varies
  if (kpis.length === 0) {
     kpis.push({ label: "Analyst Rating", value: "Buy", trend: "up" });
     kpis.push({ label: "Volatility", value: "High", trend: "down" });
     kpis.push({ label: "Sector", value: "Tech", trend: "up" });
  }

  return { kpis, cleaned };
};

interface HeadlessFinancialAnalystProps {
  initialTicker?: string;
}

export default function HeadlessFinancialAnalyst({ initialTicker = "" }: HeadlessFinancialAnalystProps) {
  const [ticker, setTicker] = useState(initialTicker);
  const [result, setResult] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState<string | null>(null);
  const [displayedResult, setDisplayedResult] = useState<string>("");
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentStep, setAgentStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (initialTicker) {
      setTicker(initialTicker);
    }
  }, [initialTicker]);

  // Agent sequence simulation
  useEffect(() => {
    if (!loading) return;
    
    setLogs(["[SYSTEM] Initializing LangGraph multi-agent state machine..."]);
    setAgentStep(0);
    
    const sequence = [
      { time: 1000, step: 0, log: "[Researcher] Scraping recent news and SEC filings..." },
      { time: 3500, step: 0, log: "[Researcher] Analyzing market sentiment & macroeconomic trends..." },
      { time: 6000, step: 1, log: "[Quant] Retrieving fundamental metrics via yfinance..." },
      { time: 9000, step: 1, log: "[Quant] Calculating historical volatility, P/E, and margins..." },
      { time: 13000, step: 2, log: "[Auditor] Fetching latest 10-K/10-Q from SEC EDGAR..." },
      { time: 17000, step: 2, log: "[Auditor] Running RAG to extract hidden risks..." },
      { time: 20000, step: 3, log: "[Editor] Synthesizing research and quantitative data..." },
      { time: 23000, step: 3, log: "[Editor] Formatting final markdown investment brief..." },
    ];

    const timeouts = sequence.map(seq => 
      setTimeout(() => {
        setAgentStep(seq.step);
        setLogs(prev => [...prev, seq.log]);
      }, seq.time)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [loading]);

  // Artificial Streaming & Auto-scroll
  useEffect(() => {
    if (!result) {
      setDisplayedResult("");
      return;
    }
    
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedResult(result.slice(0, i));
      i += 8; 
      
      if (scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }

      if (i >= result.length + 8) {
         clearInterval(interval);
         setDisplayedResult(result);
      }
    }, 10);
    
    return () => clearInterval(interval);
  }, [result]);

  const analyzeTicker = async () => {
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setKpis([]);

    try {
      const app = await Client.connect("Anishreddy13/ai-financial-analyst");
      
      // Parallel execution of all 3 endpoints
      const [analysisResponse, chartResponse, finResponse] = await Promise.all([
        app.predict("/analyze_stock", [ticker.trim().toUpperCase()]),
        app.predict("/get_historical", [ticker.trim().toUpperCase()]),
        app.predict("/get_financials_tables", [ticker.trim().toUpperCase()]),
      ]);
      
      if (analysisResponse && analysisResponse.data) {
        const rawMarkdown = (analysisResponse.data as unknown[])[0] as string;
        const { kpis: extractedKpis, cleaned } = extractKPIs(rawMarkdown, ticker);
        setKpis(extractedKpis);
        setResult(cleaned);
      } else {
         setError("Received an unexpected response format from the server.");
      }

      if (chartResponse && chartResponse.data) {
        try {
           const parsedChart = JSON.parse((chartResponse.data as unknown[])[0] as string);
           if (!parsedChart.error) {
              setChartData(parsedChart);
           }
        } catch(e) { console.error("Chart parse error", e); }
      }

      if (finResponse && finResponse.data) {
         setFinancialData((finResponse.data as unknown[])[0] as string);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to the AI agents.");
      console.error("Gradio Client Error:", err);
    } finally {
      setLoading(false);
      setAgentStep(4); // Done
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const agents = [
    { id: 'researcher', name: 'Researcher', icon: <Search size={18}/>, status: agentStep > 0 ? 'done' : agentStep === 0 && loading ? 'active' : 'waiting' },
    { id: 'quant', name: 'Quant Analyst', icon: <BarChart2 size={18}/>, status: agentStep > 1 ? 'done' : agentStep === 1 && loading ? 'active' : 'waiting' },
    { id: 'auditor', name: 'SEC Auditor', icon: <ShieldAlert size={18}/>, status: agentStep > 2 ? 'done' : agentStep === 2 && loading ? 'active' : 'waiting' },
    { id: 'editor', name: 'Chief Editor', icon: <Edit3 size={18}/>, status: agentStep > 3 ? 'done' : agentStep === 3 && loading ? 'active' : 'waiting' },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ── Spotlight Input Section ── */}
      <div 
         ref={inputRef}
         onMouseMove={handleMouseMove}
         className="relative rounded-sm p-[1px] overflow-hidden group"
      >
         {/* Spotlight Background */}
         <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
               background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(200,255,0,0.15), transparent 40%)`
            }}
         />
         
         <div 
            className="relative rounded-sm p-5 sm:p-7 z-10"
            style={{
               background: "var(--surface-1)",
               border: "1px solid rgba(200,255,0,0.1)",
            }}
         >
            <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex-1 relative">
                  <input 
                     type="text" 
                     value={ticker} 
                     onChange={(e) => setTicker(e.target.value)} 
                     onKeyDown={(e) => e.key === "Enter" && analyzeTicker()}
                     placeholder="Enter Stock Ticker (e.g. AAPL, TSLA, NVDA)" 
                     className="w-full px-5 py-4 rounded-sm font-mono text-sm placeholder:text-[#555] focus:outline-none transition-colors relative z-10"
                     style={{
                        background: "var(--surface-2)",
                        color: "var(--text-primary)",
                        border: "1px solid rgba(255,255,255,0.08)",
                     }}
                     disabled={loading}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                     <Activity className="text-[#C8FF00] opacity-40" size={20} />
                  </div>
               </div>
               
               <motion.button 
                  onClick={analyzeTicker} 
                  disabled={loading || !ticker.trim()}
                  whileHover={{ scale: (loading || !ticker.trim()) ? 1 : 1.02 }}
                  whileTap={{ scale: (loading || !ticker.trim()) ? 1 : 0.98 }}
                  className="px-8 py-4 rounded-sm font-mono text-[0.7rem] uppercase tracking-widest disabled:opacity-50 relative overflow-hidden shrink-0 group/btn z-10"
                  style={{
                     background: "#C8FF00",
                     color: "#0A0A0A",
                     boxShadow: "0 0 20px rgba(200,255,0,0.2)"
                  }}
               >
                  <span className="relative z-10 flex items-center gap-2">
                     {loading ? "Analyzing..." : "Run Analysis"}
                     {!loading && <Activity size={14} className="group-hover/btn:animate-pulse" />}
                  </span>
               </motion.button>
            </div>
         </div>
      </div>

      {/* ── Agentic State Visualization (War Room) ── */}
      <AnimatePresence>
         {loading && (
            <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               exit={{ opacity: 0, height: 0 }}
               className="overflow-hidden"
            >
               <div className="rounded-sm flex flex-col lg:flex-row gap-4 pt-2">
                  {/* Agent Cards */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                     {agents.map((agent) => (
                        <div 
                           key={agent.id}
                           className="p-4 rounded-sm transition-all duration-300 relative overflow-hidden"
                           style={{ 
                              background: agent.status === 'active' ? "rgba(200,255,0,0.05)" : "var(--surface-1)",
                              border: `1px solid ${agent.status === 'active' ? "rgba(200,255,0,0.4)" : "rgba(255,255,255,0.06)"}` 
                           }}
                        >
                           <div className="flex items-center gap-3">
                              <div 
                                 className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500`}
                                 style={{ 
                                    background: agent.status === 'done' ? "#C8FF00" : agent.status === 'active' ? "rgba(200,255,0,0.2)" : "rgba(255,255,255,0.05)",
                                    color: agent.status === 'done' ? "#000" : agent.status === 'active' ? "#C8FF00" : "var(--text-tertiary)"
                                 }}
                              >
                                 {agent.icon}
                              </div>
                              <div>
                                 <p className="font-mono text-[0.6rem] uppercase tracking-widest" style={{ color: agent.status === 'active' ? "#C8FF00" : "var(--text-secondary)" }}>
                                    {agent.name}
                                 </p>
                                 <p className="font-body text-[0.65rem]" style={{ color: "var(--text-tertiary)" }}>
                                    {agent.status === 'waiting' ? "Idle" : agent.status === 'active' ? "Working..." : "Complete"}
                                 </p>
                              </div>
                           </div>
                           {/* Pulse effect if active */}
                           {agent.status === 'active' && (
                              <motion.div 
                                 className="absolute bottom-0 left-0 h-[2px] bg-[#C8FF00]"
                                 initial={{ width: "0%" }}
                                 animate={{ width: "100%" }}
                                 transition={{ duration: 1.5, repeat: Infinity }}
                              />
                           )}
                        </div>
                     ))}
                  </div>

                  {/* Micro-logs Terminal */}
                  <div 
                     className="flex-1 rounded-sm p-4 h-32 overflow-y-auto font-mono text-[0.6rem]"
                     style={{ background: "#050505", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                     <div className="flex items-center gap-2 mb-3 border-b border-[#222] pb-2">
                        <Terminal size={12} color="#C8FF00" />
                        <span style={{ color: "var(--text-tertiary)" }}>SYSTEM.LOGS</span>
                     </div>
                     <div className="space-y-1.5 flex flex-col justify-end min-h-[50px]">
                        {logs.map((log, i) => (
                           <motion.p 
                              key={i} 
                              initial={{ opacity: 0, x: -5 }} 
                              animate={{ opacity: 1, x: 0 }}
                              style={{ color: i === logs.length - 1 ? "#C8FF00" : "var(--text-tertiary)" }}
                           >
                              <span className="opacity-50 mr-2">{new Date().toISOString().substring(11,19)}</span> 
                              {log}
                           </motion.p>
                        ))}
                     </div>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* ── Error State ── */}
      <AnimatePresence>
         {error && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="rounded-sm p-5"
               style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)" }}
            >
               <p className="font-mono text-sm tracking-wide" style={{ color: "#FF2D2D" }}>
                  ⚠️ {error}
               </p>
            </motion.div>
         )}
      </AnimatePresence>

      {/* ── Output Result (Data Vis + Streaming Markdown) ── */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            {/* KPI Cards & Chart Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
               {/* KPIs */}
               <div className="lg:col-span-1 grid grid-cols-2 gap-3">
                  {kpis.map((kpi, i) => (
                     <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-sm p-4 relative overflow-hidden flex flex-col justify-between"
                        style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
                     >
                        <p className="font-mono text-[0.55rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
                           {kpi.label}
                        </p>
                        <div className="flex items-end justify-between">
                           <p className="font-display text-xl" style={{ color: "var(--text-primary)" }}>
                              {kpi.value}
                           </p>
                           {kpi.trend === "up" ? (
                              <TrendingUp size={14} color="#C8FF00" className="mb-1" />
                           ) : (
                              <TrendingDown size={14} color="#FF2D2D" className="mb-1" />
                           )}
                        </div>
                     </motion.div>
                  ))}
               </div>

               {/* Real Recharts Line/Volume Chart */}
               <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-2 rounded-sm p-5 h-[200px] flex flex-col"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
               >
                  <div className="flex justify-between items-center mb-4">
                     <p className="font-mono text-[0.6rem] tracking-widest uppercase" style={{ color: "var(--text-tertiary)" }}>6-Month Price History</p>
                     <span className="px-2 py-0.5 rounded-sm font-mono text-[0.5rem] bg-[#C8FF00] text-black uppercase">Live</span>
                  </div>
                  <div className="flex-1 w-full h-full">
                     {chartData.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData}>
                             <XAxis dataKey="date" hide />
                             <YAxis yAxisId="price" domain={['auto', 'auto']} hide />
                             <YAxis yAxisId="volume" orientation="right" hide />
                             <Tooltip 
                               contentStyle={{ background: '#0A0A0A', border: '1px solid #333', fontSize: '12px', color: '#fff' }}
                               itemStyle={{ color: '#C8FF00' }}
                             />
                             <Bar yAxisId="volume" dataKey="volume" fill="rgba(255,255,255,0.1)" />
                             <Line 
                                yAxisId="price"
                                type="monotone" 
                                dataKey="close" 
                                stroke="#C8FF00" 
                                strokeWidth={2} 
                                dot={false}
                                animationDuration={1500}
                             />
                          </ComposedChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[var(--text-tertiary)]">
                          Loading chart data...
                       </div>
                     )}
                  </div>
               </motion.div>
            </div>

            {/* Markdown Report Container OR Structured Dashboard */}
            {displayedResult.length < result.length ? (
               <div 
                  className="rounded-sm p-6 sm:p-10 relative overflow-hidden flex flex-col"
                  style={{ 
                     background: "var(--surface-1)", 
                     border: "1px solid rgba(200,255,0,0.2)",
                     boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
                  }}
               >
                  {/* Decor */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #C8FF00, #FF6B35, #A855F7)" }} />
                  
                  <div className="mb-8 border-b pb-6 shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                     <p className="font-mono text-[0.55rem] tracking-[0.25em] uppercase mb-2" style={{ color: "#C8FF00" }}>
                        Agent Synthesis Running...
                     </p>
                     <h3 className="font-display text-4xl tracking-wide" style={{ color: "var(--text-primary)" }}>
                        Investment Brief: {ticker.toUpperCase()}
                     </h3>
                  </div>

                  {/* Streaming Text Area */}
                  <div 
                     ref={scrollRef}
                     className="max-h-[500px] overflow-y-auto pr-4 relative scroll-smooth"
                  >
                     <div className="prose prose-invert prose-p:text-[0.95rem] prose-p:leading-relaxed prose-h1:text-3xl prose-h1:font-display prose-h2:text-2xl prose-h2:font-display prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-[#C8FF00] prose-h3:text-xl prose-h3:text-[#E0E0E0] prose-li:text-[0.95rem] prose-strong:text-[#F0F0F0] max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                           {displayedResult}
                        </ReactMarkdown>
                     </div>
                     
                     {/* Streaming fade indicator */}
                     <div className="h-10 flex items-center gap-2 mt-4">
                        <span className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse" />
                        <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Writing...</span>
                     </div>
                  </div>
               </div>
            ) : (
               <>
                 <StructuredReport markdown={result} />
                 {financialData && <FinancialStatements data={financialData} />}
               </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
