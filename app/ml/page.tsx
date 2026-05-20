"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = "sentiment" | "spam" | "emotion" | "cancer" | "skin";

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

interface FeatureImportance {
  feature: string;
  importance: number;
}

interface CancerResult {
  prediction: string;
  confidence: number;
  malignant_probability: number;
  benign_probability: number;
  risk_level: string;
  top_features: FeatureImportance[];
  is_malignant: boolean;
}

interface SkinClassResult {
  class_code: string;
  class_name: string;
  probability: number;
  is_cancerous: boolean;
}

interface SkinResult {
  prediction: string;
  predicted_type: string;
  confidence: number;
  cancer_probability: number;
  benign_probability: number;
  risk_level: string;
  is_cancerous: boolean;
  top_5: SkinClassResult[];
}

interface SentimentHistoryItem extends SentimentResult { id: number; }
interface SpamHistoryItem extends SpamResult { id: number; }

// ─── Config ───────────────────────────────────────────────────────────────────

const sentimentConfig: Record<string, { color: string; bg: string; border: string; emoji: string }> = {
  Positive: { color: "#00f5ff", bg: "rgba(0,245,255,0.08)",  border: "rgba(0,245,255,0.3)",  emoji: "😊" },
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

const AGE_EMOJIS: Record<string, string> = { Child: "👶", Teenager: "🧑", Adult: "👨", Elderly: "👴" };
const GENDER_EMOJIS: Record<string, string> = { Male: "👨", Female: "👩" };

const CANCER_FEATURES = [
  { key: "radius_mean",             label: "Radius Mean",             min: 6.981,  max: 28.11,  step: 0.01,  unit: "mm"  },
  { key: "texture_mean",            label: "Texture Mean",            min: 9.71,   max: 39.28,  step: 0.01,  unit: ""    },
  { key: "perimeter_mean",          label: "Perimeter Mean",          min: 43.79,  max: 188.5,  step: 0.1,   unit: "mm"  },
  { key: "area_mean",               label: "Area Mean",               min: 143.5,  max: 2501.0, step: 1.0,   unit: "mm²" },
  { key: "smoothness_mean",         label: "Smoothness Mean",         min: 0.053,  max: 0.163,  step: 0.001, unit: ""    },
  { key: "compactness_mean",        label: "Compactness Mean",        min: 0.019,  max: 0.345,  step: 0.001, unit: ""    },
  { key: "concavity_mean",          label: "Concavity Mean",          min: 0.0,    max: 0.427,  step: 0.001, unit: ""    },
  { key: "concave_points_mean",     label: "Concave Points Mean",     min: 0.0,    max: 0.201,  step: 0.001, unit: ""    },
  { key: "symmetry_mean",           label: "Symmetry Mean",           min: 0.106,  max: 0.304,  step: 0.001, unit: ""    },
  { key: "fractal_dimension_mean",  label: "Fractal Dimension Mean",  min: 0.05,   max: 0.097,  step: 0.001, unit: ""    },
  { key: "radius_worst",            label: "Radius Worst",            min: 7.93,   max: 36.04,  step: 0.01,  unit: "mm"  },
  { key: "texture_worst",           label: "Texture Worst",           min: 12.02,  max: 49.54,  step: 0.01,  unit: ""    },
  { key: "perimeter_worst",         label: "Perimeter Worst",         min: 50.41,  max: 251.2,  step: 0.1,   unit: "mm"  },
  { key: "area_worst",              label: "Area Worst",              min: 185.2,  max: 4254.0, step: 1.0,   unit: "mm²" },
  { key: "smoothness_worst",        label: "Smoothness Worst",        min: 0.071,  max: 0.223,  step: 0.001, unit: ""    },
  { key: "compactness_worst",       label: "Compactness Worst",       min: 0.027,  max: 0.938,  step: 0.001, unit: ""    },
  { key: "concavity_worst",         label: "Concavity Worst",         min: 0.0,    max: 1.252,  step: 0.001, unit: ""    },
  { key: "concave_points_worst",    label: "Concave Points Worst",    min: 0.0,    max: 0.291,  step: 0.001, unit: ""    },
  { key: "symmetry_worst",          label: "Symmetry Worst",          min: 0.156,  max: 0.664,  step: 0.001, unit: ""    },
  { key: "fractal_dimension_worst", label: "Fractal Dimension Worst", min: 0.055,  max: 0.208,  step: 0.001, unit: ""    },
];

const MALIGNANT_SAMPLE: Record<string, number> = {
  radius_mean: 17.99, texture_mean: 10.38, perimeter_mean: 122.8, area_mean: 1001.0,
  smoothness_mean: 0.1184, compactness_mean: 0.2776, concavity_mean: 0.3001,
  concave_points_mean: 0.1471, symmetry_mean: 0.2419, fractal_dimension_mean: 0.07871,
  radius_se: 1.095, texture_se: 0.9053, perimeter_se: 8.589, area_se: 153.4,
  smoothness_se: 0.006399, compactness_se: 0.04904, concavity_se: 0.05373,
  concave_points_se: 0.01587, symmetry_se: 0.03003, fractal_dimension_se: 0.006193,
  radius_worst: 25.38, texture_worst: 17.33, perimeter_worst: 184.6, area_worst: 2019.0,
  smoothness_worst: 0.1622, compactness_worst: 0.6656, concavity_worst: 0.7119,
  concave_points_worst: 0.2654, symmetry_worst: 0.4601, fractal_dimension_worst: 0.1189,
};

const BENIGN_SAMPLE: Record<string, number> = {
  radius_mean: 13.54, texture_mean: 14.36, perimeter_mean: 87.46, area_mean: 566.3,
  smoothness_mean: 0.09779, compactness_mean: 0.08129, concavity_mean: 0.06664,
  concave_points_mean: 0.04781, symmetry_mean: 0.1885, fractal_dimension_mean: 0.05766,
  radius_se: 0.2699, texture_se: 0.7886, perimeter_se: 2.058, area_se: 23.56,
  smoothness_se: 0.008462, compactness_se: 0.0146, concavity_se: 0.02387,
  concave_points_se: 0.01315, symmetry_se: 0.0198, fractal_dimension_se: 0.0023,
  radius_worst: 15.11, texture_worst: 19.26, perimeter_worst: 99.7, area_worst: 711.2,
  smoothness_worst: 0.144, compactness_worst: 0.1773, concavity_worst: 0.239,
  concave_points_worst: 0.1288, symmetry_worst: 0.2977, fractal_dimension_worst: 0.07259,
};

// ─── Neural Canvas ─────────────────────────────────────────────────────────────

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
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
    }));
    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach((b) => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 140) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,245,255,${0.12 * (1 - d / 140)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        });
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,245,255,0.5)"; ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 opacity-30 pointer-events-none" />;
}

// ─── Confidence Bar ────────────────────────────────────────────────────────────

function ConfidenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between"><span className="font-mono text-xs text-white/40 uppercase tracking-wider">{label}</span><span className="font-mono text-xs text-white/60">{value.toFixed(1)}%</span></div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
      </div>
    </div>
  );
}

// ─── Sentiment Tab ─────────────────────────────────────────────────────────────

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
      const res = await fetch("https://portfolio-pkdj.onrender.com/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!res.ok) throw new Error((await res.json()).detail || "Failed");
      const data: SentimentResult = await res.json();
      setResult(data); setHistory((p) => [{ ...data, id: Date.now() }, ...p.slice(0, 4)]);
    } catch (e) { setError(e instanceof Error ? e.message : "Cannot connect."); } finally { setLoading(false); }
  };

  const cfg = result?.sentiment ? sentimentConfig[result.sentiment] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="glass border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/[0.04]"><span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">Input Text</span><span className={`font-mono text-[10px] ${charCount > 900 ? "text-red-400" : "text-white/20"}`}>{charCount}/1000</span></div>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setCharCount(e.target.value.length); setError(null); }} placeholder="Type or paste any text to analyze sentiment..." rows={7} maxLength={1000} className="w-full bg-transparent px-4 py-3 font-body text-white/70 text-sm placeholder:text-white/20 resize-none focus:outline-none leading-relaxed" />
        </div>
        <div><p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-2">Try an example:</p><div className="flex flex-col gap-2">{sentimentExamples.map((ex, i) => (<motion.button key={i} onClick={() => { setText(ex); setCharCount(ex.length); setResult(null); setError(null); }} whileHover={{ x: 4 }} className="text-left font-body text-xs text-white/30 hover:text-white/60 transition-colors truncate">→ {ex}</motion.button>))}</div></div>
        <div className="flex gap-3">
          <motion.button onClick={handlePredict} disabled={loading || !text.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 py-3 rounded-xl bg-[#00f5ff] text-[#03040a] font-mono text-sm tracking-widest uppercase disabled:opacity-40">{loading ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-4 h-4 border-2 border-[#03040a]/30 border-t-[#03040a] rounded-full" />Analyzing...</span> : "Analyze →"}</motion.button>
          <motion.button onClick={() => { setText(""); setResult(null); setError(null); setCharCount(0); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl glass border border-white/10 font-mono text-xs text-white/40 hover:text-white hover:border-white/30 transition-all duration-300">Clear</motion.button>
        </div>
        <AnimatePresence>{error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass border border-red-500/20 rounded-xl px-4 py-3"><p className="font-mono text-xs text-red-400">{error}</p></motion.div>)}</AnimatePresence>
      </div>
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {result && cfg ? (
            <motion.div key="r" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl overflow-hidden border" style={{ borderColor: cfg.border }}>
              <div className="px-6 py-5 border-b" style={{ background: cfg.bg, borderColor: cfg.border }}><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] tracking-widest text-white/30 uppercase mb-1">Detected Sentiment</p><div className="flex items-center gap-3"><span className="text-3xl">{cfg.emoji}</span><span className="font-display text-4xl tracking-wider" style={{ color: cfg.color }}>{result.sentiment}</span></div></div><div className="text-right"><p className="font-mono text-[10px] tracking-widest text-white/30 uppercase mb-1">Confidence</p><span className="font-display text-4xl" style={{ color: cfg.color }}>{result.confidence.toFixed(1)}%</span></div></div></div>
              <div className="px-6 py-5"><p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-4">Score Breakdown</p>{Object.entries(result.scores).map(([l, s]) => (<ConfidenceBar key={l} label={l} value={s} color={l === "Positive" ? "#00f5ff" : l === "Negative" ? "#ec4899" : "#8b5cf6"} />))}</div>
              <div className="px-6 pb-5"><div className="glass border border-white/[0.04] rounded-xl px-4 py-3"><p className="font-mono text-[10px] text-white/20 uppercase mb-1">Model Info</p><p className="font-body text-xs text-white/40">TF-IDF + Logistic Regression · Tweet Eval (45k+ samples)</p></div></div>
            </motion.div>
          ) : !loading ? (
            <motion.div key="p" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center text-center"><div className="text-4xl mb-4 opacity-30">🧠</div><p className="font-mono text-xs text-white/20 tracking-widest uppercase">Result will appear here</p></motion.div>
          ) : (
            <motion.div key="l" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-[#00f5ff]/20 border-t-[#00f5ff] rounded-full mb-4" /><p className="font-mono text-xs text-white/30 tracking-widest uppercase">Running inference...</p></motion.div>
          )}
        </AnimatePresence>
        {history.length > 0 && (<div><p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-3">Recent Analyses</p><div className="space-y-2">{history.map((item) => (<motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass border border-white/[0.04] rounded-xl px-4 py-3 flex items-center justify-between gap-4"><p className="font-body text-xs text-white/40 truncate flex-1">{item.original_text.slice(0, 45)}...</p><span className="font-mono text-xs shrink-0" style={{ color: sentimentConfig[item.sentiment]?.color }}>{item.sentiment} · {item.confidence.toFixed(0)}%</span></motion.div>))}</div></div>)}
      </div>
    </div>
  );
}

// ─── Spam Tab ──────────────────────────────────────────────────────────────────

function SpamTab({ serverStatus }: { serverStatus: string }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<SpamResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SpamHistoryItem[]>([]);
  const [charCount, setCharCount] = useState(0);
  const sc = "#ec4899", hc = "#00f5ff";

  const handlePredict = async () => {
    if (!text.trim()) { setError("Please enter a message."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("https://portfolio-pkdj.onrender.com/predict/spam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!res.ok) throw new Error((await res.json()).detail || "Failed");
      const data: SpamResult = await res.json();
      setResult(data); setHistory((p) => [{ ...data, id: Date.now() }, ...p.slice(0, 4)]);
    } catch (e) { setError(e instanceof Error ? e.message : "Cannot connect."); } finally { setLoading(false); }
  };

  const rc = result?.is_spam ? sc : hc;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="glass border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/[0.04]"><span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">Message / Email</span><span className={`font-mono text-[10px] ${charCount > 1800 ? "text-red-400" : "text-white/20"}`}>{charCount}/2000</span></div>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setCharCount(e.target.value.length); setError(null); }} placeholder="Paste any SMS, email, or message..." rows={7} maxLength={2000} className="w-full bg-transparent px-4 py-3 font-body text-white/70 text-sm placeholder:text-white/20 resize-none focus:outline-none leading-relaxed" />
        </div>
        <div><p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-2">Try an example:</p><div className="flex flex-col gap-2">{spamExamples.map((ex, i) => (<motion.button key={i} onClick={() => { setText(ex); setCharCount(ex.length); setResult(null); setError(null); }} whileHover={{ x: 4 }} className="text-left font-body text-xs text-white/30 hover:text-white/60 transition-colors truncate">→ {ex}</motion.button>))}</div></div>
        <div className="flex gap-3">
          <motion.button onClick={handlePredict} disabled={loading || !text.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 py-3 rounded-xl font-mono text-sm tracking-widest uppercase disabled:opacity-40" style={{ background: sc, color: "#03040a" }}>{loading ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-4 h-4 border-2 border-[#03040a]/30 border-t-[#03040a] rounded-full" />Checking...</span> : "Check Spam →"}</motion.button>
          <motion.button onClick={() => { setText(""); setResult(null); setError(null); setCharCount(0); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl glass border border-white/10 font-mono text-xs text-white/40 hover:text-white hover:border-white/30 transition-all duration-300">Clear</motion.button>
        </div>
        <AnimatePresence>{error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass border border-red-500/20 rounded-xl px-4 py-3"><p className="font-mono text-xs text-red-400">{error}</p></motion.div>)}</AnimatePresence>
      </div>
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="r" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl overflow-hidden border" style={{ borderColor: result.is_spam ? "rgba(236,72,153,0.3)" : "rgba(0,245,255,0.3)" }}>
              <div className="px-6 py-5 border-b" style={{ background: result.is_spam ? "rgba(236,72,153,0.08)" : "rgba(0,245,255,0.08)", borderColor: result.is_spam ? "rgba(236,72,153,0.3)" : "rgba(0,245,255,0.3)" }}><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] tracking-widest text-white/30 uppercase mb-1">Detection Result</p><div className="flex items-center gap-3"><span className="text-3xl">{result.is_spam ? "🚨" : "✅"}</span><span className="font-display text-4xl tracking-wider" style={{ color: rc }}>{result.label}</span></div></div><div className="text-right"><p className="font-mono text-[10px] tracking-widest text-white/30 uppercase mb-1">Confidence</p><span className="font-display text-4xl" style={{ color: rc }}>{result.confidence.toFixed(1)}%</span></div></div></div>
              <div className="px-6 py-5"><p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-4">Score Breakdown</p>{Object.entries(result.scores).map(([l, s]) => (<ConfidenceBar key={l} label={l} value={s} color={l === "Spam" ? sc : hc} />))}</div>
              {result.spam_keywords_found.length > 0 && (<div className="px-6 pb-4"><p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-3">Spam Triggers</p><div className="flex flex-wrap gap-2">{result.spam_keywords_found.map((kw) => (<span key={kw} className="font-mono text-[10px] uppercase px-3 py-1 rounded-full border" style={{ color: sc, borderColor: "rgba(236,72,153,0.3)", background: "rgba(236,72,153,0.08)" }}>{kw}</span>))}</div></div>)}
              <div className="px-6 pb-5"><div className="glass border border-white/[0.04] rounded-xl px-4 py-3"><p className="font-mono text-[10px] text-white/20 uppercase mb-1">Model Info</p><p className="font-body text-xs text-white/40">TF-IDF + Naive Bayes · SMS Spam Collection · ~97% accuracy</p></div></div>
            </motion.div>
          ) : !loading ? (
            <motion.div key="p" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center text-center"><div className="text-4xl mb-4 opacity-30">🔍</div><p className="font-mono text-xs text-white/20 tracking-widest uppercase">Result will appear here</p></motion.div>
          ) : (
            <motion.div key="l" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-[#ec4899]/20 border-t-[#ec4899] rounded-full mb-4" /><p className="font-mono text-xs text-white/30 tracking-widest uppercase">Scanning...</p></motion.div>
          )}
        </AnimatePresence>
        {history.length > 0 && (<div><p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-3">Recent Checks</p><div className="space-y-2">{history.map((item) => (<motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass border border-white/[0.04] rounded-xl px-4 py-3 flex items-center justify-between gap-4"><p className="font-body text-xs text-white/40 truncate flex-1">{item.original_text.slice(0, 45)}...</p><span className="font-mono text-xs shrink-0" style={{ color: item.is_spam ? sc : hc }}>{item.label} · {item.confidence.toFixed(0)}%</span></motion.div>))}</div></div>)}
      </div>
    </div>
  );
}

// ─── Emotion Tab ───────────────────────────────────────────────────────────────

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
      const res = await fetch("https://portfolio-pkdj.onrender.com/predict/emotion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!res.ok) throw new Error((await res.json()).detail || "Failed");
      setResult(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Cannot connect."); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="glass border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/[0.04]"><span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">Input Text</span><span className={`font-mono text-[10px] ${charCount > 900 ? "text-red-400" : "text-white/20"}`}>{charCount}/1000</span></div>
            <textarea value={text} onChange={(e) => { setText(e.target.value); setCharCount(e.target.value.length); setError(null); }} placeholder="Describe how you feel..." rows={7} maxLength={1000} className="w-full bg-transparent px-4 py-3 font-body text-white/70 text-sm placeholder:text-white/20 resize-none focus:outline-none leading-relaxed" />
          </div>
          <div><p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-2">Try an example:</p><div className="flex flex-col gap-2">{emotionExamples.map((ex, i) => (<motion.button key={i} onClick={() => { setText(ex); setCharCount(ex.length); setResult(null); setError(null); }} whileHover={{ x: 4 }} className="text-left font-body text-xs text-white/30 hover:text-white/60 transition-colors truncate">→ {ex}</motion.button>))}</div></div>
          <div className="flex gap-3">
            <motion.button onClick={handlePredict} disabled={loading || !text.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 py-3 rounded-xl font-mono text-sm tracking-widest uppercase disabled:opacity-40" style={{ background: "#8b5cf6", color: "#fff" }}>{loading ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Analyzing...</span> : "Detect Emotion →"}</motion.button>
            <motion.button onClick={() => { setText(""); setResult(null); setError(null); setCharCount(0); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl glass border border-white/10 font-mono text-xs text-white/40 hover:text-white hover:border-white/30 transition-all duration-300">Clear</motion.button>
          </div>
          <AnimatePresence>{error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass border border-red-500/20 rounded-xl px-4 py-3"><p className="font-mono text-xs text-red-400">{error}</p></motion.div>)}</AnimatePresence>
        </div>
        <div>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="r" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl overflow-hidden border h-full" style={{ borderColor: `${result.emotion_color}40` }}>
                <div className="px-6 py-6 text-center border-b" style={{ background: `${result.emotion_color}10`, borderColor: `${result.emotion_color}30` }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.1 }} className="text-6xl mb-3">{result.emotion_emoji}</motion.div>
                  <h3 className="font-display text-4xl tracking-wider mb-1" style={{ color: result.emotion_color }}>{result.primary_emotion.toUpperCase()}</h3>
                  <p className="font-mono text-xs text-white/30">{result.emotion_confidence.toFixed(1)}% confidence</p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-white/[0.04]">
                  <div className="px-5 py-5 text-center"><div className="text-3xl mb-2">{GENDER_EMOJIS[result.gender] || "👤"}</div><p className="font-mono text-[10px] text-white/20 uppercase tracking-widest mb-1">Gender</p><p className="font-body text-white/70 font-medium">{result.gender}</p><p className="font-mono text-[10px] text-white/30 mt-1">{result.gender_confidence.toFixed(1)}%</p></div>
                  <div className="px-5 py-5 text-center"><div className="text-3xl mb-2">{AGE_EMOJIS[result.age_group] || "🧑"}</div><p className="font-mono text-[10px] text-white/20 uppercase tracking-widest mb-1">Age Group</p><p className="font-body text-white/70 font-medium">{result.age_group}</p><p className="font-mono text-[10px] text-white/30 mt-1">{result.age_confidence.toFixed(1)}%</p></div>
                </div>
              </motion.div>
            ) : !loading ? (
              <motion.div key="p" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center text-center h-full"><div className="text-5xl mb-4 opacity-20">🎭</div><p className="font-mono text-xs text-white/20 tracking-widest uppercase">Emotion result will appear here</p></motion.div>
            ) : (
              <motion.div key="l" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center h-full"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-[#8b5cf6]/20 border-t-[#8b5cf6] rounded-full mb-4" /><p className="font-mono text-xs text-white/30 tracking-widest uppercase">Analyzing emotions...</p></motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass border border-white/[0.04] rounded-2xl p-6">
            <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-6">Top 5 Detected Emotions</p>
            <div className="space-y-3 mb-6">{result.top_emotions.map((item, i) => (<motion.div key={item.emotion} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-4"><span className="text-xl w-8 text-center">{item.emoji}</span><span className="font-mono text-xs text-white/50 uppercase w-28 tracking-wider">{item.emotion}</span><div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden"><motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }} initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }} /></div><span className="font-mono text-xs text-white/40 w-14 text-right">{item.score.toFixed(1)}%</span></motion.div>))}</div>
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/[0.04]">
              <div><p className="font-mono text-[10px] text-white/20 uppercase tracking-widest mb-4">Gender Scores</p>{Object.entries(result.gender_scores).map(([l, s]) => (<ConfidenceBar key={l} label={l} value={s} color={l === "Female" || l === "female" ? "#ec4899" : "#3b82f6"} />))}</div>
              <div><p className="font-mono text-[10px] text-white/20 uppercase tracking-widest mb-4">Age Group Scores</p>{Object.entries(result.age_scores).map(([l, s]) => (<ConfidenceBar key={l} label={l} value={s} color="#8b5cf6" />))}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Cancer Tab ────────────────────────────────────────────────────────────────

function CancerTab({ serverStatus }: { serverStatus: string }) {
  const [features, setFeatures] = useState<Record<string, number>>(BENIGN_SAMPLE);
  const [result, setResult] = useState<CancerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const riskColors: Record<string, string> = { Low: "#00f5ff", Moderate: "#f59e0b", High: "#ec4899" };

  const handlePredict = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("https://portfolio-pkdj.onrender.com/predict/cancer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ features }) });
      if (!res.ok) throw new Error((await res.json()).detail || "Failed");
      setResult(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Cannot connect."); } finally { setLoading(false); }
  };

  const rc = result ? riskColors[result.risk_level] || "#00f5ff" : "#00f5ff";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase w-full mb-1">Load a sample preset:</p>
        <motion.button onClick={() => { setFeatures(MALIGNANT_SAMPLE); setResult(null); }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="px-5 py-2 rounded-full border font-mono text-xs tracking-widest uppercase text-[#ec4899] border-[rgba(236,72,153,0.3)] bg-[rgba(236,72,153,0.08)] hover:bg-[rgba(236,72,153,0.15)] transition-all duration-300">🔴 Malignant Sample</motion.button>
        <motion.button onClick={() => { setFeatures(BENIGN_SAMPLE); setResult(null); }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="px-5 py-2 rounded-full border font-mono text-xs tracking-widest uppercase text-[#00f5ff] border-[rgba(0,245,255,0.3)] bg-[rgba(0,245,255,0.08)] hover:bg-[rgba(0,245,255,0.15)] transition-all duration-300">🟢 Benign Sample</motion.button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass border border-white/[0.06] rounded-2xl p-6 space-y-4 max-h-[600px] overflow-y-auto">
          <p className="font-mono text-[10px] tracking-widest text-white/30 uppercase sticky top-0 bg-[#03040a] pb-2">Tumor Measurements</p>
          {CANCER_FEATURES.map((f) => (
            <div key={f.key} className="space-y-1">
              <div className="flex justify-between"><span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">{f.label}</span><span className="font-mono text-[10px] text-white/60">{features[f.key]?.toFixed(4)} {f.unit}</span></div>
              <input type="range" min={f.min} max={f.max} step={f.step} value={features[f.key] ?? f.min} onChange={(e) => { setFeatures((p) => ({ ...p, [f.key]: parseFloat(e.target.value) })); setResult(null); }} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00f5ff]" />
              <div className="flex justify-between"><span className="font-mono text-[9px] text-white/15">{f.min}</span><span className="font-mono text-[9px] text-white/15">{f.max}</span></div>
            </div>
          ))}
          <motion.button onClick={handlePredict} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3 rounded-xl font-mono text-sm tracking-widest uppercase disabled:opacity-40 mt-4 sticky bottom-0" style={{ background: "#00f5ff", color: "#03040a" }}>{loading ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-4 h-4 border-2 border-[#03040a]/30 border-t-[#03040a] rounded-full" />Analyzing...</span> : "Run Detection →"}</motion.button>
        </div>
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {error && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass border border-red-500/20 rounded-xl px-4 py-3"><p className="font-mono text-xs text-red-400">{error}</p></motion.div>)}
            {result ? (
              <motion.div key="r" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="glass rounded-2xl overflow-hidden border" style={{ borderColor: result.is_malignant ? "rgba(236,72,153,0.3)" : "rgba(0,245,255,0.3)" }}>
                  <div className="px-6 py-6 text-center border-b" style={{ background: result.is_malignant ? "rgba(236,72,153,0.08)" : "rgba(0,245,255,0.08)", borderColor: result.is_malignant ? "rgba(236,72,153,0.3)" : "rgba(0,245,255,0.3)" }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-5xl mb-3">{result.is_malignant ? "🔴" : "🟢"}</motion.div>
                    <h3 className="font-display text-5xl tracking-wider mb-1" style={{ color: result.is_malignant ? "#ec4899" : "#00f5ff" }}>{result.prediction.toUpperCase()}</h3>
                    <p className="font-mono text-xs text-white/30 mt-1">{result.confidence.toFixed(1)}% confidence</p>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center justify-between glass border border-white/[0.04] rounded-xl px-4 py-3"><span className="font-mono text-xs text-white/30 uppercase tracking-widest">Risk Level</span><span className="font-display text-xl" style={{ color: rc }}>{result.risk_level}</span></div>
                    <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase">Probability Breakdown</p>
                    <ConfidenceBar label="Malignant" value={result.malignant_probability} color="#ec4899" />
                    <ConfidenceBar label="Benign" value={result.benign_probability} color="#00f5ff" />
                  </div>
                  <div className="px-6 pb-5"><div className="glass border border-white/[0.04] rounded-xl px-4 py-3"><p className="font-mono text-[10px] text-white/20 uppercase mb-1">Model Info</p><p className="font-body text-xs text-white/40">Voting Ensemble · Wisconsin Dataset · ~97-98% accuracy</p></div></div>
                </div>
                <div className="glass border border-white/[0.04] rounded-2xl p-6"><p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-4">Top 10 Important Features</p><div className="space-y-2">{result.top_features.map((f, i) => (<motion.div key={f.feature} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3"><span className="font-mono text-[9px] text-white/20 w-4">{i + 1}</span><span className="font-mono text-[10px] text-white/40 uppercase w-44 truncate">{f.feature.replace(/_/g, " ")}</span><div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden"><motion.div className="h-full rounded-full bg-[#8b5cf6]" initial={{ width: 0 }} animate={{ width: `${Math.min(f.importance * 5, 100)}%` }} transition={{ duration: 0.6, delay: i * 0.05 }} /></div><span className="font-mono text-[10px] text-white/30 w-12 text-right">{f.importance.toFixed(1)}%</span></motion.div>))}</div></div>
                <div className="glass border border-amber-500/20 rounded-xl px-4 py-3"><p className="font-mono text-[10px] text-amber-400/70 leading-relaxed">⚠️ DISCLAIMER: Portfolio demo only. Not for medical diagnosis. Always consult a physician.</p></div>
              </motion.div>
            ) : !loading ? (
              <motion.div key="p" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center text-center"><div className="text-5xl mb-4 opacity-20">🔬</div><p className="font-mono text-xs text-white/20 tracking-widest uppercase">Adjust sliders and run detection</p></motion.div>
            ) : (
              <motion.div key="l" className="glass border border-white/[0.04] rounded-2xl px-6 py-16 flex flex-col items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-[#00f5ff]/20 border-t-[#00f5ff] rounded-full mb-4" /><p className="font-mono text-xs text-white/30 tracking-widest uppercase">Running ensemble model...</p></motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Skin Cancer Tab ───────────────────────────────────────────────────────────

function SkinCancerTab({ serverStatus }: { serverStatus: string }) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<SkinResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image too large. Max 10MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageBase64(result);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handlePredict = async () => {
    if (!imageBase64) { setError("Please upload an image first."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
  const res = await fetch("https://anishreddy13-skin-cancer-api.hf.space/predict/skin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Prediction failed");
  }

  setResult(data);

} catch (e) {
  setError(
    e instanceof Error
      ? e.message
      : "Cannot connect to ML server."
  );
} finally {
  setLoading(false);
}

  const riskColors: Record<string, string> = { Low: "#00f5ff", Moderate: "#f59e0b", High: "#ec4899" };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — upload */}
        <div className="space-y-4">
          {/* Drop zone */}
          <motion.div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            animate={{ borderColor: isDragging ? "rgba(0,245,255,0.6)" : "rgba(255,255,255,0.06)" }}
            className="relative glass border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-[#00f5ff]/30"
            style={{ minHeight: "280px" }}
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />

            {imagePreview ? (
              <div className="relative w-full h-full">
                <img src={imagePreview} alt="Uploaded skin lesion" className="w-full h-72 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="font-mono text-xs text-white/60">Click to change image</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-72 p-6 text-center">
                <motion.div animate={{ y: isDragging ? -8 : 0 }} className="text-5xl mb-4 opacity-40">🔬</motion.div>
                <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-2">
                  {isDragging ? "Drop image here" : "Upload Skin Lesion Image"}
                </p>
                <p className="font-body text-xs text-white/20">Drag & drop or click to browse</p>
                <p className="font-body text-[10px] text-white/15 mt-2">JPG, PNG, WEBP · Max 10MB</p>
              </div>
            )}
          </motion.div>

          {/* Info cards */}
          <div className="glass border border-white/[0.04] rounded-2xl p-4">
            <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-3">What This Model Detects</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Melanoma", cancerous: true },
                { label: "Basal Cell Carcinoma", cancerous: true },
                { label: "Actinic Keratoses", cancerous: true },
                { label: "Melanocytic Nevi", cancerous: false },
                { label: "Benign Keratosis", cancerous: false },
                { label: "Dermatofibroma", cancerous: false },
                { label: "Vascular Lesion", cancerous: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${item.cancerous ? "bg-[#ec4899]" : "bg-[#00f5ff]"}`} />
                  <span className="font-body text-[10px] text-white/40">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <motion.button onClick={handlePredict} disabled={loading || !imageBase64} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-xl font-mono text-sm tracking-widest uppercase disabled:opacity-40"
              style={{ background: "#f59e0b", color: "#03040a" }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-4 h-4 border-2 border-[#03040a]/30 border-t-[#03040a] rounded-full" />
                  Analyzing...
                </span>
              ) : "Analyze Image →"}
            </motion.button>
            <motion.button onClick={() => { setImagePreview(null); setImageBase64(null); setResult(null); setError(null); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-xl glass border border-white/10 font-mono text-xs text-white/40 hover:text-white hover:border-white/30 transition-all duration-300">
              Clear
            </motion.button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass border border-red-500/20 rounded-xl px-4 py-3">
                <p className="font-mono text-xs text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — result */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Main result */}
                <div className="glass rounded-2xl overflow-hidden border" style={{ borderColor: result.is_cancerous ? "rgba(236,72,153,0.3)" : "rgba(0,245,255,0.3)" }}>
                  <div className="px-6 py-6 text-center border-b" style={{ background: result.is_cancerous ? "rgba(236,72,153,0.08)" : "rgba(0,245,255,0.08)", borderColor: result.is_cancerous ? "rgba(236,72,153,0.3)" : "rgba(0,245,255,0.3)" }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-5xl mb-3">
                      {result.is_cancerous ? "🔴" : "🟢"}
                    </motion.div>
                    <h3 className="font-display text-4xl tracking-wider mb-1" style={{ color: result.is_cancerous ? "#ec4899" : "#00f5ff" }}>
                      {result.prediction.toUpperCase()}
                    </h3>
                    <p className="font-body text-sm text-white/50 mt-1">{result.predicted_type}</p>
                    <p className="font-mono text-xs text-white/30 mt-1">{result.confidence.toFixed(1)}% confidence</p>
                  </div>

                  <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center justify-between glass border border-white/[0.04] rounded-xl px-4 py-3">
                      <span className="font-mono text-xs text-white/30 uppercase tracking-widest">Risk Level</span>
                      <span className="font-display text-xl" style={{ color: riskColors[result.risk_level] || "#00f5ff" }}>{result.risk_level}</span>
                    </div>
                    <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase">Cancer Probability</p>
                    <ConfidenceBar label="Cancerous" value={result.cancer_probability} color="#ec4899" />
                    <ConfidenceBar label="Non-Cancerous" value={result.benign_probability} color="#00f5ff" />
                  </div>
                </div>

                {/* Top 5 predictions */}
                <div className="glass border border-white/[0.04] rounded-2xl p-6">
                  <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-4">Top 5 Predictions</p>
                  <div className="space-y-3">
                    {result.top_5.map((item, i) => (
                      <motion.div key={item.class_code} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${item.is_cancerous ? "bg-[#ec4899]" : "bg-[#00f5ff]"}`} />
                        <span className="font-mono text-[10px] text-white/40 uppercase w-36 truncate">{item.class_name}</span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ backgroundColor: item.is_cancerous ? "#ec4899" : "#00f5ff" }}
                            initial={{ width: 0 }} animate={{ width: `${item.probability}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                        </div>
                        <span className="font-mono text-[10px] text-white/40 w-14 text-right">{item.probability.toFixed(1)}%</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Model info */}
                <div className="glass border border-white/[0.04] rounded-xl px-4 py-3">
                  <p className="font-mono text-[10px] text-white/20 uppercase mb-1">Model Info</p>
                  <p className="font-body text-xs text-white/40">ResNet18 Transfer Learning · HAM10000 Dataset (10,015 images) · 7 skin lesion classes</p>
                </div>

                {/* Disclaimer */}
                <div className="glass border border-amber-500/20 rounded-xl px-4 py-3">
                  <p className="font-mono text-[10px] text-amber-400/70 leading-relaxed">⚠️ DISCLAIMER: Portfolio demonstration only. Not for medical diagnosis. Always consult a qualified dermatologist.</p>
                </div>
              </motion.div>
            ) : !loading ? (
              <motion.div key="placeholder" className="glass border border-white/[0.04] rounded-2xl px-6 py-20 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4 opacity-20">🔬</div>
                <p className="font-mono text-xs text-white/20 tracking-widest uppercase mb-2">Upload an image to analyze</p>
                <p className="font-body text-xs text-white/15">ResNet18 CNN trained on 10,000+ dermoscopy images</p>
              </motion.div>
            ) : (
              <motion.div key="loading" className="glass border border-white/[0.04] rounded-2xl px-6 py-20 flex flex-col items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-2 border-[#f59e0b]/20 border-t-[#f59e0b] rounded-full mb-4" />
                <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-2">Analyzing image...</p>
                <p className="font-body text-[10px] text-white/20">Running through ResNet18 CNN</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MLPage() {
  const [activeTab, setActiveTab] = useState<TabType>("sentiment");
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    const check = async () => {
      try { const r = await fetch("https://portfolio-pkdj.onrender.com/health"); setServerStatus(r.ok ? "online" : "offline"); }
      catch { setServerStatus("offline"); }
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  const tabs = [
    { id: "sentiment" as TabType, label: "Sentiment",        icon: "🧠", color: "#00f5ff", desc: "Positive · Negative · Neutral" },
    { id: "spam"      as TabType, label: "Spam Detector",    icon: "🔍", color: "#ec4899", desc: "Spam · Not Spam" },
    { id: "emotion"   as TabType, label: "Emotion + Demo",   icon: "🎭", color: "#8b5cf6", desc: "28 Emotions · Gender · Age" },
    { id: "cancer"    as TabType, label: "Breast Cancer",    icon: "🔬", color: "#f59e0b", desc: "Malignant · Benign · Risk" },
    { id: "skin"      as TabType, label: "Skin Cancer",      icon: "🖼️", color: "#10b981", desc: "Image Upload · CNN Model" },
  ];

  return (
    <div className="relative min-h-screen bg-[#03040a] overflow-hidden">
      <NeuralCanvas />
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-transparent to-transparent pointer-events-none" />

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="fixed top-6 left-6 z-20">
        <Link href="/" className="flex items-center gap-2 font-mono text-xs tracking-widest text-white/30 hover:text-[#00f5ff] transition-colors duration-300 uppercase">
          <motion.span whileHover={{ x: -3 }}>←</motion.span>Back
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="fixed top-6 right-6 z-20 flex items-center gap-2 glass border border-white/[0.06] rounded-full px-4 py-2">
        <span className={`w-1.5 h-1.5 rounded-full ${serverStatus === "online" ? "bg-green-400 animate-pulse" : serverStatus === "offline" ? "bg-red-400" : "bg-yellow-400 animate-pulse"}`} />
        <span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">
          {serverStatus === "online" ? "ML Server Online" : serverStatus === "offline" ? "Start Python Server" : "Checking..."}
        </span>
      </motion.div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f5ff] animate-pulse" />
            <span className="font-mono text-xs tracking-[0.3em] text-[#00f5ff] uppercase">ML Laboratory — Live Demo</span>
            <span className="w-2 h-2 rounded-full bg-[#00f5ff] animate-pulse" />
          </div>
          <h1 className="font-display text-[clamp(3rem,10vw,8rem)] leading-none tracking-tight mb-4">
            <span className="gradient-text">ML</span><br />
            <span className="text-white/10 [-webkit-text-stroke:1px_rgba(255,255,255,0.15)]">LABORATORY</span>
          </h1>
          <p className="font-body text-white/40 max-w-xl mx-auto leading-relaxed">
            Five real ML models running locally — no external APIs, no cloud inference. Pure Python, scikit-learn & PyTorch, trained from scratch.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-10">
          {tabs.map((tab) => (
            <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="relative glass border rounded-2xl p-3 text-left transition-all duration-300"
              style={{ borderColor: activeTab === tab.id ? `${tab.color}40` : "rgba(255,255,255,0.05)", background: activeTab === tab.id ? `${tab.color}08` : "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-2 mb-1"><span className="text-lg">{tab.icon}</span><span className="font-mono text-[9px] tracking-widest uppercase hidden sm:block" style={{ color: activeTab === tab.id ? tab.color : "rgba(255,255,255,0.3)" }}>{tab.label}</span></div>
              <p className="font-body text-[9px] text-white/20 hidden sm:block">{tab.desc}</p>
              {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-px rounded-full" style={{ background: tab.color }} />}
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {activeTab === "sentiment" ? <SentimentTab serverStatus={serverStatus} /> :
             activeTab === "spam"      ? <SpamTab serverStatus={serverStatus} /> :
             activeTab === "emotion"   ? <EmotionTab serverStatus={serverStatus} /> :
             activeTab === "cancer"    ? <CancerTab serverStatus={serverStatus} /> :
             <SkinCancerTab serverStatus={serverStatus} />}
          </motion.div>
        </AnimatePresence>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-12 glass border border-white/[0.04] rounded-2xl p-6">
          <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-6">How All 5 Models Work</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Data",     desc: "Tweets, SMS, Reddit, Wisconsin clinical, HAM10000 dermoscopy images" },
              { step: "02", title: "Train",    desc: "scikit-learn pipelines + PyTorch ResNet18 CNN transfer learning" },
              { step: "03", title: "Serve",    desc: "FastAPI serves all 5 models simultaneously on port 8000" },
              { step: "04", title: "Predict",  desc: "Text analysis in milliseconds · Image CNN in under 1 second" },
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