"use client";

import { useState } from "react";
import { Client } from "@gradio/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";

export default function HeadlessFinancialAnalyst() {
  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");

  const analyzeTicker = async () => {
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStatusText("Waking up Hugging Face Space (this may take 1-2 minutes on first load)...");

    try {
      // Connect to the HF Space
      const app = await Client.connect("Anishreddy13/ai-financial-analyst");
      
      setStatusText("Connected. Agents are now researching & compiling data...");

      // Call the primary inference function. 
      // Based on our app.py, the analyze_stock function takes one input (ticker).
      const response = await app.predict("/predict", {
        ticker: ticker.trim().toUpperCase()
      });
      
      // Depending on the version and the Gradio signature, predict returns an object 
      // containing the output in the `data` array.
      if (response && response.data) {
        setResult((response.data as unknown[])[0] as string);
      } else {
         setError("Received an unexpected response format from the server.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to the AI agents. Please try again.");
      console.error("Gradio Client Error:", err);
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ── Input Section ── */}
      <div 
        className="rounded-sm p-5 sm:p-7"
        style={{
          background: "var(--surface-1)",
          border: "1px solid rgba(200,255,0,0.15)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
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
                  className="w-full px-5 py-4 rounded-sm font-mono text-sm placeholder:text-[#555] focus:outline-none transition-colors"
                  style={{
                     background: "var(--surface-2)",
                     color: "var(--text-primary)",
                     border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  disabled={loading}
               />
               <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="text-xl opacity-40">🏦</span>
               </div>
            </div>
            
            <motion.button 
               onClick={analyzeTicker} 
               disabled={loading || !ticker.trim()}
               whileHover={{ scale: (loading || !ticker.trim()) ? 1 : 1.02 }}
               whileTap={{ scale: (loading || !ticker.trim()) ? 1 : 0.98 }}
               className="px-8 py-4 rounded-sm font-mono text-[0.7rem] uppercase tracking-widest disabled:opacity-50 relative overflow-hidden shrink-0"
               style={{
                  background: "#C8FF00",
                  color: "#0A0A0A",
               }}
            >
               {loading ? "Analyzing..." : "Run Analysis ↗"}
            </motion.button>
         </div>
      </div>

      {/* ── Loading State ── */}
      <AnimatePresence>
         {loading && (
            <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               exit={{ opacity: 0, height: 0 }}
               className="overflow-hidden"
            >
               <div 
                  className="rounded-sm p-8 flex flex-col items-center justify-center text-center gap-5"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
               >
                  <div className="relative w-12 h-12">
                     <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-2"
                        style={{ borderColor: "rgba(200,255,0,0.2)", borderTopColor: "#C8FF00" }}
                     />
                     <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 rounded-full border-2"
                        style={{ borderColor: "rgba(255,107,53,0.2)", borderTopColor: "#FF6B35" }}
                     />
                  </div>
                  <div>
                     <p className="font-mono text-[0.65rem] tracking-[0.25em] uppercase mb-1" style={{ color: "#C8FF00" }}>
                        Agents Orchestrating
                     </p>
                     <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
                        {statusText}
                     </p>
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

      {/* ── Output Result ── */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-sm p-6 sm:p-10 relative overflow-hidden"
            style={{ 
               background: "var(--surface-1)", 
               border: "1px solid rgba(200,255,0,0.2)",
               boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
            }}
          >
             {/* Decor */}
             <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #C8FF00, #FF6B35, #A855F7)" }} />
             <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(200,255,0,0.05) 0%, transparent 70%)" }} />

             <div className="mb-8 border-b pb-6" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="font-mono text-[0.55rem] tracking-[0.25em] uppercase mb-2" style={{ color: "#C8FF00" }}>
                   AI Generated Report
                </p>
                <h3 className="font-display text-4xl tracking-wide" style={{ color: "var(--text-primary)" }}>
                   Investment Brief
                </h3>
             </div>

             <div 
                className="prose prose-invert prose-p:text-[0.95rem] prose-p:leading-relaxed prose-h1:text-3xl prose-h1:font-display prose-h2:text-2xl prose-h2:font-display prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-[#C8FF00] prose-li:text-[0.95rem] prose-strong:text-[#F0F0F0] max-w-none"
             >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                   {result}
                </ReactMarkdown>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
