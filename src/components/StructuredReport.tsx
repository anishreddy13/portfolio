"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Info, ShieldAlert } from "lucide-react";

interface StructuredReportProps {
  markdown: string;
}

export default function StructuredReport({ markdown }: StructuredReportProps) {
  // Check for rate limit / model errors in raw output
  const hasApiError = markdown && (markdown.includes("Error code: 429") || markdown.includes("Error code: 400"));

  if (hasApiError) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full p-6 rounded-md bg-red-950/20 border border-red-900/50 flex items-start gap-4"
      >
        <div className="mt-0.5 text-red-500">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="font-display text-xl text-red-400 mb-1">API Overloaded</h3>
          <p className="font-body text-sm text-[var(--text-secondary)] leading-relaxed">
            Please wait a moment and try again.
          </p>
        </div>
      </motion.div>
    );
  }

  // Parse the markdown into sections
  const parsed = useMemo(() => {
    const text = markdown || "";
    
    // Find section indices
    const execSummaryMatch = text.match(/Executive Summary/i);
    const financialHealthMatch = text.match(/Financial Health/i);
    const secRisksMatch = text.match(/SEC Compliance & Hidden Risks/i);
    const peerMatch = text.match(/Peer Comparison/i);
    const riskFactorsMatch = text.match(/Risk Factors/i);
    const recommendationMatch = text.match(/Recommendation/i);
    
    // Extract Executive Summary
    let execSummary = "";
    let sentiment = "Unknown";
    
    const startIndex = execSummaryMatch ? execSummaryMatch.index! + execSummaryMatch[0].length : 0;
    const endIndex = financialHealthMatch ? financialHealthMatch.index : 
                     (secRisksMatch ? secRisksMatch.index :
                     (peerMatch ? peerMatch.index :
                     (riskFactorsMatch ? riskFactorsMatch.index : 
                     (recommendationMatch ? recommendationMatch.index : text.length))));
                     
    if (endIndex !== undefined) {
      execSummary = text.substring(startIndex, endIndex).trim();
      
      // Extract sentiment if present
      const sentimentMatch = execSummary.match(/Market Sentiment:\s*([^\n]+)/i);
      if (sentimentMatch) {
        sentiment = sentimentMatch[1].trim();
        // Remove the sentiment line from the raw summary text
        execSummary = execSummary.replace(sentimentMatch[0], "").trim();
      }
    }
    
    // Extract Financial Health
    let financialData: { metric: string; value: string }[] = [];
    if (financialHealthMatch) {
      const fhStart = financialHealthMatch.index! + financialHealthMatch[0].length;
      const fhEnd = secRisksMatch ? secRisksMatch.index :
                    (peerMatch ? peerMatch.index :
                    (riskFactorsMatch ? riskFactorsMatch.index : 
                    (recommendationMatch ? recommendationMatch.index : text.length)));
      
      const fhText = text.substring(fhStart, fhEnd).trim();
      const lines = fhText.split("\n").map(l => l.trim()).filter(l => l);
      
      // Parse each line, handling Markdown tables, bulleted lists, and raw text formats
      lines.forEach(line => {
        // Skip table separators or headers
        if (line.includes("---")) return;
        if (line.toLowerCase().includes("metric") && line.toLowerCase().includes("value")) return; 
        
        let cleanedLine = line.trim();
        
        // 1. Handle Markdown Table Rows: | Metric | Value |
        if (cleanedLine.startsWith("|") && cleanedLine.endsWith("|")) {
           const cells = cleanedLine.split("|").map(c => c.trim()).filter(c => c);
           if (cells.length >= 2) {
              const metric = cells[0].replace(/\*\*/g, "");
              const value = cells[1].replace(/\*\*/g, "");
              financialData.push({ metric, value });
              return;
           }
        }
        
        // 2. Handle Bulleted/Colon List: * Metric: Value  OR - Metric: Value
        const colonMatch = cleanedLine.match(/^[-*•\d\.]*\s*(.+?):\s*(.+)$/);
        if (colonMatch) {
            const metric = colonMatch[1].replace(/\*\*/g, "").trim();
            const value = colonMatch[2].replace(/\*\*/g, "").trim();
            financialData.push({ metric, value });
            return;
        }

        // 3. Fallback: Old format (Metric Value separated by spaces)
        cleanedLine = cleanedLine.replace(/\*\*/g, "").trim();
        const parts = cleanedLine.match(/(.+?)\s+([$%\d.\-NA]+|N\/A)$/i);
        if (parts && parts.length >= 3) {
          financialData.push({ metric: parts[1].trim(), value: parts[2].trim() });
        } else {
           const fallbackParts = cleanedLine.split(/\s{2,}|\t/);
           if (fallbackParts.length >= 2) {
             financialData.push({ metric: fallbackParts[0].trim(), value: fallbackParts[fallbackParts.length-1].trim() });
           }
        }
      });
    }

    // Extract SEC Risks
    let secRisks: string[] = [];
    if (secRisksMatch) {
      const secStart = secRisksMatch.index! + secRisksMatch[0].length;
      const secEnd = peerMatch ? peerMatch.index :
                     (riskFactorsMatch ? riskFactorsMatch.index : 
                     (recommendationMatch ? recommendationMatch.index : text.length));
      
      const secText = text.substring(secStart, secEnd).trim();
      secRisks = secText.split("\n")
        .map(l => l.replace(/^[-\*•\d\.]+\s*/, "").trim())
        .filter(l => l.length > 5);
    }

    // Extract Peer Comparison
    let peerComparison: { headers: string[], rows: string[][] } = { headers: [], rows: [] };
    let peerTakeaway = "";
    if (peerMatch) {
      const pStart = peerMatch.index! + peerMatch[0].length;
      const pEnd = riskFactorsMatch ? riskFactorsMatch.index : 
                   (recommendationMatch ? recommendationMatch.index : text.length);
      
      const pText = text.substring(pStart, pEnd).trim();
      const pLines = pText.split("\n").map(l => l.trim()).filter(l => l);
      
      pLines.forEach(line => {
        if (line.includes("---")) return;
        
        if (line.startsWith("|") && line.endsWith("|")) {
          const cells = line.split("|").map(c => c.trim()).filter(c => c);
          if (peerComparison.headers.length === 0) {
            peerComparison.headers = cells.map(c => c.replace(/\*\*/g, ""));
          } else {
            peerComparison.rows.push(cells.map(c => c.replace(/\*\*/g, "")));
          }
        } else if (!line.startsWith("|") && line.length > 10) {
          peerTakeaway += line + " ";
        }
      });
      peerTakeaway = peerTakeaway.trim();
    }

    // Extract Risk Factors
    let riskFactors: string[] = [];
    if (riskFactorsMatch) {
      const rfStart = riskFactorsMatch.index! + riskFactorsMatch[0].length;
      const rfEnd = recommendationMatch ? recommendationMatch.index : text.length;
      
      const rfText = text.substring(rfStart, rfEnd).trim();
      // Split by newlines, bullet points, or numbers
      riskFactors = rfText.split("\n")
        .map(l => l.replace(/^[-\*•\d\.]+\s*/, "").trim())
        .filter(l => l.length > 5); // Ignore empty or very short lines
    }

    // Extract Recommendation
    let recommendation = "";
    if (recommendationMatch) {
      const recStart = recommendationMatch.index! + recommendationMatch[0].length;
      
      // Stop before "Report generated by..."
      const generatedMatch = text.match(/Report generated by/i);
      const recEnd = generatedMatch ? generatedMatch.index : text.length;
      
      recommendation = text.substring(recStart, recEnd).trim();
    }
    
    return {
      execSummary,
      sentiment,
      financialData,
      secRisks,
      peerComparison,
      peerTakeaway,
      riskFactors,
      recommendation
    };
  }, [markdown]);

  // Determine Sentiment Style
  const sentimentLower = parsed.sentiment.toLowerCase();
  let sentimentStyles = "bg-slate-800 text-slate-300 border-slate-600";
  let SentimentIcon = Activity;
  
  if (sentimentLower.includes("bullish") || sentimentLower.includes("positive") || sentimentLower.includes("strong")) {
    sentimentStyles = "bg-green-950/40 text-green-400 border-green-800";
    SentimentIcon = TrendingUp;
  } else if (sentimentLower.includes("bearish") || sentimentLower.includes("negative") || sentimentLower.includes("weak")) {
    sentimentStyles = "bg-red-950/40 text-red-400 border-red-800";
    SentimentIcon = TrendingDown;
  } else if (sentimentLower.includes("mixed") || sentimentLower.includes("neutral")) {
    sentimentStyles = "bg-amber-950/40 text-amber-400 border-amber-800";
    SentimentIcon = Activity;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col gap-6 w-full"
    >
      {/* 1. Executive Summary & Sentiment */}
      <div className="rounded-md overflow-hidden bg-[var(--surface-1)] border border-[rgba(255,255,255,0.06)]">
         <div className="p-5 sm:p-7 bg-slate-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80">
            <div>
               <h3 className="font-display text-2xl text-[var(--text-primary)] mb-1 tracking-wide">
                  Executive Summary
               </h3>
               <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-tertiary)]">
                  Overview & Market Context
               </p>
            </div>
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${sentimentStyles}`}>
               <SentimentIcon size={14} />
               <span className="font-mono text-[0.65rem] uppercase tracking-wider font-semibold">
                  Sentiment: {parsed.sentiment}
               </span>
            </div>
         </div>
         <div className="p-5 sm:p-7">
            <p className="font-body text-[0.95rem] text-[var(--text-secondary)] leading-relaxed">
               {parsed.execSummary || "No executive summary available."}
            </p>
         </div>
      </div>

      {/* Grid for Table & Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* 2. Financial Health Table */}
         <div className="rounded-md bg-[var(--surface-1)] border border-[rgba(255,255,255,0.06)] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800/80 bg-slate-900/20">
               <h3 className="font-display text-xl text-[var(--text-primary)]">Financial Health</h3>
            </div>
            <div className="flex-1 overflow-x-auto">
               {parsed.financialData.length > 0 ? (
                  <table className="w-full text-left table-auto">
                     <thead>
                        <tr className="bg-slate-900/50">
                           <th className="py-3 px-5 font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-tertiary)] border-b border-slate-800 font-normal">Metric</th>
                           <th className="py-3 px-5 font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-tertiary)] border-b border-slate-800 font-normal text-right">Value</th>
                        </tr>
                     </thead>
                     <tbody>
                        {parsed.financialData.map((row, idx) => (
                           <tr key={idx} className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/20'}`}>
                              <td className="py-3 px-5 font-body text-[0.85rem] text-[var(--text-secondary)]">{row.metric}</td>
                              <td className="py-3 px-5 font-mono text-[0.85rem] text-[var(--text-primary)] text-right">{row.value}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               ) : (
                  <div className="p-6 text-center text-[var(--text-tertiary)] font-mono text-xs">
                     No tabular financial data parsed.
                  </div>
               )}
            </div>
         </div>

         {/* 3. Risk Factors */}
         <div className="rounded-md bg-[var(--surface-1)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="p-5 border-b border-slate-800/80 bg-slate-900/20">
               <h3 className="font-display text-xl text-[var(--text-primary)]">Risk Factors</h3>
            </div>
            <div className="p-5">
               {parsed.riskFactors.length > 0 ? (
                  <ul className="space-y-4">
                     {parsed.riskFactors.map((risk, idx) => (
                        <li key={idx} className="flex gap-3 items-start">
                           <div className="mt-1 flex-shrink-0 bg-red-950/40 p-1.5 rounded text-red-500 border border-red-900/50">
                              <AlertTriangle size={12} />
                           </div>
                           <p className="font-body text-[0.9rem] text-[var(--text-secondary)] leading-snug">
                              {risk}
                           </p>
                        </li>
                     ))}
                  </ul>
               ) : (
                  <div className="text-center text-[var(--text-tertiary)] font-mono text-xs">
                     No significant risk factors identified.
                  </div>
               )}
            </div>
         </div>

      </div>

      {/* SEC Compliance Risks */}
      {parsed.secRisks.length > 0 && (
         <div className="rounded-md bg-[var(--surface-1)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="p-5 border-b border-orange-900/40 bg-orange-950/20 flex items-center gap-3">
               <ShieldAlert size={18} className="text-orange-500" />
               <h3 className="font-display text-xl text-orange-400">SEC Compliance & Hidden Risks</h3>
            </div>
            <div className="p-5 bg-gradient-to-b from-orange-950/10 to-transparent">
               <ul className="space-y-4">
                  {parsed.secRisks.map((risk, idx) => (
                     <li key={idx} className="flex gap-3 items-start">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                        <p className="font-body text-[0.95rem] text-[var(--text-secondary)] leading-relaxed">
                           {risk}
                        </p>
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      )}

      {/* Peer Comparison */}
      {parsed.peerComparison.headers.length > 0 && (
         <div className="rounded-md bg-[var(--surface-1)] border border-[rgba(255,255,255,0.06)] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800/80 bg-slate-900/20">
               <h3 className="font-display text-xl text-[var(--text-primary)]">Peer Comparison</h3>
            </div>
            <div className="flex-1 overflow-x-auto">
               <table className="w-full text-left table-auto">
                  <thead>
                     <tr className="bg-slate-900/50">
                        {parsed.peerComparison.headers.map((header, idx) => (
                          <th key={idx} className={`py-3 px-5 font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-tertiary)] border-b border-slate-800 font-normal ${idx > 0 ? 'text-right' : ''}`}>
                            {header}
                          </th>
                        ))}
                     </tr>
                  </thead>
                  <tbody>
                     {parsed.peerComparison.rows.map((row, idx) => (
                        <tr key={idx} className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/20'}`}>
                           {row.map((cell, cellIdx) => (
                             <td key={cellIdx} className={`py-3 px-5 font-body text-[0.85rem] ${cellIdx === 0 ? 'text-[var(--text-secondary)]' : 'font-mono text-[var(--text-primary)] text-right'}`}>
                               {cell}
                             </td>
                           ))}
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {parsed.peerTakeaway && (
              <div className="p-4 bg-slate-900/10 border-t border-[rgba(255,255,255,0.02)]">
                 <p className="font-body text-sm text-[var(--text-secondary)] leading-relaxed italic">
                    "{parsed.peerTakeaway}"
                 </p>
              </div>
            )}
         </div>
      )}

      {/* 4. Recommendation Callout */}
      {parsed.recommendation && (
         <div className="rounded-md border-l-4 border-l-[#C8FF00] border-t border-r border-b border-[rgba(255,255,255,0.06)] bg-gradient-to-r from-[rgba(200,255,0,0.05)] to-transparent p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
               <Info size={16} className="text-[#C8FF00]" />
               <h3 className="font-display text-2xl text-[var(--text-primary)]">Strategic Recommendation</h3>
            </div>
            <p className="font-body text-[1rem] leading-relaxed text-[var(--text-secondary)] pl-6 border-l border-slate-700/50">
               {parsed.recommendation}
            </p>
         </div>
      )}

      {/* Footer Meta */}
      <div className="text-center pt-2">
         <p className="font-mono text-[0.55rem] text-[var(--text-tertiary)] uppercase tracking-widest">
            Generated by AI Financial Analyst · Multi-Agent Data Aggregation
         </p>
      </div>

    </motion.div>
  );
}
