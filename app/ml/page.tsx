"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Sentiment = "Positive" | "Negative" | "Neutral" | null;

interface PredictionResult {
  sentiment: Sentiment;
  confidence: number;
  scores: Record<string, number>;
  original_text: string;
}

interface HistoryItem extends PredictionResult {
  id: number;
  timestamp: string;
}

const sentimentConfig = {
  Positive: {
    color: "#00f5ff",
    bg: "rgba(0,245,255,0.08)",
    border: "rgba(0,245,255,0.3)",
    emoji: "😊",
    bar: "bg-[#00f5ff]",
  },
  Negative: {
    color: "#ec4899",
    bg: "rgba(236,72,153,0.08)",
    border: "rgba(236,72,153,0.3)",
    emoji: "😔",
    bar: "bg-[#ec4899]",
  },
  Neutral: {
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.3)",
    emoji: "😐",
    bar: "bg-[#8b5cf6]",
  },
};

const exampleTexts = [
  "I absolutely love this new feature, it's incredible!",
  "This is the worst service I have ever experienced.",
  "The meeting is scheduled for tomorrow at 3pm.",
  "Feeling so grateful and happy today!",
  "I'm really disappointed with the results.",
];

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

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 opacity-30 pointer-events-none"
    />
  );
}

function ConfidenceBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs text-white/40 uppercase tracking-wider">
          {label}
        </span>
        <span className="font-mono text-xs text-white/60">
          {value.toFixed(1)}%
        </span>
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

export default function MLPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [charCount, setCharCount] = useState(0);
  const [serverStatus, setServerStatus] = useState("checking");

  // Check if backend is running
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch("http://localhost:8000/health");
        if (res.ok) {
          setServerStatus("online");
        } else {
          setServerStatus("offline");
        }
      } catch {
        setServerStatus("offline");
      }
    };
    checkServer();
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setCharCount(e.target.value.length);
    setError(null);
  };

  const handlePredict = async () => {
    if (!text.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }
    if (text.length > 1000) {
      setError("Text too long. Max 1000 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Prediction failed");
      }

      const data: PredictionResult = await response.json();
      setResult(data);

      // Add to history
      setHistory((prev) => [
        {
          ...data,
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Cannot connect to ML server. Make sure the Python backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (example: string) => {
    setText(example);
    setCharCount(example.length);
    setResult(null);
    setError(null);
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setError(null);
    setCharCount(0);
  };

  const config = result?.sentiment
    ? sentimentConfig[result.sentiment]
    : null;

  return (
    <div className="relative min-h-screen bg-[#03040a] overflow-hidden">
      <NeuralCanvas />
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-transparent to-transparent pointer-events-none" />

      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-6 z-20"
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-xs tracking-widest text-white/30 hover:text-[#00f5ff] transition-colors duration-300 uppercase"
        >
          <motion.span whileHover={{ x: -3 }}>←</motion.span>
          Back
        </Link>
      </motion.div>

      {/* Server status */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 right-6 z-20 flex items-center gap-2 glass border border-white/[0.06] rounded-full px-4 py-2"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            serverStatus === "online"
              ? "bg-green-400 animate-pulse"
              : serverStatus === "offline"
              ? "bg-red-400"
              : "bg-yellow-400 animate-pulse"
          }`}
        />
        <span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">
          {serverStatus === "online"
            ? "ML Server Online"
            : serverStatus === "offline"
            ? "Start Python Server"
            : "Checking..."}
        </span>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f5ff] animate-pulse" />
            <span className="font-mono text-xs tracking-[0.3em] text-[#00f5ff] uppercase">
              ML Laboratory — Live Demo
            </span>
            <span className="w-2 h-2 rounded-full bg-[#00f5ff] animate-pulse" />
          </div>

          <h1 className="font-display text-[clamp(3rem,10vw,8rem)] leading-none tracking-tight mb-4">
            <span className="gradient-text">SENTIMENT</span>
            <br />
            <span className="text-white/10 [-webkit-text-stroke:1px_rgba(255,255,255,0.15)]">
              ANALYSIS
            </span>
          </h1>

          <p className="font-body text-white/40 max-w-xl mx-auto leading-relaxed">
            Real ML model trained on{" "}
            <span className="text-white/60">50,000+ tweets</span> using
            TF-IDF + Logistic Regression. No external APIs — runs entirely
            on a local Python server.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Input */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-4"
          >
            {/* Text input */}
            <div className="glass border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/[0.04]">
                <span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">
                  Input Text
                </span>
                <span
                  className={`font-mono text-[10px] ${
                    charCount > 900
                      ? "text-red-400"
                      : charCount > 700
                      ? "text-yellow-400"
                      : "text-white/20"
                  }`}
                >
                  {charCount}/1000
                </span>
              </div>

              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="Type or paste any text here to analyze its sentiment..."
                rows={7}
                maxLength={1000}
                className="w-full bg-transparent px-4 py-3 font-body text-white/70 text-sm placeholder:text-white/20 resize-none focus:outline-none leading-relaxed"
              />
            </div>

            {/* Example texts */}
            <div>
              <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-2">
                Try an example:
              </p>
              <div className="flex flex-col gap-2">
                {exampleTexts.map((example, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleExample(example)}
                    whileHover={{ x: 4 }}
                    className="text-left font-body text-xs text-white/30 hover:text-white/60 transition-colors duration-200 truncate"
                  >
                    → {example}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={handlePredict}
                disabled={loading || !text.trim()}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="flex-1 py-3 rounded-xl bg-[#00f5ff] text-[#03040a] font-mono text-sm tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="inline-block w-4 h-4 border-2 border-[#03040a]/30 border-t-[#03040a] rounded-full"
                    />
                    Analyzing...
                  </span>
                ) : (
                  "Analyze →"
                )}
              </motion.button>

              <motion.button
                onClick={handleClear}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-xl glass border border-white/10 font-mono text-xs text-white/40 hover:text-white hover:border-white/30 transition-all duration-300"
              >
                Clear
              </motion.button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass border border-red-500/20 rounded-xl px-4 py-3"
                >
                  <p className="font-mono text-xs text-red-400">{error}</p>
                  {serverStatus === "offline" && (
                    <p className="font-mono text-[10px] text-white/30 mt-2">
                      Run: cd ml-backend → python main.py
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right — Result */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="space-y-4"
          >
            {/* Result card */}
            <AnimatePresence mode="wait">
              {result && config ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="glass rounded-2xl overflow-hidden border"
                  style={{ borderColor: config.border }}
                >
                  {/* Sentiment header */}
                  <div
                    className="px-6 py-5 border-b"
                    style={{
                      background: config.bg,
                      borderColor: config.border,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-[10px] tracking-widest text-white/30 uppercase mb-1">
                          Detected Sentiment
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{config.emoji}</span>
                          <span
                            className="font-display text-4xl tracking-wider"
                            style={{ color: config.color }}
                          >
                            {result.sentiment}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] tracking-widest text-white/30 uppercase mb-1">
                          Confidence
                        </p>
                        <span
                          className="font-display text-4xl"
                          style={{ color: config.color }}
                        >
                          {result.confidence.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="px-6 py-5 space-y-4">
                    <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase">
                      Score Breakdown
                    </p>
                    {Object.entries(result.scores).map(([label, score]) => {
                      const labelMap: Record<string, string> = {
                        "0": "Negative",
                        "1": "Neutral",
                        "2": "Positive",
                      };
                      const displayLabel = labelMap[label] || label;
                      const sentColor =
                        displayLabel === "Positive"
                          ? "#00f5ff"
                          : displayLabel === "Negative"
                          ? "#ec4899"
                          : "#8b5cf6";
                      return (
                        <ConfidenceBar
                          key={label}
                          label={displayLabel}
                          value={score}
                          color={sentColor}
                        />
                      );
                    })}
                  </div>

                  {/* Model info */}
                  <div className="px-6 pb-5">
                    <div className="glass border border-white/[0.04] rounded-xl px-4 py-3">
                      <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-1">
                        Model Info
                      </p>
                      <p className="font-body text-xs text-white/40">
                        TF-IDF Vectorizer + Logistic Regression · Trained on
                        Tweet Eval dataset (50k+ samples)
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : !loading ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass border border-white/[0.04] rounded-2xl px-6 py-12 flex flex-col items-center justify-center text-center"
                >
                  <div className="text-4xl mb-4 opacity-30">🧠</div>
                  <p className="font-mono text-xs text-white/20 tracking-widest uppercase">
                    Result will appear here
                  </p>
                  <p className="font-body text-xs text-white/15 mt-2">
                    Type some text and click Analyze
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass border border-white/[0.04] rounded-2xl px-6 py-12 flex flex-col items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-10 h-10 border-2 border-[#00f5ff]/20 border-t-[#00f5ff] rounded-full mb-4"
                  />
                  <p className="font-mono text-xs text-white/30 tracking-widest uppercase">
                    Running inference...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* History */}
            {history.length > 0 && (
              <div>
                <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-3">
                  Recent Analyses
                </p>
                <div className="space-y-2">
                  {history.map((item) => {
                    const cfg = item.sentiment
                      ? sentimentConfig[item.sentiment]
                      : null;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass border border-white/[0.04] rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                      >
                        <p className="font-body text-xs text-white/40 truncate flex-1">
                          {item.original_text.slice(0, 50)}...
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="font-mono text-xs font-medium"
                            style={{ color: cfg?.color }}
                          >
                            {item.sentiment}
                          </span>
                          <span className="font-mono text-[10px] text-white/20">
                            {item.confidence.toFixed(0)}%
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-12 glass border border-white/[0.04] rounded-2xl p-6"
        >
          <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-6">
            How It Works
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Data",
                desc: "50k+ tweets from HuggingFace datasets library",
              },
              {
                step: "02",
                title: "Preprocessing",
                desc: "NLTK stopword removal, lemmatization, cleaning",
              },
              {
                step: "03",
                title: "Vectorization",
                desc: "TF-IDF converts text to numerical features",
              },
              {
                step: "04",
                title: "Prediction",
                desc: "Logistic Regression classifies sentiment",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="font-display text-3xl gradient-text mb-2">
                  {item.step}
                </div>
                <h4 className="font-mono text-xs text-white/50 uppercase tracking-wider mb-1">
                  {item.title}
                </h4>
                <p className="font-body text-xs text-white/25 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}