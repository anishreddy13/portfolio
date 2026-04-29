"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabType = "sentiment" | "spam" | "emotion";

interface SentimentResult {
  sentiment: string;
  confidence: number;
  scores: Record<string, number>;
  original_text: string;
}

interface SpamResult {
  label: string;
  confidence: number;
  scores: Record<string, number>;
  spam_keywords_found: string[];
  original_text: string;
  is_spam: boolean;
}

interface EmotionItem {
  emotion: string;
  score: number;
  emoji: string;
  color: string;
}

interface EmotionResult {
  primary_emotion: string;
  emotion_emoji: string;
  emotion_color: string;
  emotion_confidence: number;
  top_emotions: EmotionItem[];
  gender: string;
  gender_confidence: number;
  gender_scores: Record<string, number>;
  age_group: string;
  age_confidence: number;
  age_scores: Record<string, number>;
  original_text: string;
}

interface SentimentHistoryItem extends SentimentResult {
  id: number;
}

interface SpamHistoryItem extends SpamResult {
  id: number;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const sentimentConfig: Record<string, { color: string; bg: string; border: string; emoji: string }> = {
  Positive: { color: "#00f5ff", bg: "rgba(0,245,255,0.08)", border: "rgba(0,245,255,0.3)", emoji: "😊" },
  Negative: { color: "#ec4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.3)", emoji: "😔" },
  Neutral:  { color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.3)", emoji: "😐" },
};

const sentimentExamples = [
  "I absolutely love this new feature, it's incredible!",
  "This is the worst service I have ever experienced.",
  "The meeting is scheduled for tomorrow at 3pm.",
  "Feeling so grateful and happy today!",
  "I'm really disappointed with the results.",
];

const spamExamples = [
  "Congratulations! You've won a FREE iPhone. Click here NOW!",
  "Hey, are we still meeting for lunch tomorrow?",
  "URGENT: Win £1000 cash! Text WIN to 87121. Limited offer!",
  "Can you send me the project files when you get a chance?",
  "FREE entry! You have been selected for a cash prize. Call now!",
];

const emotionExamples = [
  "I am so incredibly happy today, everything is going perfectly!",
  "I cannot believe they did this to me, I am absolutely furious!",
  "I miss my grandmother so much, it hurts every single day.",
  "Oh my gosh I had no idea this would happen, what a shock!",
  "Thank you so much for everything, I am deeply grateful.",
  "I am really nervous about the job interview tomorrow.",
  "Just got promoted! All my hard work finally paid off!",
  "I feel so confused and lost, I don't know what to do.",
];

const AGE_EMOJIS: Record<string, string> = {
  Child: "👶", Teenager: "🧑", Adult: "👨", Elderly: "👴",
};

const GENDER_EMOJIS: Record<string, string> = {
  Male: "👨", Female: "👩",
};

// ─── Neural Canvas ────────────────────────────────────────────────────────────

function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,245,255,${0.12 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
        ctx.beginPath();
        ctx.arc(a.x, a.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,245,255,0.5)";
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 opacity-30 pointer-events-none" />;
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────

function ConfidenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs text-white/40 uppercase tracking-wider">{label}</span>
        <span className="font-mono text-xs text-white/60">{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

// ─── Sentiment Tab ────────────────────────────────────────────────────────────

function SentimentTab({ serverStatus }: { serverStatus: string }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SentimentHistoryItem[]>([]);
  const [charCount, setCharCount] = useState(0);

  const handlePredict = async () => {
    if (!text.trim()) { setError("Please enter some text."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Failed");
      const data: SentimentResult = await res.json();
      setResult(data);
      setHistory((prev) => [{ ...data, id: Date.now() }, ...prev.slice(0, 4)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot connect to ML server.");
    } finally {
      setLoading(false);
    }
  };

  const cfg = result?.sentiment ? sentimentConfig[result.sentiment] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="glass border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/[0.04]">
            <span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">Input Text</span>
            <span className={`font-mono text-[10px] ${charCount > 900 ? "text-red-400" : "text-white/20"}`}>{charCount}/1000</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setCharCount(e.target.value.length); setError(null); }}
            placeholder="Type or paste any text to analyze sentiment..."
            rows={7}
            maxLength={1000}
            className="w-full bg-transparent px-4 py-3 font-body text-white/70 text-sm placeholder:text-white/20 resize-none focus:outline-none leading-relaxed"
          />
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-2">Try an example:</p>
          <div className="flex flex-col gap-2">
            {sentimentExamples.map((ex, i) => (
              <motion.button key={i} onClick={() => { setText(ex); setCharCount(ex.length); setResult(null); setError(null); }} whileHover={{ x: 4 }} className="text-left font-body text-xs text-white/30 hover:text-white/60 transition-colors duration-200 truncate">
                → {ex}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button onClick={handlePredict} disabled={loading || !text.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 py-3 rounded-xl bg-[#00f5ff] text-[#03040a] font-mono text-sm tracking-widest uppercase disabled:opacity-40">
            {loading ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-4 h-4 border-2 border-[#03040a]/30 border-t-[#03040a] rounded-full" />Analyzing...</span> : "Analyze →"}
          </motion.button>
          <motion.button onClick={() => { setText(""); setResult(null); setError(null); setCharCount(0); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl glass border border-white/10 font-mono text-xs text-white/40 hover:text-white hover:border-white/30 transition-all duration-300">Clear</motion.button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass border border-red-500/20 rounded-xl px-4 py-3">
              <p className="font-mono text-xs text-red-400">{error}</p>
              {serverStatus === "offline" && <p className="font-mono text-[10px] text-white/30 mt-1">Run: cd ml-backend → python -m uvicorn main:app --port 8000</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {result && cfg ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl overflow-hidden border" style={{ borderColor: cfg.border }}>
              <div className="px-6 py-5 border-b" style={{ background: cfg.bg, borderColor: cfg.border }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] tracking-widest text-white/30 uppercase mb-1">Detected Sentiment</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{cfg.emoji}</span>
                      <span className="font-display text-4xl tracking-wider" style={{ color: cfg.color }}>{result.sentiment}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] tracking-widest text-white/30 uppercase mb-1">Confidence</p>
                    <span className="font-display text-4xl" style={{ color: cfg.color }}>{result.confidence.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-4">Score Breakdown</p>
                {Object.entries(result.scores).map(([label, score]) => (
                  <ConfidenceBar key={label} label={label} value={score} color={label === "Positive" ? "#00f5ff" : label === "Negative" ? "#ec4899" : "#8b5cf6"} />
                ))}
              </div>
              <div className="px-6 pb-5">
                <div className="glass border border-white/[0.04] rounded-xl px-4 py-3">
                  <p className="font-mono text-[10px] text-white/20 uppercase mb-1">Model Info</p>
                  <p className="font-body text-xs text-white/40">TF-IDF + Logistic Regression · Tweet Eval dataset (45k+ samples)</p>
                </div>
              </div>
            </motion.div>
          ) : !loading ? (
            <motion.div key="placeholder" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-4 opacity-30">🧠</div>
              <p className="font-mono text-xs text-white/20 tracking-widest uppercase">Result will appear here</p>
            </motion.div>
          ) : (
            <motion.div key="loading" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-[#00f5ff]/20 border-t-[#00f5ff] rounded-full mb-4" />
              <p className="font-mono text-xs text-white/30 tracking-widest uppercase">Running inference...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {history.length > 0 && (
          <div>
            <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-3">Recent Analyses</p>
            <div className="space-y-2">
              {history.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass border border-white/[0.04] rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                  <p className="font-body text-xs text-white/40 truncate flex-1">{item.original_text.slice(0, 45)}...</p>
                  <span className="font-mono text-xs shrink-0" style={{ color: sentimentConfig[item.sentiment]?.color }}>{item.sentiment} · {item.confidence.toFixed(0)}%</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Spam Tab ─────────────────────────────────────────────────────────────────

function SpamTab({ serverStatus }: { serverStatus: string }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<SpamResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SpamHistoryItem[]>([]);
  const [charCount, setCharCount] = useState(0);

  const handlePredict = async () => {
    if (!text.trim()) { setError("Please enter a message."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("http://localhost:8000/predict/spam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Failed");
      const data: SpamResult = await res.json();
      setResult(data);
      setHistory((prev) => [{ ...data, id: Date.now() }, ...prev.slice(0, 4)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot connect to ML server.");
    } finally {
      setLoading(false);
    }
  };

  const spamColor = "#ec4899";
  const hamColor = "#00f5ff";
  const resultColor = result?.is_spam ? spamColor : hamColor;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="glass border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/[0.04]">
            <span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">Message / Email Text</span>
            <span className={`font-mono text-[10px] ${charCount > 1800 ? "text-red-400" : "text-white/20"}`}>{charCount}/2000</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setCharCount(e.target.value.length); setError(null); }}
            placeholder="Paste any SMS, email, or message to check if it's spam..."
            rows={7}
            maxLength={2000}
            className="w-full bg-transparent px-4 py-3 font-body text-white/70 text-sm placeholder:text-white/20 resize-none focus:outline-none leading-relaxed"
          />
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-2">Try an example:</p>
          <div className="flex flex-col gap-2">
            {spamExamples.map((ex, i) => (
              <motion.button key={i} onClick={() => { setText(ex); setCharCount(ex.length); setResult(null); setError(null); }} whileHover={{ x: 4 }} className="text-left font-body text-xs text-white/30 hover:text-white/60 transition-colors duration-200 truncate">
                → {ex}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button onClick={handlePredict} disabled={loading || !text.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 py-3 rounded-xl font-mono text-sm tracking-widest uppercase disabled:opacity-40" style={{ background: "#ec4899", color: "#03040a" }}>
            {loading ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-4 h-4 border-2 border-[#03040a]/30 border-t-[#03040a] rounded-full" />Checking...</span> : "Check Spam →"}
          </motion.button>
          <motion.button onClick={() => { setText(""); setResult(null); setError(null); setCharCount(0); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl glass border border-white/10 font-mono text-xs text-white/40 hover:text-white hover:border-white/30 transition-all duration-300">Clear</motion.button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass border border-red-500/20 rounded-xl px-4 py-3">
              <p className="font-mono text-xs text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl overflow-hidden border" style={{ borderColor: result.is_spam ? "rgba(236,72,153,0.3)" : "rgba(0,245,255,0.3)" }}>
              <div className="px-6 py-5 border-b" style={{ background: result.is_spam ? "rgba(236,72,153,0.08)" : "rgba(0,245,255,0.08)", borderColor: result.is_spam ? "rgba(236,72,153,0.3)" : "rgba(0,245,255,0.3)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] tracking-widest text-white/30 uppercase mb-1">Detection Result</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{result.is_spam ? "🚨" : "✅"}</span>
                      <span className="font-display text-4xl tracking-wider" style={{ color: resultColor }}>{result.label}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] tracking-widest text-white/30 uppercase mb-1">Confidence</p>
                    <span className="font-display text-4xl" style={{ color: resultColor }}>{result.confidence.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-4">Score Breakdown</p>
                {Object.entries(result.scores).map(([label, score]) => (
                  <ConfidenceBar key={label} label={label} value={score} color={label === "Spam" ? spamColor : hamColor} />
                ))}
              </div>
              {result.spam_keywords_found.length > 0 && (
                <div className="px-6 pb-4">
                  <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-3">Spam Triggers Detected</p>
                  <div className="flex flex-wrap gap-2">
                    {result.spam_keywords_found.map((kw) => (
                      <span key={kw} className="font-mono text-[10px] uppercase px-3 py-1 rounded-full border" style={{ color: spamColor, borderColor: "rgba(236,72,153,0.3)", background: "rgba(236,72,153,0.08)" }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="px-6 pb-5">
                <div className="glass border border-white/[0.04] rounded-xl px-4 py-3">
                  <p className="font-mono text-[10px] text-white/20 uppercase mb-1">Model Info</p>
                  <p className="font-body text-xs text-white/40">TF-IDF + Naive Bayes · SMS Spam Collection (5,500+ messages) · ~97% accuracy</p>
                </div>
              </div>
            </motion.div>
          ) : !loading ? (
            <motion.div key="placeholder" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-4 opacity-30">🔍</div>
              <p className="font-mono text-xs text-white/20 tracking-widest uppercase">Result will appear here</p>
            </motion.div>
          ) : (
            <motion.div key="loading" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-[#ec4899]/20 border-t-[#ec4899] rounded-full mb-4" />
              <p className="font-mono text-xs text-white/30 tracking-widest uppercase">Scanning message...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {history.length > 0 && (
          <div>
            <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-3">Recent Checks</p>
            <div className="space-y-2">
              {history.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass border border-white/[0.04] rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                  <p className="font-body text-xs text-white/40 truncate flex-1">{item.original_text.slice(0, 45)}...</p>
                  <span className="font-mono text-xs shrink-0" style={{ color: item.is_spam ? spamColor : hamColor }}>{item.label} · {item.confidence.toFixed(0)}%</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Emotion Tab ──────────────────────────────────────────────────────────────

function EmotionTab({ serverStatus }: { serverStatus: string }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<EmotionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const handlePredict = async () => {
    if (!text.trim()) { setError("Please enter some text."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("http://localhost:8000/predict/emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Failed");
      const data: EmotionResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot connect to ML server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — input */}
        <div className="space-y-4">
          <div className="glass border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/[0.04]">
              <span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">Input Text</span>
              <span className={`font-mono text-[10px] ${charCount > 900 ? "text-red-400" : "text-white/20"}`}>{charCount}/1000</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setCharCount(e.target.value.length); setError(null); }}
              placeholder="Describe how you feel — we'll detect emotion, gender and age group..."
              rows={7}
              maxLength={1000}
              className="w-full bg-transparent px-4 py-3 font-body text-white/70 text-sm placeholder:text-white/20 resize-none focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-2">Try an example:</p>
            <div className="flex flex-col gap-2">
              {emotionExamples.map((ex, i) => (
                <motion.button key={i} onClick={() => { setText(ex); setCharCount(ex.length); setResult(null); setError(null); }} whileHover={{ x: 4 }} className="text-left font-body text-xs text-white/30 hover:text-white/60 transition-colors duration-200 truncate">
                  → {ex}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button onClick={handlePredict} disabled={loading || !text.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 py-3 rounded-xl font-mono text-sm tracking-widest uppercase disabled:opacity-40" style={{ background: "#8b5cf6", color: "#fff" }}>
              {loading ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Analyzing...</span> : "Detect Emotion →"}
            </motion.button>
            <motion.button onClick={() => { setText(""); setResult(null); setError(null); setCharCount(0); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl glass border border-white/10 font-mono text-xs text-white/40 hover:text-white hover:border-white/30 transition-all duration-300">Clear</motion.button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass border border-red-500/20 rounded-xl px-4 py-3">
                <p className="font-mono text-xs text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — primary result */}
        <div>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl overflow-hidden border h-full" style={{ borderColor: `${result.emotion_color}40` }}>
                <div className="px-6 py-6 text-center border-b" style={{ background: `${result.emotion_color}10`, borderColor: `${result.emotion_color}30` }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.1 }} className="text-6xl mb-3">
                    {result.emotion_emoji}
                  </motion.div>
                  <h3 className="font-display text-4xl tracking-wider mb-1" style={{ color: result.emotion_color }}>
                    {result.primary_emotion.toUpperCase()}
                  </h3>
                  <p className="font-mono text-xs text-white/30">{result.emotion_confidence.toFixed(1)}% confidence</p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-white/[0.04]">
                  <div className="px-5 py-5 text-center">
                    <div className="text-3xl mb-2">{GENDER_EMOJIS[result.gender] || "👤"}</div>
                    <p className="font-mono text-[10px] text-white/20 uppercase tracking-widest mb-1">Gender</p>
                    <p className="font-body text-white/70 font-medium">{result.gender}</p>
                    <p className="font-mono text-[10px] text-white/30 mt-1">{result.gender_confidence.toFixed(1)}%</p>
                  </div>
                  <div className="px-5 py-5 text-center">
                    <div className="text-3xl mb-2">{AGE_EMOJIS[result.age_group] || "🧑"}</div>
                    <p className="font-mono text-[10px] text-white/20 uppercase tracking-widest mb-1">Age Group</p>
                    <p className="font-body text-white/70 font-medium">{result.age_group}</p>
                    <p className="font-mono text-[10px] text-white/30 mt-1">{result.age_confidence.toFixed(1)}%</p>
                  </div>
                </div>
              </motion.div>
            ) : !loading ? (
              <motion.div key="placeholder" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center text-center h-full">
                <div className="text-5xl mb-4 opacity-20">🎭</div>
                <p className="font-mono text-xs text-white/20 tracking-widest uppercase">Emotion result will appear here</p>
                <p className="font-body text-xs text-white/10 mt-2">Detects 28 emotions + gender + age group</p>
              </motion.div>
            ) : (
              <motion.div key="loading" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center h-full">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-[#8b5cf6]/20 border-t-[#8b5cf6] rounded-full mb-4" />
                <p className="font-mono text-xs text-white/30 tracking-widest uppercase">Analyzing emotions...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Top 5 emotions + gender/age scores */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass border border-white/[0.04] rounded-2xl p-6">
            <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-6">Top 5 Detected Emotions</p>
            <div className="space-y-3 mb-6">
              {result.top_emotions.map((item, i) => (
                <motion.div key={item.emotion} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-4">
                  <span className="text-xl w-8 text-center">{item.emoji}</span>
                  <span className="font-mono text-xs text-white/50 uppercase w-28 tracking-wider">{item.emotion}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }} initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                  <span className="font-mono text-xs text-white/40 w-14 text-right">{item.score.toFixed(1)}%</span>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/[0.04]">
              <div>
                <p className="font-mono text-[10px] text-white/20 uppercase tracking-widest mb-4">Gender Scores</p>
                {Object.entries(result.gender_scores).map(([label, score]) => (
                  <ConfidenceBar key={label} label={label} value={score} color={label === "Female" || label === "female" ? "#ec4899" : "#3b82f6"} />
                ))}
              </div>
              <div>
                <p className="font-mono text-[10px] text-white/20 uppercase tracking-widest mb-4">Age Group Scores</p>
                {Object.entries(result.age_scores).map(([label, score]) => (
                  <ConfidenceBar key={label} label={label} value={score} color="#8b5cf6" />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MLPage() {
  const [activeTab, setActiveTab] = useState<TabType>("sentiment");
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch("http://localhost:8000/health");
        setServerStatus(res.ok ? "online" : "offline");
      } catch {
        setServerStatus("offline");
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: "sentiment" as TabType, label: "Sentiment", icon: "🧠", color: "#00f5ff", desc: "Positive · Negative · Neutral" },
    { id: "spam" as TabType, label: "Spam Detector", icon: "🔍", color: "#ec4899", desc: "Spam · Not Spam" },
    { id: "emotion" as TabType, label: "Emotion + Demographics", icon: "🎭", color: "#8b5cf6", desc: "28 Emotions · Gender · Age" },
  ];

  return (
    <div className="relative min-h-screen bg-[#03040a] overflow-hidden">
      <NeuralCanvas />
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-transparent to-transparent pointer-events-none" />

      {/* Back */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="fixed top-6 left-6 z-20">
        <Link href="/" className="flex items-center gap-2 font-mono text-xs tracking-widest text-white/30 hover:text-[#00f5ff] transition-colors duration-300 uppercase">
          <motion.span whileHover={{ x: -3 }}>←</motion.span>
          Back
        </Link>
      </motion.div>

      {/* Server status */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="fixed top-6 right-6 z-20 flex items-center gap-2 glass border border-white/[0.06] rounded-full px-4 py-2">
        <span className={`w-1.5 h-1.5 rounded-full ${serverStatus === "online" ? "bg-green-400 animate-pulse" : serverStatus === "offline" ? "bg-red-400" : "bg-yellow-400 animate-pulse"}`} />
        <span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">
          {serverStatus === "online" ? "ML Server Online" : serverStatus === "offline" ? "Start Python Server" : "Checking..."}
        </span>
      </motion.div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f5ff] animate-pulse" />
            <span className="font-mono text-xs tracking-[0.3em] text-[#00f5ff] uppercase">ML Laboratory — Live Demo</span>
            <span className="w-2 h-2 rounded-full bg-[#00f5ff] animate-pulse" />
          </div>
          <h1 className="font-display text-[clamp(3rem,10vw,8rem)] leading-none tracking-tight mb-4">
            <span className="gradient-text">ML</span>
            <br />
            <span className="text-white/10 [-webkit-text-stroke:1px_rgba(255,255,255,0.15)]">LABORATORY</span>
          </h1>
          <p className="font-body text-white/40 max-w-xl mx-auto leading-relaxed">
            Three real ML models running locally — no external APIs, no cloud inference. Pure Python, scikit-learn, trained from scratch.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-4 mb-10">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative glass border rounded-2xl p-4 text-left transition-all duration-300"
              style={{
                borderColor: activeTab === tab.id ? `${tab.color}40` : "rgba(255,255,255,0.05)",
                background: activeTab === tab.id ? `${tab.color}08` : "rgba(255,255,255,0.02)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{tab.icon}</span>
                <span className="font-mono text-[10px] tracking-widest uppercase hidden sm:block" style={{ color: activeTab === tab.id ? tab.color : "rgba(255,255,255,0.3)" }}>
                  {tab.label}
                </span>
              </div>
              <p className="font-body text-[10px] text-white/20 hidden sm:block">{tab.desc}</p>
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-px rounded-full" style={{ background: tab.color }} />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {activeTab === "sentiment" ? (
              <SentimentTab serverStatus={serverStatus} />
            ) : activeTab === "spam" ? (
              <SpamTab serverStatus={serverStatus} />
            ) : (
              <EmotionTab serverStatus={serverStatus} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-12 glass border border-white/[0.04] rounded-2xl p-6">
          <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-6">How All Models Work</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Data", desc: "Real datasets from HuggingFace — tweets, SMS, Reddit comments" },
              { step: "02", title: "Clean", desc: "NLTK removes stopwords, lemmatizes, strips noise from text" },
              { step: "03", title: "Vectorize", desc: "TF-IDF converts text into numerical feature vectors" },
              { step: "04", title: "Predict", desc: "Logistic Regression & Naive Bayes classify in milliseconds" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="font-display text-3xl gradient-text mb-2">{item.step}</div>
                <h4 className="font-mono text-xs text-white/50 uppercase tracking-wider mb-1">{item.title}</h4>
                <p className="font-body text-xs text-white/25 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}