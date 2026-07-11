"use client";

import { motion } from "framer-motion";
import { MessageSquare, Newspaper, CheckCircle, TrendingUp, TrendingDown, Minus, PlayCircle } from "lucide-react";

interface SocialItem {
  source: string;
  content: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  url: string;
  verified: boolean;
}

interface SocialSentinelProps {
  data: SocialItem[] | null;
  loading: boolean;
}

export default function SocialSentinel({ data, loading }: SocialSentinelProps) {
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-20">
         <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-[#C8FF00] border-t-transparent rounded-full animate-spin opacity-80" />
            <p className="font-mono text-sm text-[var(--text-tertiary)] uppercase tracking-widest">Aggregating Global Feeds...</p>
         </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full p-10 border border-[rgba(255,255,255,0.05)] rounded-sm text-center">
         <p className="font-mono text-sm text-[var(--text-secondary)]">No recent news or social sentiment found for this asset.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-4">
        <div>
           <h3 className="font-display text-xl text-[var(--text-primary)]">Social & News Sentinel</h3>
           <p className="font-mono text-[0.6rem] tracking-widest uppercase text-[var(--text-tertiary)] mt-1">
             Real-Time Retail & Institutional Sentiment
           </p>
        </div>
      </div>

      {/* Masonry Layout Grid */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {data.map((item, idx) => {
          const isBullish = item.sentiment === "Bullish";
          const isBearish = item.sentiment === "Bearish";
          const isNeutral = item.sentiment === "Neutral";
          
          return (
            <motion.a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="break-inside-avoid flex flex-col p-5 rounded-sm relative overflow-hidden group cursor-pointer"
              style={{
                background: "var(--surface-1)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "block"
              }}
              whileHover={{ 
                  y: -2,
                  borderColor: isBullish ? "rgba(200,255,0,0.3)" : isBearish ? "rgba(255,45,45,0.3)" : "rgba(255,255,255,0.15)",
                  background: "var(--surface-2)"
              }}
            >
              {/* Header: Source and Verification */}
              <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {item.source === "YouTube" ? (
                       <PlayCircle size={14} className="text-[#FF0000]" />
                    ) : item.source === "Reddit" ? (
                       <MessageSquare size={14} className="text-[#FF4500]" />
                    ) : item.source === "StockTwits" ? (
                       <MessageSquare size={14} className="text-[#00A6DF]" />
                    ) : item.verified ? (
                       <Newspaper size={14} className="text-[#C8FF00]" />
                    ) : (
                       <MessageSquare size={14} className="text-[var(--text-tertiary)]" />
                    )}
                    <span className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                       {item.source}
                    </span>
                 </div>
                 {item.verified && (
                    <div className="flex items-center gap-1 bg-[rgba(200,255,0,0.05)] px-2 py-0.5 rounded-sm border border-[rgba(200,255,0,0.1)]">
                       <CheckCircle size={10} color="#C8FF00" />
                       <span className="font-mono text-[0.55rem] text-[#C8FF00] uppercase tracking-widest">Verified</span>
                    </div>
                 )}
              </div>
              
              {/* Content */}
              <p className="font-body text-sm text-[var(--text-primary)] leading-relaxed mb-4 line-clamp-6 group-hover:text-white transition-colors">
                {item.content}
              </p>
              
              {/* Footer: Sentiment Tag */}
              <div className="mt-auto pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between">
                 <div 
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm"
                    style={{
                       background: isBullish ? "rgba(200,255,0,0.1)" : isBearish ? "rgba(255,45,45,0.1)" : "rgba(255,255,255,0.05)",
                       border: `1px solid ${isBullish ? "rgba(200,255,0,0.2)" : isBearish ? "rgba(255,45,45,0.2)" : "rgba(255,255,255,0.1)"}`
                    }}
                 >
                    {isBullish && <TrendingUp size={12} color="#C8FF00" />}
                    {isBearish && <TrendingDown size={12} color="#FF2D2D" />}
                    {isNeutral && <Minus size={12} className="text-[var(--text-tertiary)]" />}
                    
                    <span 
                       className="font-mono text-[0.6rem] uppercase tracking-widest font-bold"
                       style={{ color: isBullish ? "#C8FF00" : isBearish ? "#FF2D2D" : "var(--text-secondary)" }}
                    >
                       {item.sentiment}
                    </span>
                 </div>
              </div>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
