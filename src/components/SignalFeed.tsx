"use client";

import { useState, useEffect } from "react";
import { Client } from "@gradio/client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, TrendingUp, ShieldAlert, Zap, Activity } from "lucide-react";

interface Signal {
  ticker: string;
  signal_type: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
}

function parseSignals(response: unknown): Signal[] {
  const data = (response as { data?: unknown[] } | null)?.data;
  const raw = Array.isArray(data) ? data[0] : null;
  if (typeof raw !== "string") return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function SignalFeed() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchSignals = async () => {
      try {
        const app = await Client.connect("Anishreddy13/ai-financial-analyst");
        const response = await app.predict("/get_market_signals", []);
        
        if (mounted && response && response.data) {
          setSignals(parseSignals(response));
        }
      } catch (e) {
        console.error("Failed to fetch market signals", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSignals();
    // Poll every 5 minutes
    const interval = setInterval(fetchSignals, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const getSignalIcon = (type: string) => {
    switch (type) {
      case "VALUATION_ALERT": return <TrendingUp size={16} className="text-[#C8FF00]" />;
      case "REGULATORY_RISK": return <ShieldAlert size={16} className="text-orange-500" />;
      case "CATALYST": return <Zap size={16} className="text-purple-400" />;
      case "ERROR": return <AlertTriangle size={16} className="text-red-500" />;
      default: return <Activity size={16} className="text-blue-400" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "HIGH": return "bg-red-950/40 text-red-400 border-red-900/50";
      case "MEDIUM": return "bg-orange-950/40 text-orange-400 border-orange-900/50";
      default: return "bg-slate-800/50 text-slate-400 border-slate-700/50";
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-[var(--surface-1)] border-b border-[rgba(255,255,255,0.06)] py-3 px-4 flex items-center justify-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse" />
        <span className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--text-tertiary)]">
          Scanning Live Market Signals...
        </span>
      </div>
    );
  }

  if (signals.length === 0) return null;

  return (
    <div className="w-full bg-[#050505] border-b border-[rgba(255,255,255,0.06)] overflow-hidden relative flex items-center">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050505] to-transparent z-10 flex items-center px-4 border-r border-[#111]">
         <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-red-500 font-semibold">LIVE</span>
         </div>
      </div>
      
      {/* Marquee Container */}
      <div className="flex-1 overflow-hidden ml-24">
        <motion.div 
          className="flex whitespace-nowrap py-3 gap-8 px-4"
          animate={{ x: [0, -2000] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        >
          {/* Double the array for seamless infinite scrolling */}
          {[...signals, ...signals].map((sig, idx) => (
            <div 
              key={idx} 
              className={`flex items-center gap-3 px-4 py-1.5 rounded-full border ${getSeverityStyles(sig.severity)}`}
            >
              <div className="flex items-center gap-2">
                 {getSignalIcon(sig.signal_type)}
                 <span className="font-display text-sm tracking-wide font-bold">{sig.ticker}</span>
              </div>
              <span className="w-px h-3 bg-current opacity-30" />
              <span className="font-body text-xs pr-2">{sig.description}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
