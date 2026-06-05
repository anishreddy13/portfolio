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
  "How do I become an ML Engineer?",
  "What salary can I expect in Hyderabad?",
  "Should I learn Docker or Kubernetes first?",
];

function getUserId() {
  if (typeof window === "undefined") return "career-session";
  const existing = window.localStorage.getItem("career_user_id");
  if (existing) return existing;
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `career-${Date.now()}`;
  window.localStorage.setItem("career_user_id", id);
  return id;
}

function isColdStartError(error: unknown) {
  return error instanceof Error && /warming|try again|fetch|network|timeout/i.test(error.message);
}

export default function MentorChat({
  studentSkills = [],
  hasProfile = false,
}: {
  studentSkills?: string[];
  hasProfile?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [warming, setWarming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = useRef("career-session");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => { userId.current = getUserId(); }, []);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [messages, loading, warming]);

  const callMentor = async (message: string) => {
    if (hasProfile) {
      const response = await contextualChat({ user_id: userId.current, message });
      return {
        response: response.response,
        followUps: response.follow_up_questions || [],
        relevantSkills: response.relevant_skills || [],
      };
    }

    const response = await chatWithMentor({
      user_id: userId.current,
      message,
      student_skills: studentSkills,
      employability_score: 0,
    });
    return {
      response: response.response,
      followUps: [],
      relevantSkills: studentSkills.slice(0, 6),
    };
  };

  const appendAssistant = (content: string, followUps: string[] = [], relevantSkills: string[] = []) => {
    setMessages((items) => [
      ...items,
      {
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
        followUps,
        relevantSkills,
      },
    ]);
  };

  const send = async (value = input) => {
    const content = value.trim();
    if (!content || loading) return;
    setInput("");
    setError(null);
    setWarming(false);
    setMessages((items) => [...items, { role: "user", content, timestamp: new Date().toISOString() }]);
    setLoading(true);

    try {
      const response = await callMentor(content);
      appendAssistant(response.response || "I could not generate a response.", response.followUps, response.relevantSkills);
    } catch (firstError) {
      if (!isColdStartError(firstError)) {
        setError(firstError instanceof Error ? firstError.message : "Mentor is unavailable.");
        setLoading(false);
        return;
      }

      setWarming(true);
      appendAssistant("Career API warming up... retrying in 15 seconds");
      await new Promise((resolve) => window.setTimeout(resolve, 15000));

      try {
        const retryResponse = await callMentor(content);
        setWarming(false);
        appendAssistant(retryResponse.response || "I could not generate a response.", retryResponse.followUps, retryResponse.relevantSkills);
      } catch (secondError) {
        setWarming(false);
        setError(secondError instanceof Error ? secondError.message : "Mentor is unavailable after retry.");
      }
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
        <span className="font-mono text-[0.52rem] uppercase tracking-widest" style={{ color: warming ? "#FF6B35" : "#C8FF00" }}>
          {warming ? "Warming" : "Online"}
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
            <div className="max-w-[86%] rounded-sm p-3" style={{ background: message.role === "user" ? "#C8FF00" : "var(--surface-2)", color: message.role === "user" ? "#0A0A0A" : "#F0F0F0", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="font-mono text-[0.48rem] uppercase tracking-widest mb-2" style={{ color: message.role === "user" ? "rgba(10,10,10,0.6)" : "#606060" }}>
                {message.role === "user" ? "You" : "Mentor"} · {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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
          onKeyDown={(event) => { if (event.key === "Enter") void send(); }}
          placeholder="Ask your career mentor..."
          className="flex-1 rounded-sm px-3 py-3 bg-transparent font-body text-sm focus:outline-none"
          style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "#F0F0F0" }}
        />
        <button onClick={() => void send()} disabled={loading || !input.trim()} className="rounded-sm px-5 font-mono text-[0.62rem] uppercase tracking-[0.2em] disabled:opacity-40" style={{ background: "#C8FF00", color: "#0A0A0A" }}>Send</button>
      </div>
    </div>
  );
}
