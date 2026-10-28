"use client";

import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  fetchAuthorshipPrediction,
  fetchAuthorshipBenchmark,
  AuthorshipPredictionResponse,
  AuthorshipBenchmarkResponse,
} from "../../lib/mlApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Default research samples for quick exploration
const SAMPLES = [
  {
    name: "Human Academic Abstract",
    type: "human",
    desc: "Empirical machine learning research paper abstract (~115 words)",
    text: "In this study, we empirically investigate the generalization properties of overparameterized linear classifiers trained with stochastic gradient descent. We demonstrate that under isotropic Gaussian feature distributions, the implicit regularization of gradient descent minimizes the L2 norm of the parameter vector, preventing catastrophic overfitting even when the sample size is significantly smaller than the ambient dimension. Our theoretical bounds are corroborated by extensive synthetic and semi-synthetic benchmarks across various noise regimes.",
  },
  {
    name: "AI-Generated Explainer",
    type: "ai",
    desc: "Structured synthetic explanation with typical transition markers (~130 words)",
    text: "Artificial intelligence has fundamentally revolutionized modern computational science in several critical ways. Furthermore, machine-learning models now allow researchers to uncover intricate patterns within large-scale datasets that were previously inaccessible to classical statistical techniques. Additionally, neural network architectures offer unprecedented scalability when deployed across distributed cloud infrastructure. Consequently, organizations worldwide are actively integrating automated intelligence pipelines into their core workflows to enhance predictive accuracy and maximize operational efficiency.",
  },
  {
    name: "Short Snippet (OOD Length Warning)",
    type: "short",
    desc: "Under-length snippet (<50 words) to trigger out-of-distribution warning",
    text: "The quarterly revenue increased by 14% year-over-year, driven primarily by strong cloud infrastructure growth and improved operating margins across all major regional divisions.",
  },
];

// Fallback baseline benchmark metrics from Phase 1 execution
const DEFAULT_BENCHMARK_DATA = [
  { metric: "Accuracy", MNB: 82.01, LR: 89.85, SVM: 90.02 },
  { metric: "Precision (AI)", MNB: 80.77, LR: 90.15, SVM: 89.73 },
  { metric: "Recall (AI)", MNB: 84.12, LR: 89.53, SVM: 90.45 },
  { metric: "F1 Score (AI)", MNB: 82.41, LR: 89.84, SVM: 90.09 },
  { metric: "ROC-AUC", MNB: 90.87, LR: 96.63, SVM: 96.71 },
];

const FALLBACK_LENGTH_SLICES = [
  {
    sliceKey: "short (<400 words)",
    sample_count: 234,
    human_count: 182,
    ai_count: 52,
    models: {
      naive_bayes: { accuracy: 0.8077 },
      logistic_regression: { accuracy: 0.9359 },
      calibrated_svm: { accuracy: 0.9188 },
    },
  },
  {
    sliceKey: "medium (400-800 words)",
    sample_count: 1031,
    human_count: 609,
    ai_count: 422,
    models: {
      naive_bayes: { accuracy: 0.8012 },
      logistic_regression: { accuracy: 0.8594 },
      calibrated_svm: { accuracy: 0.8652 },
    },
  },
  {
    sliceKey: "long (>800 words)",
    sample_count: 469,
    human_count: 74,
    ai_count: 395,
    models: {
      naive_bayes: { accuracy: 0.8678 },
      logistic_regression: { accuracy: 0.9659 },
      calibrated_svm: { accuracy: 0.9680 },
    },
  },
];

const FALLBACK_PERTURBATIONS = [
  {
    name: "Whitespace Padding",
    desc: "Doubles inter-word spaces to test robustness to spacing artifacts.",
    lrAcc: "89.85%",
    lrDelta: "±0.00%",
    svmAcc: "90.02%",
    svmDelta: "±0.00%",
    mnbAcc: "82.01%",
    mnbDelta: "±0.00%",
  },
  {
    name: "Lowercase Normalization",
    desc: "Lowercases all characters to evaluate reliance on capitalized tokens.",
    lrAcc: "89.85%",
    lrDelta: "±0.00%",
    svmAcc: "90.02%",
    svmDelta: "±0.00%",
    mnbAcc: "82.01%",
    mnbDelta: "±0.00%",
  },
  {
    name: "Title Case Transform",
    desc: "Capitalizes every word to simulate unconventional casing variations.",
    lrAcc: "89.85%",
    lrDelta: "±0.00%",
    svmAcc: "90.02%",
    svmDelta: "±0.00%",
    mnbAcc: "82.01%",
    mnbDelta: "±0.00%",
  },
  {
    name: "Punctuation Removal",
    desc: "Strips all ASCII punctuation marks to measure syntax reliance.",
    lrAcc: "88.18%",
    lrDelta: "-1.67%",
    svmAcc: "87.95%",
    svmDelta: "-2.07%",
    mnbAcc: "81.14%",
    mnbDelta: "-0.87%",
  },
  {
    name: "Punctuation Doubling",
    desc: "Repeats commas, dots, and delimiters to simulate noisy syntax.",
    lrAcc: "89.62%",
    lrDelta: "-0.23%",
    svmAcc: "89.79%",
    svmDelta: "-0.23%",
    mnbAcc: "81.83%",
    mnbDelta: "-0.18%",
  },
];

interface AuthorshipLabProps {
  serverStatus?: "online" | "offline" | "checking";
}

export default function AuthorshipLab({ serverStatus = "online" }: AuthorshipLabProps) {
  const chartId = useId();
  const t = useTranslations("ML.authorship");

  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AuthorshipPredictionResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Benchmark states
  const [benchmarkData, setBenchmarkData] = useState<AuthorshipBenchmarkResponse | null>(null);
  const [, setBenchmarkLoading] = useState(true);
  const [activeBenchmarkTab, setActiveBenchmarkTab] = useState<
    "overview" | "matrices" | "length" | "perturbations" | "domains"
  >("overview");

  // Word and character count tracking
  const trimmed = inputText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = inputText.length;
  const minWordCount =
    benchmarkData?.benchmark_metadata?.dataset_provenance?.training_word_count_min ?? 266;
  const maxWordCount =
    benchmarkData?.benchmark_metadata?.dataset_provenance?.training_word_count_max ?? 5958;

  // Load benchmark data on mount
  useEffect(() => {
    let isMounted = true;
    async function loadBenchmark() {
      try {
        setBenchmarkLoading(true);
        const data = await fetchAuthorshipBenchmark();
        if (isMounted) setBenchmarkData(data);
      } catch (err) {
        console.warn("Could not load live benchmark JSON from server, falling back to bundled metrics:", err);
      } finally {
        if (isMounted) setBenchmarkLoading(false);
      }
    }
    loadBenchmark();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAnalyze = async () => {
    if (!trimmed) {
      setAnalysisError("Please provide English text to analyze.");
      return;
    }
    if (charCount > 40000) {
      setAnalysisError("Input text exceeds the 40,000 character maximum limit.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      const res = await fetchAuthorshipPrediction(inputText);
      setAnalysisResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Inference request failed";
      setAnalysisError(
        msg.includes("Failed to fetch") || msg.includes("timeout")
          ? "Backend request timed out. Render free tier may be waking up from sleep (~30s). Please retry."
          : msg
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSample = (sampleText: string) => {
    setInputText(sampleText);
    setAnalysisError(null);
  };

  const handleClear = () => {
    setInputText("");
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  // Dynamically computed chart data from benchmarkData when available
  const dynamicChartData = benchmarkData?.model_comparison
    ? [
        {
          metric: "Accuracy",
          MNB: +(benchmarkData.model_comparison.naive_bayes.accuracy * 100).toFixed(2),
          LR: +(benchmarkData.model_comparison.logistic_regression.accuracy * 100).toFixed(2),
          SVM: +(benchmarkData.model_comparison.calibrated_svm.accuracy * 100).toFixed(2),
        },
        {
          metric: "Precision (AI)",
          MNB: +(benchmarkData.model_comparison.naive_bayes.precision_ai * 100).toFixed(2),
          LR: +(benchmarkData.model_comparison.logistic_regression.precision_ai * 100).toFixed(2),
          SVM: +(benchmarkData.model_comparison.calibrated_svm.precision_ai * 100).toFixed(2),
        },
        {
          metric: "Recall (AI)",
          MNB: +(benchmarkData.model_comparison.naive_bayes.recall_ai * 100).toFixed(2),
          LR: +(benchmarkData.model_comparison.logistic_regression.recall_ai * 100).toFixed(2),
          SVM: +(benchmarkData.model_comparison.calibrated_svm.recall_ai * 100).toFixed(2),
        },
        {
          metric: "F1 Score (AI)",
          MNB: +(benchmarkData.model_comparison.naive_bayes.f1_ai * 100).toFixed(2),
          LR: +(benchmarkData.model_comparison.logistic_regression.f1_ai * 100).toFixed(2),
          SVM: +(benchmarkData.model_comparison.calibrated_svm.f1_ai * 100).toFixed(2),
        },
        {
          metric: "ROC-AUC",
          MNB: +(benchmarkData.model_comparison.naive_bayes.roc_auc * 100).toFixed(2),
          LR: +(benchmarkData.model_comparison.logistic_regression.roc_auc * 100).toFixed(2),
          SVM: +(benchmarkData.model_comparison.calibrated_svm.roc_auc * 100).toFixed(2),
        },
      ]
    : DEFAULT_BENCHMARK_DATA;

  // Dynamically computed confusion matrices
  const dynamicMatrices = benchmarkData?.model_comparison
    ? [
        {
          name: "Multinomial Naive Bayes",
          tn: benchmarkData.model_comparison.naive_bayes.confusion_matrix.tn,
          fp: benchmarkData.model_comparison.naive_bayes.confusion_matrix.fp,
          fn: benchmarkData.model_comparison.naive_bayes.confusion_matrix.fn,
          tp: benchmarkData.model_comparison.naive_bayes.confusion_matrix.tp,
          color: "#FF6B35",
        },
        {
          name: "Logistic Regression",
          tn: benchmarkData.model_comparison.logistic_regression.confusion_matrix.tn,
          fp: benchmarkData.model_comparison.logistic_regression.confusion_matrix.fp,
          fn: benchmarkData.model_comparison.logistic_regression.confusion_matrix.fn,
          tp: benchmarkData.model_comparison.logistic_regression.confusion_matrix.tp,
          color: "#C8FF00",
        },
        {
          name: "Calibrated Linear SVM",
          tn: benchmarkData.model_comparison.calibrated_svm.confusion_matrix.tn,
          fp: benchmarkData.model_comparison.calibrated_svm.confusion_matrix.fp,
          fn: benchmarkData.model_comparison.calibrated_svm.confusion_matrix.fn,
          tp: benchmarkData.model_comparison.calibrated_svm.confusion_matrix.tp,
          color: "#00F0FF",
        },
      ]
    : [
        { name: "Multinomial Naive Bayes", tn: 691, fp: 174, fn: 138, tp: 731, color: "#FF6B35" },
        { name: "Logistic Regression", tn: 780, fp: 85, fn: 91, tp: 778, color: "#C8FF00" },
        { name: "Calibrated Linear SVM", tn: 775, fp: 90, fn: 83, tp: 786, color: "#00F0FF" },
      ];

  return (
    <div className="space-y-12">
      {/* ─── SECTION 1: HEADER & RESEARCH QUESTION ──────────────────────────── */}
      <section
        className="relative rounded-sm p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, rgba(200,255,0,0.06), rgba(168,85,247,0.04), var(--surface-1))",
          border: "1px solid rgba(200,255,0,0.25)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[0.55rem] uppercase tracking-widest px-2 py-1 rounded-sm"
              style={{ background: "#C8FF00", color: "#0A0A0A" }}
            >
              Research Lab
            </span>
            <span className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "#C8FF00" }}>
              NLP & Classification Robustness
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: serverStatus === "online" ? "#C8FF00" : serverStatus === "offline" ? "#FF2D2D" : "#FF6B35",
              }}
            />
            <span className="font-mono text-[0.6rem] text-neutral-400">
              Backend Status: <strong className="text-white capitalize">{serverStatus}</strong>
            </span>
          </div>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl text-white mb-3">
          {t("title")}
        </h2>

        <p className="font-body text-sm sm:text-base leading-relaxed text-neutral-300 max-w-3xl mb-4">
          {t("research_question")}
        </p>

        {/* Dataset Attribution & Compact Disclaimer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 text-neutral-400 font-mono text-[0.65rem]">
            <span>Dataset:</span>
            <span className="text-white">AH&amp;AITD (Arslan&apos;s Human and AI Text Database)</span>
            <span className="text-neutral-500">·</span>
            <a
              href="https://doi.org/10.5281/zenodo.15506369"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C8FF00] hover:underline"
            >
              Zenodo CC BY 4.0 ↗
            </a>
          </div>

          <div
            className="px-2.5 py-1 rounded-sm font-mono text-[0.62rem]"
            style={{
              background: "rgba(255,107,53,0.1)",
              border: "1px solid rgba(255,107,53,0.3)",
              color: "#FF6B35",
            }}
          >
            ⚠️ {t("disclaimer")}
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: LIVE THREE-MODEL ANALYZER ───────────────────────────── */}
      <section
        className="rounded-sm p-6 sm:p-8"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-display text-xl sm:text-2xl text-white">
              {t("analyzer_title")}
            </h3>
            <p className="font-body text-xs sm:text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              Executes all 3 models (Naive Bayes, Logistic Regression, Calibrated Linear SVM) concurrently on one shared TF-IDF feature pipeline.
            </p>
          </div>

          {/* Sample Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.55rem] uppercase tracking-wider text-neutral-400">
              {t("load_sample")}:
            </span>
            {SAMPLES.map((sample, idx) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => handleLoadSample(sample.text)}
                className="font-mono text-[0.58rem] uppercase tracking-wider px-2 py-1 rounded-sm transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-secondary)",
                }}
                title={sample.desc}
              >
                Sample {idx + 1} ({sample.type})
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Area */}
        <div className="relative mb-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t("placeholder")}
            rows={7}
            className="w-full p-4 rounded-sm font-body text-sm leading-relaxed transition-all duration-200 resize-y focus:outline-none"
            style={{
              background: "var(--surface-0)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-primary)",
            }}
          />

          {/* Word / Char Counter */}
          <div className="flex items-center justify-between mt-2 font-mono text-[0.62rem]" style={{ color: "var(--text-tertiary)" }}>
            <div className="flex items-center gap-4">
              <span>{t("word_count")}: <strong className="text-white">{wordCount}</strong></span>
              <span>{t("char_count")}: <strong className="text-white">{charCount}</strong> / 40,000</span>
              {wordCount > 0 && wordCount < minWordCount && (
                <span className="text-amber-400 font-sans text-[0.7rem]">
                  ⚠️ Below observed training distribution (&lt;{minWordCount} words)
                </span>
              )}
              {wordCount > maxWordCount && (
                <span className="text-amber-400 font-sans text-[0.7rem]">
                  ⚠️ Exceeds observed training distribution (&gt;{maxWordCount.toLocaleString()} words)
                </span>
              )}
            </div>

            {inputText && (
              <button
                type="button"
                onClick={handleClear}
                className="hover:text-white transition-colors uppercase tracking-wider"
              >
                {t("clear")}
              </button>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !trimmed}
            className="font-mono text-xs uppercase tracking-widest px-6 py-3 rounded-sm transition-all duration-200 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "#C8FF00",
              color: "#0A0A0A",
              fontWeight: 600,
            }}
          >
            {isAnalyzing ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                {t("analyzing")}
              </>
            ) : (
              <>⚡ {t("analyze_btn")}</>
            )}
          </button>

          <span className="font-mono text-[0.6rem] text-neutral-400">
            Targeting ~4.2ms CPU inference per sample
          </span>
        </div>

        {/* Error Alert with Retry */}
        {analysisError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-sm flex items-start justify-between gap-4"
            style={{ background: "rgba(255,45,45,0.1)", border: "1px solid rgba(255,45,45,0.3)" }}
          >
            <div className="text-xs leading-relaxed text-red-200">
              <strong className="font-mono block uppercase text-red-400 text-[0.65rem] mb-1">
                Analysis Request Error
              </strong>
              {analysisError}
            </div>
            <button
              type="button"
              onClick={handleAnalyze}
              className="font-mono text-[0.62rem] uppercase tracking-wider px-3 py-1.5 rounded-sm bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-colors shrink-0"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Analysis Results Display */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mt-8 space-y-6 pt-6 border-t border-white/10"
            >
              {/* Length Warning Banner if applicable */}
              {analysisResult.length_warning && (
                <div
                  className="p-3.5 rounded-sm flex items-start gap-3"
                  style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}
                >
                  <span className="text-amber-400">ℹ️</span>
                  <div className="font-mono text-xs leading-relaxed text-amber-200">
                    <strong className="block text-amber-400 uppercase text-[0.62rem] mb-0.5">
                      Out-of-Distribution Length Notice
                    </strong>
                    {analysisResult.length_warning}
                  </div>
                </div>
              )}

              {/* Consensus Summary Banner */}
              <div
                className="p-4 sm:p-5 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{
                  background:
                    analysisResult.consensus.majority_vote_label === "AI-generated"
                      ? "linear-gradient(135deg, rgba(255,107,53,0.12), var(--surface-0))"
                      : "linear-gradient(135deg, rgba(200,255,0,0.10), var(--surface-0))",
                  border: `1px solid ${
                    analysisResult.consensus.majority_vote_label === "AI-generated"
                      ? "rgba(255,107,53,0.4)"
                      : "rgba(200,255,0,0.35)"
                  }`,
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="font-mono text-[0.55rem] uppercase tracking-widest px-2 py-0.5 rounded-sm font-semibold"
                      style={{
                        background:
                          analysisResult.consensus.majority_vote_label === "AI-generated"
                            ? "#FF6B35"
                            : "#C8FF00",
                        color: "#0A0A0A",
                      }}
                    >
                      {analysisResult.consensus.agreement === "unanimous" ? t("unanimous") : t("disagreement")}
                    </span>
                    <span className="font-mono text-[0.65rem] text-neutral-400 uppercase">
                      {t("consensus_title")}:
                    </span>
                  </div>
                  <h4 className="font-display text-2xl text-white">
                    {analysisResult.consensus.majority_vote_label}
                  </h4>
                  <p className="font-body text-xs text-neutral-300 mt-0.5">
                    Vote Split: {analysisResult.consensus.ai_votes} AI / {analysisResult.consensus.human_votes} Human.
                    Mean estimated AI likelihood:{" "}
                    <strong>{(analysisResult.consensus.mean_ai_probability * 100).toFixed(1)}%</strong>.
                  </p>
                </div>

                <div className="font-mono text-[0.6rem] text-neutral-400 sm:text-right">
                  <div>Input Length: {analysisResult.text_length_words} words ({analysisResult.text_length_chars} chars)</div>
                  <div>Model Version: v{analysisResult.model_version}</div>
                </div>
              </div>

              {/* Three Comparable Model Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(analysisResult.predictions).map(([key, model]) => {
                  const isAI = model.predicted_label === "AI-generated";
                  const primaryColor = isAI ? "#FF6B35" : "#C8FF00";
                  const aiPercent = (model.ai_probability * 100).toFixed(1);
                  const humanPercent = (model.human_probability * 100).toFixed(1);

                  return (
                    <div
                      key={key}
                      className="p-5 rounded-sm flex flex-col justify-between"
                      style={{
                        background: "var(--surface-0)",
                        border: `1px solid ${primaryColor}30`,
                      }}
                    >
                      <div>
                        {/* Model Title */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-[0.62rem] uppercase tracking-wider text-neutral-400">
                            {model.model_name}
                          </span>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: primaryColor }}
                          />
                        </div>

                        {/* Predicted Label */}
                        <div
                          className="font-display text-xl mb-1"
                          style={{ color: primaryColor }}
                        >
                          {model.predicted_label}
                        </div>

                        {/* Probability Progress Bar */}
                        <div className="space-y-1.5 mt-3 mb-4">
                          <div className="flex justify-between font-mono text-[0.62rem]">
                            <span className="text-neutral-400">AI Likelihood</span>
                            <span className="text-white font-semibold">{aiPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${aiPercent}%`,
                                background: primaryColor,
                              }}
                            />
                          </div>
                          <div className="flex justify-between font-mono text-[0.55rem] text-neutral-400">
                            <span>Human: {humanPercent}%</span>
                            <span>Conf: {(model.confidence * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Score Calibration Description */}
                      <div className="pt-3 border-t border-white/5 font-mono text-[0.58rem] text-neutral-400">
                        Score Type:{" "}
                        <span className="text-neutral-300">
                          {model.score_type === "platt_calibrated_probability"
                            ? "Platt-Calibrated SVM Probability"
                            : model.score_type === "logistic_sigmoid_probability"
                            ? "Logistic Sigmoid Probability"
                            : "Multinomial Posterior Probability"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Feature Attribution (Logistic Regression Coefficients) */}
              {analysisResult.explanations && analysisResult.explanations.length > 0 && (
                <div className="p-4 rounded-sm bg-black/30 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-neutral-300">
                      Top Salient N-Gram Signals (Logistic Regression Linear Projection)
                    </span>
                    <span className="font-mono text-[0.58rem] text-neutral-400">
                      Contribution = TF-IDF × Weight
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {analysisResult.explanations.map((exp) => (
                      <div
                        key={exp.feature}
                        className="p-2 rounded-sm border border-white/5 text-center"
                        style={{
                          background: exp.direction === "AI" ? "rgba(255,107,53,0.06)" : "rgba(200,255,0,0.06)",
                        }}
                      >
                        <div className="font-mono text-xs font-semibold text-white truncate" title={exp.feature}>
                          &quot;{exp.feature.replace(/^word_tfidf__|^char_tfidf__/, "")}&quot;
                        </div>
                        <div
                          className="font-mono text-[0.55rem] uppercase tracking-wider mt-1"
                          style={{ color: exp.direction === "AI" ? "#FF6B35" : "#C8FF00" }}
                        >
                          → {exp.direction} ({exp.contribution > 0 ? `+${exp.contribution}` : exp.contribution})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Limitations Notice */}
              <p className="font-mono text-[0.58rem] text-neutral-400 text-center">
                {analysisResult.limitations_disclaimer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ─── SECTION 3: RESEARCH BENCHMARK DASHBOARD ────────────────────────── */}
      <section
        className="rounded-sm p-6 sm:p-8"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-mono text-[0.55rem] uppercase tracking-widest px-2 py-0.5 rounded-sm"
                style={{ background: "rgba(168,85,247,0.15)", color: "#A855F7", border: "1px solid rgba(168,85,247,0.3)" }}
              >
                Empirical Evaluation
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                1,734 Held-Out Test Samples · AH&amp;AITD Dataset
              </span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl text-white">
              {t("benchmark_title")}
            </h3>
          </div>

          {/* Benchmark Sub-Navigation */}
          <div className="flex flex-wrap gap-1 p-1 rounded-sm bg-black/40 border border-white/5">
            {[
              { id: "overview", label: t("model_comparison") },
              { id: "matrices", label: t("matrices") },
              { id: "length", label: t("length_subgroups") },
              { id: "perturbations", label: t("perturbation_analysis") },
              { id: "domains", label: t("domain_slices") },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveBenchmarkTab(tab.id as typeof activeBenchmarkTab)}
                className="font-mono text-[0.58rem] uppercase tracking-wider px-2.5 py-1.5 rounded-sm transition-all"
                style={{
                  background: activeBenchmarkTab === tab.id ? "#C8FF00" : "transparent",
                  color: activeBenchmarkTab === tab.id ? "#0A0A0A" : "var(--text-tertiary)",
                  fontWeight: activeBenchmarkTab === tab.id ? 600 : 400,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: OVERVIEW & COMPARISON TABLE */}
        {activeBenchmarkTab === "overview" && (
          <div className="space-y-6">
            <p className="font-body text-xs text-neutral-300">
              {t("benchmark_desc")} Calibrated Linear SVM and Logistic Regression perform comparably (~90.0% vs ~89.8%), while Multinomial Naive Bayes provides an ultra-fast baseline (0.15s training).
            </p>

            {/* Recharts Comparison Chart */}
            <div className="h-64 sm:h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="metric" stroke="#888" tick={{ fontSize: 11 }} />
                  <YAxis domain={[75, 100]} stroke="#888" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid #333", fontSize: "12px" }}
                    formatter={(val) => [`${val}%`]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar id={`${chartId}-mnb`} dataKey="MNB" name="Naive Bayes (82.0%)" fill="#FF6B35" radius={[2, 2, 0, 0]} />
                  <Bar id={`${chartId}-lr`} dataKey="LR" name="Logistic Regression (89.8%)" fill="#C8FF00" radius={[2, 2, 0, 0]} />
                  <Bar id={`${chartId}-svm`} dataKey="SVM" name="Calibrated Linear SVM (90.0%)" fill="#00F0FF" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Full Metrics Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-neutral-400 text-[0.62rem] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Metric</th>
                    <th className="py-2.5 px-3 text-[#FF6B35]">Multinomial Naive Bayes</th>
                    <th className="py-2.5 px-3 text-[#C8FF00]">Logistic Regression</th>
                    <th className="py-2.5 px-3 text-[#00F0FF]">Calibrated Linear SVM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-neutral-200">
                  {(() => {
                    const mc = benchmarkData?.model_comparison;
                    const durations = benchmarkData?.benchmark_metadata?.training_durations_sec;
                    const testSplit = benchmarkData?.benchmark_metadata?.split_protocol?.test;

                    const mnbAcc = mc ? `${(mc.naive_bayes.accuracy * 100).toFixed(2)}% (${mc.naive_bayes.accuracy.toFixed(4)})` : "82.01% (0.8201)";
                    const lrAcc = mc ? `${(mc.logistic_regression.accuracy * 100).toFixed(2)}% (${mc.logistic_regression.accuracy.toFixed(4)})` : "89.85% (0.8985)";
                    const svmAcc = mc ? `${(mc.calibrated_svm.accuracy * 100).toFixed(2)}% (${mc.calibrated_svm.accuracy.toFixed(4)})` : "90.02% (0.9002)";

                    const mnbPrec = mc ? `${(mc.naive_bayes.precision_ai * 100).toFixed(2)}%` : "80.77%";
                    const lrPrec = mc ? `${(mc.logistic_regression.precision_ai * 100).toFixed(2)}%` : "90.15%";
                    const svmPrec = mc ? `${(mc.calibrated_svm.precision_ai * 100).toFixed(2)}%` : "89.73%";

                    const mnbRec = mc ? `${(mc.naive_bayes.recall_ai * 100).toFixed(2)}%` : "84.12%";
                    const lrRec = mc ? `${(mc.logistic_regression.recall_ai * 100).toFixed(2)}%` : "89.53%";
                    const svmRec = mc ? `${(mc.calibrated_svm.recall_ai * 100).toFixed(2)}%` : "90.45%";

                    const mnbF1 = mc ? `${(mc.naive_bayes.f1_ai * 100).toFixed(2)}%` : "82.41%";
                    const lrF1 = mc ? `${(mc.logistic_regression.f1_ai * 100).toFixed(2)}%` : "89.84%";
                    const svmF1 = mc ? `${(mc.calibrated_svm.f1_ai * 100).toFixed(2)}%` : "90.09%";

                    const mnbAuc = mc ? mc.naive_bayes.roc_auc.toFixed(4) : "0.9087";
                    const lrAuc = mc ? mc.logistic_regression.roc_auc.toFixed(4) : "0.9663";
                    const svmAuc = mc ? mc.calibrated_svm.roc_auc.toFixed(4) : "0.9671";

                    const mnbPr = mc ? mc.naive_bayes.pr_auc.toFixed(4) : "0.9100";
                    const lrPr = mc ? mc.logistic_regression.pr_auc.toFixed(4) : "0.9673";
                    const svmPr = mc ? mc.calibrated_svm.pr_auc.toFixed(4) : "0.9682";

                    const mnbBrier = mc ? mc.naive_bayes.brier_score.toFixed(4) : "0.1302";
                    const lrBrier = mc ? mc.logistic_regression.brier_score.toFixed(4) : "0.0801";
                    const svmBrier = mc ? mc.calibrated_svm.brier_score.toFixed(4) : "0.0720";

                    const mnbTime = durations ? `${durations.naive_bayes}s` : "0.149s";
                    const lrTime = durations ? `${durations.logistic_regression}s` : "3.427s";
                    const svmTime = durations ? `${durations.calibrated_svm}s` : "5.841s";

                    const supportText = testSplit
                      ? `${testSplit.samples.toLocaleString()} total held-out examples (${testSplit.human_0.toLocaleString()} Human, ${testSplit.ai_1.toLocaleString()} AI)`
                      : "1,734 total held-out examples (865 Human, 869 AI)";

                    return (
                      <>
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-white">Overall Accuracy</td>
                          <td className="py-2.5 px-3">{mnbAcc}</td>
                          <td className="py-2.5 px-3 font-bold">{lrAcc}</td>
                          <td className="py-2.5 px-3 font-bold text-[#00F0FF]">{svmAcc}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3">Precision (AI-generated)</td>
                          <td className="py-2.5 px-3">{mnbPrec}</td>
                          <td className="py-2.5 px-3 font-bold">{lrPrec}</td>
                          <td className="py-2.5 px-3">{svmPrec}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3">Recall (AI-generated)</td>
                          <td className="py-2.5 px-3">{mnbRec}</td>
                          <td className="py-2.5 px-3">{lrRec}</td>
                          <td className="py-2.5 px-3 font-bold text-[#00F0FF]">{svmRec}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3">F1 Score (AI-generated)</td>
                          <td className="py-2.5 px-3">{mnbF1}</td>
                          <td className="py-2.5 px-3">{lrF1}</td>
                          <td className="py-2.5 px-3 font-bold text-[#00F0FF]">{svmF1}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3">ROC-AUC Score</td>
                          <td className="py-2.5 px-3">{mnbAuc}</td>
                          <td className="py-2.5 px-3">{lrAuc}</td>
                          <td className="py-2.5 px-3 font-bold text-[#00F0FF]">{svmAuc}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3">PR-AUC (Avg Precision)</td>
                          <td className="py-2.5 px-3">{mnbPr}</td>
                          <td className="py-2.5 px-3">{lrPr}</td>
                          <td className="py-2.5 px-3 font-bold text-[#00F0FF]">{svmPr}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3">Brier Score (lower = better)</td>
                          <td className="py-2.5 px-3">{mnbBrier}</td>
                          <td className="py-2.5 px-3">{lrBrier}</td>
                          <td className="py-2.5 px-3 font-bold text-[#00F0FF]">{svmBrier}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3">Training Time</td>
                          <td className="py-2.5 px-3 font-bold text-[#FF6B35]">{mnbTime}</td>
                          <td className="py-2.5 px-3">{lrTime}</td>
                          <td className="py-2.5 px-3">{svmTime}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3">Test Support (Samples)</td>
                          <td className="py-2.5 px-3" colSpan={3}>{supportText}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CONFUSION MATRICES */}
        {activeBenchmarkTab === "matrices" && (
          <div className="space-y-6">
            <p className="font-body text-xs text-neutral-300">
              Evaluated on 1,734 held-out test texts (865 Human-written, 869 AI-generated).
              Linear SVM and Logistic Regression maintain balanced error distributions with False Positive rates of ~9.8% and ~10.4%, whereas Naive Bayes yields higher False Positives (20.1%).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dynamicMatrices.map((m) => (
                <div key={m.name} className="p-4 rounded-sm border border-white/10 bg-black/30">
                  <h5 className="font-mono text-xs uppercase tracking-wider mb-3 text-center" style={{ color: m.color }}>
                    {m.name}
                  </h5>

                  <div className="grid grid-cols-2 gap-2 text-center font-mono">
                    {(() => {
                      const humanTotal = m.tn + m.fp || 1;
                      const aiTotal = m.fn + m.tp || 1;
                      return (
                        <>
                          <div className="p-3 rounded-sm bg-green-500/10 border border-green-500/30">
                            <span className="text-[0.6rem] text-neutral-400 block uppercase">True Human</span>
                            <strong className="text-sm text-green-400">{m.tn}</strong>
                            <span className="text-[0.55rem] block text-neutral-400">{((m.tn / humanTotal) * 100).toFixed(1)}%</span>
                          </div>

                          <div className="p-3 rounded-sm bg-red-500/10 border border-red-500/30">
                            <span className="text-[0.6rem] text-neutral-400 block uppercase">False AI (FP)</span>
                            <strong className="text-sm text-red-400">{m.fp}</strong>
                            <span className="text-[0.55rem] block text-neutral-400">{((m.fp / humanTotal) * 100).toFixed(1)}%</span>
                          </div>

                          <div className="p-3 rounded-sm bg-amber-500/10 border border-amber-500/30">
                            <span className="text-[0.6rem] text-neutral-400 block uppercase">False Human (FN)</span>
                            <strong className="text-sm text-amber-400">{m.fn}</strong>
                            <span className="text-[0.55rem] block text-neutral-400">{((m.fn / aiTotal) * 100).toFixed(1)}%</span>
                          </div>

                          <div className="p-3 rounded-sm bg-cyan-500/10 border border-cyan-500/30">
                            <span className="text-[0.6rem] text-neutral-400 block uppercase">True AI (TP)</span>
                            <strong className="text-sm text-cyan-400">{m.tp}</strong>
                            <span className="text-[0.55rem] block text-neutral-400">{((m.tp / aiTotal) * 100).toFixed(1)}%</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TEXT LENGTH SUBGROUPS */}
        {activeBenchmarkTab === "length" && (
          <div className="space-y-4">
            <p className="font-body text-xs text-neutral-300">
              Texts stratified into three length bands as measured in benchmark_results.json. Natural source distributions vary by length in AH&amp;AITD (short samples contain mostly human QA/blog items, whereas long samples skew toward generated essays). Random stratified test evaluation on in-distribution data does not establish generalization to entirely unseen datasets or future AI generators:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-neutral-400 text-[0.62rem] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Length Band</th>
                    <th className="py-2.5 px-3">Samples (Human / AI)</th>
                    <th className="py-2.5 px-3">Naive Bayes Acc</th>
                    <th className="py-2.5 px-3">Logistic Reg Acc</th>
                    <th className="py-2.5 px-3">Calibrated SVM Acc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-neutral-200">
                  {benchmarkData?.subgroup_analysis?.text_length_slices
                    ? Object.entries(benchmarkData.subgroup_analysis.text_length_slices).map(([sliceKey, s]) => (
                        <tr key={sliceKey}>
                          <td className="py-2.5 px-3 font-semibold text-white capitalize">{sliceKey}</td>
                          <td className="py-2.5 px-3">{s.sample_count} ({s.human_count} Human / {s.ai_count} AI)</td>
                          <td className="py-2.5 px-3">{(s.models.naive_bayes.accuracy * 100).toFixed(2)}%</td>
                          <td className="py-2.5 px-3 font-bold text-[#C8FF00]">{(s.models.logistic_regression.accuracy * 100).toFixed(2)}%</td>
                          <td className="py-2.5 px-3 font-bold text-[#00F0FF]">{(s.models.calibrated_svm.accuracy * 100).toFixed(2)}%</td>
                        </tr>
                      ))
                    : FALLBACK_LENGTH_SLICES.map((s) => (
                        <tr key={s.sliceKey}>
                          <td className="py-2.5 px-3 font-semibold text-white capitalize">{s.sliceKey}</td>
                          <td className="py-2.5 px-3">{s.sample_count} ({s.human_count} Human / {s.ai_count} AI)</td>
                          <td className="py-2.5 px-3">{(s.models.naive_bayes.accuracy * 100).toFixed(2)}%</td>
                          <td className="py-2.5 px-3 font-bold text-[#C8FF00]">{(s.models.logistic_regression.accuracy * 100).toFixed(2)}%</td>
                          <td className="py-2.5 px-3 font-bold text-[#00F0FF]">{(s.models.calibrated_svm.accuracy * 100).toFixed(2)}%</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            <p className="font-mono text-[0.6rem] text-neutral-400 pt-2">
              *Observation: Classifier confidence and accuracy scale directly with text length due to increased n-gram coverage. Classifiers should not be treated as equally reliable on single-sentence excerpts. Stratified splits within AH&amp;AITD do not guarantee generalization to unseen external benchmarks.
            </p>
          </div>
        )}

        {/* TAB 4: PERTURBATION ROBUSTNESS */}
        {activeBenchmarkTab === "perturbations" && (
          <div className="space-y-4">
            <p className="font-body text-xs text-neutral-300">
              Evaluated on 1,734 test texts under five controlled transformations to measure sensitivity to formatting quirks, casing variants, and delimiter stripping:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-neutral-400 text-[0.62rem] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Perturbation Transform</th>
                    <th className="py-2.5 px-3">What It Simulates</th>
                    <th className="py-2.5 px-3">Logistic Reg Acc (Δ)</th>
                    <th className="py-2.5 px-3">Calibrated SVM Acc (Δ)</th>
                    <th className="py-2.5 px-3">Naive Bayes Acc (Δ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-neutral-200">
                  {benchmarkData?.perturbation_robustness_tests
                    ? Object.entries(benchmarkData.perturbation_robustness_tests).map(([key, p]) => (
                        <tr key={key}>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-400">{p.description}</td>
                          <td className="py-2.5 px-3 font-bold text-green-400">
                            {(p.models.logistic_regression.accuracy * 100).toFixed(2)}% (
                            {p.models.logistic_regression.accuracy_delta >= 0
                              ? `+${(p.models.logistic_regression.accuracy_delta * 100).toFixed(2)}`
                              : `${(p.models.logistic_regression.accuracy_delta * 100).toFixed(2)}`}
                            %)
                          </td>
                          <td className="py-2.5 px-3 font-bold text-green-400">
                            {(p.models.calibrated_svm.accuracy * 100).toFixed(2)}% (
                            {p.models.calibrated_svm.accuracy_delta >= 0
                              ? `+${(p.models.calibrated_svm.accuracy_delta * 100).toFixed(2)}`
                              : `${(p.models.calibrated_svm.accuracy_delta * 100).toFixed(2)}`}
                            %)
                          </td>
                          <td className="py-2.5 px-3">
                            {(p.models.naive_bayes.accuracy * 100).toFixed(2)}% (
                            {p.models.naive_bayes.accuracy_delta >= 0
                              ? `+${(p.models.naive_bayes.accuracy_delta * 100).toFixed(2)}`
                              : `${(p.models.naive_bayes.accuracy_delta * 100).toFixed(2)}`}
                            %)
                          </td>
                        </tr>
                      ))
                    : FALLBACK_PERTURBATIONS.map((p) => (
                        <tr key={p.name}>
                          <td className="py-2.5 px-3 font-semibold text-white">{p.name}</td>
                          <td className="py-2.5 px-3 text-neutral-400">{p.desc}</td>
                          <td className="py-2.5 px-3 font-bold text-green-400">{p.lrAcc} ({p.lrDelta})</td>
                          <td className="py-2.5 px-3 font-bold text-green-400">{p.svmAcc} ({p.svmDelta})</td>
                          <td className="py-2.5 px-3">{p.mnbAcc} ({p.mnbDelta})</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            <p className="font-mono text-[0.6rem] text-neutral-400 pt-2">
              *Insight: Invariance to whitespace and casing is primarily guaranteed by sublinear TF-IDF tokenization rules. Deliberate punctuation stripping degrades accuracy by ~2%, indicating syntactic cadence and punctuation rhythm carry notable authorship signals.
            </p>
          </div>
        )}

        {/* TAB 5: DOMAIN & GENERATOR SLICES */}
        {activeBenchmarkTab === "domains" && (
          <div className="space-y-4">
            <p className="font-body text-xs text-neutral-300">
              Evaluated on test set slices across human source domains and AI generator architectures:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {benchmarkData?.subgroup_analysis?.source_domain_and_generator_slices
                ? Object.entries(benchmarkData.subgroup_analysis.source_domain_and_generator_slices).map(([name, s]) => (
                    <div key={name} className="p-3 rounded-sm border border-white/5 bg-black/20 font-mono text-xs">
                      <div className="font-semibold text-white truncate capitalize">{name}</div>
                      <div className="text-[0.6rem] text-neutral-400 mt-1">
                        Support: {s.sample_count} ({s.human_count} Human / {s.ai_count} AI)
                      </div>
                      <div className="flex justify-between text-[0.62rem] mt-2 pt-2 border-t border-white/5">
                        <span className="text-[#C8FF00]">LR: {(s.models.logistic_regression.accuracy * 100).toFixed(1)}%</span>
                        <span className="text-[#FF6B35]">MNB: {(s.models.naive_bayes.accuracy * 100).toFixed(1)}%</span>
                        <span className="text-[#00F0FF]">SVM: {(s.models.calibrated_svm.accuracy * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))
                : [
                    { name: "OpenWebText (Human)", count: 351, lrAcc: "96.3%", mnbAcc: "86.9%", svmAcc: "96.0%" },
                    { name: "Opinion Statements (Human)", count: 232, lrAcc: "81.0%", mnbAcc: "69.4%", svmAcc: "81.9%" },
                    { name: "Answers & Q&A (Human)", count: 101, lrAcc: "100.0%", mnbAcc: "100.0%", svmAcc: "100.0%" },
                    { name: "ChatGPT (AI)", count: 170, lrAcc: "91.2%", mnbAcc: "93.5%", svmAcc: "92.4%" },
                    { name: "GPT-4 (AI)", count: 112, lrAcc: "88.4%", mnbAcc: "87.5%", svmAcc: "88.4%" },
                    { name: "Paraphrase Models (AI)", count: 251, lrAcc: "88.8%", mnbAcc: "82.1%", svmAcc: "88.4%" },
                    { name: "DaVinci (GPT-3.5) (AI)", count: 65, lrAcc: "92.3%", mnbAcc: "89.2%", svmAcc: "93.8%" },
                    { name: "Flan-T5 (AI)", count: 59, lrAcc: "86.4%", mnbAcc: "79.7%", svmAcc: "86.4%" },
                    { name: "OPT-IML (AI)", count: 61, lrAcc: "90.2%", mnbAcc: "85.2%", svmAcc: "91.8%" },
                  ].map((s) => (
                    <div key={s.name} className="p-3 rounded-sm border border-white/5 bg-black/20 font-mono text-xs">
                      <div className="font-semibold text-white truncate">{s.name}</div>
                      <div className="text-[0.6rem] text-neutral-400 mt-1">Support: {s.count} samples</div>
                      <div className="flex justify-between text-[0.62rem] mt-2 pt-2 border-t border-white/5">
                        <span className="text-[#C8FF00]">LR: {s.lrAcc}</span>
                        <span className="text-[#FF6B35]">MNB: {s.mnbAcc}</span>
                        <span className="text-[#00F0FF]">SVM: {s.svmAcc}</span>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        )}
      </section>

      {/* ─── SECTION 4 & 5: RESEARCH & MODEL TRANSPARENCY ───────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Research Transparency */}
        <div className="p-6 rounded-sm bg-neutral-900/60 border border-white/10 space-y-4">
          <h4 className="font-mono text-xs uppercase tracking-widest text-[#C8FF00]">
            01 / {t("research_transparency")}
          </h4>
          <h5 className="font-display text-xl text-white">AH&amp;AITD Dataset Provenance</h5>
          <p className="font-body text-xs text-neutral-300 leading-relaxed">
            The models were trained on <strong>Arslan&apos;s Human and AI Text Database (AH&amp;AITD)</strong>, published via CERN Zenodo (DOI: 10.5281/zenodo.15506369) under the Creative Commons Attribution 4.0 International license (CC BY 4.0).
          </p>
          <ul className="font-mono text-[0.65rem] space-y-1.5 text-neutral-300 list-disc list-inside">
            <li><strong>Raw Samples:</strong> 11,580 (5,790 human, 5,790 AI).</li>
            <li><strong>Audit &amp; Deduplication:</strong> 25 exact duplicates removed prior to train/val/test splitting. 0 conflicting labels. Clean count: 11,555.</li>
            <li><strong>Deterministic Split:</strong> Seed 42, 70% Train (8,088), 15% Validation (1,733), 15% Test (1,734).</li>
            <li><strong>Vocabulary Extraction:</strong> Word TF-IDF (12,000 features) + Char TF-IDF (18,000 features) fitted strictly on the 8,088 training samples.</li>
          </ul>
        </div>

        {/* Model Architecture & Limitations */}
        <div className="p-6 rounded-sm bg-neutral-900/60 border border-white/10 space-y-4">
          <h4 className="font-mono text-xs uppercase tracking-widest text-[#00F0FF]">
            02 / {t("model_transparency")}
          </h4>
          <h5 className="font-display text-xl text-white">Why Classical ML on Free Tier?</h5>
          <p className="font-body text-xs text-neutral-300 leading-relaxed">
            Rather than introducing 500MB+ Transformer LLM checkpoints (such as RoBERTa or DistilBERT) that risk OOM kills on 512MB RAM free instances, this implementation utilizes a compressed 2.4 MB multi-model bundle.
          </p>
          <ul className="font-mono text-[0.65rem] space-y-1.5 text-neutral-300 list-disc list-inside">
            <li><strong>Unified Feature Extraction:</strong> 1 shared vectorizer avoids triple memory consumption.</li>
            <li><strong>Inference Latency:</strong> ~4.2ms CPU execution per sample. Zero GPU required.</li>
            <li><strong>Honest Limitation:</strong> Random stratified splitting can overestimate generalization to unseen generators or specialized technical domains.</li>
            <li><strong>Platt Calibration:</strong> Linear SVM scores are mapped to true posterior probabilities using 3-fold cross-validated sigmoid scaling.</li>
          </ul>
        </div>
      </section>

      {/* ─── DOCUMENTATION & CITATION FOOTER ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-sm border border-white/5 bg-black/40 font-mono text-[0.62rem] text-neutral-400">
        <div>
          Dataset Citation: Arslan, M. (2025). <em>AH&amp;AITD – Arslan&apos;s Human and AI Text Database</em>. Zenodo. DOI: 10.5281/zenodo.15506369 (CC BY 4.0).
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://doi.org/10.5281/zenodo.15506369"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors underline"
          >
            Zenodo Archive ↗
          </a>
          <span>Bundle: 2.40 MB (v1.0.0)</span>
        </div>
      </div>
    </div>
  );
}
