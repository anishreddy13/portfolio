"use client";

import React, { useState } from "react";
import {
  Bot,
  Send,
  Zap,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BarChart3,
  Cpu,
  Layers,
} from "lucide-react";
import { useCopilot } from "@/hooks/useCopilot";

export default function CopilotPanel() {
  const { messages, suggestions, executionPlan, statistics, sendMessage, generatePlan } = useCopilot();
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 font-mono text-xs space-y-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 text-slate-950 font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white leading-none">ENTERPRISE AI TRADING COPILOT</h3>
            <p className="text-[10px] text-slate-400 leading-tight">Orchestration & Decision Explanation Subsystem</p>
          </div>
        </div>

        {/* Operational Statistics */}
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span>Queries: <strong className="text-sky-400">{statistics.totalQueriesAnswered}</strong></span>
          <span>Plans: <strong className="text-lime-400">{statistics.totalPlansGenerated}</strong></span>
        </div>
      </div>

      {/* Main Copilot Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Chat Conversation Stream */}
        <div className="lg:col-span-2 space-y-3 flex flex-col justify-between bg-slate-950/80 rounded-xl border border-slate-800/80 p-3 h-80">
          {/* Conversation Stream */}
          <div className="overflow-y-auto space-y-2 pr-1 flex-1">
            {messages.map((m) => (
              <div
                key={m.msgId}
                className={`p-2.5 rounded-xl text-[11px] leading-relaxed max-w-[90%] ${
                  m.sender === "USER"
                    ? "bg-sky-500/10 text-sky-200 border border-sky-500/30 ml-auto"
                    : "bg-slate-900 text-slate-300 border border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1">
                  <span className="font-bold uppercase text-sky-400">{m.sender}</span>
                  <span>{m.timestamp}</span>
                </div>
                <p>{m.content}</p>
              </div>
            ))}
          </div>

          {/* Quick Action Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => sendMessage("Explain AAPL signal")}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-sky-400 transition whitespace-nowrap"
            >
              ⚡ Explain Signal
            </button>
            <button
              onClick={() => sendMessage("Explain portfolio risk")}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-rose-400 transition whitespace-nowrap"
            >
              🛡️ Explain Risk
            </button>
            <button
              onClick={() => sendMessage("Explain portfolio positions")}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-lime-400 transition whitespace-nowrap"
            >
              📊 Portfolio Overview
            </button>
            <button
              onClick={() => generatePlan("Rebalance Execution Plan")}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-amber-400 transition whitespace-nowrap"
            >
              📋 Generate Plan
            </button>
          </div>

          {/* Input Chat Bar */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask Copilot (e.g. 'Explain risk', 'Recommend trade')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 text-xs"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Column: Copilot Action Suggestions & Execution Plan */}
        <div className="space-y-3">
          {/* Action Suggestions */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-3 space-y-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Action Suggestions
            </span>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {suggestions.map((s) => (
                <div key={s.suggestionId} className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-white">
                    <span>{s.title}</span>
                    <span className="text-[9px] px-1.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                      {(s.confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">{s.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Plan Viewer */}
          {executionPlan ? (
            <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-white border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-lime-400" /> {executionPlan.title}
                </span>
                <span className="text-[9px] px-1.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/30">
                  {executionPlan.complianceStatus}
                </span>
              </div>
              <div className="space-y-1">
                {executionPlan.steps.map((st) => (
                  <div key={st.step} className="p-1.5 rounded bg-slate-900 text-[9px] flex items-center gap-2 text-slate-300">
                    <span className="w-4 h-4 rounded bg-slate-800 font-bold text-sky-400 flex items-center justify-center">
                      {st.step}
                    </span>
                    <span>{st.name}: {st.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/50 rounded-xl border border-slate-800/50 p-4 text-center text-slate-500 text-[10px]">
              No active execution plan generated. Click "Generate Plan" to construct multi-step plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
