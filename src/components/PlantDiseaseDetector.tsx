"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fetchPlantForm } from "../../lib/mlApi";
import { usePlantScanAnalytics } from "../hooks/usePlantScanAnalytics";
import {
  getPlantGuidance,
  plantArchitectureSteps,
  plantProductStats,
  plantShowcaseItems,
  plantTechBadges,
} from "../lib/plantDiseaseContent";

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

type InputMode = "upload" | "webcam";
type AttentionView = "original" | "heatmap";

const PLANT_ACCENT = "#C8FF00";
const PLANT_DISEASE = "#FF6B35";
const PLANT_ERROR = "#FF2D2D";
const PLANT_VIOLET = "#A855F7";

const formatTimestamp = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(iso)) : "--";

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function MiniConfidenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[0.56rem] uppercase tracking-wider truncate" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </span>
        <span className="font-mono text-[0.56rem] shrink-0" style={{ color: "var(--text-secondary)" }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}55` }}
        />
      </div>
    </div>
  );
}

function PanelTitle({ label, color = PLANT_ACCENT }: { label: string; color?: string }) {
  return (
    <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-3" style={{ color }}>
      {label}
    </p>
  );
}

function ModeToggle({ mode, setMode }: { mode: InputMode; setMode: (mode: InputMode) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-sm p-1" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {[
        { id: "upload" as InputMode, label: "Upload" },
        { id: "webcam" as InputMode, label: "Webcam" },
      ].map((item) => {
        const active = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className="relative rounded-sm py-2.5 font-mono text-[0.58rem] uppercase tracking-[0.2em]"
            style={{ color: active ? "#0A0A0A" : "var(--text-tertiary)" }}
          >
            {active && (
              <motion.span
                layoutId="plant-input-mode"
                className="absolute inset-0 rounded-sm"
                style={{ background: PLANT_ACCENT }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function UploadSurface({
  imagePreview,
  selectedFile,
  isDragging,
  setIsDragging,
  processFile,
}: {
  imagePreview: string | null;
  selectedFile: File | null;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  processFile: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile, setIsDragging]);

  return (
    <motion.div
      onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className="relative rounded-sm overflow-hidden cursor-pointer"
      style={{
        minHeight: "300px",
        background: "var(--surface-1)",
        border: `1px dashed ${isDragging ? "rgba(200,255,0,0.7)" : "var(--border)"}`,
        transition: "border-color 0.3s ease",
      }}
      whileHover={{ borderColor: "rgba(200,255,0,0.35)" }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) processFile(file);
        }}
      />

      {imagePreview ? (
        <div className="relative w-full h-full">
          <img src={imagePreview} alt="Plant leaf preview" className="w-full h-[300px] sm:h-80 object-cover" />
          <div className="absolute inset-0 flex items-end p-4" style={{ background: "linear-gradient(to top, rgba(var(--color-overlay-base), 0.82), transparent)" }}>
            <div className="flex items-center justify-between gap-3 w-full">
              <p className="font-mono text-[0.58rem] tracking-widest uppercase" style={{ color: "var(--text-secondary)" }}>
                Click to change image
              </p>
              <p className="font-mono text-[0.52rem] truncate max-w-[46%]" style={{ color: "var(--text-tertiary)" }}>
                {selectedFile?.name}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[300px] sm:h-80 p-6 text-center">
          <motion.div
            animate={{ y: isDragging ? -8 : [0, -4, 0] }}
            transition={{ duration: isDragging ? 0.2 : 2.2, repeat: isDragging ? 0 : Infinity }}
            className="text-4xl mb-3 opacity-40"
          >
            🌿
          </motion.div>
          <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase mb-1" style={{ color: isDragging ? PLANT_ACCENT : "var(--text-tertiary)" }}>
            {isDragging ? "Drop leaf image here" : "Upload Plant Leaf Image"}
          </p>
          <p className="font-body text-xs" style={{ color: "#404040" }}>
            Drag & drop or click · JPG, PNG, WEBP · Max 10MB
          </p>
        </div>
      )}
    </motion.div>
  );
}

function WebcamScanner({ onCapture }: { onCapture: (file: File, preview: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<"idle" | "starting" | "ready" | "error">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraState("idle");
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState("starting");
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("ready");
    } catch {
      setCameraError("Camera permission denied or unavailable. Upload mode still works.");
      setCameraState("error");
    }
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || cameraState !== "ready") return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `plant-webcam-${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file, canvas.toDataURL("image/jpeg", 0.9));
    }, "image/jpeg", 0.9);
  }, [cameraState, onCapture]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="rounded-sm overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="relative min-h-[300px] sm:min-h-[320px] flex items-center justify-center">
        <video ref={videoRef} playsInline muted className="w-full h-[300px] sm:h-80 object-cover" style={{ display: cameraState === "ready" ? "block" : "none" }} />
        {cameraState !== "ready" && (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3 opacity-30">▣</div>
            <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase mb-2" style={{ color: "var(--text-tertiary)" }}>
              Live Webcam Scanner
            </p>
            <p className="font-body text-xs max-w-xs mx-auto" style={{ color: "#404040" }}>
              Use your camera to capture a leaf frame and send it through the same inference API.
            </p>
            {cameraError && (
              <p className="font-mono text-[0.58rem] mt-3" style={{ color: PLANT_ERROR }}>
                {cameraError}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <button
          type="button"
          onClick={cameraState === "ready" ? stopCamera : startCamera}
          className="py-2.5 rounded-sm font-mono text-[0.58rem] uppercase tracking-[0.2em]"
          style={{ background: "var(--surface-2)", color: cameraState === "ready" ? PLANT_ERROR : PLANT_ACCENT, border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {cameraState === "ready" ? "Stop Camera" : cameraState === "starting" ? "Starting..." : "Start Camera"}
        </button>
        <button
          type="button"
          onClick={captureFrame}
          disabled={cameraState !== "ready"}
          className="py-2.5 rounded-sm font-mono text-[0.58rem] uppercase tracking-[0.2em] disabled:opacity-40"
          style={{ background: PLANT_ACCENT, color: "#0A0A0A" }}
        >
          Capture Frame
        </button>
      </div>
    </div>
  );
}

function ResultDashboard({
  result,
  apiMs,
  modelMs,
  uploadKb,
  timestamp,
}: {
  result: PlantPredictionResult;
  apiMs: number | null;
  modelMs: number | null;
  uploadKb: number;
  timestamp: string | null;
}) {
  const resultColor = result.is_healthy ? PLANT_ACCENT : PLANT_DISEASE;

  return (
    <motion.div
      key="plant-result"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-3"
    >
      <div className="rounded-sm overflow-hidden" style={{ background: "var(--surface-1)", border: `1px solid ${result.is_healthy ? "rgba(200,255,0,0.25)" : "rgba(255,107,53,0.32)"}` }}>
        <div className="px-4 sm:px-5 py-5 text-center" style={{ background: result.is_healthy ? "rgba(200,255,0,0.05)" : "rgba(255,107,53,0.06)", borderBottom: `1px solid ${result.is_healthy ? "rgba(200,255,0,0.2)" : "rgba(255,107,53,0.2)"}` }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-4xl mb-3">
            {result.is_healthy ? "●" : "◆"}
          </motion.div>
          <h3 className="font-display text-3xl sm:text-4xl tracking-wider mb-1 leading-none" style={{ color: resultColor }}>
            {result.predicted_display_name.toUpperCase()}
          </h3>
          <p className="font-mono text-[0.6rem] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
            {result.status} · {result.confidence_score.toFixed(1)}% confidence
          </p>
        </div>

        <div className="px-4 sm:px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Status", value: result.is_healthy ? "Healthy" : "Disease", color: resultColor },
            { label: "API", value: apiMs ? `${apiMs}ms` : "--", color: PLANT_VIOLET },
            { label: "Model", value: modelMs ? `${modelMs}ms` : "Pending", color: PLANT_ACCENT },
            { label: "Upload", value: `${uploadKb.toFixed(0)}KB`, color: "var(--text-secondary)" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-sm px-3 py-2" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <p className="font-mono text-[0.5rem] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>{stat.label}</p>
              <p className="font-display text-xl sm:text-2xl leading-none mt-1 truncate" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="px-4 sm:px-5 pb-4">
          <div className="rounded-sm px-3 py-2 flex items-center justify-between gap-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="font-mono text-[0.52rem] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Request State</span>
            <span className="font-mono text-[0.52rem] uppercase tracking-widest" style={{ color: PLANT_ACCENT }}>
              Success · {formatTimestamp(timestamp ?? undefined)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-sm p-4" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <PanelTitle label="Top 5 Predictions" color="var(--text-tertiary)" />
        <div className="space-y-3">
          {result.top_5_predictions.map((item, index) => (
            <motion.div
              key={item.class_name}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.07 }}
            >
              <MiniConfidenceBar
                label={item.display_name}
                value={item.confidence}
                color={item.status === "healthy" ? PLANT_ACCENT : PLANT_DISEASE}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ObservabilityPanel({
  result,
  apiMs,
  modelMs,
  uploadKb,
  timestamp,
  success,
}: {
  result: PlantPredictionResult | null;
  apiMs: number | null;
  modelMs: number | null;
  uploadKb: number;
  timestamp: string | null;
  success: boolean;
}) {
  const confidence = result?.confidence_score ?? 0;
  const circumference = 2 * Math.PI * 34;
  const dash = circumference - (confidence / 100) * circumference;

  return (
    <div className="rounded-sm p-4 sm:p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <PanelTitle label="Inference Observability" />
      <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-center">
        <div className="relative w-[96px] h-[96px] mx-auto">
          <svg width="96" height="96" className="-rotate-90">
            <circle cx="48" cy="48" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
            <motion.circle
              cx="48"
              cy="48"
              r="34"
              fill="none"
              stroke={result?.is_healthy ? PLANT_ACCENT : PLANT_DISEASE}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dash }}
              transition={{ duration: 1 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl leading-none" style={{ color: result?.is_healthy ? PLANT_ACCENT : PLANT_DISEASE }}>
              {confidence.toFixed(0)}
            </span>
            <span className="font-mono text-[0.46rem] uppercase" style={{ color: "var(--text-tertiary)" }}>Confidence</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "API Response", value: apiMs ? `${apiMs}ms` : "--", color: PLANT_VIOLET },
            { label: "Model Duration", value: modelMs ? `${modelMs}ms` : "--", color: PLANT_ACCENT },
            { label: "Upload Size", value: uploadKb > 0 ? `${uploadKb.toFixed(0)}KB` : "--", color: "var(--text-secondary)" },
            { label: "State", value: success ? "Success" : "Waiting", color: success ? PLANT_ACCENT : "var(--text-tertiary)" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-sm p-3" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <p className="font-mono text-[0.48rem] uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>{stat.label}</p>
              <motion.p className="font-display text-xl leading-none truncate" style={{ color: stat.color }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {stat.value}
              </motion.p>
            </div>
          ))}
        </div>
      </div>
      <p className="font-mono text-[0.52rem] uppercase tracking-widest mt-4" style={{ color: "#404040" }}>
        Last prediction: {timestamp ? formatTimestamp(timestamp) : "No scan yet"}
      </p>
    </div>
  );
}

function AttentionMapPanel({
  original,
  explanation,
  loading,
  error,
}: {
  original: string | null;
  explanation: PlantExplanationResult | null;
  loading: boolean;
  error: string | null;
}) {
  const [view, setView] = useState<AttentionView>("heatmap");
  const imageSrc = view === "heatmap" && explanation ? explanation.overlay_base64 : original;

  return (
    <div className="rounded-sm overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="p-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div>
          <PanelTitle label="AI Attention Map" />
          <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
            Grad-CAM highlights the image regions that most influenced the top prediction.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1 shrink-0 rounded-sm p-1" style={{ background: "var(--surface-2)" }}>
          {[
            { id: "original" as AttentionView, label: "Original" },
            { id: "heatmap" as AttentionView, label: "Heatmap" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className="px-2 py-1 rounded-sm font-mono text-[0.5rem] uppercase"
              style={{ background: view === item.id ? PLANT_ACCENT : "transparent", color: view === item.id ? "#0A0A0A" : "var(--text-tertiary)" }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {imageSrc ? (
          <div className="relative rounded-sm overflow-hidden" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <img src={imageSrc} alt="Grad-CAM attention visualization" className="w-full h-64 sm:h-80 object-contain" />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(var(--color-overlay-base), 0.72)" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-9 h-9 border-2 rounded-full" style={{ borderColor: "rgba(200,255,0,0.18)", borderTopColor: PLANT_ACCENT }} />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-sm h-56 flex items-center justify-center text-center p-6" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>Attention map appears after prediction</p>
          </div>
        )}

        {error && (
          <p className="font-mono text-[0.55rem] mt-3 leading-relaxed" style={{ color: PLANT_DISEASE }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function GuidancePanel({ result }: { result: PlantPredictionResult | null }) {
  const [expanded, setExpanded] = useState<string | null>("treatment");
  const guidance = getPlantGuidance(result?.predicted_class, result?.is_healthy);
  const severityColor = guidance.severity === "Healthy" ? PLANT_ACCENT : guidance.severity === "High" ? PLANT_ERROR : PLANT_DISEASE;
  const sections = [
    { id: "treatment", label: "Treatment", items: guidance.treatment },
    { id: "prevention", label: "Prevention", items: guidance.prevention },
    { id: "care", label: "Care", items: guidance.care },
  ];

  return (
    <div className="rounded-sm p-4 sm:p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <PanelTitle label="Disease Guidance" />
          <h3 className="font-display text-3xl leading-none" style={{ color: "var(--text-primary)" }}>{guidance.title}</h3>
        </div>
        <span className="rounded-sm px-2.5 py-1 font-mono text-[0.52rem] uppercase tracking-widest" style={{ color: severityColor, background: `${severityColor}12`, border: `1px solid ${severityColor}35` }}>
          {guidance.severity}
        </span>
      </div>
      <p className="font-body text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{guidance.description}</p>
      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section.id} className="rounded-sm overflow-hidden" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <button
              type="button"
              onClick={() => setExpanded((current) => current === section.id ? null : section.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left"
            >
              <span className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>{section.label}</span>
              <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{expanded === section.id ? "-" : "+"}</span>
            </button>
            <AnimatePresence initial={false}>
              {expanded === section.id && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 pb-3 space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2 font-body text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
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

function MediaShowcase() {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [customAsset, setCustomAsset] = useState<{ url: string; type: "image" | "video"; name: string } | null>(null);
  const item = plantShowcaseItems[active];
  const assetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % plantShowcaseItems.length), 4200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (customAsset) URL.revokeObjectURL(customAsset.url);
    };
  }, [customAsset]);

  return (
    <div className="rounded-sm p-4 sm:p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <PanelTitle label="Product Demo Showcase" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
        <button
          type="button"
          onClick={() => setLightbox(active)}
          className="relative rounded-sm min-h-[240px] overflow-hidden text-left"
          style={{ background: "var(--surface-2)", border: `1px solid ${item.accent}35` }}
        >
          {customAsset ? (
            customAsset.type === "video" ? (
              <video src={customAsset.url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-55" />
            ) : (
              <img src={customAsset.url} alt={customAsset.name} className="absolute inset-0 w-full h-full object-cover opacity-55" />
            )
          ) : (
            <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 35% 25%, ${item.accent}40, transparent 55%)` }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(var(--color-overlay-base), 0.92), rgba(var(--color-overlay-base), 0.3))" }} />
          <div className="absolute inset-4 grid grid-rows-[auto_1fr_auto]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.25em]" style={{ color: item.accent }}>{item.eyebrow}</span>
              <span className="font-mono text-[0.52rem] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                {customAsset ? customAsset.name : "Preview"}
              </span>
            </div>
            <div className="flex items-center">
              <div>
                <h3 className="font-display text-4xl sm:text-5xl leading-none mb-3" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                <p className="font-body text-sm max-w-md" style={{ color: "var(--text-secondary)" }}>{item.summary}</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 15 }).map((_, index) => (
                <motion.span
                  key={index}
                  className="h-1 rounded-full"
                  style={{ background: index <= active * 4 ? item.accent : "var(--border)" }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.03 }}
                />
              ))}
            </div>
          </div>
        </button>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          <input
            ref={assetInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setCustomAsset({
                url: URL.createObjectURL(file),
                type: file.type.startsWith("video/") ? "video" : "image",
                name: file.name,
              });
            }}
          />
          <button
            type="button"
            onClick={() => assetInputRef.current?.click()}
            className="rounded-sm p-3 text-left"
            style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.2)" }}
          >
            <p className="font-mono text-[0.5rem] uppercase tracking-widest mb-1" style={{ color: PLANT_ACCENT }}>Assets</p>
            <p className="font-body text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>Upload screenshot or demo video</p>
          </button>
          {plantShowcaseItems.map((showcase, index) => (
            <button
              key={showcase.title}
              type="button"
              onClick={() => setActive(index)}
              className="rounded-sm p-3 text-left"
              style={{ background: active === index ? `${showcase.accent}10` : "var(--surface-2)", border: `1px solid ${active === index ? `${showcase.accent}35` : "var(--border-soft)"}` }}
            >
              <p className="font-mono text-[0.5rem] uppercase tracking-widest mb-1" style={{ color: showcase.accent }}>{showcase.eyebrow}</p>
              <p className="font-body text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>{showcase.title}</p>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9996] p-4 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.76)" }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="w-full max-w-3xl rounded-sm p-6"
              style={{ background: "var(--surface-1)", border: `1px solid ${plantShowcaseItems[lightbox].accent}35` }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex justify-between gap-4 mb-5">
                <div>
                  <p className="font-mono text-[0.55rem] uppercase tracking-[0.25em] mb-2" style={{ color: plantShowcaseItems[lightbox].accent }}>{plantShowcaseItems[lightbox].eyebrow}</p>
                  <h3 className="font-display text-5xl leading-none" style={{ color: "var(--text-primary)" }}>{plantShowcaseItems[lightbox].title}</h3>
                </div>
                <button className="font-mono text-lg" style={{ color: "var(--text-tertiary)" }} onClick={() => setLightbox(null)}>x</button>
              </div>
              <div className="rounded-sm min-h-[280px] p-6 flex items-center justify-center text-center overflow-hidden" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                {customAsset ? (
                  customAsset.type === "video" ? (
                    <video src={customAsset.url} autoPlay muted loop playsInline controls className="max-h-[420px] w-full object-contain rounded-sm" />
                  ) : (
                    <img src={customAsset.url} alt={customAsset.name} className="max-h-[420px] w-full object-contain rounded-sm" />
                  )
                ) : (
                  <p className="font-body text-sm max-w-lg" style={{ color: "var(--text-secondary)" }}>{plantShowcaseItems[lightbox].summary}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArchitecturePanel() {
  return (
    <div className="rounded-sm p-4 sm:p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <PanelTitle label="System Architecture" />
          <p className="font-body text-sm max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            The plant detector is served as an isolated inference product: Next.js sends multipart images to a lightweight HF Spaces FastAPI service that loads EfficientNet-B0 once at startup.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="rounded-sm px-3 py-2 font-mono text-[0.55rem] uppercase tracking-widest" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}>
            GitHub ↗
          </a>
          <a href="https://anishreddy13-plant-disease-api.hf.space/docs" target="_blank" rel="noopener noreferrer" className="rounded-sm px-3 py-2 font-mono text-[0.55rem] uppercase tracking-widest" style={{ background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.2)", color: PLANT_ACCENT }}>
            API Docs ↗
          </a>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {plantArchitectureSteps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            className="relative rounded-sm p-3 min-h-[124px]"
            style={{ background: index === 3 ? `${step.color}10` : "var(--surface-2)", border: `1px solid ${index === 3 ? `${step.color}35` : "var(--border-soft)"}` }}
          >
            <p className="font-display text-2xl leading-none mb-2" style={{ color: step.color }}>0{index + 1}</p>
            <p className="font-mono text-[0.54rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>{step.title}</p>
            <p className="font-body text-[0.68rem] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>{step.detail}</p>
            {index < plantArchitectureSteps.length - 1 && (
              <span className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 font-mono text-[0.6rem]" style={{ color: "#404040" }}>&gt;</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ModelDetailsPanel() {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div className="rounded-sm overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        style={{ borderBottom: expanded ? "1px solid rgba(255,255,255,0.04)" : "none" }}
      >
        <div>
          <PanelTitle label="Model Intelligence" />
          <p className="font-body text-xs" style={{ color: "var(--text-tertiary)" }}>EfficientNet-B0 transfer learning pipeline, trained for production inference.</p>
        </div>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="font-mono text-lg" style={{ color: "var(--text-tertiary)" }}>v</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { title: "Architecture", lines: ["EfficientNet-B0", "Transfer Learning", "CNN classification"] },
                  { title: "Training", lines: ["15 classes", "PlantVillage dataset", "20k+ images", "GPU trained"] },
                  { title: "Deployment", lines: ["PyTorch", "FastAPI", "Hugging Face Spaces", "Docker"] },
                ].map((card) => (
                  <div key={card.title} className="rounded-sm p-4" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <p className="font-mono text-[0.55rem] uppercase tracking-[0.22em] mb-3" style={{ color: "var(--text-tertiary)" }}>{card.title}</p>
                    <div className="space-y-1.5">
                      {card.lines.map((line) => <p key={line} className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>{line}</p>)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {plantProductStats.map((metric) => (
                  <div key={metric.label} className="rounded-sm p-3 text-center" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <p className="font-display text-2xl leading-none" style={{ color: metric.color }}>{metric.value}</p>
                    <p className="font-mono text-[0.5rem] uppercase tracking-widest mt-2" style={{ color: "var(--text-tertiary)" }}>{metric.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {plantTechBadges.map((tech) => (
                  <span key={tech} className="px-2.5 py-1 rounded-sm font-mono text-[0.52rem] uppercase tracking-wider" style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.18)", color: PLANT_ACCENT }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AnalyticsDashboard({
  analytics,
  clearAnalytics,
}: {
  analytics: ReturnType<typeof usePlantScanAnalytics>["analytics"];
  clearAnalytics: () => void;
}) {
  const maxCount = Math.max(1, ...analytics.distribution.map((item) => item.count));

  return (
    <div className="rounded-sm p-4 sm:p-5" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <PanelTitle label="Local Usage Analytics" />
          <p className="font-body text-xs" style={{ color: "var(--text-tertiary)" }}>Stored in this browser only. No backend dependency.</p>
        </div>
        <button type="button" onClick={clearAnalytics} className="rounded-sm px-2.5 py-1.5 font-mono text-[0.52rem] uppercase tracking-widest" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-tertiary)" }}>
          Clear
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: "Total Scans", value: analytics.totalScans, color: PLANT_ACCENT },
          { label: "Successful", value: analytics.successfulPredictions, color: PLANT_VIOLET },
          { label: "Avg Conf.", value: `${analytics.averageConfidence.toFixed(1)}%`, color: PLANT_DISEASE },
          { label: "Classes", value: analytics.distribution.length, color: "var(--text-secondary)" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-sm p-3" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="font-display text-2xl leading-none" style={{ color: stat.color }}>{stat.value}</p>
            <p className="font-mono text-[0.48rem] uppercase tracking-widest mt-1" style={{ color: "var(--text-tertiary)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.22em] mb-3" style={{ color: "var(--text-tertiary)" }}>Disease Distribution</p>
          <div className="space-y-2">
            {analytics.distribution.length > 0 ? analytics.distribution.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between gap-3">
                  <span className="font-body text-xs truncate" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                  <span className="font-mono text-[0.55rem]" style={{ color: "var(--text-tertiary)" }}>{item.count}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${(item.count / maxCount) * 100}%` }} style={{ background: PLANT_ACCENT }} />
                </div>
              </div>
            )) : (
              <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "#404040" }}>No scans yet</p>
            )}
          </div>
        </div>
        <div>
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.22em] mb-3" style={{ color: "var(--text-tertiary)" }}>Recent Scans</p>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {analytics.recentScans.length > 0 ? analytics.recentScans.map((scan) => (
              <div key={scan.id} className="rounded-sm p-2.5 flex items-center justify-between gap-3" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="min-w-0">
                  <p className="font-body text-xs truncate" style={{ color: "var(--text-secondary)" }}>{scan.displayName}</p>
                  <p className="font-mono text-[0.48rem] uppercase tracking-widest" style={{ color: "#404040" }}>{formatTimestamp(scan.timestamp)}</p>
                </div>
                <span className="font-mono text-[0.55rem]" style={{ color: scan.isHealthy ? PLANT_ACCENT : PLANT_DISEASE }}>{scan.confidence.toFixed(1)}%</span>
              </div>
            )) : (
              <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "#404040" }}>History appears after predictions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlantDiseaseDetector() {
  const [mode, setMode] = useState<InputMode>("upload");
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
  const { analytics, recordScan, clearAnalytics } = usePlantScanAnalytics();

  const uploadKb = selectedFile ? selectedFile.size / 1024 : 0;

  const resetImage = useCallback(() => {
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

  const processFile = useCallback(async (file: File, previewOverride?: string) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Supported formats: JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large. Max 10MB.");
      return;
    }

    const preview = previewOverride ?? await fileToDataUrl(file);
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

  const handlePredict = async () => {
    if (!selectedFile) {
      setError("Please upload or capture a plant leaf image first.");
      return;
    }

    setLoading(true);
    setExplainLoading(false);
    setError(null);
    setExplainError(null);
    setResult(null);
    setExplanation(null);
    const startedAt = performance.now();

    try {
      const data = await fetchPlantForm<PlantPredictionResult>("/predict/plant", selectedFile);
      const responseMs = Math.round(performance.now() - startedAt);
      const now = new Date().toISOString();
      setApiMs(responseMs);
      setModelMs(null);
      setTimestamp(now);
      setResult(data);
      recordScan({
        id: `${Date.now()}`,
        className: data.predicted_class,
        displayName: data.predicted_display_name,
        confidence: data.confidence_score,
        status: data.status,
        isHealthy: data.is_healthy,
        apiMs: responseMs,
        modelMs: null,
        uploadKb: selectedFile.size / 1024,
        timestamp: now,
      });

      setExplainLoading(true);
      try {
        const gradCam = await fetchPlantForm<PlantExplanationResult>("/explain/plant", selectedFile);
        setExplanation(gradCam);
        setModelMs(gradCam.model_inference_ms);
      } catch {
        setExplainError("Grad-CAM endpoint is optional. Deploy the updated plant API package to enable live attention maps.");
      } finally {
        setExplainLoading(false);
      }
    } catch (err) {
      setApiMs(null);
      setTimestamp(null);
      setError(err instanceof Error ? err.message : "Cannot connect to plant model.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-sm p-5 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(200,255,0,0.08), rgba(255,107,53,0.045) 55%, var(--surface-1))",
          border: "1px solid rgba(200,255,0,0.2)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: PLANT_ACCENT, boxShadow: `0 0 8px ${PLANT_ACCENT}` }} />
              <span className="font-mono text-[0.58rem] tracking-[0.28em] uppercase" style={{ color: PLANT_ACCENT }}>
                Flagship Vision Product
              </span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl leading-none tracking-wider" style={{ color: "var(--text-primary)" }}>
              Plant Disease Detection
            </h2>
            <p className="font-body text-sm mt-2 max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Upload or capture a plant leaf image, inspect model confidence, review care guidance, and analyze local scan trends.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-full md:min-w-[300px]">
            {plantProductStats.map((metric) => (
              <div key={metric.label} className="rounded-sm px-3 py-2 text-center" style={{ background: "rgba(var(--color-overlay-base), 0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="font-display text-xl leading-none" style={{ color: metric.color }}>{metric.value}</p>
                <p className="font-mono text-[0.48rem] uppercase tracking-widest mt-1" style={{ color: "var(--text-tertiary)" }}>{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3 min-w-0">
          <ModeToggle mode={mode} setMode={setMode} />
          {mode === "upload" ? (
            <UploadSurface
              imagePreview={imagePreview}
              selectedFile={selectedFile}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              processFile={processFile}
            />
          ) : (
            <WebcamScanner onCapture={(file, preview) => processFile(file, preview)} />
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {["Pepper", "Potato", "Tomato", "15 Classes"].map((item, index) => (
              <div key={item} className="rounded-sm p-3" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="font-display text-xl leading-none" style={{ color: index === 3 ? PLANT_ACCENT : "var(--text-secondary)" }}>{item}</p>
                <p className="font-mono text-[0.5rem] uppercase tracking-widest mt-1" style={{ color: "#404040" }}>Supported</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={handlePredict}
              disabled={loading || !selectedFile}
              whileHover={{ scale: loading || !selectedFile ? 1 : 1.02 }}
              whileTap={{ scale: loading || !selectedFile ? 1 : 0.98 }}
              className="flex-1 py-3 rounded-sm font-mono text-[0.68rem] tracking-[0.18em] uppercase disabled:opacity-40"
              style={{ background: PLANT_ACCENT, color: "#0A0A0A" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-4 h-4 border-2 rounded-full" style={{ borderColor: "rgba(var(--color-overlay-base), 0.3)", borderTopColor: "#0A0A0A" }} />
                  Analyzing...
                </span>
              ) : "Analyze Plant ->"}
            </motion.button>
            <motion.button
              onClick={resetImage}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-3 rounded-sm font-mono text-[0.62rem] uppercase tracking-widest"
              style={{ background: "var(--surface-2)", color: "var(--text-tertiary)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              Clear
            </motion.button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-sm px-4 py-3" style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)" }}>
                <p className="font-mono text-[0.62rem]" style={{ color: PLANT_ERROR }}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-3 min-w-0">
          <AnimatePresence mode="wait">
            {result ? (
              <ResultDashboard result={result} apiMs={apiMs} modelMs={modelMs} uploadKb={uploadKb} timestamp={timestamp} />
            ) : loading ? (
              <motion.div key="plant-loading" className="rounded-sm px-6 py-16 flex flex-col items-center justify-center h-full min-h-[320px]" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <motion.div className="grid grid-cols-5 gap-1 mb-5">
                  {Array.from({ length: 15 }).map((_, index) => (
                    <motion.span key={index} className="w-2 h-8 rounded-full" style={{ background: PLANT_ACCENT }} animate={{ scaleY: [0.25, 1, 0.25], opacity: [0.25, 1, 0.25] }} transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.04 }} />
                  ))}
                </motion.div>
                <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase" style={{ color: "var(--text-tertiary)" }}>Running EfficientNet-B0...</p>
              </motion.div>
            ) : (
              <motion.div key="plant-empty" className="rounded-sm px-6 py-16 flex flex-col items-center justify-center text-center h-full min-h-[320px]" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-4xl mb-4 opacity-30">🌿</div>
                <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase mb-2" style={{ color: "var(--text-tertiary)" }}>Upload or capture a leaf</p>
                <p className="font-body text-xs max-w-xs" style={{ color: "#404040" }}>Results include disease status, confidence, top predictions, timing, attention maps, and care guidance.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ObservabilityPanel result={result} apiMs={apiMs} modelMs={modelMs} uploadKb={uploadKb} timestamp={timestamp} success={Boolean(result)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttentionMapPanel original={imagePreview} explanation={explanation} loading={explainLoading} error={explainError} />
        <GuidancePanel result={result} />
      </div>

      <MediaShowcase />
      <ArchitecturePanel />
      <AnalyticsDashboard analytics={analytics} clearAnalytics={clearAnalytics} />
      <ModelDetailsPanel />
    </div>
  );
}
