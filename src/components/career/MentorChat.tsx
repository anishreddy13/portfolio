"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { chatWithMentor, contextualChat } from "../../../lib/careerApi";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  followUps?: string[];
  relevantSkills?: string[];
};

const suggestions = [
  "What skills should I learn in 2026?",
  "Should I learn Kubernetes or LangChain first?",
  "How do I transition from frontend to ML?",
  "What salary can I expect as a Python dev in India?",
];

function getUserId() {
  if (typeof window === "undefined") return "career-session";
  const existing = window.localStorage.getItem("career_user_id");
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem("career_user_id", id);
  return id;
}

export default function MentorChat({ studentSkills = [], hasProfile = false }: { studentSkills?: string[]; hasProfile?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = useRef("career-session");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => { userId.current = getUserId(); }, []);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  const send = async (value = input) => {
    const content = value.trim();
    if (!content || loading) return;
    setInput("");
    setError(null);
    const userMessage: Message = { role: "user", content, timestamp: new Date().toISOString() };
    setMessages((items) => [...items, userMessage]);
    setLoading(true);
    try {
      const response = hasProfile
        ? await contextualChat({ user_id: userId.current, message: content })
        : await chatWithMentor({
            user_id: userId.current,
            message: content,
            student_skills: studentSkills,
            employability_score: 0,
          });
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          content: response.response,
          timestamp: new Date().toISOString(),
          followUps: "follow_up_questions" in response ? response.follow_up_questions : [],
          relevantSkills: "relevant_skills" in response ? response.relevant_skills : [],
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mentor is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-sm overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="p-4 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#C8FF00", boxShadow: "0 0 8px #C8FF00" }} />
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em]" style={{ color: "#C8FF00" }}>AI Mentor</p>
          </div>
          <p className="font-body text-xs" style={{ color: "#606060" }}>Powered by Groq Llama3-70b · Real market data</p>
        </div>
        <span className="font-mono text-[0.52rem] uppercase tracking-widest" style={{ color: hasProfile ? "#C8FF00" : "#606060" }}>
          {hasProfile ? "Profile Context" : "Basic Context"}
        </span>
      </div>

      <div ref={scroller} className="h-[440px] overflow-y-auto p-4 space-y-4">
        {!messages.length && (
          <div className="space-y-3">
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em]" style={{ color: "#606060" }}>Suggested Questions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.map((question) => (
                <button key={question} onClick={() => send(question)} className="rounded-sm p-3 text-left font-body text-xs leading-relaxed" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "#A0A0A0" }}>{question}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <motion.div key={`${message.timestamp}-${index}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[86%] rounded-sm p-3" style={{ background: message.role === "user" ? "#C8FF00" : "var(--surface-2)", color: message.role === "user" ? "#0A0A0A" : "#A0A0A0", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <p className="font-mono text-[0.48rem] uppercase tracking-widest mt-2 opacity-60">{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              {message.relevantSkills?.length ? (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {message.relevantSkills.map((skill) => <span key={skill} className="rounded-sm px-2 py-1 font-mono text-[0.48rem] uppercase" style={{ background: "rgba(168,85,247,0.12)", color: "#A855F7" }}>{skill}</span>)}
                </div>
              ) : null}
              {message.followUps?.length ? (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {message.followUps.map((question) => <button key={question} onClick={() => send(question)} className="rounded-sm px-2 py-1 font-mono text-[0.48rem] uppercase" style={{ background: "rgba(200,255,0,0.08)", color: "#C8FF00", border: "1px solid rgba(200,255,0,0.16)" }}>{question}</button>)}
                </div>
              ) : null}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex gap-1.5">
            {[0, 1, 2].map((dot) => (
              <motion.span key={dot} className="w-2 h-2 rounded-full" style={{ background: "#C8FF00" }} animate={{ opacity: [0.25, 1, 0.25], y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: dot * 0.12 }} />
            ))}
          </div>
        )}
      </div>

      {error && <p className="px-4 pb-3 font-mono text-[0.58rem]" style={{ color: "#FF2D2D" }}>{error}</p>}
      <div className="p-3 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") send(); }}
          placeholder="Ask your career mentor..."
          className="flex-1 rounded-sm px-3 py-3 bg-transparent font-body text-sm focus:outline-none"
          style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "#F0F0F0" }}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} className="rounded-sm px-5 font-mono text-[0.62rem] uppercase tracking-[0.2em] disabled:opacity-40" style={{ background: "#C8FF00", color: "#0A0A0A" }}>Send</button>
      </div>
    </div>
  );
}
