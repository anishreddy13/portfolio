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
    if (matches && matches.length > 0) {
      found[word] = matches.length;
    }
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

  // Scoring
  let communicationScore = 70;
  let confidenceScore = 70;
  let clarityScore = 70;

  // WPM scoring (ideal: 120-160 wpm)
  if (wpm >= 120 && wpm <= 160) communicationScore += 15;
  else if (wpm >= 100 && wpm <= 180) communicationScore += 8;
  else if (wpm < 80 || wpm > 200) communicationScore -= 10;

  // Filler word penalty
  if (fillerRate < 2) { communicationScore += 10; confidenceScore += 15; }
  else if (fillerRate < 5) { communicationScore += 5; confidenceScore += 5; }
  else if (fillerRate > 10) { communicationScore -= 15; confidenceScore -= 20; }
  else if (fillerRate > 7) { communicationScore -= 8; confidenceScore -= 10; }

  // Vocabulary richness
  if (vocabularyRichness > 70) { clarityScore += 15; communicationScore += 5; }
  else if (vocabularyRichness > 55) { clarityScore += 8; }
  else if (vocabularyRichness < 35) { clarityScore -= 10; }

  // Sentence length
  if (avgSentenceLength >= 10 && avgSentenceLength <= 20) clarityScore += 10;
  else if (avgSentenceLength > 30) clarityScore -= 8;

  // Word count bonus
  if (totalWords >= 80) { communicationScore += 5; confidenceScore += 5; }
  else if (totalWords < 30) { communicationScore -= 10; confidenceScore -= 10; }

  communicationScore = Math.min(100, Math.max(0, communicationScore));
  confidenceScore = Math.min(100, Math.max(0, confidenceScore));
  clarityScore = Math.min(100, Math.max(0, clarityScore));

  // Feedback generation
  const feedback: string[] = [];
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (wpm >= 120 && wpm <= 160) strengths.push("Excellent speaking pace — very easy to follow.");
  else if (wpm < 100) improvements.push("Try speaking a bit faster to maintain listener engagement.");
  else if (wpm > 180) improvements.push("Slow down slightly — you're speaking quite fast.");

  if (fillerRate < 2) strengths.push("Minimal filler words — you sound polished and confident.");
  else if (fillerRate > 7) improvements.push(`High filler word usage (${fillerWordCount} times) — practice pausing instead of saying "um" or "like".`);

  if (vocabularyRichness > 65) strengths.push("Rich vocabulary — shows strong command of language.");
  else if (vocabularyRichness < 40) improvements.push("Try using more varied vocabulary to sound more engaging.");

  if (totalWords >= 100) strengths.push("Good response length — thorough and detailed.");
  else if (totalWords < 40) improvements.push("Expand your answers — aim for at least 60-80 words per response.");

  if (avgSentenceLength <= 20) strengths.push("Clear sentence structure — easy to understand.");
  else if (avgSentenceLength > 28) improvements.push("Break long sentences into shorter ones for better clarity.");

  if (sentenceCount >= 5) strengths.push("Well-structured response with multiple complete thoughts.");

  if (feedback.length === 0) feedback.push("Keep practicing — consistency builds confidence.");

  return {
    communicationScore,
    confidenceScore,
    clarityScore,
    wpm,
    totalWords,
    totalTime: totalSeconds,
    fillerWords,
    fillerWordCount,
    sentenceCount,
    avgSentenceLength,
    uniqueWords,
    vocabularyRichness,
    longestSentence,
    feedback,
    strengths,
    improvements,
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#00f5ff";
  if (score >= 60) return "#f59e0b";
  return "#ec4899";
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Needs Work";
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, label, color, size = 100 }: { score: number; label: string; color: string; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
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
      <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest text-center">{label}</span>
      <span className="font-body text-[10px]" style={{ color }}>{getScoreLabel(score)}</span>
    </div>
  );
}

// ─── Waveform Visualizer ──────────────────────────────────────────────────────

function WaveformVisualizer({ isListening }: { isListening: boolean }) {
  const bars = 20;
  return (
    <div className="flex items-center justify-center gap-1 h-10">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: 3, backgroundColor: "#00f5ff" }}
          animate={isListening ? {
            height: [4, Math.random() * 28 + 8, 4],
            opacity: [0.3, 1, 0.3],
          } : { height: 4, opacity: 0.2 }}
          transition={{
            duration: 0.6 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.05,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InterviewAnalyzer() {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interimText, setInterimText] = useState("");
  const [fullText, setFullText] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState(INTERVIEW_PROMPTS[0]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<string>("");

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) setSupported(false);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, [stopTimer]);

  const setupRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
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
          const entry: TranscriptEntry = {
            id: Date.now(),
            text,
            timestamp: formatTime(elapsedTime),
            wordCount: words.length,
          };
          setTranscript((prev) => [...prev, entry]);
          setInterimText("");
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") return;
      if (event.error === "aborted") return;
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
    setError(null);
    setShowResults(false);
    const recognition = setupRecognition();
    if (!recognition) { setError("Speech recognition not supported."); return; }
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      setIsPaused(false);
      setSessionStarted(true);
      startTimer();
      startTimeRef.current = Date.now();
    } catch (e) {
      setError("Could not start microphone. Please allow mic access.");
    }
  }, [setupRecognition, startTimer]);

  const pauseListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    setIsPaused(true);
    setIsListening(false);
    stopTimer();
  }, [stopTimer]);

  const resumeListening = useCallback(() => {
    const recognition = setupRecognition();
    if (!recognition) return;
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      setIsPaused(false);
      startTimer();
    } catch (e) {
      setError("Could not resume. Please try again.");
    }
  }, [setupRecognition, startTimer]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsPaused(false);
    stopTimer();
    setInterimText("");
    const text = accumulatedRef.current.trim();
    if (text.length > 0) {
      const result = analyzeText(text, elapsedTime);
      setAnalysis(result);
      setShowResults(true);
    }
  }, [elapsedTime, stopTimer]);

  const resetSession = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    stopTimer();
    setIsListening(false);
    setIsPaused(false);
    setTranscript([]);
    setInterimText("");
    setFullText("");
    setFullText("");
    accumulatedRef.current = "";
    setAnalysis(null);
    setElapsedTime(0);
    setSessionStarted(false);
    setShowResults(false);
    setError(null);
  }, [stopTimer]);

  const nextPrompt = useCallback(() => {
    const next = (promptIndex + 1) % INTERVIEW_PROMPTS.length;
    setPromptIndex(next);
    setCurrentPrompt(INTERVIEW_PROMPTS[next]);
    resetSession();
  }, [promptIndex, resetSession]);

  const randomPrompt = useCallback(() => {
    let next = Math.floor(Math.random() * INTERVIEW_PROMPTS.length);
    if (next === promptIndex) next = (next + 1) % INTERVIEW_PROMPTS.length;
    setPromptIndex(next);
    setCurrentPrompt(INTERVIEW_PROMPTS[next]);
    resetSession();
  }, [promptIndex, resetSession]);

  useEffect(() => () => { stopTimer(); }, [stopTimer]);

  if (!supported) {
    return (
      <div className="glass border border-red-500/20 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">🎤</div>
        <h3 className="font-display text-2xl text-white/60 mb-2">Not Supported</h3>
        <p className="font-body text-sm text-white/40">
          Your browser does not support the Web Speech API. Please use Chrome or Edge for this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Prompt Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass border border-[#8b5cf6]/30 rounded-2xl p-6" style={{ background: "rgba(139,92,246,0.05)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <p className="font-mono text-[10px] tracking-widest text-[#8b5cf6] uppercase mb-3">
              Interview Question {promptIndex + 1} / {INTERVIEW_PROMPTS.length}
            </p>
            <p className="font-body text-white/80 text-base leading-relaxed">{currentPrompt}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <motion.button onClick={nextPrompt} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="glass border border-white/10 rounded-xl px-4 py-2 font-mono text-[10px] text-white/40 hover:text-white hover:border-white/30 transition-all duration-300 uppercase tracking-widest">
              Next →
            </motion.button>
            <motion.button onClick={randomPrompt} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="glass border border-[#8b5cf6]/30 rounded-xl px-4 py-2 font-mono text-[10px] text-[#8b5cf6] hover:bg-[#8b5cf6]/10 transition-all duration-300 uppercase tracking-widest">
              Shuffle
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left — Controls + Transcript */}
        <div className="space-y-4">

          {/* Timer + Waveform */}
          <div className="glass border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-1">Session Time</p>
                <p className="font-display text-4xl text-white/80">{formatTime(elapsedTime)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-1">Words</p>
                <p className="font-display text-4xl text-white/80">
                  {fullText.trim().split(/\s+/).filter((w) => w.length > 0).length || 0}
                </p>
              </div>
            </div>

            <WaveformVisualizer isListening={isListening} />

            {/* Status badge */}
            <div className="flex justify-center mt-3">
              <span className={`flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded-full ${
                isListening ? "text-green-400 bg-green-400/10 border border-green-400/20" :
                isPaused ? "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20" :
                "text-white/20 bg-white/5 border border-white/10"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-green-400 animate-pulse" : isPaused ? "bg-yellow-400" : "bg-white/20"}`} />
                {isListening ? "Recording" : isPaused ? "Paused" : sessionStarted ? "Stopped" : "Ready"}
              </span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {!sessionStarted ? (
              <motion.button onClick={startListening} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="col-span-2 py-4 rounded-xl font-mono text-sm tracking-widest uppercase"
                style={{ background: "#00f5ff", color: "#03040a" }}>
                🎤 Start Recording
              </motion.button>
            ) : (
              <>
                {isListening ? (
                  <motion.button onClick={pauseListening} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="py-3 rounded-xl font-mono text-xs tracking-widest uppercase glass border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 transition-all duration-300">
                    ⏸ Pause
                  </motion.button>
                ) : (
                  <motion.button onClick={resumeListening} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="py-3 rounded-xl font-mono text-xs tracking-widest uppercase glass border border-green-400/30 text-green-400 hover:bg-green-400/10 transition-all duration-300">
                    ▶ Resume
                  </motion.button>
                )}
                <motion.button onClick={stopListening} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="py-3 rounded-xl font-mono text-xs tracking-widest uppercase"
                  style={{ background: "#ec4899", color: "#03040a" }}>
                  ⏹ Analyze
                </motion.button>
              </>
            )}
            {sessionStarted && (
              <motion.button onClick={resetSession} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="col-span-2 py-2 rounded-xl font-mono text-[10px] tracking-widest uppercase glass border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-all duration-300">
                ↺ Reset Session
              </motion.button>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass border border-red-500/20 rounded-xl px-4 py-3">
                <p className="font-mono text-xs text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          {!sessionStarted && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass border border-white/[0.04] rounded-2xl p-5">
              <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-3">Tips for Best Results</p>
              <ul className="space-y-2">
                {[
                  "Speak clearly and at a natural pace",
                  "Aim for 120–160 words per minute",
                  "Avoid filler words like 'um' and 'like'",
                  "Use complete sentences with clear structure",
                  "Allow microphone access when prompted",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#8b5cf6] mt-0.5">›</span>
                    <span className="font-body text-xs text-white/35">{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Right — Live Transcript */}
        <div className="space-y-4">
          <div className="glass border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: "360px" }}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
              <span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">Live Transcript</span>
              <span className="font-mono text-[10px] text-white/20">{transcript.length} segments</span>
            </div>

            <div ref={transcriptRef} className="flex-1 overflow-y-auto p-5 space-y-3" style={{ maxHeight: "340px" }}>
              {transcript.length === 0 && !interimText && (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <div className="text-3xl mb-3 opacity-20">🎙️</div>
                  <p className="font-mono text-xs text-white/20 tracking-widest uppercase">Transcript will appear here</p>
                  <p className="font-body text-[10px] text-white/15 mt-1">Start recording to begin</p>
                </div>
              )}

              {transcript.map((entry) => (
                <motion.div key={entry.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-[#00f5ff]/40">{entry.timestamp}</span>
                    <span className="font-mono text-[9px] text-white/15">{entry.wordCount} words</span>
                  </div>
                  <p className="font-body text-sm text-white/70 leading-relaxed">{entry.text}</p>
                </motion.div>
              ))}

              {/* Interim text */}
              {interimText && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                  <span className="font-mono text-[9px] text-[#00f5ff]/40">Live...</span>
                  <p className="font-body text-sm text-white/30 italic leading-relaxed">{interimText}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Live stats during recording */}
          {sessionStarted && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Est. WPM",
                  value: elapsedTime > 5
                    ? Math.round((fullText.trim().split(/\s+/).filter((w) => w.length > 0).length / elapsedTime) * 60)
                    : "—",
                  color: "#00f5ff",
                },
                {
                  label: "Fillers",
                  value: Object.values(countFillerWords(fullText)).reduce((a, b) => a + b, 0),
                  color: "#f59e0b",
                },
                {
                  label: "Sentences",
                  value: fullText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length,
                  color: "#8b5cf6",
                },
              ].map((stat) => (
                <div key={stat.label} className="glass border border-white/[0.04] rounded-xl p-3 text-center">
                  <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="font-display text-2xl" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      <AnimatePresence>
        {showResults && analysis && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Score rings */}
            <div className="glass border border-white/[0.06] rounded-2xl p-8">
              <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase mb-8 text-center">Analysis Results</p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="flex justify-center">
                  <ScoreRing score={analysis.communicationScore} label="Communication" color={getScoreColor(analysis.communicationScore)} size={110} />
                </div>
                <div className="flex justify-center">
                  <ScoreRing score={analysis.confidenceScore} label="Confidence" color={getScoreColor(analysis.confidenceScore)} size={110} />
                </div>
                <div className="flex justify-center">
                  <ScoreRing score={analysis.clarityScore} label="Clarity" color={getScoreColor(analysis.clarityScore)} size={110} />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Speaking WPM", value: analysis.wpm, unit: "wpm", ideal: "120–160", color: getScoreColor(analysis.wpm >= 120 && analysis.wpm <= 160 ? 90 : 50) },
                  { label: "Total Words", value: analysis.totalWords, unit: "words", ideal: "80+ good", color: getScoreColor(analysis.totalWords >= 80 ? 90 : 55) },
                  { label: "Filler Words", value: analysis.fillerWordCount, unit: "times", ideal: "< 3 good", color: getScoreColor(analysis.fillerWordCount < 3 ? 90 : analysis.fillerWordCount < 7 ? 65 : 30) },
                  { label: "Vocabulary", value: `${analysis.vocabularyRichness}%`, unit: "unique", ideal: "60%+ good", color: getScoreColor(analysis.vocabularyRichness >= 60 ? 90 : 55) },
                ].map((stat) => (
                  <div key={stat.label} className="glass border border-white/[0.04] rounded-xl p-4 text-center">
                    <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className="font-display text-2xl mb-1" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="font-mono text-[9px] text-white/15">{stat.unit} · {stat.ideal}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Filler words breakdown */}
            {Object.keys(analysis.fillerWords).length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass border border-[#f59e0b]/20 rounded-2xl p-6" style={{ background: "rgba(245,158,11,0.03)" }}>
                <p className="font-mono text-[10px] tracking-widest text-[#f59e0b] uppercase mb-4">Filler Words Detected</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(analysis.fillerWords)
                    .sort(([, a], [, b]) => b - a)
                    .map(([word, count]) => (
                      <div key={word} className="flex items-center gap-2 glass border border-[#f59e0b]/20 rounded-full px-4 py-2">
                        <span className="font-body text-sm text-white/60">"{word}"</span>
                        <span className="font-display text-sm text-[#f59e0b]">×{count}</span>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Strengths + Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              {analysis.strengths.length > 0 && (
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass border border-[#00f5ff]/20 rounded-2xl p-6" style={{ background: "rgba(0,245,255,0.03)" }}>
                  <p className="font-mono text-[10px] tracking-widest text-[#00f5ff] uppercase mb-4">✓ Strengths</p>
                  <ul className="space-y-3">
                    {analysis.strengths.map((s, i) => (
                      <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="flex items-start gap-3">
                        <span className="text-[#00f5ff] mt-0.5 shrink-0">›</span>
                        <span className="font-body text-sm text-white/60 leading-relaxed">{s}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Improvements */}
              {analysis.improvements.length > 0 && (
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass border border-[#ec4899]/20 rounded-2xl p-6" style={{ background: "rgba(236,72,153,0.03)" }}>
                  <p className="font-mono text-[10px] tracking-widest text-[#ec4899] uppercase mb-4">↑ Areas to Improve</p>
                  <ul className="space-y-3">
                    {analysis.improvements.map((s, i) => (
                      <motion.li key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }} className="flex items-start gap-3">
                        <span className="text-[#ec4899] mt-0.5 shrink-0">›</span>
                        <span className="font-body text-sm text-white/60 leading-relaxed">{s}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>

            {/* Full transcript */}
            {fullText && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass border border-white/[0.04] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-mono text-[10px] tracking-widest text-white/20 uppercase">Full Transcript</p>
                  <span className="font-mono text-[10px] text-white/20">{analysis.totalWords} words · {formatTime(analysis.totalTime)}</span>
                </div>
                <p className="font-body text-sm text-white/50 leading-relaxed">{fullText}</p>
              </motion.div>
            )}

            {/* Try again */}
            <div className="flex gap-3">
              <motion.button onClick={resetSession} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl font-mono text-sm tracking-widest uppercase"
                style={{ background: "#8b5cf6", color: "#fff" }}>
                ↺ Try Again
              </motion.button>
              <motion.button onClick={nextPrompt} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl font-mono text-sm tracking-widest uppercase glass border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all duration-300">
                Next Question →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}