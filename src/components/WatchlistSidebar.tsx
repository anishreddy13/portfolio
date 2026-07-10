"use client";

import { useState, useEffect } from "react";
import { Client } from "@gradio/client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X, Activity, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface TickerMetrics {
  price: number;
  change_pct: number;
  marketCap: number;
  pe: number | null;
  beta: number | null;
  name: string;
}

interface PortfolioData {
  tickers: Record<string, TickerMetrics | { error: string }>;
  aggregate: {
    totalMarketCap: number;
    weightedPE: number | null;
    weightedBeta: number | null;
  };
}

interface WatchlistSidebarProps {
  portfolio: Record<string, number>; // Ticker -> Weight
  setPortfolio: (p: Record<string, number>) => void;
  onSelectTicker: (ticker: string) => void;
}

export default function WatchlistSidebar({ portfolio, setPortfolio, onSelectTicker }: WatchlistSidebarProps) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [newTicker, setNewTicker] = useState("");

  const tickers = Object.keys(portfolio);

  useEffect(() => {
    if (tickers.length === 0) {
      setData(null);
      return;
    }

    const fetchPortfolioData = async () => {
      setLoading(true);
      try {
        const app = await Client.connect("Anishreddy13/ai-financial-analyst");
        // We pass the portfolio dict to the backend so it can calc weighted metrics
        const payload = JSON.stringify(portfolio);
        const response = await app.predict("/get_portfolio_data", [payload]);
        
        if (response && response.data) {
          const rawJson = (response.data as unknown[])[0] as string;
          const parsed = JSON.parse(rawJson);
          if (!parsed.error) {
            setData(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to fetch portfolio data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
    // Poll every 60 seconds
    const interval = setInterval(fetchPortfolioData, 60000);
    return () => clearInterval(interval);
  }, [JSON.stringify(portfolio)]);

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const t = newTicker.trim().toUpperCase();
    if (t && !portfolio[t]) {
      // Add with equal weight rebalance simplified (just add 10% for now, rebalancer handles actual)
      setPortfolio({ ...portfolio, [t]: 0.1 });
      setNewTicker("");
    }
  };

  const handleRemoveTicker = (e: React.MouseEvent, t: string) => {
    e.stopPropagation();
    const newPort = { ...portfolio };
    delete newPort[t];
    setPortfolio(newPort);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="w-full h-full bg-[var(--surface-1)] border-r border-[rgba(255,255,255,0.06)] flex flex-col">
      {/* Header & Add Ticker */}
      <div className="p-5 border-b border-[rgba(255,255,255,0.06)] bg-[#0A0A0A]">
        <h2 className="font-display text-xl mb-4 text-[var(--text-primary)] tracking-wide">
          Your Watchlist
        </h2>
        
        <form onSubmit={handleAddTicker} className="relative">
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value)}
            placeholder="Add ticker (e.g. MSFT)"
            className="w-full bg-[#111] border border-[#222] rounded-md py-2.5 pl-9 pr-3 text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C8FF00]/50 transition-colors uppercase"
            maxLength={5}
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <button 
            type="submit" 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#222] hover:bg-[#333] p-1 rounded transition-colors text-[var(--text-secondary)] hover:text-[#C8FF00]"
            disabled={!newTicker.trim()}
          >
            <Plus size={14} />
          </button>
        </form>
      </div>

      {/* Aggregate Portfolio Metrics (if we have data) */}
      {data && data.aggregate && tickers.length > 0 && (
        <div className="p-4 grid grid-cols-2 gap-3 border-b border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-[#0A0A0A] to-[#050505]">
          <div className="flex flex-col">
            <span className="font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Total MCap</span>
            <span className="font-mono text-sm text-[var(--text-primary)]">
              {formatNumber(data.aggregate.totalMarketCap)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Weighted PE</span>
            <span className="font-mono text-sm text-[var(--text-primary)]">
              {data.aggregate.weightedPE !== null ? data.aggregate.weightedPE.toFixed(1) : "N/A"}
            </span>
          </div>
        </div>
      )}

      {/* Ticker List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {tickers.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-6 opacity-50"
            >
              <Activity size={32} className="mb-3 text-[var(--text-tertiary)]" />
              <p className="font-body text-sm text-[var(--text-secondary)]">Your watchlist is empty.</p>
              <p className="font-mono text-[0.65rem] text-[var(--text-tertiary)] mt-2 uppercase tracking-wide">Add a ticker to track</p>
            </motion.div>
          ) : (
            tickers.map((t) => {
              const itemData = data?.tickers[t];
              const isError = itemData && 'error' in itemData;
              const metrics = !isError ? (itemData as TickerMetrics) : null;
              
              const isPositive = metrics && metrics.change_pct >= 0;

              return (
                <motion.div
                  key={t}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  onClick={() => onSelectTicker(t)}
                  className="group relative bg-[#0A0A0A] border border-[rgba(255,255,255,0.03)] hover:border-[rgba(200,255,0,0.3)] rounded-md p-3 cursor-pointer transition-all hover:bg-[#111]"
                >
                  <button 
                    onClick={(e) => handleRemoveTicker(e, t)}
                    className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-tertiary)] hover:text-red-400"
                  >
                    <X size={12} />
                  </button>

                  <div className="flex justify-between items-start mb-1 pr-6">
                    <h3 className="font-display text-lg tracking-wide text-[var(--text-primary)] leading-none">{t}</h3>
                    {metrics ? (
                      <span className="font-mono text-sm text-[var(--text-primary)]">
                        ${metrics.price.toFixed(2)}
                      </span>
                    ) : isError ? (
                      <span className="font-mono text-xs text-red-500">Error</span>
                    ) : (
                      <span className="w-12 h-4 bg-[#222] rounded animate-pulse" />
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-body text-[0.65rem] text-[var(--text-tertiary)] truncate w-32">
                      {metrics ? metrics.name : "Loading..."}
                    </span>
                    {metrics ? (
                      <div className={`flex items-center gap-1 font-mono text-xs ${isPositive ? 'text-[#C8FF00]' : 'text-[#FF2D2D]'}`}>
                        {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(metrics.change_pct)}%
                      </div>
                    ) : !isError && (
                      <span className="w-10 h-3 bg-[#222] rounded animate-pulse" />
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {loading && tickers.length > 0 && !data && (
        <div className="p-3 border-t border-[rgba(255,255,255,0.06)] flex justify-center">
          <div className="w-4 h-4 border-2 border-[var(--text-tertiary)] border-t-[#C8FF00] rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
