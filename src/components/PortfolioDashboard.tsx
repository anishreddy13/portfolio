"use client";

import { useState, useEffect } from "react";
import WatchlistSidebar from "./WatchlistSidebar";
import SignalFeed from "./SignalFeed";
import HeadlessFinancialAnalyst from "./HeadlessFinancialAnalyst";
import RebalancerCard from "./RebalancerCard";

export default function PortfolioDashboard() {
  // Global persistent portfolio state: Ticker -> Weight
  const [portfolio, setPortfolio] = useState<Record<string, number>>({});
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ai_financial_portfolio");
    if (saved) {
      try {
        setPortfolio(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse portfolio", e);
      }
    } else {
      // Default initial portfolio
      setPortfolio({
        "AAPL": 0.4,
        "TSLA": 0.3,
        "NVDA": 0.3
      });
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("ai_financial_portfolio", JSON.stringify(portfolio));
    }
  }, [portfolio, isLoaded]);

  if (!isLoaded) return null;

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden text-[var(--text-primary)]">
      
      {/* Left Sidebar: Watchlist */}
      <div className="w-[320px] h-full shrink-0 hidden md:block">
        <WatchlistSidebar 
          portfolio={portfolio} 
          setPortfolio={setPortfolio} 
          onSelectTicker={setSelectedTicker} 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Marquee: Live AI Signals */}
        <div className="shrink-0 h-14">
          <SignalFeed />
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32">
          
          <div className="max-w-5xl mx-auto space-y-12">
            
            {/* 1. Selected Asset Deep Dive */}
            <div id="deep-dive">
              <div className="mb-4">
                 <h2 className="font-display text-2xl tracking-wide">
                   Asset Deep Dive
                 </h2>
                 <p className="font-body text-sm text-[var(--text-tertiary)] mt-1">
                   {selectedTicker 
                     ? `Run full multi-agent analysis on ${selectedTicker}.`
                     : "Search for a ticker below, or select one from your watchlist."}
                 </p>
              </div>
              
              <HeadlessFinancialAnalyst initialTicker={selectedTicker || ""} />
            </div>

            {/* 2. Portfolio Rebalancer */}
            <div id="rebalancer">
              <RebalancerCard 
                portfolio={portfolio}
                setPortfolio={setPortfolio}
              />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
