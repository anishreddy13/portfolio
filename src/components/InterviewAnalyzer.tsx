"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TranscriptEntry {
  id: number;
  text: string;
  timestamp: string;
  wordCount: number;
}

interface AnalysisResult {
  communicationScore: number;
  confidenceScore: number;
  clarityScore: number;
  wpm: number;
  totalWords: number;
  totalTime: number;
  fillerWords: Record<string, number>;
  fillerWordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  uniqueWords: number;
  vocabularyRichness: number;
  longestSentence: number;
  feedback: string[];
  strengths: string[];
  improvements: string[];
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FILLER_WORDS = [
  "um", "uh", "like", "you know", "so", "basically", "actually",
  "literally", "right", "okay", "well", "hmm", "er", "ah",
  "kind of", "sort of", "i mean", "you see", "honestly",
];

const INTERVIEW_PROMPTS = [
  "Tell me about yourself and your professional background.",
  "What is your greatest strength and how have you applied it?",
  "Describe a challenging situation you faced and how you overcame it.",
  "Where do you see yourself in 5 years?",
  "Why do you want to work for our company?",
  "Tell me about a time you worked in a team under pressure.",
  "What is your biggest weakness and how are you working on it?",
  "Describe a project you are most proud of and your role in it.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countFillerWords(text: string): Record<string, number> {
  const lower = text.toLowerCase();
  const found: Record<string, number> = {};
  FILLER_WORDS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches && matches.length > 0) found[word] = matches.length;
  });
  return found;
}

function analyzeText(fullText: string, totalSeconds: number): AnalysisResult {
  const words = fullText.trim().split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;
  const wpm = totalSeconds > 0 ? Math.round((totalWords / totalSeconds) * 60) : 0;

  const sentences = fullText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(sentences.length, 1);
  const avgSentenceLength = Math.round(totalWords / sentenceCount);
  const longestSentence = Math.max(...sentences.map((s) => s.trim().split(/\s+/).length));

  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ""))).size;
  const vocabularyRichness = totalWords > 0 ? Math.round((uniqueWords / totalWords) * 100) : 0;

  const fillerWords = countFillerWords(fullText);
  const fillerWordCount = Object.values(fillerWords).reduce((a, b) => a + b, 0);
  const fillerRate = totalWords > 0 ? (fillerWordCount / totalWords) * 100 : 0;

  let communicationScore = 70;
  let confidenceScore = 70;
  let clarityScore = 70;

  if (wpm >= 120 && wpm <= 160) communicationScore += 15;
  else if (wpm >= 100 && wpm <= 180) communicationScore += 8;
  else if (wpm < 80 || wpm > 200) communicationScore -= 10;

  if (fillerRate < 2)       { communicationScore += 10; confidenceScore += 15; }
  else if (fillerRate < 5)  { communicationScore += 5;  confidenceScore += 5;  }
  else if (fillerRate > 10) { communicationScore -= 15; confidenceScore -= 20; }
  else if (fillerRate > 7)  { communicationScore -= 8;  confidenceScore -= 10; }

  if (vocabularyRichness > 70)      { clarityScore += 15; communicationScore += 5; }
  else if (vocabularyRichness > 55) { clarityScore += 8; }
  else if (vocabularyRichness < 35) { clarityScore -= 10; }

  if (avgSentenceLength >= 10 && avgSentenceLength <= 20) clarityScore += 10;
  else if (avgSentenceLength > 30) clarityScore -= 8;

  if (totalWords >= 80)      { communicationScore += 5; confidenceScore += 5;   }
  else if (totalWords < 30)  { communicationScore -= 10; confidenceScore -= 10; }

  communicationScore = Math.min(100, Math.max(0, communicationScore));
  confidenceScore    = Math.min(100, Math.max(0, confidenceScore));
  clarityScore       = Math.min(100, Math.max(0, clarityScore));

  const feedback: string[]     = [];
  const strengths: string[]    = [];
  const improvements: string[] = [];

  if (wpm >= 120 && wpm <= 160) strengths.push("Excellent speaking pace — very easy to follow.");
  else if (wpm < 100) improvements.push("Try speaking a bit faster to maintain listener engagement.");
  else if (wpm > 180) improvements.push("Slow down slightly — you are speaking quite fast.");

  if (fillerRate < 2) strengths.push("Minimal filler words — you sound polished and confident.");
  else if (fillerRate > 7) improvements.push(`High filler word usage (${fillerWordCount} times) — practice pausing instead.`);

  if (vocabularyRichness > 65) strengths.push("Rich vocabulary — shows strong command of language.");
  else if (vocabularyRichness < 40) improvements.push("Try using more varied vocabulary to sound more engaging.");

  if (totalWords >= 100) strengths.push("Good response length — thorough and detailed.");
  else if (totalWords < 40) improvements.push("Expand your answers — aim for at least 60-80 words per response.");

  if (avgSentenceLength <= 20) strengths.push("Clear sentence structure — easy to understand.");
  else if (avgSentenceLength > 28) improvements.push("Break long sentences into shorter ones for better clarity.");

  if (sentenceCount >= 5) strengths.push("Well-structured response with multiple complete thoughts.");
  if (feedback.length === 0) feedback.push("Keep practicing — consistency builds confidence.");

  return {
    communicationScore, confidenceScore, clarityScore,
    wpm, totalWords, totalTime: totalSeconds,
    fillerWords, fillerWordCount, sentenceCount,
    avgSentenceLength, uniqueWords, vocabularyRichness,
    longestSentence, feedback, strengths, improvements,
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#C8FF00";
  if (score >= 60) return "#FF6B35";
  return "#FF2D2D";
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Needs Work";
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({
  score, label, color, size = 100,
}: {
  score: number; label: string; color: string; size?: number;
}) {
  const radius       = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset       = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6}
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-display text-2xl leading-none"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <span
        className="font-mono text-[0.58rem] uppercase tracking-widest text-center"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <span className="font-body text-[0.6rem]" style={{ color }}>
        {getScoreLabel(score)}
      </span>
    </div>
  );
}

// ─── Waveform ─────────────────────────────────────────────────────────────────

function WaveformVisualizer({ isListening }: { isListening: boolean }) {
  const bars = 24;
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: 2.5, backgroundColor: "#FF2D2D" }}
          animate={
            isListening
              ? { height: [3, Math.random() * 28 + 6, 3], opacity: [0.4, 1, 0.4] }
              : { height: 3, opacity: 0.15 }
          }
          transition={{
            duration: 0.5 + Math.random() * 0.5,
            repeat: Infinity,
            delay: i * 0.04,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InterviewAnalyzer() {
  const [isListening,    setIsListening]    = useState(false);
  const [isPaused,       setIsPaused]       = useState(false);
  const [transcript,     setTranscript]     = useState<TranscriptEntry[]>([]);
  const [interimText,    setInterimText]    = useState("");
  const [fullText,       setFullText]       = useState("");
  const [analysis,       setAnalysis]       = useState<AnalysisResult | null>(null);
  const [elapsedTime,    setElapsedTime]    = useState(0);
  const [currentPrompt,  setCurrentPrompt]  = useState(INTERVIEW_PROMPTS[0]);
  const [promptIndex,    setPromptIndex]    = useState(0);
  const [supported,      setSupported]      = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showResults,    setShowResults]    = useState(false);

  const recognitionRef  = useRef<any>(null);
  const timerRef        = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef   = useRef<HTMLDivElement>(null);
  const accumulatedRef  = useRef<string>("");

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => setElapsedTime((p) => p + 1), 1000);
  }, [stopTimer]);

  const setupRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    const recognition = new SR();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          accumulatedRef.current += " " + text;
          setFullText(accumulatedRef.current.trim());
          const words = text.split(/\s+/).filter((w: string) => w.length > 0);
          setTranscript((prev) => [...prev, {
            id: Date.now(), text,
            timestamp: formatTime(elapsedTime),
            wordCount: words.length,
          }]);
          setInterimText("");
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(`Microphone error: ${event.error}. Please check permissions.`);
      setIsListening(false);
      stopTimer();
    };

    recognition.onend = () => {
      if (isListening && !isPaused) {
        try { recognition.start(); } catch (_) {}
      }
    };

    return recognition;
  }, [elapsedTime, isListening, isPaused, stopTimer]);

  const startListening = useCallback(() => {
    setError(null); setShowResults(false);
    const recognition = setupRecognition();
    if (!recognition) { setError("Speech recognition not supported."); return; }
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true); setIsPaused(false);
      setSessionStarted(true); startTimer();
    } catch (e) {
      setError("Could not start microphone. Please allow mic access.");
    }
  }, [setupRecognition, startTimer]);

  const pauseListening = useCallback(() => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (_) {} }
    setIsPaused(true); setIsListening(false); stopTimer();
  }, [stopTimer]);

  const resumeListening = useCallback(() => {
    const recognition = setupRecognition();
    if (!recognition) return;
    recognitionRef.current = recognition;
    try { recognition.start(); setIsListening(true); setIsPaused(false); startTimer(); }
    catch (e) { setError("Could not resume. Please try again."); }
  }, [setupRecognition, startTimer]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListening(false); setIsPaused(false); stopTimer(); setInterimText("");
    const text = accumulatedRef.current.trim();
    if (text.length > 0) {
      setAnalysis(analyzeText(text, elapsedTime));
      setShowResults(true);
    }
  }, [elapsedTime, stopTimer]);

  const resetSession = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    stopTimer();
    setIsListening(false); setIsPaused(false);
    setTranscript([]); setInterimText(""); setFullText("");
    accumulatedRef.current = "";
    setAnalysis(null); setElapsedTime(0);
    setSessionStarted(false); setShowResults(false); setError(null);
  }, [stopTimer]);

  const nextPrompt = useCallback(() => {
    const next = (promptIndex + 1) % INTERVIEW_PROMPTS.length;
    setPromptIndex(next); setCurrentPrompt(INTERVIEW_PROMPTS[next]); resetSession();
  }, [promptIndex, resetSession]);

  const randomPrompt = useCallback(() => {
    let next = Math.floor(Math.random() * INTERVIEW_PROMPTS.length);
    if (next === promptIndex) next = (next + 1) % INTERVIEW_PROMPTS.length;
    setPromptIndex(next); setCurrentPrompt(INTERVIEW_PROMPTS[next]); resetSession();
  }, [promptIndex, resetSession]);

  useEffect(() => () => { stopTimer(); }, [stopTimer]);

  if (!supported) {
    return (
      <div
        className="rounded-sm p-8 text-center"
        style={{ background: "var(--surface-1)", border: "1px solid rgba(255,45,45,0.2)" }}
      >
        <div className="text-4xl mb-4">🎤</div>
        <h3 className="font-display text-2xl mb-2" style={{ color: "#FF2D2D" }}>
          Not Supported
        </h3>
        <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
          Your browser does not support the Web Speech API.
          Please use Chrome or Edge for this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Prompt Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-sm p-5"
        style={{
          background:  "rgba(255,45,45,0.05)",
          border:      "1px solid rgba(255,45,45,0.2)",
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <p
              className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-3"
              style={{ color: "#FF2D2D" }}
            >
              Question {promptIndex + 1} / {INTERVIEW_PROMPTS.length}
            </p>
            <p className="font-body text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {currentPrompt}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <motion.button
              onClick={nextPrompt} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="rounded-sm px-3 py-2 font-mono text-[0.58rem] uppercase tracking-widest transition-all duration-200"
              style={{ background: "var(--surface-2)", color: "var(--text-tertiary)", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)")}
            >
              Next →
            </motion.button>
            <motion.button
              onClick={randomPrompt} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="rounded-sm px-3 py-2 font-mono text-[0.58rem] uppercase tracking-widest transition-all duration-200"
              style={{
                background:  "rgba(255,45,45,0.08)",
                color:       "#FF2D2D",
                border:      "1px solid rgba(255,45,45,0.25)",
              }}
            >
              Shuffle
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Left: Controls ── */}
        <div className="space-y-3">

          {/* Timer + waveform */}
          <div
            className="rounded-sm p-5"
            style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p
                  className="font-mono text-[0.55rem] tracking-[0.25em] uppercase mb-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Session Time
                </p>
                <p className="font-display text-4xl" style={{ color: "var(--text-primary)" }}>
                  {formatTime(elapsedTime)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-mono text-[0.55rem] tracking-[0.25em] uppercase mb-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Words
                </p>
                <p className="font-display text-4xl" style={{ color: "var(--text-primary)" }}>
                  {fullText.trim().split(/\s+/).filter((w) => w.length > 0).length || 0}
                </p>
              </div>
            </div>

            <WaveformVisualizer isListening={isListening} />

            {/* Status */}
            <div className="flex justify-center mt-3">
              <span
                className="flex items-center gap-2 font-mono text-[0.55rem] tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm"
                style={{
                  background: isListening
                    ? "rgba(200,255,0,0.08)"
                    : isPaused
                    ? "rgba(255,107,53,0.08)"
                    : "var(--border-soft)",
                  border: isListening
                    ? "1px solid rgba(200,255,0,0.25)"
                    : isPaused
                    ? "1px solid rgba(255,107,53,0.25)"
                    : "1px solid rgba(255,255,255,0.06)",
                  color: isListening ? "#C8FF00" : isPaused ? "#FF6B35" : "var(--text-tertiary)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isListening ? "#C8FF00" : isPaused ? "#FF6B35" : "var(--text-tertiary)",
                    animation: isListening ? "pulse 1.5s infinite" : "none",
                  }}
                />
                {isListening ? "Recording" : isPaused ? "Paused" : sessionStarted ? "Stopped" : "Ready"}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {!sessionStarted ? (
              <motion.button
                onClick={startListening}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="col-span-2 py-4 rounded-sm font-mono text-[0.7rem] tracking-[0.2em] uppercase"
                style={{ background: "#FF2D2D", color: "#fff", boxShadow: "0 0 24px rgba(255,45,45,0.35)" }}
              >
                🎤 Start Recording
              </motion.button>
            ) : (
              <>
                {isListening ? (
                  <motion.button
                    onClick={pauseListening}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="py-3 rounded-sm font-mono text-[0.62rem] uppercase tracking-widest transition-all duration-200"
                    style={{
                      background:  "rgba(255,107,53,0.08)",
                      color:       "#FF6B35",
                      border:      "1px solid rgba(255,107,53,0.3)",
                    }}
                  >
                    ⏸ Pause
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={resumeListening}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="py-3 rounded-sm font-mono text-[0.62rem] uppercase tracking-widest transition-all duration-200"
                    style={{
                      background:  "rgba(200,255,0,0.06)",
                      color:       "#C8FF00",
                      border:      "1px solid rgba(200,255,0,0.25)",
                    }}
                  >
                    ▶ Resume
                  </motion.button>
                )}
                <motion.button
                  onClick={stopListening}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="py-3 rounded-sm font-mono text-[0.62rem] uppercase tracking-widest"
                  style={{ background: "#FF2D2D", color: "#fff" }}
                >
                  ⏹ Analyze
                </motion.button>
              </>
            )}
            {sessionStarted && (
              <motion.button
                onClick={resetSession}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="col-span-2 py-2 rounded-sm font-mono text-[0.58rem] uppercase tracking-widest transition-all duration-200"
                style={{
                  background:  "var(--surface-2)",
                  color:       "var(--text-tertiary)",
                  border:      "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)")}
              >
                ↺ Reset Session
              </motion.button>
            )}
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

          {/* Tips */}
          {!sessionStarted && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-sm p-4"
              style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p
                className="font-mono text-[0.55rem] tracking-[0.25em] uppercase mb-3"
                style={{ color: "#FF2D2D" }}
              >
                — Tips for Best Results
              </p>
              <ul className="space-y-2">
                {[
                  "Speak clearly and at a natural pace",
                  "Aim for 120–160 words per minute",
                  "Avoid filler words like 'um' and 'like'",
                  "Use complete sentences with clear structure",
                  "Allow microphone access when prompted",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span style={{ color: "#FF2D2D" }}>›</span>
                    <span className="font-body text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* ── Right: Transcript ── */}
        <div className="space-y-3">
          <div
            className="rounded-sm overflow-hidden flex flex-col"
            style={{
              minHeight: "360px",
              background: "var(--surface-1)",
              border:     "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <span
                className="font-mono text-[0.58rem] tracking-[0.25em] uppercase"
                style={{ color: "#FF2D2D" }}
              >
                Live Transcript
              </span>
              <span className="font-mono text-[0.55rem]" style={{ color: "var(--text-tertiary)" }}>
                {transcript.length} segments
              </span>
            </div>

            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ maxHeight: "340px" }}
            >
              {transcript.length === 0 && !interimText && (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <div className="text-3xl mb-3 opacity-20">🎙️</div>
                  <p
                    className="font-mono text-[0.58rem] tracking-[0.2em] uppercase"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Transcript will appear here
                  </p>
                </div>
              )}

              {transcript.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  className="space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.5rem]" style={{ color: "#FF2D2D" }}>
                      {entry.timestamp}
                    </span>
                    <span className="font-mono text-[0.5rem]" style={{ color: "#404040" }}>
                      {entry.wordCount} words
                    </span>
                  </div>
                  <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {entry.text}
                  </p>
                </motion.div>
              ))}

              {interimText && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                  <span className="font-mono text-[0.5rem]" style={{ color: "#FF2D2D" }}>Live...</span>
                  <p className="font-body text-sm italic leading-relaxed" style={{ color: "#404040" }}>
                    {interimText}
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Live stats */}
          {sessionStarted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-2"
            >
              {[
                {
                  label: "Est. WPM",
                  value: elapsedTime > 5
                    ? Math.round((fullText.trim().split(/\s+/).filter((w) => w.length > 0).length / elapsedTime) * 60)
                    : "—",
                  color: "#C8FF00",
                },
                {
                  label: "Fillers",
                  value: Object.values(countFillerWords(fullText)).reduce((a, b) => a + b, 0),
                  color: "#FF6B35",
                },
                {
                  label: "Sentences",
                  value: fullText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length,
                  color: "#A855F7",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-sm p-3 text-center"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p
                    className="font-mono text-[0.52rem] uppercase tracking-widest mb-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {stat.label}
                  </p>
                  <p className="font-display text-2xl" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Analysis Results ── */}
      <AnimatePresence>
        {showResults && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Score rings */}
            <div
              className="rounded-sm p-6"
              style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p
                className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-6 text-center"
                style={{ color: "#FF2D2D" }}
              >
                — Analysis Results
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { score: analysis.communicationScore, label: "Communication" },
                  { score: analysis.confidenceScore,    label: "Confidence"    },
                  { score: analysis.clarityScore,       label: "Clarity"       },
                ].map((item) => (
                  <div key={item.label} className="flex justify-center">
                    <ScoreRing
                      score={item.score} label={item.label}
                      color={getScoreColor(item.score)} size={100}
                    />
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: "Speaking WPM", value: analysis.wpm,               unit: "wpm",   color: getScoreColor(analysis.wpm >= 120 && analysis.wpm <= 160 ? 90 : 50) },
                  { label: "Total Words",  value: analysis.totalWords,         unit: "words", color: getScoreColor(analysis.totalWords >= 80 ? 90 : 55) },
                  { label: "Filler Words", value: analysis.fillerWordCount,    unit: "times", color: getScoreColor(analysis.fillerWordCount < 3 ? 90 : analysis.fillerWordCount < 7 ? 65 : 30) },
                  { label: "Vocabulary",   value: `${analysis.vocabularyRichness}%`, unit: "unique", color: getScoreColor(analysis.vocabularyRichness >= 60 ? 90 : 55) },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-sm p-3 text-center"
                    style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <p
                      className="font-mono text-[0.52rem] uppercase tracking-widest mb-1.5"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {stat.label}
                    </p>
                    <p className="font-display text-xl mb-0.5" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                    <p className="font-mono text-[0.5rem]" style={{ color: "#404040" }}>
                      {stat.unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Filler words */}
            {Object.keys(analysis.fillerWords).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-sm p-5"
                style={{
                  background: "rgba(255,107,53,0.05)",
                  border:     "1px solid rgba(255,107,53,0.2)",
                }}
              >
                <p
                  className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-4"
                  style={{ color: "#FF6B35" }}
                >
                  Filler Words Detected
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysis.fillerWords)
                    .sort(([, a], [, b]) => b - a)
                    .map(([word, count]) => (
                      <div
                        key={word}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-sm"
                        style={{
                          background:  "rgba(255,107,53,0.08)",
                          border:      "1px solid rgba(255,107,53,0.2)",
                        }}
                      >
                        <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
                          &quot;{word}&quot;
                        </span>
                        <span className="font-display text-sm" style={{ color: "#FF6B35" }}>
                          ×{count}
                        </span>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Strengths + Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.strengths.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-sm p-5"
                  style={{
                    background: "rgba(200,255,0,0.04)",
                    border:     "1px solid rgba(200,255,0,0.2)",
                  }}
                >
                  <p
                    className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-4"
                    style={{ color: "#C8FF00" }}
                  >
                    ✓ Strengths
                  </p>
                  <ul className="space-y-2.5">
                    {analysis.strengths.map((s, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.07 }}
                        className="flex items-start gap-2"
                      >
                        <span style={{ color: "#C8FF00" }}>›</span>
                        <span className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {s}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {analysis.improvements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-sm p-5"
                  style={{
                    background: "rgba(255,45,45,0.04)",
                    border:     "1px solid rgba(255,45,45,0.2)",
                  }}
                >
                  <p
                    className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-4"
                    style={{ color: "#FF2D2D" }}
                  >
                    ↑ Areas to Improve
                  </p>
                  <ul className="space-y-2.5">
                    {analysis.improvements.map((s, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.07 }}
                        className="flex items-start gap-2"
                      >
                        <span style={{ color: "#FF2D2D" }}>›</span>
                        <span className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {s}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>

            {/* Full transcript */}
            {fullText && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-sm p-5"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="font-mono text-[0.58rem] tracking-[0.25em] uppercase"
                    style={{ color: "#FF2D2D" }}
                  >
                    Full Transcript
                  </p>
                  <span className="font-mono text-[0.55rem]" style={{ color: "var(--text-tertiary)" }}>
                    {analysis.totalWords} words · {formatTime(analysis.totalTime)}
                  </span>
                </div>
                <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                  {fullText}
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <motion.button
                onClick={resetSession}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-sm font-mono text-[0.7rem] tracking-[0.2em] uppercase"
                style={{ background: "#FF2D2D", color: "#fff" }}
              >
                ↺ Try Again
              </motion.button>
              <motion.button
                onClick={nextPrompt}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-sm font-mono text-[0.7rem] tracking-[0.2em] uppercase transition-all duration-200"
                style={{
                  background:  "var(--surface-2)",
                  color:       "var(--text-tertiary)",
                  border:      "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,45,45,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                }}
              >
                Next Question →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}