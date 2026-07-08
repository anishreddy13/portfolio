"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { fetchPlantForm } from "../../lib/mlApi";
import { getPlantGuidance } from "../lib/plantDiseaseContent";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PlantPredictionItem {
  class_name: string;
  display_name: string;
  confidence: number;
  status: string;
}

interface PlantPredictionResult {
  predicted_class: string;
  predicted_display_name: string;
  confidence_score: number;
  status: string;
  is_healthy: boolean;
  top_5_predictions: PlantPredictionItem[];
}

interface PlantExplanationResult {
  prediction: PlantPredictionResult;
  heatmap_base64: string;
  overlay_base64: string;
  target_class: string;
  model_inference_ms: number;
}

type AttentionView = "original" | "heatmap";

const ACCENT = "#C8FF00";
const DISEASE = "#FF6B35";
const ERROR_COLOR = "#FF2D2D";
const VIOLET = "#A855F7";

// ─── Helper ─────────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

// ─── Panel Title ────────────────────────────────────────────────────────────────

function PanelLabel({ text, color = ACCENT }: { text: string; color?: string }) {
  return (
    <p className="font-mono text-[0.52rem] tracking-[0.25em] uppercase mb-2.5" style={{ color }}>
      {text}
    </p>
  );
}

// ─── Confidence Ring ────────────────────────────────────────────────────────────

function ConfidenceRing({ value, color }: { value: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
        <motion.circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-2xl leading-none"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {value.toFixed(0)}
        </motion.span>
        <span className="font-mono text-[0.44rem] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          %conf
        </span>
      </div>
    </div>
  );
}

// ─── Confidence Bar ─────────────────────────────────────────────────────────────

function ConfBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-2">
        <span className="font-mono text-[0.52rem] uppercase tracking-wider truncate" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </span>
        <span className="font-mono text-[0.52rem] shrink-0" style={{ color: "var(--text-secondary)" }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}55` }}
        />
      </div>
    </div>
  );
}

// ─── Upload Zone ────────────────────────────────────────────────────────────────

function UploadZone({
  imagePreview,
  selectedFile,
  isDragging,
  setIsDragging,
  onFile,
}: {
  imagePreview: string | null;
  selectedFile: File | null;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile, setIsDragging]
  );

  return (
    <motion.div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="relative rounded-sm overflow-hidden cursor-pointer"
      style={{
        minHeight: "220px",
        background: "var(--surface-2)",
        border: `1px dashed ${isDragging ? "rgba(200,255,0,0.7)" : "var(--border)"}`,
        transition: "border-color 0.3s ease",
      }}
      whileHover={{ borderColor: "rgba(200,255,0,0.35)" }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />

      {imagePreview ? (
        <div className="relative w-full h-full">
          <img
            src={imagePreview}
            alt="Plant leaf preview"
            className="w-full object-cover"
            style={{ height: "220px" }}
          />
          <div
            className="absolute inset-0 flex items-end p-3"
            style={{ background: "linear-gradient(to top, rgba(10,10,10,0.82), transparent)" }}
          >
            <div className="flex items-center justify-between w-full gap-2">
              <p className="font-mono text-[0.52rem] tracking-widest uppercase" style={{ color: "var(--text-secondary)" }}>
                Click to change
              </p>
              <p className="font-mono text-[0.48rem] truncate max-w-[50%]" style={{ color: "var(--text-tertiary)" }}>
                {selectedFile?.name}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center" style={{ height: "220px" }}>
          <motion.div
            animate={{ y: isDragging ? -8 : [0, -4, 0] }}
            transition={{ duration: isDragging ? 0.2 : 2.2, repeat: isDragging ? 0 : Infinity }}
            className="text-4xl mb-3 opacity-40"
          >
            🌿
          </motion.div>
          <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-1"
            style={{ color: isDragging ? ACCENT : "var(--text-tertiary)" }}>
            {isDragging ? "Drop leaf image here" : "Upload Plant Leaf Image"}
          </p>
          <p className="font-body text-xs" style={{ color: "#404040" }}>
            Drag & drop or click · JPG, PNG, WEBP
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Attention Map Panel ────────────────────────────────────────────────────────

function AttentionMap({
  original,
  explanation,
  explainLoading,
  explainError,
}: {
  original: string | null;
  explanation: PlantExplanationResult | null;
  explainLoading: boolean;
  explainError: string | null;
}) {
  const [view, setView] = useState<AttentionView>("heatmap");
  const imageSrc = view === "heatmap" && explanation ? explanation.overlay_base64 : original;

  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div
        className="px-3 py-2.5 flex items-center justify-between gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div>
          <p className="font-mono text-[0.52rem] tracking-[0.25em] uppercase" style={{ color: ACCENT }}>
            AI Attention Map
          </p>
          <p className="font-body text-[0.65rem] leading-tight mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Grad-CAM highlights regions that drove the prediction
          </p>
        </div>
        {/* Toggle */}
        <div
          className="grid grid-cols-2 gap-0.5 rounded-sm p-0.5 shrink-0"
          style={{ background: "var(--surface-1)" }}
        >
          {(["original", "heatmap"] as AttentionView[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className="px-2 py-1 rounded-sm font-mono text-[0.48rem] uppercase"
              style={{
                background: view === id ? ACCENT : "transparent",
                color: view === id ? "#0A0A0A" : "var(--text-tertiary)",
                transition: "background 0.2s",
              }}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Image area */}
      <div className="p-2.5">
        {imageSrc ? (
          <div
            className="relative rounded-sm overflow-hidden"
            style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.04)" }}
          >
            <img
              src={imageSrc}
              alt="Grad-CAM attention visualization"
              className="w-full object-contain"
              style={{ height: "200px" }}
            />
            {explainLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(10,10,10,0.72)" }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 rounded-full"
                  style={{ borderColor: "rgba(200,255,0,0.18)", borderTopColor: ACCENT }}
                />
              </div>
            )}
          </div>
        ) : (
          <div
            className="rounded-sm h-44 flex items-center justify-center text-center p-4"
            style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.04)" }}
          >
            <p className="font-mono text-[0.54rem] uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
              Attention map appears after prediction
            </p>
          </div>
        )}
        {explainError && (
          <p className="font-mono text-[0.52rem] mt-2 leading-relaxed" style={{ color: DISEASE }}>
            {explainError}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Observability Panel ────────────────────────────────────────────────────────

function ObservabilityPanel({
  result,
  apiMs,
  modelMs,
  uploadKb,
  timestamp,
}: {
  result: PlantPredictionResult | null;
  apiMs: number | null;
  modelMs: number | null;
  uploadKb: number;
  timestamp: string | null;
}) {
  const confidence = result?.confidence_score ?? 0;
  const color = result ? (result.is_healthy ? ACCENT : DISEASE) : "var(--text-tertiary)";
  const success = Boolean(result);

  const formatTs = (iso: string) =>
    new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(iso));

  return (
    <div
      className="rounded-sm p-4"
      style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <PanelLabel text="Inference Observability" />
      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4 items-center">
        <ConfidenceRing value={confidence} color={color as string} />
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "API Response", value: apiMs ? `${apiMs}ms` : "—", color: VIOLET },
            { label: "Model Duration", value: modelMs ? `${modelMs}ms` : "—", color: ACCENT },
            { label: "Upload Size", value: uploadKb > 0 ? `${uploadKb.toFixed(0)}KB` : "—", color: "var(--text-secondary)" },
            { label: "State", value: success ? "Success" : "Waiting", color: success ? ACCENT : "var(--text-tertiary)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-sm p-2.5"
              style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <p className="font-mono text-[0.44rem] uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>
                {stat.label}
              </p>
              <motion.p
                className="font-display text-base leading-none truncate"
                style={{ color: stat.color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {stat.value}
              </motion.p>
            </div>
          ))}
        </div>
      </div>
      <p className="font-mono text-[0.48rem] uppercase tracking-widest mt-3" style={{ color: "#404040" }}>
        Last prediction: {timestamp ? formatTs(timestamp) : "No scan yet"}
      </p>
    </div>
  );
}

// ─── Disease Guidance Panel ─────────────────────────────────────────────────────

function GuidancePanel({ result }: { result: PlantPredictionResult | null }) {
  const [expanded, setExpanded] = useState<string | null>("treatment");
  const guidance = getPlantGuidance(result?.predicted_class, result?.is_healthy);
  const severityColor =
    guidance.severity === "Healthy" ? ACCENT
    : guidance.severity === "High" ? ERROR_COLOR
    : DISEASE;

  const sections = [
    { id: "treatment", label: "Treatment", items: guidance.treatment },
    { id: "prevention", label: "Prevention", items: guidance.prevention },
    { id: "care", label: "Care", items: guidance.care },
  ];

  return (
    <div
      className="rounded-sm p-4"
      style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <PanelLabel text="Disease Guidance" />
          <h4 className="font-display text-xl leading-none" style={{ color: "var(--text-primary)" }}>
            {guidance.title}
          </h4>
        </div>
        <span
          className="rounded-sm px-2 py-1 font-mono text-[0.46rem] uppercase tracking-widest shrink-0"
          style={{
            color: severityColor,
            background: `${severityColor}12`,
            border: `1px solid ${severityColor}35`,
          }}
        >
          {guidance.severity}
        </span>
      </div>
      <p className="font-body text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
        {guidance.description}
      </p>
      <div className="space-y-1.5">
        {sections.map((section) => (
          <div
            key={section.id}
            className="rounded-sm overflow-hidden"
            style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.04)" }}
          >
            <button
              type="button"
              onClick={() => setExpanded((c) => (c === section.id ? null : section.id))}
              className="w-full flex items-center justify-between px-3 py-2 text-left"
            >
              <span className="font-mono text-[0.5rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                {section.label}
              </span>
              <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                {expanded === section.id ? "−" : "+"}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {expanded === section.id && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="px-3 pb-2.5 space-y-1.5"
                >
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 font-body text-xs leading-relaxed"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <span style={{ color: severityColor }}>›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Result Panel ───────────────────────────────────────────────────────────────

function ResultPanel({
  result,
  apiMs,
  modelMs,
}: {
  result: PlantPredictionResult;
  apiMs: number | null;
  modelMs: number | null;
}) {
  const color = result.is_healthy ? ACCENT : DISEASE;

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-3"
    >
      {/* Primary result */}
      <div
        className="rounded-sm overflow-hidden"
        style={{
          background: "var(--surface-2)",
          border: `1px solid ${result.is_healthy ? "rgba(200,255,0,0.25)" : "rgba(255,107,53,0.3)"}`,
        }}
      >
        <div
          className="px-4 py-4 flex items-center gap-4"
          style={{
            background: result.is_healthy ? "rgba(200,255,0,0.05)" : "rgba(255,107,53,0.06)",
            borderBottom: `1px solid ${result.is_healthy ? "rgba(200,255,0,0.15)" : "rgba(255,107,53,0.18)"}`,
          }}
        >
          <ConfidenceRing value={result.confidence_score} color={color} />
          <div className="flex-1 min-w-0">
            <h4
              className="font-display text-xl sm:text-2xl leading-tight tracking-wide truncate"
              style={{ color }}
            >
              {result.predicted_display_name.toUpperCase()}
            </h4>
            <p className="font-mono text-[0.52rem] uppercase tracking-widest mt-1" style={{ color: "var(--text-tertiary)" }}>
              {result.status} · {result.confidence_score.toFixed(1)}% confidence
            </p>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-1.5 p-3">
          {[
            { label: "Status", value: result.is_healthy ? "Healthy" : "Disease", color },
            { label: "API", value: apiMs ? `${apiMs}ms` : "—", color: VIOLET },
            { label: "Model", value: modelMs ? `${modelMs}ms` : "—", color: ACCENT },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-sm px-2 py-2"
              style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <p className="font-mono text-[0.44rem] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                {s.label}
              </p>
              <p className="font-display text-base leading-none mt-1 truncate" style={{ color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top predictions */}
      <div
        className="rounded-sm p-3"
        style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="font-mono text-[0.52rem] tracking-[0.22em] uppercase mb-2.5" style={{ color: "var(--text-tertiary)" }}>
          Top Predictions
        </p>
        <div className="space-y-2.5">
          {result.top_5_predictions.slice(0, 4).map((item, i) => (
            <motion.div
              key={item.class_name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <ConfBar
                label={item.display_name}
                value={item.confidence}
                color={item.status === "healthy" ? ACCENT : DISEASE}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function HomePlantDemo() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<PlantPredictionResult | null>(null);
  const [explanation, setExplanation] = useState<PlantExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [apiMs, setApiMs] = useState<number | null>(null);
  const [modelMs, setModelMs] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const uploadKb = selectedFile ? selectedFile.size / 1024 : 0;

  const reset = useCallback(() => {
    setImagePreview(null);
    setSelectedFile(null);
    setResult(null);
    setExplanation(null);
    setError(null);
    setExplainError(null);
    setApiMs(null);
    setModelMs(null);
    setTimestamp(null);
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large. Max 10 MB.");
      return;
    }
    const preview = await fileToDataUrl(file);
    setImagePreview(preview);
    setSelectedFile(file);
    setResult(null);
    setExplanation(null);
    setError(null);
    setExplainError(null);
    setApiMs(null);
    setModelMs(null);
    setTimestamp(null);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Upload or drop a plant leaf image first.");
      return;
    }
    setLoading(true);
    setExplainLoading(false);
    setError(null);
    setExplainError(null);
    setResult(null);
    setExplanation(null);
    const t0 = performance.now();

    try {
      const data = await fetchPlantForm<PlantPredictionResult>("/predict/plant", selectedFile);
      const now = new Date().toISOString();
      setApiMs(Math.round(performance.now() - t0));
      setTimestamp(now);
      setResult(data);

      // Kick off Grad-CAM concurrently
      setExplainLoading(true);
      try {
        const cam = await fetchPlantForm<PlantExplanationResult>("/explain/plant", selectedFile);
        setExplanation(cam);
        setModelMs(cam.model_inference_ms);
      } catch {
        setExplainError("Grad-CAM endpoint optional — deploy the updated plant API to enable live attention maps.");
      } finally {
        setExplainLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the plant model.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Two-column inference layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* LEFT: upload + controls */}
        <div className="space-y-3">
          <UploadZone
            imagePreview={imagePreview}
            selectedFile={selectedFile}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            onFile={processFile}
          />

          {/* Analyze / Clear */}
          <div className="flex gap-2">
            <motion.button
              onClick={handleAnalyze}
              disabled={loading || !selectedFile}
              whileHover={{ scale: loading || !selectedFile ? 1 : 1.02 }}
              whileTap={{ scale: loading || !selectedFile ? 1 : 0.98 }}
              className="flex-1 py-3 rounded-sm font-mono text-[0.65rem] tracking-[0.18em] uppercase disabled:opacity-40"
              style={{ background: ACCENT, color: "#0A0A0A" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-3.5 h-3.5 border-2 rounded-full"
                    style={{ borderColor: "rgba(10,10,10,0.25)", borderTopColor: "#0A0A0A" }}
                  />
                  Analyzing…
                </span>
              ) : "Analyze Plant →"}
            </motion.button>

            {(imagePreview || result) && (
              <motion.button
                onClick={reset}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-3 rounded-sm font-mono text-[0.6rem] uppercase tracking-widest"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-tertiary)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                Clear
              </motion.button>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-sm px-4 py-2.5"
                style={{
                  background: "rgba(255,45,45,0.08)",
                  border: "1px solid rgba(255,45,45,0.25)",
                }}
              >
                <p className="font-mono text-[0.58rem]" style={{ color: ERROR_COLOR }}>
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Supported classes hint */}
          <div className="grid grid-cols-4 gap-1.5">
            {["Pepper", "Potato", "Tomato", "15 Classes"].map((item, i) => (
              <div
                key={item}
                className="rounded-sm px-2 py-2 text-center"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <p
                  className="font-display text-sm leading-none"
                  style={{ color: i === 3 ? ACCENT : "var(--text-secondary)" }}
                >
                  {item}
                </p>
                <p className="font-mono text-[0.44rem] uppercase tracking-widest mt-1" style={{ color: "#404040" }}>
                  Supported
                </p>
              </div>
            ))}
          </div>

          {/* Guidance Panel — shown on left below the upload controls once available */}
          <GuidancePanel result={result} />
        </div>

        {/* RIGHT: results + attention map */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {result ? (
              <ResultPanel key="result" result={result} apiMs={apiMs} modelMs={modelMs} />
            ) : loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-sm flex flex-col items-center justify-center text-center"
                style={{
                  minHeight: "220px",
                  background: "var(--surface-2)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <motion.div className="grid grid-cols-5 gap-1 mb-4">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-7 rounded-full"
                      style={{ background: ACCENT }}
                      animate={{ scaleY: [0.25, 1, 0.25], opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.04 }}
                    />
                  ))}
                </motion.div>
                <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase" style={{ color: "var(--text-tertiary)" }}>
                  Running EfficientNet-B0…
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-sm flex flex-col items-center justify-center text-center p-6"
                style={{
                  minHeight: "220px",
                  background: "var(--surface-2)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="text-3xl mb-3 opacity-30">🌿</div>
                <p className="font-mono text-[0.58rem] tracking-[0.22em] uppercase mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Upload a leaf to begin
                </p>
                <p className="font-body text-xs max-w-[220px]" style={{ color: "#404040" }}>
                  Results include disease status, confidence ring, top predictions, Grad-CAM heatmap, and care guidance.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attention map — always shown, activates after prediction */}
          <AttentionMap
            original={imagePreview}
            explanation={explanation}
            explainLoading={explainLoading}
            explainError={explainError}
          />
        </div>
      </div>

      {/* ── Observability Panel (full-width) ── */}
      <ObservabilityPanel
        result={result}
        apiMs={apiMs}
        modelMs={modelMs}
        uploadKb={uploadKb}
        timestamp={timestamp}
      />

      {/* ── CTA to full ML Lab ── */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="font-body text-xs leading-relaxed max-w-sm" style={{ color: "var(--text-tertiary)" }}>
          Full experience includes webcam capture, Grad-CAM explorer, disease guidance, model telemetry, and local scan analytics.
        </p>
        <Link href="/ml?tab=plant">
          <motion.span
            className="inline-flex items-center gap-2 rounded-sm px-5 py-2.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] shrink-0"
            style={{ background: "rgba(200,255,0,0.1)", color: ACCENT, border: "1px solid rgba(200,255,0,0.25)" }}
            whileHover={{ scale: 1.03, background: "rgba(200,255,0,0.16)" }}
            whileTap={{ scale: 0.97 }}
          >
            Open Full ML Lab
            <span>→</span>
          </motion.span>
        </Link>
      </div>
    </div>
  );
}
