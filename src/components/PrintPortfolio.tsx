"use client";

import React from "react";

export default function PrintPortfolio() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="hidden print:block text-black bg-white font-sans text-xs leading-relaxed">

      {/* ==================================================================== */}
      {/* PAGE 1: EXECUTIVE OVERVIEW & AI FINANCIAL ANALYST (FLAGSHIP SYSTEM)  */}
      {/* ==================================================================== */}
      <div className="min-h-screen p-2 flex flex-col justify-between" style={{ pageBreakAfter: "always" }}>
        <div>
          {/* Document Header */}
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-black">ANISH REDDY</h1>
              <p className="text-sm font-semibold tracking-wider text-gray-700 uppercase mt-0.5">
                AI Researcher & Systems Engineer
              </p>
            </div>
            <div className="text-right text-[0.7rem] font-mono text-gray-700 leading-tight">
              <p>Email: anishreddy1373@gmail.com</p>
              <p>GitHub: github.com/anishreddy13</p>
              <p>LinkedIn: linkedin.com/in/anishreddy5676</p>
              <p>Portfolio: https://anishreddy.online</p>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest bg-gray-100 p-1.5 border-l-4 border-black mb-2">
              EXECUTIVE PROFILE & TECHNICAL ARCHITECTURE
            </h2>
            <p className="text-gray-800 text-[0.78rem] leading-relaxed">
              Specialized in engineering end-to-end Machine Learning pipelines, multi-agent AI systems, deep learning computer vision endpoints, and production microservices. Platform architecture combines PyTorch neural networks, LangGraph orchestration, FastAPI backends, Supabase realtime telemetry, and Dockerized Hugging Face Spaces.
            </p>
          </div>

          {/* Core Tech Stack Matrix */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest bg-gray-100 p-1.5 border-l-4 border-black mb-2">
              CORE SYSTEM STACK & INFRASTRUCTURE
            </h2>
            <div className="grid grid-cols-4 gap-2 text-[0.72rem]">
              <div className="border p-2 rounded">
                <span className="font-bold block text-black border-b pb-1 mb-1">AI & Multi-Agent</span>
                <p className="text-gray-700">LangGraph, Groq Llama-3, ReAct Agent Loops, Tool Calling</p>
              </div>
              <div className="border p-2 rounded">
                <span className="font-bold block text-black border-b pb-1 mb-1">Deep Learning & CV</span>
                <p className="text-gray-700">PyTorch, EfficientNet-B0, Custom CNNs, Grad-CAM XAI</p>
              </div>
              <div className="border p-2 rounded">
                <span className="font-bold block text-black border-b pb-1 mb-1">Backend & MLOps</span>
                <p className="text-gray-700">FastAPI, Render.com, Supabase, Upstash Redis, Docker</p>
              </div>
              <div className="border p-2 rounded">
                <span className="font-bold block text-black border-b pb-1 mb-1">Frontend & Web</span>
                <p className="text-gray-700">Next.js 14, TypeScript, TailwindCSS, Framer Motion</p>
              </div>
            </div>
          </div>

          {/* FLAGSHIP PROJECT: AI FINANCIAL ANALYST */}
          <div className="mb-6 border-2 border-black p-4 rounded">
            <div className="flex justify-between items-center mb-2 border-b pb-2">
              <div>
                <span className="text-[0.65rem] font-mono uppercase bg-black text-white px-2 py-0.5 font-bold mr-2">
                  FLAGSHIP SYSTEM 01
                </span>
                <h3 className="text-lg font-extrabold inline text-black">AI FINANCIAL ANALYST PLATFORM</h3>
              </div>
              <span className="text-xs font-mono font-bold text-gray-700">Multi-Agent AI & PyTorch Vision</span>
            </div>

            <p className="text-[0.76rem] text-gray-800 mb-3">
              Enterprise financial intelligence engine orchestrated by 5 specialized AI agents communicating via graph state machines, integrated with PyTorch Neural Chart Vision and real-time portfolio rebalancing.
            </p>

            <div className="grid grid-cols-2 gap-3 text-[0.72rem] mb-3">
              <div className="bg-gray-50 p-2.5 rounded border">
                <h4 className="font-bold text-black border-b pb-1 mb-1.5">🤖 5-Agent Architecture Breakdown</h4>
                <ul className="space-y-1 text-gray-700">
                  <li>• <strong>Researcher Agent</strong>: Scrapes & synthesizes SEC filings, news feeds, and RSS.</li>
                  <li>• <strong>Quant Agent</strong>: Computes RSI, MACD, SMA-200, Sharpe ratios, and beta metrics.</li>
                  <li>• <strong>Auditor Agent</strong>: Evaluates risk metrics, debt ratios, and solvency signals.</li>
                  <li>• <strong>Competitor Agent</strong>: Benchmarks peers and market sector positioning.</li>
                  <li>• <strong>Editor Agent</strong>: Synthesizes final structured PDF and markdown reports.</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-2.5 rounded border">
                <h4 className="font-bold text-black border-b pb-1 mb-1.5">👁️ Neural Vision & Risk Engine</h4>
                <ul className="space-y-1 text-gray-700">
                  <li>• <strong>CNN + Transformer Vision</strong>: Scans chart images for head & shoulders, support/resistance.</li>
                  <li>• <strong>Mean-Variance Rebalancer</strong>: Calculates optimal asset weights and risk frontiers.</li>
                  <li>• <strong>Explainability (XAI)</strong>: Provides line-item rationale for all agent recommendations.</li>
                  <li>• <strong>Live Infrastructure</strong>: Deployed on Hugging Face Spaces + Gradio Client.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between items-center text-[0.68rem] font-mono bg-gray-100 p-2 rounded">
              <span>Technologies: LangGraph · PyTorch · Groq Llama-3 · yfinance · Gradio · Next.js</span>
              <span className="font-bold">Route: /projects/ai-financial-analyst</span>
            </div>
          </div>
        </div>

        {/* Page Footer */}
        <div className="border-t pt-2 text-between flex justify-between text-[0.65rem] font-mono text-gray-500">
          <span>AnishReddy.Online — Technical Portfolio Specification</span>
          <span>Page 1 of 3</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PAGE 2: DEEP LEARNING & COMPUTER VISION SUITE (ML LAB)               */}
      {/* ==================================================================== */}
      <div className="min-h-screen p-2 flex flex-col justify-between" style={{ pageBreakAfter: "always" }}>
        <div>
          {/* Header */}
          <div className="border-b pb-2 mb-4 flex justify-between items-center">
            <h2 className="text-base font-extrabold text-black">SECTION 02: COMPUTER VISION & DEEP LEARNING SUITE</h2>
            <span className="text-xs font-mono text-gray-600">ML Lab Production Models</span>
          </div>

          {/* PROJECT 01: PLANT DISEASE DETECTION */}
          <div className="mb-5 border p-3.5 rounded bg-white">
            <div className="flex justify-between items-center mb-2 border-b pb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] font-mono font-bold bg-black text-white px-2 py-0.5 rounded">
                  MODEL CV-01
                </span>
                <h3 className="text-sm font-bold text-black">Plant Disease Classifier & Grad-CAM Explainability</h3>
              </div>
              <span className="text-xs font-mono font-bold text-gray-700">Accuracy: 97.84% · 38 Classes</span>
            </div>

            <p className="text-[0.74rem] text-gray-800 mb-2">
              Production-grade PyTorch leaf pathology model trained on 20,000+ agricultural images. Uses EfficientNet-B0 transfer learning with real-time Grad-CAM visual heatmaps that highlight affected leaf regions for explainable AI diagnostics.
            </p>

            <div className="grid grid-cols-3 gap-2 text-[0.7rem] bg-gray-50 p-2 rounded mb-2">
              <div>
                <span className="font-bold text-black block">Model Backbone</span>
                <span className="text-gray-700">EfficientNet-B0 (Pretrained ImageNet weights)</span>
              </div>
              <div>
                <span className="font-bold text-black block">Explainable AI</span>
                <span className="text-gray-700">Grad-CAM (Gradient-weighted Class Activation)</span>
              </div>
              <div>
                <span className="font-bold text-black block">Inference Host</span>
                <span className="text-gray-700">Hugging Face Spaces FastAPI Docker Container</span>
              </div>
            </div>

            <div className="text-[0.68rem] font-mono text-gray-600">
              Features: Multipart Image Upload · Top-5 Confidence Breakdown · Live Camera Capture · Offline Fallback
            </div>
          </div>

          {/* PROJECT 02: SKIN LESION ANALYZER */}
          <div className="mb-5 border p-3.5 rounded bg-white">
            <div className="flex justify-between items-center mb-2 border-b pb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] font-mono font-bold bg-black text-white px-2 py-0.5 rounded">
                  MODEL CV-02
                </span>
                <h3 className="text-sm font-bold text-black">Skin Lesion Classifier & Medical Risk Panel</h3>
              </div>
              <span className="text-xs font-mono font-bold text-gray-700">HAM10000 Dataset · 7 Lesion Classes</span>
            </div>

            <p className="text-[0.74rem] text-gray-800 mb-2">
              Dermatological lesion classification pipeline trained on the HAM10000 dataset (melanoma, melanocytic nevi, basal cell carcinoma, actinic keratoses). Includes multi-class probability scoring, top-5 confidence ranking, and risk category alerts.
            </p>

            <div className="grid grid-cols-3 gap-2 text-[0.7rem] bg-gray-50 p-2 rounded mb-2">
              <div>
                <span className="font-bold text-black block">Dataset</span>
                <span className="text-gray-700">HAM10000 Dermatoscopy (10,015 images)</span>
              </div>
              <div>
                <span className="font-bold text-black block">Target Output</span>
                <span className="text-gray-700">7 Lesion Categories + Malignancy Risk Level</span>
              </div>
              <div>
                <span className="font-bold text-black block">API Endpoint</span>
                <span className="text-gray-700">FastAPI `/predict/skin` (Base64 / Multipart)</span>
              </div>
            </div>
          </div>

          {/* PROJECT 03: NEURAL CHART VISION */}
          <div className="mb-5 border p-3.5 rounded bg-white">
            <div className="flex justify-between items-center mb-2 border-b pb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] font-mono font-bold bg-black text-white px-2 py-0.5 rounded">
                  MODEL CV-03
                </span>
                <h3 className="text-sm font-bold text-black">Neural Chart Pattern Recognition Engine</h3>
              </div>
              <span className="text-xs font-mono font-bold text-gray-700">Visual Pattern Mining</span>
            </div>

            <p className="text-[0.74rem] text-gray-800 mb-2">
              Computer vision algorithm for technical chart analysis. Detects double bottoms, head & shoulders, triangle consolidations, and support/resistance boundaries directly from chart image artifacts.
            </p>

            <div className="text-[0.68rem] font-mono text-gray-600">
              Stack: PyTorch · OpenCV · ResNet Feature Extractor · Gradio Inference Pipeline
            </div>
          </div>
        </div>

        {/* Page Footer */}
        <div className="border-t pt-2 text-between flex justify-between text-[0.65rem] font-mono text-gray-500">
          <span>AnishReddy.Online — Technical Portfolio Specification</span>
          <span>Page 2 of 3</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PAGE 3: NLP SUITE, SPEECH AI & MLOPS PRODUCTION INFRASTRUCTURE        */}
      {/* ==================================================================== */}
      <div className="min-h-screen p-2 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="border-b pb-2 mb-4 flex justify-between items-center">
            <h2 className="text-base font-extrabold text-black">SECTION 03: NLP SUITE, SPEECH AI & MLOPS INFRASTRUCTURE</h2>
            <span className="text-xs font-mono text-gray-600">Production Systems</span>
          </div>

          {/* NLP & SPEECH MODELS GRID */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            
            {/* SOCIAL SENTINEL */}
            <div className="border p-3 rounded">
              <span className="text-[0.6rem] font-mono bg-black text-white px-1.5 py-0.5 font-bold">NLP-01</span>
              <h3 className="text-xs font-bold text-black mt-1">Social Sentinel & Market Sentiment</h3>
              <p className="text-[0.7rem] text-gray-700 mt-1">
                Real-time RSS ingestion pipeline scanning Twitter/X and financial news feeds. Runs DistilBERT / scikit-learn sentiment classification for bullish/bearish market signals.
              </p>
              <div className="mt-2 text-[0.65rem] font-mono text-gray-500">
                Tech: RSS Feedparser · TF-IDF / DistilBERT · FastAPI
              </div>
            </div>

            {/* SPAM DETECTION */}
            <div className="border p-3 rounded">
              <span className="text-[0.6rem] font-mono bg-black text-white px-1.5 py-0.5 font-bold">NLP-02</span>
              <h3 className="text-xs font-bold text-black mt-1">SMS & Email Spam Filter API</h3>
              <p className="text-[0.7rem] text-gray-700 mt-1">
                Security-focused text classifier identifying spam vs ham probability with high precision, keyword extraction, confidence scoring, and low latency execution.
              </p>
              <div className="mt-2 text-[0.65rem] font-mono text-gray-500">
                Tech: scikit-learn · MultinomialNB · FastAPI
              </div>
            </div>

            {/* EMOTION DETECTION */}
            <div className="border p-3 rounded">
              <span className="text-[0.6rem] font-mono bg-black text-white px-1.5 py-0.5 font-bold">NLP-03</span>
              <h3 className="text-xs font-bold text-black mt-1">Multi-Task Emotion & Demographic Model</h3>
              <p className="text-[0.7rem] text-gray-700 mt-1">
                Multi-task NLP model predicting 28 emotion categories alongside auxiliary gender and age signals from unstructured user text.
              </p>
              <div className="mt-2 text-[0.65rem] font-mono text-gray-500">
                Tech: HuggingFace Transformers · Multi-Task Classification
              </div>
            </div>

            {/* SPEECH AI INTERVIEW ANALYZER */}
            <div className="border p-3 rounded">
              <span className="text-[0.6rem] font-mono bg-black text-white px-1.5 py-0.5 font-bold">SPEECH-01</span>
              <h3 className="text-xs font-bold text-black mt-1">AI Interview Practice & Speech AI</h3>
              <p className="text-[0.7rem] text-gray-700 mt-1">
                Browser-native live speech recognition module analyzing vocal cadence, response structure, grammar accuracy, and technical keyword coverage.
              </p>
              <div className="mt-2 text-[0.65rem] font-mono text-gray-500">
                Tech: Web Speech API · Speech-to-Text · Feedback Engine
              </div>
            </div>
          </div>

          {/* MLOPS & PRODUCTION INFRASTRUCTURE */}
          <div className="border-2 border-black p-4 rounded bg-gray-50 mb-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black border-b border-black pb-1.5 mb-3">
              ENGINEERING INFRASTRUCTURE & MLOPS PIPELINE
            </h3>

            <div className="grid grid-cols-3 gap-3 text-[0.72rem]">
              <div>
                <h4 className="font-bold text-black">🚀 Microservices & Containers</h4>
                <p className="text-gray-700 leading-snug">
                  FastAPI backends deployed on Render.com and Hugging Face Docker Spaces with automatic container health monitoring and graceful fallback handling.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-black">⚡ Realtime Data & Telemetry</h4>
                <p className="text-gray-700 leading-snug">
                  Supabase PostgreSQL stores system telemetry and contact submissions. Upstash Redis manages async background prediction queues.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-black">⏱️ Latency & Optimization</h4>
                <p className="text-gray-700 leading-snug">
                  Sub-50ms inference latency on scikit-learn models; PyTorch models optimized via JIT compilation and tensor quantization.
                </p>
              </div>
            </div>
          </div>

          {/* Summary Callout */}
          <div className="border p-3 rounded text-center bg-black text-white">
            <p className="text-[0.74rem] font-mono">
              Complete source code, live demos, and API documentation available at <strong>https://anishreddy.online</strong>
            </p>
          </div>
        </div>

        {/* Page Footer */}
        <div className="border-t pt-2 text-between flex justify-between text-[0.65rem] font-mono text-gray-500">
          <span>AnishReddy.Online — Technical Portfolio Specification</span>
          <span>Page 3 of 3</span>
        </div>
      </div>

    </div>
  );
}
