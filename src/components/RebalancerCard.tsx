"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getFinancialAnalystServiceMessage, predictFinancialAnalyst } from "@/lib/financialAnalystClient";

interface RebalancerCardProps {
  portfolio: Record<string, number>;
  setPortfolio: (p: Record<string, number>) => void;
}

export default function RebalancerCard({ portfolio, setPortfolio }: RebalancerCardProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const tickers = Object.keys(portfolio);

  const handleWeightChange = (ticker: string, value: number) => {
    // Basic normalization could happen here, but for now we just store raw %
    setPortfolio({ ...portfolio, [ticker]: value / 100 });
  };

  const handleRebalance = async () => {
    if (tickers.length === 0) return;
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const payload = JSON.stringify(portfolio);
      const response = await predictFinancialAnalyst("/rebalance_portfolio", [payload]);
      
      if (response && response.data) {
        const result = (response.data as unknown[])[0] as string;
        setReport(result);
        setExpanded(true);
      }
    } catch (e) {
      console.error(e);
      setError(getFinancialAnalystServiceMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (tickers.length === 0) return null;

  return (
    <div className="w-full bg-[var(--surface-1)] border border-[rgba(255,255,255,0.06)] rounded-sm overflow-hidden flex flex-col mt-6 shadow-2xl">
      <div className="p-5 border-b border-[rgba(255,255,255,0.06)] bg-gradient-to-r from-[#050505] to-[#0A0A0A] flex justify-between items-center">
        <div>
           <h2 className="font-display text-xl text-[var(--text-primary)] tracking-wide flex items-center gap-2">
             <Settings2 size={18} className="text-[#C8FF00]" />
             AI Portfolio Rebalancer
           </h2>
           <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-tertiary)] mt-1">
             Optimize allocations & minimize concentration risk
           </p>
        </div>
        <button
          onClick={handleRebalance}
          disabled={loading}
          className="bg-[#C8FF00] text-black hover:bg-[#a6d800] px-4 py-2 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
             <>
               <RefreshCw size={14} className="animate-spin" />
               Analyzing...
             </>
          ) : (
             <>
               <ShieldCheck size={14} />
               Run Optimization
             </>
          )}
        </button>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sliders Column */}
        <div className="md:col-span-1 space-y-4">
           <h3 className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--text-tertiary)] border-b border-[#222] pb-2">Current Allocation</h3>
           <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
             {tickers.map(t => (
               <div key={t} className="flex flex-col gap-1">
                 <div className="flex justify-between items-center font-mono text-sm">
                   <span className="text-[var(--text-secondary)]">{t}</span>
                   <span className="text-[#C8FF00]">{Math.round(portfolio[t] * 100)}%</span>
                 </div>
                 <input 
                   type="range" 
                   min="1" max="100" 
                   value={Math.round(portfolio[t] * 100)}
                   onChange={(e) => handleWeightChange(t, parseInt(e.target.value))}
                   className="w-full accent-[#C8FF00] bg-[#222] h-1 rounded-full appearance-none outline-none"
                 />
               </div>
             ))}
           </div>
        </div>

        {/* AI Output Column */}
        <div className="md:col-span-2 border-l border-[rgba(255,255,255,0.06)] pl-6">
           <h3 className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--text-tertiary)] border-b border-[#222] pb-2 mb-4">
             AI Reallocation Strategy
           </h3>
           
           <AnimatePresence mode="wait">
             {error ? (
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded font-mono text-sm flex items-start gap-3">
                 <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                 {error}
               </motion.div>
             ) : report ? (
               <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="w-full">
                 <ReactMarkdown 
                   remarkPlugins={[remarkGfm]}
                   components={{
                     h3: ({node, ...props}) => <h3 className="text-lg font-display text-[#C8FF00] mt-8 mb-3 pb-2 border-b border-[rgba(255,255,255,0.1)]" {...props} />,
                     p: ({node, ...props}) => <p className="font-body text-sm text-[var(--text-secondary)] leading-relaxed mb-4 bg-slate-900/30 p-4 rounded border border-[rgba(255,255,255,0.04)]" {...props} />,
                     ul: ({node, ...props}) => <ul className="space-y-3 mb-4 text-sm text-[var(--text-secondary)] list-none" {...props} />,
                     li: ({node, ...props}) => (
                       <li className="flex items-start gap-2 bg-slate-900/30 p-3 rounded border border-[rgba(255,255,255,0.04)]">
                         <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#C8FF00] shrink-0" />
                         <span className="leading-relaxed" {...props} />
                       </li>
                     ),
                     strong: ({node, ...props}) => <strong className="font-semibold text-[var(--text-primary)]" {...props} />
                   }}
                 >
                    {report}
                 </ReactMarkdown>
               </motion.div>
             ) : (
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
                 <ShieldCheck size={32} className="text-[var(--text-tertiary)] mb-3" />
                 <p className="font-body text-sm text-[var(--text-secondary)] max-w-xs">Adjust your allocations and run the optimization engine to receive a strategic reallocation plan.</p>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
