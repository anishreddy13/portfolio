"use client";

import React from "react";

export default function PrintPortfolio() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="hidden print:block text-black bg-white font-sans text-xs leading-relaxed">

      {/* ==================================================================== */}
      {/* SECTION 1: SYSTEM OVERVIEW & ARCHITECTURE FLOWCHART                   */}
      {/* ==================================================================== */}
      <div className="p-2 mb-6" style={{ pageBreakAfter: "always", breakAfter: "page" }}>
        {/* Document Header */}
        <div className="border-b-2 border-black pb-3 mb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-black">ANISHREDDY.ONLINE</h1>
            <p className="text-xs font-bold tracking-wider text-gray-800 uppercase mt-0.5">
              Full Platform Technical Architecture & System Specification
            </p>
          </div>
          <div className="text-right text-[0.68rem] font-mono text-gray-700 leading-tight">
            <p>Author: Anish Reddy (AI Researcher & Systems Engineer)</p>
            <p>Contact: anishreddy1373@gmail.com · Hyderabad, India</p>
            <p>GitHub: github.com/anishreddy13 · LinkedIn: in/anishreddy5676</p>
            <p>Specification Version: 3.2.0 (Production Release)</p>
          </div>
        </div>

        {/* 1.1 Platform Architectural Flowchart */}
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest bg-gray-100 p-1.5 border-l-4 border-black mb-2">
            1.1 END-TO-END SYSTEM INFRASTRUCTURE & DATAFLOW DIAGRAM
          </h2>
          <div className="bg-gray-50 border border-black p-3 font-mono text-[0.62rem] leading-tight overflow-hidden">
            <pre className="whitespace-pre">
{`+---------------------------------------------------------------------------------------------------+
|                                  USER CLIENT / BROWSER INTERFACE                                  |
|   Next.js 14 App Router (React 18) · TailwindCSS · Framer Motion · Web Speech API · Gradio Client   |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                (HTTP REST / WebSocket / JSON / Multipart)
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                  EDGE MIDDLEWARE & NEXT-INTL ROUTER                               |
|   middleware.ts (Negative lookahead /api exclusion) · next-intl (English Standard Routing)        |
+---------------------------------------------------------------------------------------------------+
            |                                     |                                   |
            | (Contact API)                       | (AI Analyst Proxy)                | (ML Models)
            v                                     v                                   v
+-----------------------+             +-----------------------+           +-----------------------+
|  VERCEL SERVERLESS    |             | HUGGING FACE SPACES   |           | RENDER.COM FASTAPI    |
|  /api/contact         |             | Docker / Gradio API   |           | Python 3.11 Microservice|
|  (Node.js Runtime)    |             | - AI Financial Analyst|           | - Sentiment Model     |
+-----------------------+             | - Plant Disease API   |           | - Spam Classifier     |
     |              |                 | - Skin Cancer API     |           | - Emotion Model       |
     |              |                 +-----------------------+           | - Breast Cancer Model |
 (Resend Email) (Supabase)                        |                       +-----------------------+
     |              |                 (Groq Llama-3 LLM Agents)                       |
     v              v                             v                                       v
[Resend.com]  [Supabase DB]               [Groq Cloud API]                     [Upstash Redis Queue]`}
            </pre>
          </div>
        </div>

        {/* 1.2 Technology Matrix */}
        <div className="mb-4" style={{ breakInside: "avoid" }}>
          <h2 className="text-xs font-bold uppercase tracking-widest bg-gray-100 p-1.5 border-l-4 border-black mb-2">
            1.2 PRODUCTION TECHNOLOGY & FRAMEWORK BREAKDOWN
          </h2>
          <table className="w-full border-collapse border border-gray-300 text-[0.68rem]">
            <thead>
              <tr className="bg-gray-100 font-bold border-b border-gray-300 text-left">
                <th className="p-1.5 border-r border-gray-300">Layer</th>
                <th className="p-1.5 border-r border-gray-300">Technologies Used</th>
                <th className="p-1.5 border-r border-gray-300">Primary Purpose / Function</th>
                <th className="p-1.5">Deployment Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              <tr>
                <td className="p-1.5 font-bold border-r border-gray-300">AI & Agents</td>
                <td className="p-1.5 border-r border-gray-300">LangGraph, Groq Llama-3, ReAct Loops</td>
                <td className="p-1.5 border-r border-gray-300">5-agent financial research state machine orchestration</td>
                <td className="p-1.5">Hugging Face Spaces</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold border-r border-gray-300">Deep Learning</td>
                <td className="p-1.5 border-r border-gray-300">PyTorch, EfficientNet-B0, ResNet, OpenCV</td>
                <td className="p-1.5 border-r border-gray-300">Computer vision leaf/skin pathology & chart pattern recognition</td>
                <td className="p-1.5">HF Spaces Docker Container</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold border-r border-gray-300">ML Microservices</td>
                <td className="p-1.5 border-r border-gray-300">FastAPI, scikit-learn, DistilBERT, NLTK</td>
                <td className="p-1.5 border-r border-gray-300">Text sentiment, spam security filter, 28-emotion classification</td>
                <td className="p-1.5">Render.com Cloud</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold border-r border-gray-300">Data & Queues</td>
                <td className="p-1.5 border-r border-gray-300">Supabase PostgreSQL, Upstash Redis</td>
                <td className="p-1.5 border-r border-gray-300">Contact form persistence, telemetry logging, task queues</td>
                <td className="p-1.5">Supabase / Upstash Cloud</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold border-r border-gray-300">Web App</td>
                <td className="p-1.5 border-r border-gray-300">Next.js 14 (App Router), TypeScript, Tailwind</td>
                <td className="p-1.5 border-r border-gray-300">Interactive platform shell, interactive demos, SSR & PDF export</td>
                <td className="p-1.5">Vercel Edge Network</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t pt-2 text-between flex justify-between text-[0.65rem] font-mono text-gray-500">
          <span>AnishReddy.Online — System Specification Blueprint</span>
          <span>Section 1 · Page 1</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 2: AI FINANCIAL ANALYST (5-AGENT ARCHITECTURE DEEP DIVE)      */}
      {/* ==================================================================== */}
      <div className="p-2 mb-6" style={{ pageBreakAfter: "always", breakAfter: "page" }}>
        <div className="border-b pb-2 mb-3 flex justify-between items-center">
          <h2 className="text-sm font-extrabold text-black uppercase">
            SECTION 2: AI FINANCIAL ANALYST PLATFORM — 5-AGENT MULTI-AGENT ARCHITECTURE
          </h2>
          <span className="text-[0.65rem] font-mono text-gray-600 font-bold">Flagship Project 01</span>
        </div>

        {/* 2.1 Agent State Machine Diagram */}
        <div className="mb-4">
          <h3 className="text-[0.72rem] font-bold uppercase tracking-wider bg-gray-100 p-1 border-l-3 border-black mb-2">
            2.1 LANGGRAPH MULTI-AGENT STATE GRAPH WORKFLOW
          </h3>
          <div className="bg-gray-50 border border-black p-2.5 font-mono text-[0.6rem] leading-tight">
            <pre className="whitespace-pre">
{`                  +-------------------------------------------------------+
                  |  START STATE: User Ticker Query (e.g. AAPL, NVDA)    |
                  +-------------------------------------------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------------------+
| [AGENT 1: RESEARCHER AGENT]                                                                       |
| Fetches SEC EDGAR filings (10-K, 10-Q), Yahoo Finance financials, RSS market news, macro data.    |
+---------------------------------------------------------------------------------------------------+
                                              |
                        +---------------------+---------------------+
                        v                                           v
+-----------------------------------------------+   +-----------------------------------------------+
| [AGENT 2: QUANT AGENT]                        |   | [AGENT 3: AUDITOR AGENT]                      |
| Calculates RSI (14), MACD, SMA-200, Sharpe,   |   | Evaluates debt ratios, free cash flow (FCF),  |
| Alpha, Beta, and Mean-Variance optimization.  |   | Altman Z-score, solvency, and forensic risk.  |
+-----------------------------------------------+   +-----------------------------------------------+
                        \                                           /
                         +--------------------+--------------------+
                                              v
+---------------------------------------------------------------------------------------------------+
| [AGENT 4: COMPETITOR AGENT]                                                                       |
| Benchmarks P/E ratios, EV/EBITDA, and revenue growth rates against sector peers (e.g. MSFT, AMD). |
+---------------------------------------------------------------------------------------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------------------+
| [AGENT 5: EDITOR AGENT]                                                                           |
| Synthesizes all agent outputs into structured Markdown, executive summaries, and signal ratings.   |
+---------------------------------------------------------------------------------------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------------------+
|  END STATE: Interactive Explainer UI + Structured Report PDF Export                               |
+---------------------------------------------------------------------------------------------------+`}
            </pre>
          </div>
        </div>

        {/* 2.2 Neural Chart Vision & Quantitative Rebalancer */}
        <div className="grid grid-cols-2 gap-3 mb-4" style={{ breakInside: "avoid" }}>
          <div className="border p-2.5 rounded bg-gray-50">
            <h4 className="text-[0.72rem] font-bold text-black border-b pb-1 mb-1.5">
              👁️ PyTorch Neural Chart Vision Engine
            </h4>
            <p className="text-[0.7rem] text-gray-800 leading-relaxed mb-2">
              Combines a ResNet CNN feature extractor with a Transformer encoder block to process stock chart imagery directly.
            </p>
            <ul className="text-[0.68rem] text-gray-700 space-y-1 font-mono">
              <li>• <strong>Pattern Classification</strong>: Head & Shoulders, Double Bottom, Cup & Handle.</li>
              <li>• <strong>Trend Extraction</strong>: Automated Support/Resistance line calculation.</li>
              <li>• <strong>Input Pipeline</strong>: 224x224 RGB image tensors via OpenCV & torchvision.</li>
            </ul>
          </div>

          <div className="border p-2.5 rounded bg-gray-50">
            <h4 className="text-[0.72rem] font-bold text-black border-b pb-1 mb-1.5">
              ⚖️ Mean-Variance Portfolio Rebalancer
            </h4>
            <p className="text-[0.7rem] text-gray-800 leading-relaxed mb-2">
              Mathematical risk optimization engine computing Markowitz efficient frontier weights for target asset allocations.
            </p>
            <ul className="text-[0.68rem] text-gray-700 space-y-1 font-mono">
              <li>• <strong>Sharpe Maximization</strong>: Solves optimal risk-adjusted asset weights.</li>
              <li>• <strong>Volatility Control</strong>: Calculates covariance matrix and asset betas.</li>
              <li>• <strong>Rebalance Signals</strong>: Returns actionable +% / -% allocation adjustments.</li>
            </ul>
          </div>
        </div>

        {/* 2.3 Code & File Architecture */}
        <div className="border p-2.5 rounded" style={{ breakInside: "avoid" }}>
          <h3 className="text-[0.72rem] font-bold text-black border-b pb-1 mb-2 uppercase font-mono">
            2.3 Codebase Structure & File Mapping
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[0.68rem] font-mono text-gray-800">
            <div>
              <p>• <strong>`src/components/FinancialAnalystExplainer.tsx`</strong>: Interactive System Tour UI, 5-agent state graph visualizer, sample ticker presets.</p>
              <p>• <strong>`src/components/HeadlessFinancialAnalyst.tsx`</strong>: Full financial dashboard, stock charts, live AI agent execution trigger.</p>
            </div>
            <div>
              <p>• <strong>`src/lib/financialAnalystClient.ts`</strong>: Hugging Face Gradio client wrapper (`@gradio/client`) for zero-latency API streaming.</p>
              <p>• <strong>`src/lib/financialAnalystContent.ts`</strong>: Technical explainer content, model architecture definitions, and sample ticker metrics.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-2 text-between flex justify-between text-[0.65rem] font-mono text-gray-500 mt-4">
          <span>AnishReddy.Online — System Specification Blueprint</span>
          <span>Section 2 · Page 2</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 3: COMPUTER VISION & MEDICAL PATHOLOGY SUITE                 */}
      {/* ==================================================================== */}
      <div className="p-2 mb-6" style={{ pageBreakAfter: "always", breakAfter: "page" }}>
        <div className="border-b pb-2 mb-3 flex justify-between items-center">
          <h2 className="text-sm font-extrabold text-black uppercase">
            SECTION 3: COMPUTER VISION & DEEP LEARNING PATHOLOGY SUITE
          </h2>
          <span className="text-[0.65rem] font-mono text-gray-600 font-bold">ML Lab Vision Models</span>
        </div>

        {/* 3.1 Plant Disease Classifier */}
        <div className="border-2 border-black p-3 rounded mb-4" style={{ breakInside: "avoid" }}>
          <div className="flex justify-between items-center border-b pb-1.5 mb-2">
            <span className="font-mono text-xs font-bold text-black uppercase">
              MODEL 3.1: PLANT DISEASE CLASSIFIER & GRAD-CAM EXPLAINABILITY
            </span>
            <span className="font-mono text-[0.65rem] font-bold bg-black text-white px-2 py-0.5">
              ACCURACY: 97.84% · 38 PATHOLOGY CLASSES
            </span>
          </div>

          <p className="text-[0.74rem] text-gray-800 mb-3 leading-relaxed">
            Deep learning computer vision model designed to classify 38 distinct plant species and pathology conditions (e.g. Tomato Late Blight, Apple Scab, Corn Common Rust). Features real-time Grad-CAM (Gradient-weighted Class Activation Mapping) heatmaps that visually highlight affected leaf regions for transparent explainable AI diagnostics.
          </p>

          <div className="bg-gray-50 border p-2.5 font-mono text-[0.62rem] mb-3">
            <p className="font-bold border-b pb-1 mb-1 text-black">DIAGNOSTIC PIPELINE FLOWCHART:</p>
            <pre className="whitespace-pre text-gray-800">
{`[Leaf Upload / Webcam] -> [Resize 224x224 & Normalize] -> [EfficientNet-B0 Backbone]
                                                                     |
[Grad-CAM Visual Heatmap] <- [Softmax Top-5 Probabilities] <- [FC Classifier Layer]`}
            </pre>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[0.68rem]">
            <div className="border p-2 rounded bg-gray-50">
              <span className="font-bold block text-black">Dataset Scale</span>
              <span className="text-gray-700">20,000+ high-resolution agricultural leaf images across 38 classes.</span>
            </div>
            <div className="border p-2 rounded bg-gray-50">
              <span className="font-bold block text-black">Model Weights</span>
              <span className="text-gray-700">EfficientNet-B0 fine-tuned with PyTorch transfer learning.</span>
            </div>
            <div className="border p-2 rounded bg-gray-50">
              <span className="font-bold block text-black">Deployment</span>
              <span className="text-gray-700">FastAPI microservice running inside Hugging Face Spaces Docker container.</span>
            </div>
          </div>
        </div>

        {/* 3.2 Skin Lesion Analyzer */}
        <div className="border-2 border-black p-3 rounded mb-4" style={{ breakInside: "avoid" }}>
          <div className="flex justify-between items-center border-b pb-1.5 mb-2">
            <span className="font-mono text-xs font-bold text-black uppercase">
              MODEL 3.2: DERMATOLOGICAL SKIN LESION CLASSIFIER
            </span>
            <span className="font-mono text-[0.65rem] font-bold bg-black text-white px-2 py-0.5">
              HAM10000 DATASET · 7 CLINICAL CLASSES
            </span>
          </div>

          <p className="text-[0.74rem] text-gray-800 mb-3 leading-relaxed">
            Medical dermatoscopy classification engine trained on the HAM10000 dataset (Human Against Skin Cancer). Classifies lesions into 7 diagnostic categories including Melanoma (MEL), Melanocytic Nevi (NV), Basal Cell Carcinoma (BCC), and Actinic Keratoses (AKIEC).
          </p>

          <div className="grid grid-cols-2 gap-3 text-[0.68rem] font-mono">
            <div className="border p-2 rounded bg-gray-50">
              <span className="font-bold block text-black mb-1">Target Categories</span>
              <p className="text-gray-700">1. Melanoma (MEL)</p>
              <p className="text-gray-700">2. Melanocytic Nevi (NV)</p>
              <p className="text-gray-700">3. Basal Cell Carcinoma (BCC)</p>
              <p className="text-gray-700">4. Actinic Keratoses (AKIEC)</p>
            </div>
            <div className="border p-2 rounded bg-gray-50">
              <span className="font-bold block text-black mb-1">Output Payload Schema</span>
              <p className="text-gray-700">• `predicted_class`: Clinical diagnostic code</p>
              <p className="text-gray-700">• `confidence_score`: Top probability percentage</p>
              <p className="text-gray-700">• `risk_level`: Low / Moderate / High clinical alert</p>
              <p className="text-gray-700">• `top_5_predictions`: Ranked candidate list</p>
            </div>
          </div>
        </div>

        {/* 3.3 Codebase Components */}
        <div className="border p-2.5 rounded bg-gray-50" style={{ breakInside: "avoid" }}>
          <span className="font-mono text-[0.7rem] font-bold text-black block mb-1">COMPONENT FILE MAPPING:</span>
          <p className="font-mono text-[0.68rem] text-gray-800">
            • <strong>`src/components/PlantDiseaseDetector.tsx`</strong>: Full leaf upload UI, webcam frame capture, top-5 prediction bar charts, and Grad-CAM overlay toggle.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t pt-2 text-between flex justify-between text-[0.65rem] font-mono text-gray-500 mt-4">
          <span>AnishReddy.Online — System Specification Blueprint</span>
          <span>Section 3 · Page 3</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 4: NLP SUITE, SPEECH AI & PRODUCTION APIS                     */}
      {/* ==================================================================== */}
      <div className="p-2 mb-6" style={{ pageBreakAfter: "always", breakAfter: "page" }}>
        <div className="border-b pb-2 mb-3 flex justify-between items-center">
          <h2 className="text-sm font-extrabold text-black uppercase">
            SECTION 4: NATURAL LANGUAGE PROCESSING & SPEECH AI SUITE
          </h2>
          <span className="text-[0.65rem] font-mono text-gray-600 font-bold">ML Lab NLP Models</span>
        </div>

        {/* 4.1 Social Sentinel */}
        <div className="border p-3 rounded mb-3 bg-white" style={{ breakInside: "avoid" }}>
          <div className="flex justify-between items-center border-b pb-1 mb-1.5">
            <h3 className="font-bold text-xs text-black">4.1 Social Sentinel — Real-Time Sentiment & RSS Ingestion</h3>
            <span className="font-mono text-[0.62rem] text-gray-600">TF-IDF + DistilBERT · FastAPI</span>
          </div>
          <p className="text-[0.72rem] text-gray-800 leading-relaxed mb-2">
            In-flight social sentiment monitor scanning financial news feeds, Twitter/X, and Reddit RSS. Parses raw text through custom NLTK tokenization and scikit-learn TF-IDF pipelines to score market sentiment (Bullish / Bearish / Neutral).
          </p>
          <div className="text-[0.66rem] font-mono text-gray-600 bg-gray-50 p-1.5 rounded">
            API Route: `POST /predict` · File: `src/components/SocialSentinel.tsx`
          </div>
        </div>

        {/* 4.2 Spam Filter */}
        <div className="border p-3 rounded mb-3 bg-white" style={{ breakInside: "avoid" }}>
          <div className="flex justify-between items-center border-b pb-1 mb-1.5">
            <h3 className="font-bold text-xs text-black">4.2 SMS & Email Spam Filter Security API</h3>
            <span className="font-mono text-[0.62rem] text-gray-600">MultinomialNB · scikit-learn</span>
          </div>
          <p className="text-[0.72rem] text-gray-800 leading-relaxed mb-2">
            Production SMS spam classifier evaluating message text for security risks, promotional spam, and phishing attempts. Surfacing high-weighted spam keywords and probability confidence bars.
          </p>
          <div className="text-[0.66rem] font-mono text-gray-600 bg-gray-50 p-1.5 rounded">
            API Route: `POST /predict/spam` · Latency: &lt; 15ms execution
          </div>
        </div>

        {/* 4.3 Multi-Task Emotion Model */}
        <div className="border p-3 rounded mb-3 bg-white" style={{ breakInside: "avoid" }}>
          <div className="flex justify-between items-center border-b pb-1 mb-1.5">
            <h3 className="font-bold text-xs text-black">4.3 Multi-Task Emotion & Demographic Classifier</h3>
            <span className="font-mono text-[0.62rem] text-gray-600">28 Emotion Categories + Demographic Signal</span>
          </div>
          <p className="text-[0.72rem] text-gray-800 leading-relaxed mb-2">
            Multi-head text model outputting 28 fine-grained emotion probabilities alongside age and gender demographic estimates from unstructured user input.
          </p>
          <div className="text-[0.66rem] font-mono text-gray-600 bg-gray-50 p-1.5 rounded">
            API Route: `POST /predict/emotion` · Output: Ranked Top-5 Emotion Probabilities
          </div>
        </div>

        {/* 4.4 Speech AI Interview Coach */}
        <div className="border p-3 rounded mb-3 bg-white" style={{ breakInside: "avoid" }}>
          <div className="flex justify-between items-center border-b pb-1 mb-1.5">
            <h3 className="font-bold text-xs text-black">4.4 Speech AI Interview Practice & Real-Time Feedback Coach</h3>
            <span className="font-mono text-[0.62rem] text-gray-600">Web Speech API · Audio Stream Parsing</span>
          </div>
          <p className="text-[0.72rem] text-gray-800 leading-relaxed mb-2">
            Browser-native interactive interview module using Web Speech API to capture live voice responses, compute transcript keyword coverage, evaluate technical accuracy, and generate instant answer feedback.
          </p>
          <div className="text-[0.66rem] font-mono text-gray-600 bg-gray-50 p-1.5 rounded">
            File: `src/components/InterviewAnalyzer.tsx` · Input: Real-time Microphone Audio
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-2 text-between flex justify-between text-[0.65rem] font-mono text-gray-500 mt-4">
          <span>AnishReddy.Online — System Specification Blueprint</span>
          <span>Section 4 · Page 4</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 5: BACKEND MICROSERVICES, SCHEMAS & MLOPS INFRASTRUCTURE      */}
      {/* ==================================================================== */}
      <div className="p-2">
        <div className="border-b pb-2 mb-3 flex justify-between items-center">
          <h2 className="text-sm font-extrabold text-black uppercase">
            SECTION 5: BACKEND FASTAPI MICROSERVICES, DATABASE SCHEMAS & MLOPS
          </h2>
          <span className="text-[0.65rem] font-mono text-gray-600 font-bold">Production Infrastructure</span>
        </div>

        {/* 5.1 FastAPI Main Architecture */}
        <div className="border p-3 rounded mb-3 bg-white" style={{ breakInside: "avoid" }}>
          <h3 className="font-bold text-xs text-black border-b pb-1 mb-1.5">
            5.1 Render FastAPI Production Backend (`ml-backend/main.py`)
          </h3>
          <p className="text-[0.72rem] text-gray-800 leading-relaxed mb-2">
            Modular Python 3.11 microservice running Uvicorn + ASGI event loops. Features optional model loading patterns (`_optional_loader_unavailable`), non-blocking startup lifespans, CORS middleware, and automatic OpenAPI schema generation.
          </p>
        </div>

        {/* 5.2 Supabase SQL Schema */}
        <div className="border p-3 rounded mb-3 bg-gray-50 font-mono text-[0.65rem]" style={{ breakInside: "avoid" }}>
          <h3 className="font-bold text-xs text-black border-b pb-1 mb-1.5 font-sans">
            5.2 Supabase Database Schema (`contact_submissions` Table)
          </h3>
          <pre className="whitespace-pre text-gray-800 bg-white p-2 border rounded mb-2">
{`CREATE TABLE public.contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

-- Service Role Access Policy
ALTER TABLE public.contact_submissions DISABLE ROW LEVEL SECURITY;`}
          </pre>
          <p className="text-gray-700">
            Handled directly by Node.js serverless route `app/api/contact/route.ts` via `SUPABASE_SERVICE_ROLE_KEY` with parallel Resend email delivery.
          </p>
        </div>

        {/* 5.3 System Security & Performance Summary */}
        <div className="border-2 border-black p-3 rounded bg-white" style={{ breakInside: "avoid" }}>
          <h3 className="font-bold text-xs text-black border-b border-black pb-1 mb-2">
            5.3 PERFORMANCE, SECURITY & REPOSITORIES SUMMARY
          </h3>
          <div className="grid grid-cols-2 gap-3 text-[0.7rem] leading-snug text-gray-800">
            <div>
              <p>• <strong>Inference Latency</strong>: &lt; 50ms for scikit-learn models; quantized PyTorch tensors for rapid GPU/CPU inference.</p>
              <p>• <strong>Error Isolation</strong>: Edge middleware negative lookaheads prevent i18n route interception on `/api/*` endpoints.</p>
            </div>
            <div>
              <p>• <strong>Source Repository</strong>: https://github.com/anishreddy13/portfolio</p>
              <p>• <strong>Live Web Endpoint</strong>: https://anishreddy.online</p>
            </div>
          </div>
        </div>

        {/* Document End Footer */}
        <div className="border-t pt-3 text-between flex justify-between items-center text-[0.65rem] font-mono text-gray-600 mt-6">
          <span>© {currentYear} AnishReddy.Online — Complete Technical System Specification</span>
          <span className="font-bold">END OF DOCUMENT (Section 5 · Page 5)</span>
        </div>
      </div>

    </div>
  );
}
