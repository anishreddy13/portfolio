"use client";

import { trackActivity } from "../../lib/trackActivity";
import { fetchMlHealth, fetchMlJson, fetchSkinJson } from "../../lib/mlApi";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import InterviewAnalyzer from "../../src/components/InterviewAnalyzer";
import PlantDiseaseDetector from "../../src/components/PlantDiseaseDetector";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = "sentiment" | "spam" | "emotion" | "cancer" | "skin" | "plant" | "interview";

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
  Positive: { color: "#C8FF00", bg: "rgba(200,255,0,0.06)",  border: "rgba(200,255,0,0.25)",  emoji: "😊" },
  Negative: { color: "#FF2D2D", bg: "rgba(255,45,45,0.06)",  border: "rgba(255,45,45,0.25)",  emoji: "😔" },
  Neutral:  { color: "#A855F7", bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.25)", emoji: "😐" },
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

// ─── Neural Canvas ────────────────────────────────────────────────────────────

function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const nodes = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
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
          if (d < 130) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(255,45,45,${0.1 * (1 - d / 130)})`;
            ctx.lineWidth = 0.6; ctx.stroke();
          }
        });
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,45,45,0.4)"; ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    const onResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.25, zIndex: 0 }}
    />
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────

function ConfidenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between">
        <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </span>
        <span className="font-mono text-[0.6rem]" style={{ color: "var(--text-secondary)" }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
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

// ─── Shared Input Box ─────────────────────────────────────────────────────────

function InputBox({
  value, onChange, placeholder, rows = 7, maxLength = 1000, charCount,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows?: number;
  maxLength?: number;
  charCount: number;
}) {
  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{
        background:  "var(--surface-1)",
        border:      "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 pt-3 pb-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span
          className="font-mono text-[0.58rem] tracking-[0.25em] uppercase"
          style={{ color: "#FF2D2D" }}
        >
          Input
        </span>
        <span
          className="font-mono text-[0.58rem]"
          style={{ color: charCount > maxLength * 0.9 ? "#FF2D2D" : "var(--text-tertiary)" }}
        >
          {charCount}/{maxLength}
        </span>
      </div>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full bg-transparent px-4 py-3 font-body text-sm
                   placeholder:text-[#404040] resize-none focus:outline-none leading-relaxed"
        style={{ color: "var(--text-primary)" }}
      />
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionButton({
  onClick, disabled, loading, loadingText, text, color = "#FF2D2D",
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  loadingText: string;
  text: string;
  color?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className="flex-1 py-3 rounded-sm font-mono text-[0.7rem]
                 tracking-[0.2em] uppercase disabled:opacity-40 relative overflow-hidden"
      style={{ background: color, color: "#0A0A0A" }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block w-4 h-4 border-2 rounded-full"
            style={{ borderColor: "rgba(var(--color-overlay-base), 0.3)", borderTopColor: "#0A0A0A" }}
          />
          {loadingText}
        </span>
      ) : text}
    </motion.button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <motion.div
      key="empty"
      className="rounded-sm px-6 py-16 flex flex-col items-center justify-center text-center h-full"
      style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="text-4xl mb-4 opacity-20">{icon}</div>
      <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase" style={{ color: "var(--text-tertiary)" }}>
        {text}
      </p>
    </motion.div>
  );
}

function LoadingState({ color, text }: { color: string; text: string }) {
  return (
    <motion.div
      key="loading"
      className="rounded-sm px-6 py-16 flex flex-col items-center justify-center h-full"
      style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="w-10 h-10 border-2 rounded-full mb-4"
        style={{ borderColor: `${color}20`, borderTopColor: color }}
      />
      <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase" style={{ color: "var(--text-tertiary)" }}>
        {text}
      </p>
    </motion.div>
  );
}

// ─── Sentiment Tab ────────────────────────────────────────────────────────────

function SentimentTab({ serverStatus }: { serverStatus: string }) {
  const [text, setText]       = useState("");
  const [result, setResult]   = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [history, setHistory] = useState<SentimentHistoryItem[]>([]);
  const [charCount, setCharCount] = useState(0);

  const handlePredict = async () => {
    if (!text.trim()) { setError("Please enter some text."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await fetchMlJson<SentimentResult>("/predict", { text });
      setResult(data);
      setHistory((p) => [{ ...data, id: Date.now() }, ...p.slice(0, 4)]);
    } catch (e) { setError(e instanceof Error ? e.message : "Cannot connect."); }
    finally { setLoading(false); }
  };

  const cfg = result?.sentiment ? sentimentConfig[result.sentiment] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left */}
      <div className="space-y-3">
        <InputBox
          value={text} onChange={(e) => { setText(e.target.value); setCharCount(e.target.value.length); setError(null); }}
          placeholder="Type or paste any text to analyze sentiment..."
          charCount={charCount} maxLength={1000}
        />

        <div>
          <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-2" style={{ color: "var(--text-tertiary)" }}>
            — Examples
          </p>
          <div className="flex flex-col gap-1.5">
            {sentimentExamples.map((ex, i) => (
              <motion.button
                key={i}
                onClick={() => { setText(ex); setCharCount(ex.length); setResult(null); setError(null); }}
                whileHover={{ x: 4 }}
                className="text-left font-body text-xs truncate transition-colors duration-200"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--text-primary)")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-tertiary)")}
              >
                → {ex}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <ActionButton
            onClick={handlePredict} disabled={loading || !text.trim()}
            loading={loading} loadingText="Analyzing..." text="Analyze →"
            color="#FF2D2D"
          />
          <motion.button
            onClick={() => { setText(""); setResult(null); setError(null); setCharCount(0); }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="px-5 py-3 rounded-sm font-mono text-[0.62rem] uppercase tracking-widest transition-all duration-300"
            style={{ background: "var(--surface-2)", color: "var(--text-tertiary)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            Clear
          </motion.button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-sm px-4 py-3"
              style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)" }}
            >
              <p className="font-mono text-[0.62rem]" style={{ color: "#FF2D2D" }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {result && cfg ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="rounded-sm overflow-hidden"
              style={{ border: `1px solid ${cfg.border}`, background: "var(--surface-1)" }}
            >
              <div
                className="px-5 py-5 flex items-center justify-between"
                style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}
              >
                <div>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-2" style={{ color: "var(--text-tertiary)" }}>
                    Detected Sentiment
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{cfg.emoji}</span>
                    <span className="font-display text-4xl tracking-wider" style={{ color: cfg.color }}>
                      {result.sentiment}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-2" style={{ color: "var(--text-tertiary)" }}>
                    Confidence
                  </p>
                  <span className="font-display text-4xl" style={{ color: cfg.color }}>
                    {result.confidence.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-4" style={{ color: "var(--text-tertiary)" }}>
                  Score Breakdown
                </p>
                {Object.entries(result.scores).map(([l, s]) => (
                  <ConfidenceBar
                    key={l} label={l} value={s}
                    color={l === "Positive" ? "#C8FF00" : l === "Negative" ? "#FF2D2D" : "#A855F7"}
                  />
                ))}
              </div>
              <div className="px-5 pb-4">
                <div className="px-3 py-2 rounded-sm" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="font-mono text-[0.58rem] uppercase mb-0.5" style={{ color: "var(--text-tertiary)" }}>Model</p>
                  <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>TF-IDF + Logistic Regression · Tweet Eval (45k+ samples)</p>
                </div>
              </div>
            </motion.div>
          ) : loading ? (
            <LoadingState color="#FF2D2D" text="Running inference..." />
          ) : (
            <EmptyState icon="🧠" text="Result will appear here" />
          )}
        </AnimatePresence>

        {history.length > 0 && (
          <div>
            <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-2" style={{ color: "var(--text-tertiary)" }}>
              — Recent
            </p>
            <div className="space-y-1.5">
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  className="rounded-sm px-3 py-2 flex items-center justify-between gap-3"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <p className="font-body text-xs truncate flex-1" style={{ color: "var(--text-tertiary)" }}>
                    {item.original_text.slice(0, 45)}...
                  </p>
                  <span className="font-mono text-[0.6rem] shrink-0" style={{ color: sentimentConfig[item.sentiment]?.color }}>
                    {item.sentiment} · {item.confidence.toFixed(0)}%
                  </span>
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
  const [text, setText]       = useState("");
  const [result, setResult]   = useState<SpamResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [history, setHistory] = useState<SpamHistoryItem[]>([]);
  const [charCount, setCharCount] = useState(0);

  const handlePredict = async () => {
    if (!text.trim()) { setError("Please enter a message."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await fetchMlJson<SpamResult>("/predict/spam", { text });
      setResult(data);
      setHistory((p) => [{ ...data, id: Date.now() }, ...p.slice(0, 4)]);
    } catch (e) { setError(e instanceof Error ? e.message : "Cannot connect."); }
    finally { setLoading(false); }
  };

  const rc = result?.is_spam ? "#FF2D2D" : "#C8FF00";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <InputBox
          value={text}
          onChange={(e) => { setText(e.target.value); setCharCount(e.target.value.length); setError(null); }}
          placeholder="Paste any SMS, email, or message to check..."
          charCount={charCount} maxLength={2000}
        />
        <div>
          <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-2" style={{ color: "var(--text-tertiary)" }}>— Examples</p>
          <div className="flex flex-col gap-1.5">
            {spamExamples.map((ex, i) => (
              <motion.button key={i}
                onClick={() => { setText(ex); setCharCount(ex.length); setResult(null); setError(null); }}
                whileHover={{ x: 4 }}
                className="text-left font-body text-xs truncate transition-colors duration-200"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--text-primary)")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-tertiary)")}
              >→ {ex}</motion.button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <ActionButton onClick={handlePredict} disabled={loading || !text.trim()}
            loading={loading} loadingText="Checking..." text="Check Spam →" color="#FF2D2D" />
          <motion.button onClick={() => { setText(""); setResult(null); setError(null); setCharCount(0); }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="px-5 py-3 rounded-sm font-mono text-[0.62rem] uppercase tracking-widest"
            style={{ background: "var(--surface-2)", color: "var(--text-tertiary)", border: "1px solid rgba(255,255,255,0.06)" }}>
            Clear
          </motion.button>
        </div>
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-sm px-4 py-3"
              style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)" }}>
              <p className="font-mono text-[0.62rem]" style={{ color: "#FF2D2D" }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="r" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="rounded-sm overflow-hidden"
              style={{ border: `1px solid ${result.is_spam ? "rgba(255,45,45,0.3)" : "rgba(200,255,0,0.25)"}`, background: "var(--surface-1)" }}>
              <div className="px-5 py-5 flex items-center justify-between"
                style={{ background: result.is_spam ? "rgba(255,45,45,0.06)" : "rgba(200,255,0,0.05)", borderBottom: `1px solid ${result.is_spam ? "rgba(255,45,45,0.2)" : "rgba(200,255,0,0.2)"}` }}>
                <div>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-2" style={{ color: "var(--text-tertiary)" }}>Detection Result</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{result.is_spam ? "🚨" : "✅"}</span>
                    <span className="font-display text-4xl tracking-wider" style={{ color: rc }}>{result.label}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-2" style={{ color: "var(--text-tertiary)" }}>Confidence</p>
                  <span className="font-display text-4xl" style={{ color: rc }}>{result.confidence.toFixed(1)}%</span>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-4" style={{ color: "var(--text-tertiary)" }}>Scores</p>
                {Object.entries(result.scores).map(([l, s]) => (
                  <ConfidenceBar key={l} label={l} value={s} color={l === "Spam" ? "#FF2D2D" : "#C8FF00"} />
                ))}
              </div>
              {result.spam_keywords_found.length > 0 && (
                <div className="px-5 pb-4">
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-3" style={{ color: "var(--text-tertiary)" }}>Spam Triggers</p>
                  <div className="flex flex-wrap gap-2">
                    {result.spam_keywords_found.map((kw) => (
                      <span key={kw} className="font-mono text-[0.58rem] uppercase px-2.5 py-1 rounded-sm"
                        style={{ color: "#FF2D2D", border: "1px solid rgba(255,45,45,0.3)", background: "rgba(255,45,45,0.08)" }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="px-5 pb-4">
                <div className="px-3 py-2 rounded-sm" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="font-mono text-[0.58rem] uppercase mb-0.5" style={{ color: "var(--text-tertiary)" }}>Model</p>
                  <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>TF-IDF + Naive Bayes · SMS Spam Collection · ~97% accuracy</p>
                </div>
              </div>
            </motion.div>
          ) : loading ? (
            <LoadingState color="#FF2D2D" text="Scanning message..." />
          ) : (
            <EmptyState icon="🔍" text="Result will appear here" />
          )}
        </AnimatePresence>
        {history.length > 0 && (
          <div>
            <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-2" style={{ color: "var(--text-tertiary)" }}>— Recent</p>
            <div className="space-y-1.5">
              {history.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  className="rounded-sm px-3 py-2 flex items-center justify-between gap-3"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="font-body text-xs truncate flex-1" style={{ color: "var(--text-tertiary)" }}>{item.original_text.slice(0, 45)}...</p>
                  <span className="font-mono text-[0.6rem] shrink-0" style={{ color: item.is_spam ? "#FF2D2D" : "#C8FF00" }}>
                    {item.label} · {item.confidence.toFixed(0)}%
                  </span>
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
  const [text, setText]       = useState("");
  const [result, setResult]   = useState<EmotionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const handlePredict = async () => {
    if (!text.trim()) { setError("Please enter some text."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      setResult(await fetchMlJson<EmotionResult>("/predict/emotion", { text }));
    } catch (e) { setError(e instanceof Error ? e.message : "Cannot connect."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <InputBox value={text}
            onChange={(e) => { setText(e.target.value); setCharCount(e.target.value.length); setError(null); }}
            placeholder="Describe how you feel..." charCount={charCount} maxLength={1000} />
          <div>
            <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-2" style={{ color: "var(--text-tertiary)" }}>— Examples</p>
            <div className="flex flex-col gap-1.5">
              {emotionExamples.map((ex, i) => (
                <motion.button key={i}
                  onClick={() => { setText(ex); setCharCount(ex.length); setResult(null); setError(null); }}
                  whileHover={{ x: 4 }}
                  className="text-left font-body text-xs truncate transition-colors duration-200"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-tertiary)")}
                >→ {ex}</motion.button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <ActionButton onClick={handlePredict} disabled={loading || !text.trim()}
              loading={loading} loadingText="Analyzing..." text="Detect Emotion →" color="#A855F7" />
            <motion.button onClick={() => { setText(""); setResult(null); setError(null); setCharCount(0); }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="px-5 py-3 rounded-sm font-mono text-[0.62rem] uppercase tracking-widest"
              style={{ background: "var(--surface-2)", color: "var(--text-tertiary)", border: "1px solid rgba(255,255,255,0.06)" }}>
              Clear
            </motion.button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-sm px-4 py-3"
                style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)" }}>
                <p className="font-mono text-[0.62rem]" style={{ color: "#FF2D2D" }}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="r" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="rounded-sm overflow-hidden h-full"
                style={{ border: `1px solid ${result.emotion_color}40`, background: "var(--surface-1)" }}>
                <div className="px-5 py-6 text-center"
                  style={{ background: `${result.emotion_color}08`, borderBottom: `1px solid ${result.emotion_color}25` }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    className="text-5xl mb-3">{result.emotion_emoji}</motion.div>
                  <h3 className="font-display text-4xl tracking-wider mb-1" style={{ color: result.emotion_color }}>
                    {result.primary_emotion.toUpperCase()}
                  </h3>
                  <p className="font-mono text-[0.6rem]" style={{ color: "var(--text-tertiary)" }}>
                    {result.emotion_confidence.toFixed(1)}% confidence
                  </p>
                </div>
                <div className="grid grid-cols-2 divide-x" style={{ borderColor: "var(--border-soft)" }}>
                  <div className="px-4 py-4 text-center">
                    <div className="text-2xl mb-1">{GENDER_EMOJIS[result.gender] || "👤"}</div>
                    <p className="font-mono text-[0.55rem] uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Gender</p>
                    <p className="font-body text-sm font-medium" style={{ color: "var(--text-primary)" }}>{result.gender}</p>
                    <p className="font-mono text-[0.55rem] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{result.gender_confidence.toFixed(1)}%</p>
                  </div>
                  <div className="px-4 py-4 text-center">
                    <div className="text-2xl mb-1">{AGE_EMOJIS[result.age_group] || "🧑"}</div>
                    <p className="font-mono text-[0.55rem] uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Age Group</p>
                    <p className="font-body text-sm font-medium" style={{ color: "var(--text-primary)" }}>{result.age_group}</p>
                    <p className="font-mono text-[0.55rem] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{result.age_confidence.toFixed(1)}%</p>
                  </div>
                </div>
              </motion.div>
            ) : loading ? (
              <LoadingState color="#A855F7" text="Analyzing emotions..." />
            ) : (
              <EmptyState icon="🎭" text="Emotion result will appear here" />
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-sm p-5"
            style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5" style={{ color: "var(--text-tertiary)" }}>
              Top 5 Emotions
            </p>
            <div className="space-y-3 mb-5">
              {result.top_emotions.map((item, i) => (
                <motion.div key={item.emotion} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{item.emoji}</span>
                  <span className="font-mono text-[0.58rem] uppercase w-24 tracking-wider" style={{ color: "var(--text-tertiary)" }}>{item.emotion}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }} animate={{ width: `${item.score}%` }}
                      transition={{ duration: 0.7, delay: i * 0.08 }} />
                  </div>
                  <span className="font-mono text-[0.58rem] w-12 text-right" style={{ color: "var(--text-secondary)" }}>{item.score.toFixed(1)}%</span>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <p className="font-mono text-[0.58rem] uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>Gender Scores</p>
                {Object.entries(result.gender_scores).map(([l, s]) => (
                  <ConfidenceBar key={l} label={l} value={s} color={l === "Female" || l === "female" ? "#FF6B35" : "#A855F7"} />
                ))}
              </div>
              <div>
                <p className="font-mono text-[0.58rem] uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>Age Scores</p>
                {Object.entries(result.age_scores).map(([l, s]) => (
                  <ConfidenceBar key={l} label={l} value={s} color="#C8FF00" />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Cancer Tab ───────────────────────────────────────────────────────────────

function CancerTab({ serverStatus }: { serverStatus: string }) {
  const [features, setFeatures] = useState<Record<string, number>>(BENIGN_SAMPLE);
  const [result, setResult]     = useState<CancerResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const riskColors: Record<string, string> = { Low: "#C8FF00", Moderate: "#FF6B35", High: "#FF2D2D" };

  const handlePredict = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      setResult(await fetchMlJson<CancerResult>("/predict/cancer", { features }));
    } catch (e) { setError(e instanceof Error ? e.message : "Cannot connect."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase w-full" style={{ color: "var(--text-tertiary)" }}>
          — Load Sample Preset
        </p>
        {[
          { label: "🔴 Malignant Sample", data: MALIGNANT_SAMPLE, color: "#FF2D2D", border: "rgba(255,45,45,0.3)", bg: "rgba(255,45,45,0.08)" },
          { label: "🟢 Benign Sample",    data: BENIGN_SAMPLE,    color: "#C8FF00", border: "rgba(200,255,0,0.25)",  bg: "rgba(200,255,0,0.06)"  },
        ].map((s) => (
          <motion.button key={s.label}
            onClick={() => { setFeatures(s.data); setResult(null); }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-4 py-2 rounded-sm font-mono text-[0.62rem] uppercase tracking-widest"
            style={{ color: s.color, border: `1px solid ${s.border}`, background: s.bg }}>
            {s.label}
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-sm p-5 space-y-4 max-h-[580px] overflow-y-auto"
          style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase sticky top-0 pb-2"
            style={{ color: "#FF2D2D", background: "var(--surface-1)" }}>
            Tumor Measurements
          </p>
          {CANCER_FEATURES.map((f) => (
            <div key={f.key} className="space-y-1">
              <div className="flex justify-between">
                <span className="font-mono text-[0.58rem] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{f.label}</span>
                <span className="font-mono text-[0.58rem]" style={{ color: "var(--text-secondary)" }}>
                  {features[f.key]?.toFixed(4)} {f.unit}
                </span>
              </div>
              <input type="range" min={f.min} max={f.max} step={f.step}
                value={features[f.key] ?? f.min}
                onChange={(e) => { setFeatures((p) => ({ ...p, [f.key]: parseFloat(e.target.value) })); setResult(null); }}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: "var(--border)", accentColor: "#FF2D2D" }}
              />
              <div className="flex justify-between">
                <span className="font-mono text-[0.5rem]" style={{ color: "#404040" }}>{f.min}</span>
                <span className="font-mono text-[0.5rem]" style={{ color: "#404040" }}>{f.max}</span>
              </div>
            </div>
          ))}
          <ActionButton onClick={handlePredict} disabled={loading}
            loading={loading} loadingText="Analyzing..." text="Run Detection →" color="#FF2D2D" />
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-sm px-4 py-3"
                style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)" }}>
                <p className="font-mono text-[0.62rem]" style={{ color: "#FF2D2D" }}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="r" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="space-y-3">
                <div className="rounded-sm overflow-hidden"
                  style={{ border: `1px solid ${result.is_malignant ? "rgba(255,45,45,0.3)" : "rgba(200,255,0,0.25)"}`, background: "var(--surface-1)" }}>
                  <div className="px-5 py-6 text-center"
                    style={{ background: result.is_malignant ? "rgba(255,45,45,0.06)" : "rgba(200,255,0,0.05)", borderBottom: `1px solid ${result.is_malignant ? "rgba(255,45,45,0.2)" : "rgba(200,255,0,0.2)"}` }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                      className="text-5xl mb-3">{result.is_malignant ? "🔴" : "🟢"}</motion.div>
                    <h3 className="font-display text-4xl tracking-wider mb-1"
                      style={{ color: result.is_malignant ? "#FF2D2D" : "#C8FF00" }}>
                      {result.prediction.toUpperCase()}
                    </h3>
                    <p className="font-mono text-[0.6rem]" style={{ color: "var(--text-tertiary)" }}>{result.confidence.toFixed(1)}% confidence</p>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between rounded-sm px-3 py-2"
                      style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <span className="font-mono text-[0.6rem] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Risk Level</span>
                      <span className="font-display text-xl" style={{ color: riskColors[result.risk_level] || "#C8FF00" }}>
                        {result.risk_level}
                      </span>
                    </div>
                    <ConfidenceBar label="Malignant" value={result.malignant_probability} color="#FF2D2D" />
                    <ConfidenceBar label="Benign"    value={result.benign_probability}    color="#C8FF00" />
                  </div>
                </div>
                <div className="rounded-sm p-4"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-3" style={{ color: "var(--text-tertiary)" }}>Top Features</p>
                  <div className="space-y-2">
                    {result.top_features.map((f, i) => (
                      <motion.div key={f.feature} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }} className="flex items-center gap-2">
                        <span className="font-mono text-[0.5rem] w-4" style={{ color: "#FF2D2D" }}>{i + 1}</span>
                        <span className="font-mono text-[0.58rem] uppercase w-40 truncate" style={{ color: "var(--text-tertiary)" }}>
                          {f.feature.replace(/_/g, " ")}
                        </span>
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <motion.div className="h-full rounded-full" style={{ background: "#A855F7" }}
                            initial={{ width: 0 }} animate={{ width: `${Math.min(f.importance * 5, 100)}%` }}
                            transition={{ duration: 0.5, delay: i * 0.04 }} />
                        </div>
                        <span className="font-mono text-[0.58rem] w-10 text-right" style={{ color: "var(--text-secondary)" }}>
                          {f.importance.toFixed(1)}%
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="rounded-sm px-4 py-3"
                  style={{ background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.2)" }}>
                  <p className="font-mono text-[0.58rem] leading-relaxed" style={{ color: "#FF6B35" }}>
                    ⚠️ Demo only. Not for medical diagnosis. Consult a physician.
                  </p>
                </div>
              </motion.div>
            ) : loading ? (
              <LoadingState color="#FF2D2D" text="Running ensemble model..." />
            ) : (
              <EmptyState icon="🔬" text="Adjust sliders and run detection" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Skin Cancer Tab ──────────────────────────────────────────────────────────

function SkinCancerTab({ serverStatus }: { serverStatus: string }) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64]   = useState<string | null>(null);
  const [result, setResult]             = useState<SkinResult | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const riskColors: Record<string, string> = { Low: "#C8FF00", Moderate: "#FF6B35", High: "#FF2D2D" };

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 10 * 1024 * 1024)   { setError("Image too large. Max 10MB.");    return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result as string;
      setImagePreview(res); setImageBase64(res);
      setResult(null); setError(null);
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
      const data = await fetchSkinJson<SkinResult>("/predict/skin", { image: imageBase64 });
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Cannot connect to ML server."); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        {/* Drop zone */}
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative rounded-sm overflow-hidden cursor-pointer"
          style={{
            minHeight: "260px",
            background:  "var(--surface-1)",
            border:      `1px dashed ${isDragging ? "rgba(255,45,45,0.6)" : "var(--border)"}`,
            transition:  "border-color 0.3s ease",
          }}
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
          {imagePreview ? (
            <div className="relative w-full h-full">
              <img src={imagePreview} alt="Skin lesion" className="w-full h-64 object-cover" />
              <div className="absolute inset-0 flex items-end p-3"
                style={{ background: "linear-gradient(to top, rgba(var(--color-overlay-base), 0.8), transparent)" }}>
                <p className="font-mono text-[0.6rem] tracking-widest uppercase" style={{ color: "var(--text-secondary)" }}>
                  Click to change image
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
              <motion.div animate={{ y: isDragging ? -8 : 0 }} className="text-4xl mb-3 opacity-30">🔬</motion.div>
              <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase mb-1" style={{ color: isDragging ? "#FF2D2D" : "var(--text-tertiary)" }}>
                {isDragging ? "Drop image here" : "Upload Skin Lesion Image"}
              </p>
              <p className="font-body text-xs" style={{ color: "#404040" }}>Drag & drop or click · JPG, PNG · Max 10MB</p>
            </div>
          )}
        </motion.div>

        {/* What it detects */}
        <div className="rounded-sm p-4" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-3" style={{ color: "var(--text-tertiary)" }}>
            Detectable Conditions
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Melanoma",           cancerous: true  },
              { label: "Basal Cell Ca.",     cancerous: true  },
              { label: "Actinic Keratoses",  cancerous: true  },
              { label: "Melanocytic Nevi",   cancerous: false },
              { label: "Benign Keratosis",   cancerous: false },
              { label: "Dermatofibroma",     cancerous: false },
              { label: "Vascular Lesion",    cancerous: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: item.cancerous ? "#FF2D2D" : "#C8FF00" }} />
                <span className="font-body text-[0.68rem]" style={{ color: "var(--text-tertiary)" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <ActionButton onClick={handlePredict} disabled={loading || !imageBase64}
            loading={loading} loadingText="Analyzing..." text="Analyze Image →" color="#FF6B35" />
          <motion.button onClick={() => { setImagePreview(null); setImageBase64(null); setResult(null); setError(null); }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="px-5 py-3 rounded-sm font-mono text-[0.62rem] uppercase tracking-widest"
            style={{ background: "var(--surface-2)", color: "var(--text-tertiary)", border: "1px solid rgba(255,255,255,0.06)" }}>
            Clear
          </motion.button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-sm px-4 py-3"
              style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)" }}>
              <p className="font-mono text-[0.62rem]" style={{ color: "#FF2D2D" }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="r" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="space-y-3">
              <div className="rounded-sm overflow-hidden"
                style={{ border: `1px solid ${result.is_cancerous ? "rgba(255,45,45,0.3)" : "rgba(200,255,0,0.25)"}`, background: "var(--surface-1)" }}>
                <div className="px-5 py-5 text-center"
                  style={{ background: result.is_cancerous ? "rgba(255,45,45,0.06)" : "rgba(200,255,0,0.05)", borderBottom: `1px solid ${result.is_cancerous ? "rgba(255,45,45,0.2)" : "rgba(200,255,0,0.2)"}` }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                    className="text-4xl mb-3">{result.is_cancerous ? "🔴" : "🟢"}</motion.div>
                  <h3 className="font-display text-3xl tracking-wider mb-1"
                    style={{ color: result.is_cancerous ? "#FF2D2D" : "#C8FF00" }}>
                    {result.prediction.toUpperCase()}
                  </h3>
                  <p className="font-body text-sm mb-1" style={{ color: "var(--text-secondary)" }}>{result.predicted_type}</p>
                  <p className="font-mono text-[0.6rem]" style={{ color: "var(--text-tertiary)" }}>{result.confidence.toFixed(1)}% confidence</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between rounded-sm px-3 py-2"
                    style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="font-mono text-[0.6rem] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Risk Level</span>
                    <span className="font-display text-xl" style={{ color: riskColors[result.risk_level] || "#C8FF00" }}>{result.risk_level}</span>
                  </div>
                  <ConfidenceBar label="Cancerous"     value={result.cancer_probability}  color="#FF2D2D" />
                  <ConfidenceBar label="Non-Cancerous" value={result.benign_probability}   color="#C8FF00" />
                </div>
              </div>

              <div className="rounded-sm p-4" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-3" style={{ color: "var(--text-tertiary)" }}>Top 5 Predictions</p>
                <div className="space-y-2">
                  {result.top_5.map((item, i) => (
                    <motion.div key={item.class_code} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: item.is_cancerous ? "#FF2D2D" : "#C8FF00" }} />
                      <span className="font-mono text-[0.58rem] uppercase w-32 truncate" style={{ color: "var(--text-tertiary)" }}>{item.class_name}</span>
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <motion.div className="h-full rounded-full"
                          style={{ backgroundColor: item.is_cancerous ? "#FF2D2D" : "#C8FF00" }}
                          initial={{ width: 0 }} animate={{ width: `${item.probability}%` }}
                          transition={{ duration: 0.7, delay: i * 0.08 }} />
                      </div>
                      <span className="font-mono text-[0.58rem] w-12 text-right" style={{ color: "var(--text-secondary)" }}>
                        {item.probability.toFixed(1)}%
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-sm px-4 py-3"
                style={{ background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.2)" }}>
                <p className="font-mono text-[0.58rem] leading-relaxed" style={{ color: "#FF6B35" }}>
                  ⚠️ Demo only. Not for medical diagnosis. Consult a dermatologist.
                </p>
              </div>
            </motion.div>
          ) : loading ? (
            <LoadingState color="#FF6B35" text="Running ResNet18 CNN..." />
          ) : (
            <EmptyState icon="🖼️" text="Upload an image to analyze" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MLPage() {
  const [activeTab, setActiveTab]       = useState<TabType>("sentiment");
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    trackActivity("ml_page", "page_visit");
  }, []);

  useEffect(() => {
    const validTabs: TabType[] = ["sentiment", "spam", "emotion", "cancer", "skin", "plant", "interview"];
    const activateFromUrl = () => {
      const tab = new URLSearchParams(window.location.search).get("tab") as TabType | null;
      if (tab && validTabs.includes(tab)) setActiveTab(tab);
    };
    const handleTabChange = (event: Event) => {
      const tab = (event as CustomEvent<TabType>).detail;
      if (validTabs.includes(tab)) setActiveTab(tab);
    };

    activateFromUrl();
    window.addEventListener("popstate", activateFromUrl);
    window.addEventListener("ml-tab-change", handleTabChange);
    return () => {
      window.removeEventListener("popstate", activateFromUrl);
      window.removeEventListener("ml-tab-change", handleTabChange);
    };
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetchMlHealth();
        setServerStatus(r.ok ? "online" : "offline");
      } catch { setServerStatus("offline"); }
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  const tabs = [
    { id: "plant"     as TabType, label: "Plant AI",       icon: "🌿", color: "#C8FF00", desc: "New · Leaf CNN", featured: true },
    { id: "sentiment" as TabType, label: "Sentiment",      icon: "🧠", color: "#FF2D2D", desc: "Pos · Neg · Neutral"    },
    { id: "spam"      as TabType, label: "Spam",           icon: "🔍", color: "#FF6B35", desc: "Spam · Ham"             },
    { id: "emotion"   as TabType, label: "Emotion",        icon: "🎭", color: "#A855F7", desc: "28 Emotions · Demo"     },
    { id: "cancer"    as TabType, label: "Breast Cancer",  icon: "🔬", color: "#C8FF00", desc: "Malignant · Benign"     },
    { id: "skin"      as TabType, label: "Skin Cancer",    icon: "🖼️", color: "#FF6B35", desc: "Image Upload · CNN"     },
    { id: "interview" as TabType, label: "AI Interview",   icon: "🎤", color: "#FF2D2D", desc: "Live Speech"            },
  ];

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--surface-0)" }}
    >
      <NeuralCanvas />

      {/* Background accents */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(circle at top left, rgba(255,45,45,0.06) 0%, transparent 65%)" }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(circle at bottom right, rgba(200,255,0,0.04) 0%, transparent 65%)" }} />

      {/* Back button */}
      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
        className="fixed top-20 left-4 sm:left-5 z-30">
        <Link href="/"
          className="flex items-center gap-2 font-mono text-[0.58rem] sm:text-[0.62rem] tracking-[0.18em] sm:tracking-[0.2em] uppercase
                     px-2.5 sm:px-3 py-2 rounded-sm transition-all duration-200"
          style={{
            background:  "rgba(var(--color-overlay-base), 0.8)",
            border:      "1px solid rgba(255,255,255,0.08)",
            color:       "var(--text-tertiary)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#FF2D2D";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,45,45,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          }}
        >
          ← Back
        </Link>
      </motion.div>

      {/* Server status */}
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
        className="fixed top-20 right-4 sm:right-5 z-30 flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-sm"
        style={{ background: "rgba(var(--color-overlay-base), 0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <span className="w-1.5 h-1.5 rounded-full"
          style={{
            background: serverStatus === "online" ? "#C8FF00" : serverStatus === "offline" ? "#FF2D2D" : "#FF6B35",
            boxShadow:  serverStatus === "online" ? "0 0 6px #C8FF00" : "none",
            animation:  serverStatus !== "offline" ? "pulse 2s infinite" : "none",
          }} />
        <span className="font-mono text-[0.52rem] sm:text-[0.58rem] tracking-[0.16em] sm:tracking-[0.2em] uppercase" style={{ color: "var(--text-tertiary)" }}>
          {serverStatus === "online" ? "Server Online" : serverStatus === "offline" ? "Server Offline" : "Checking..."}
        </span>
      </motion.div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 pt-36 sm:pt-40 pb-24">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#FF2D2D", boxShadow: "0 0 8px #FF2D2D" }} />
            <span className="font-mono text-[0.62rem] tracking-[0.3em] uppercase" style={{ color: "#FF2D2D" }}>
              ML Laboratory — Live Demo
            </span>
          </div>
          <h1 className="font-display leading-none tracking-tight mb-4"
            style={{ fontSize: "clamp(3.5rem, 12vw, 9rem)" }}>
            <span
              style={{
                background: "linear-gradient(135deg, #FF2D2D 0%, #FF6B35 50%, #C8FF00 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ML
            </span>
            <br />
            <span style={{ color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.1)" }}>
              LABORATORY
            </span>
          </h1>
          <p className="font-body text-base max-w-xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Seven real ML models across text, speech, tabular, and vision workflows.{" "}
            <span style={{ color: "var(--text-primary)" }}>Python, scikit-learn, PyTorch & FastAPI.</span>
          </p>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 mb-8"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative rounded-sm p-3 text-left transition-all duration-200"
                style={{
                  background:   active ? `${tab.color}10` : tab.featured ? "rgba(200,255,0,0.045)" : "var(--surface-1)",
                  border:       `1px solid ${active ? `${tab.color}40` : tab.featured ? "rgba(200,255,0,0.18)" : "var(--border)"}`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{tab.icon}</span>
                  {tab.featured && (
                    <span
                      className="font-mono text-[0.42rem] uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
                      style={{ background: "rgba(200,255,0,0.1)", color: "#C8FF00", border: "1px solid rgba(200,255,0,0.2)" }}
                    >
                      New
                    </span>
                  )}
                </div>
                <p className="font-mono text-[0.58rem] tracking-wider uppercase leading-tight"
                  style={{ color: active ? tab.color : "var(--text-tertiary)" }}>
                  {tab.label}
                </p>
                <p className="font-body text-[0.55rem] mt-0.5 hidden sm:block" style={{ color: "#404040" }}>
                  {tab.desc}
                </p>
                {active && (
                  <motion.div layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-px rounded-full"
                    style={{ background: tab.color }} />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "sentiment" ? <SentimentTab serverStatus={serverStatus} /> :
             activeTab === "spam"      ? <SpamTab      serverStatus={serverStatus} /> :
             activeTab === "emotion"   ? <EmotionTab   serverStatus={serverStatus} /> :
             activeTab === "cancer"    ? <CancerTab    serverStatus={serverStatus} /> :
             activeTab === "skin"      ? <SkinCancerTab serverStatus={serverStatus} /> :
             activeTab === "plant"     ? <PlantDiseaseDetector /> :
             <InterviewAnalyzer />}
          </motion.div>
        </AnimatePresence>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 rounded-sm p-6"
          style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-6" style={{ color: "#FF2D2D" }}>
            — How It Works
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { step: "01", title: "Data",    desc: "Tweets, SMS, Reddit, clinical, HAM10000, and PlantVillage datasets" },
              { step: "02", title: "Train",   desc: "scikit-learn pipelines plus PyTorch transfer learning for vision" },
              { step: "03", title: "Serve",   desc: "FastAPI services with isolated Hugging Face Spaces deployments" },
              { step: "04", title: "Predict", desc: "Text, speech, tabular, skin, and plant inference demos" },
            ].map((item) => (
              <div key={item.step}>
                <div className="font-display text-2xl mb-2"
                  style={{
                    background: "linear-gradient(135deg, #FF2D2D, #FF6B35)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                  {item.step}
                </div>
                <h4 className="font-mono text-[0.62rem] uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
                  {item.title}
                </h4>
                <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
