"use client";

import type { ReactNode } from "react";

type MatrixRow = {
  layer: string;
  technologies: string;
  purpose: string;
  deployment: string;
};

type EndpointRow = {
  surface: string;
  contract: string;
  implementation: string;
  resilience: string;
};

const auditedFiles = [
  "src/components/Navbar.tsx",
  "src/components/Hero.tsx",
  "src/components/About.tsx",
  "src/components/Projects.tsx",
  "src/components/FinancialAnalystExplainer.tsx",
  "src/components/HeadlessFinancialAnalyst.tsx",
  "src/components/PlantDiseaseDetector.tsx",
  "src/components/InterviewAnalyzer.tsx",
  "src/components/SocialSentinel.tsx",
  "src/components/Contact.tsx",
  "src/data/projects.ts",
  "src/lib/financialAnalystClient.ts",
  "src/lib/financialAnalystContent.ts",
  "app/api/contact/route.ts",
  "ml-backend/main.py",
  "ml-backend/plant_inference.py",
  "middleware.ts",
];

const technologyMatrix: MatrixRow[] = [
  {
    layer: "Web Application Shell",
    technologies: "Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, next-intl",
    purpose: "Portfolio routing, localized pages, animated project surfaces, print export shell, and user navigation.",
    deployment: "Vercel",
  },
  {
    layer: "AI Financial Analyst",
    technologies: "@gradio/client, Hugging Face Spaces, LangGraph, Groq Llama-3, yfinance, pandas",
    purpose: "Ticker analysis, financial tables, live/recent market signals, social sentiment, chart forecasting, XAI, and rebalancing.",
    deployment: "Hugging Face Spaces Gradio service",
  },
  {
    layer: "Deep Learning Vision",
    technologies: "PyTorch, EfficientNet-B0, torchvision transforms, Neural Chart Vision CNN + Transformer branch",
    purpose: "Plant disease inference, top-5 image classification, chart pattern logits, return forecast evidence, and fallback inference.",
    deployment: "Render FastAPI and Hugging Face Spaces",
  },
  {
    layer: "Classical ML and NLP",
    technologies: "FastAPI, scikit-learn, NLTK-style text processing, persisted pickle models",
    purpose: "Sentiment, spam detection, emotion/gender/age estimates, and structured prediction endpoints.",
    deployment: "Render.com Python service",
  },
  {
    layer: "Data, Delivery, and Reliability",
    technologies: "Supabase PostgreSQL, optional Redis service, Resend email, CORS, retrying Gradio client",
    purpose: "Contact persistence, optional service health checks, email dispatch, API fallback behavior, and runtime diagnostics.",
    deployment: "Supabase, Upstash/Redis-compatible service, Resend, Vercel serverless",
  },
];

const endpointRows: EndpointRow[] = [
  {
    surface: "Contact API",
    contract: "POST /api/contact: name, email, subject, message, company honeypot",
    implementation: "app/api/contact/route.ts validates payload, rate-limits by IP, stores to contact_submissions, and dispatches Resend email when configured.",
    resilience: "No-store responses, honeypot spam guard, server-side validation, and non-secret operational logging.",
  },
  {
    surface: "ML Backend Health",
    contract: "GET /health",
    implementation: "ml-backend/main.py reports model availability for sentiment, spam, emotion, cancer, plant, Redis, and Supabase.",
    resilience: "Optional loaders keep the API bootable even when model files or cloud keys are absent.",
  },
  {
    surface: "Text ML",
    contract: "POST /predict, /predict/spam, /predict/emotion",
    implementation: "FastAPI routes call loaded scikit-learn/NLP pipelines and return typed Pydantic response models.",
    resilience: "Missing model references return HTTP 503 instead of crashing startup.",
  },
  {
    surface: "Vision ML",
    contract: "POST /predict/plant, POST /predict/cancer",
    implementation: "Plant images are multipart uploads; cancer route accepts structured feature vectors.",
    resilience: "MIME validation, top-5 payload normalization, and clear 400/503/500 error classes.",
  },
  {
    surface: "AI Analyst Gradio",
    contract: "/analyze_stock, /get_forecast, /get_financials_tables, /get_social_sentiment, /get_neural_chart_vision, /get_service_health",
    implementation: "src/lib/financialAnalystClient.ts connects by Space ID first and URL second, then retries failed predictions.",
    resilience: "Client resets stale connections and maps app-config/503 errors to user-safe service messages.",
  },
];

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section className="print-card mb-3 border border-black bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-3 border-b border-black pb-1.5">
        <h2 className="text-[0.78rem] font-extrabold uppercase tracking-[0.16em] text-black">
          {title}
        </h2>
        {eyebrow ? (
          <span className="shrink-0 border border-black px-1.5 py-0.5 font-mono text-[0.54rem] font-bold uppercase tracking-wider text-black">
            {eyebrow}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function MiniCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="print-card border border-gray-400 bg-gray-50 p-2">
      <h3 className="mb-1 border-b border-gray-300 pb-0.5 text-[0.66rem] font-bold uppercase tracking-wider text-black">
        {title}
      </h3>
      <div className="text-[0.62rem] leading-snug text-gray-800">{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="print-card mb-2 overflow-hidden border border-black bg-gray-50 p-2 font-mono text-[0.52rem] leading-tight text-black whitespace-pre-wrap">
      {children}
    </pre>
  );
}

function MatrixTable({ rows }: { rows: MatrixRow[] }) {
  return (
    <table className="mb-2 w-full border-collapse border border-gray-400 text-[0.58rem]">
      <thead>
        <tr className="bg-gray-100 text-left font-bold uppercase tracking-wider text-black">
          <th className="border border-gray-400 p-1">Layer</th>
          <th className="border border-gray-400 p-1">Technologies Used</th>
          <th className="border border-gray-400 p-1">Primary Purpose / Function</th>
          <th className="border border-gray-400 p-1">Deployment Target</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.layer} className="align-top">
            <td className="border border-gray-300 p-1 font-bold text-black">{row.layer}</td>
            <td className="border border-gray-300 p-1 text-gray-800">{row.technologies}</td>
            <td className="border border-gray-300 p-1 text-gray-800">{row.purpose}</td>
            <td className="border border-gray-300 p-1 text-gray-800">{row.deployment}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EndpointTable() {
  return (
    <table className="w-full border-collapse border border-gray-400 text-[0.56rem]">
      <thead>
        <tr className="bg-gray-100 text-left font-bold uppercase tracking-wider text-black">
          <th className="border border-gray-400 p-1">Surface</th>
          <th className="border border-gray-400 p-1">Contract</th>
          <th className="border border-gray-400 p-1">Implementation</th>
          <th className="border border-gray-400 p-1">Reliability Notes</th>
        </tr>
      </thead>
      <tbody>
        {endpointRows.map((row) => (
          <tr key={row.surface} className="align-top">
            <td className="border border-gray-300 p-1 font-bold text-black">{row.surface}</td>
            <td className="border border-gray-300 p-1 text-gray-800">{row.contract}</td>
            <td className="border border-gray-300 p-1 text-gray-800">{row.implementation}</td>
            <td className="border border-gray-300 p-1 text-gray-800">{row.resilience}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PrintPortfolio() {
  const currentYear = new Date().getFullYear();

  return (
    <div id="print-root" className="hidden bg-white text-black print:block">
      <header className="print-card mb-3 border-b-2 border-black pb-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.2em] text-gray-700">
              anishreddy.online
            </p>
            <h1 className="text-xl font-black uppercase tracking-tight text-black">
              Technical System Architecture Blueprint
            </h1>
            <p className="mt-0.5 max-w-[560px] text-[0.66rem] leading-snug text-gray-800">
              Publication-grade engineering specification for the full portfolio platform: Next.js shell,
              AI Financial Analyst, MLOps APIs, computer vision pipelines, NLP services, persistence,
              reliability controls, and print/export behavior.
            </p>
          </div>
          <div className="text-right font-mono text-[0.55rem] leading-tight text-gray-700">
            <p><strong>Author:</strong> Anish Reddy</p>
            <p><strong>Role:</strong> AI Researcher and Systems Engineer</p>
            <p><strong>Web:</strong> https://anishreddy.online</p>
            <p><strong>GitHub:</strong> https://github.com/anishreddy13</p>
            <p><strong>Generated:</strong> {currentYear}</p>
          </div>
        </div>
      </header>

      <Section title="0. Audit Scope and Ground Truth" eyebrow="Code-level review">
        <p className="mb-2 text-[0.64rem] leading-snug text-gray-800">
          This is a technical specification, not a resume. The document is derived from the repository
          files listed below and describes real system boundaries, API contracts, model paths, fallback
          behavior, deployment targets, and user-facing workflows. Where frontend marketing copy and live
          backend capability differ, this blueprint calls out the distinction instead of flattening it.
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {auditedFiles.map((file) => (
            <div key={file} className="border border-gray-300 bg-gray-50 p-1 font-mono text-[0.5rem] text-gray-800">
              {file}
            </div>
          ))}
        </div>
      </Section>

      <Section title="1. End-to-End Infrastructure and Dataflow" eyebrow="System map">
        <CodeBlock>
{`+-------------------------+       +------------------------------------+
| User Browser            |       | Next.js App Router / React Client  |
| desktop / mobile        | ----> | Navbar, Hero, Projects, ML Lab,    |
| print preview           |       | AI Analyst, Contact, Print Export  |
+-------------------------+       +------------------------------------+
                                      |
                                      v
+------------------------------------------------------------------------+
| middleware.ts / next-intl routing                                       |
| matcher excludes /api, _next, _vercel, and static assets from i18n flow |
+------------------------------------------------------------------------+
       |                         |                         |
       v                         v                         v
+------------------+    +-----------------------+   +----------------------+
| Vercel API        |    | Hugging Face Space    |   | Render FastAPI       |
| /api/contact      |    | Gradio AI Analyst     |   | ml-backend/main.py   |
| validation + DB   |    | @gradio/client calls  |   | typed ML endpoints   |
+------------------+    +-----------------------+   +----------------------+
       |                         |                         |
       v                         v                         v
+------------------+    +-----------------------+   +----------------------+
| Supabase table    |    | Groq / yfinance /     |   | model pickle files,  |
| contact_submits   |    | pandas / PyTorch      |   | plant checkpoint     |
+------------------+    +-----------------------+   +----------------------+
       |
       v
+------------------+
| Resend email      |
| optional dispatch |
+------------------+`}
        </CodeBlock>
        <MatrixTable rows={technologyMatrix} />
      </Section>

      <Section title="2. AI Financial Analyst Platform Deep Dive" eyebrow="Flagship system">
        <p className="mb-2 text-[0.64rem] leading-snug text-gray-800">
          The analyst UI in HeadlessFinancialAnalyst.tsx coordinates a ticker-centered workflow. On Run
          Analysis it starts independent non-LLM service calls for forecast, financial tables, social
          sentiment, and neural chart vision, then performs sequential analysis and explainability calls.
          The shared client in financialAnalystClient.ts connects to the Hugging Face Gradio Space by ID,
          falls back to direct URL connection, retries failed calls, and normalizes cold-start errors.
        </p>
        <CodeBlock>
{`[Ticker input]
      |
      v
[search_ticker optional validation]
      |
      v
+---------------------------------------------------------------+
| Run Analysis                                                  |
|  - parallel: /get_forecast                                    |
|  - parallel: /get_financials_tables                           |
|  - parallel: /get_social_sentiment(page=1, limit=20)          |
|  - parallel: /get_neural_chart_vision                         |
|  - sequential: /analyze_stock                                 |
|  - sequential: /get_xai_explanation                           |
+---------------------------------------------------------------+
      |
      v
[Charts and Metrics tab] + [News and Sentiment tab] + [Neural Chart Vision card]`}
        </CodeBlock>
        <div className="grid grid-cols-2 gap-2">
          <MiniCard title="Agent Architecture">
            <p>
              The live/explainer architecture documents a five-role analyst pipeline: Researcher,
              Quant, Auditor, Competitor, and Editor. Older frontend metadata still lists a smaller
              three-agent story, so the blueprint treats five roles as the current flagship capability
              and the legacy content data as presentation metadata that should stay synchronized.
            </p>
          </MiniCard>
          <MiniCard title="Neural Chart Vision">
            <p>
              The neural vision feature is exposed through /get_neural_chart_vision. The explainer
              describes OHLCV windows, RSI/MACD/Bollinger/volume indicators, a candlestick image branch,
              a Transformer time-series branch, fusion logits, pattern labels, future-return estimates,
              and a deterministic fallback when trained weights are not deployed.
            </p>
          </MiniCard>
          <MiniCard title="Portfolio Rebalancer">
            <p>
              The implementation is an AI risk and exposure analysis engine, not a guaranteed quadratic
              optimizer. It evaluates allocation payloads, sector concentration, beta exposure, and then
              uses Llama reasoning to produce a reallocation strategy with graceful fallback behavior.
            </p>
          </MiniCard>
          <MiniCard title="Service Reliability">
            <p>
              /get_service_health checks runtime module readiness for market data, watchlist,
              rebalancing, neural chart vision, and the deep learning bundle. The frontend health strip
              summarizes readiness without triggering expensive external analysis requests.
            </p>
          </MiniCard>
        </div>
      </Section>

      <Section title="3. Computer Vision and Deep Learning Pathology Suite" eyebrow="Vision ML">
        <CodeBlock>
{`Plant disease inference:
[Upload or webcam image]
      -> [multipart/form-data /predict/plant]
      -> [MIME validation: jpeg/png/webp]
      -> [PIL decode to RGB]
      -> [Resize 224x224 + ImageNet normalization]
      -> [EfficientNet-B0 classifier]
      -> [softmax probabilities]
      -> [predicted_class, display_name, confidence_score, status, top_5_predictions]`}
        </CodeBlock>
        <div className="grid grid-cols-3 gap-2">
          <MiniCard title="Plant Model">
            <p>
              plant_inference.py loads an EfficientNet-B0 checkpoint from
              ml-backend/models/plant_disease/best_model.pt and class mapping JSON. The project card
              reports 97.84% accuracy, 20K+ dataset scale, and currently displays 15 classes.
            </p>
          </MiniCard>
          <MiniCard title="Skin/Cancer Surface">
            <p>
              main.py exposes /predict/cancer for structured cancer features and the portfolio project
              describes a skin disease image demo with seven clinical-style classes and top-5/risk UI.
              Treat those as separate surfaces unless the backend model path is unified.
            </p>
          </MiniCard>
          <MiniCard title="Explainability">
            <p>
              The PlantDiseaseDetector UI has heatmap/original attention views. The backend plant route
              returns classification payloads; any Grad-CAM overlay route should be verified before
              promising exported overlays in external documentation.
            </p>
          </MiniCard>
        </div>
      </Section>

      <Section title="4. NLP, Security, and Speech AI Suite" eyebrow="Applied ML">
        <div className="grid grid-cols-2 gap-2">
          <MiniCard title="Social and News Sentinel">
            <p>
              SocialSentinel.tsx filters All, news, social, and video items for the selected stock. It
              expects source, source_type, content, sentiment, URL, and verification flags from
              /get_social_sentiment.
            </p>
          </MiniCard>
          <MiniCard title="Sentiment / Spam / Emotion APIs">
            <p>
              FastAPI endpoints /predict, /predict/spam, and /predict/emotion call loaded ML pipelines
              when pickle files are available. Responses include sentiment labels, spam probability and
              keywords, or 28-emotion ranked outputs plus demographic estimates.
            </p>
          </MiniCard>
          <MiniCard title="Interview Analyzer">
            <p>
              InterviewAnalyzer.tsx is browser-native. It uses speech recognition/transcript state,
              filler-word detection, WPM, vocabulary richness, sentence metrics, and rule-based coaching
              feedback without depending on a remote LLM call.
            </p>
          </MiniCard>
          <MiniCard title="Project Catalog Mapping">
            <p>
              src/data/projects.ts indexes Plant Disease, AI Financial Analyst, AI Interview Analyzer,
              Skin Disease Detection, Emotion Detection, Spam Detection, and Sentiment Analysis with
              route targets, status, technology tags, and feature metrics.
            </p>
          </MiniCard>
        </div>
      </Section>

      <Section title="5. Backend Microservices, Schemas, and Runtime Controls" eyebrow="MLOps">
        <EndpointTable />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <MiniCard title="Supabase Contact Schema">
            <CodeBlock>
{`CREATE TABLE public.contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);`}
            </CodeBlock>
          </MiniCard>
          <MiniCard title="FastAPI Startup Strategy">
            <p>
              main.py uses an async lifespan hook, optional loader functions, CORS middleware, health
              checks, and model-path validation. Missing models are recorded in OPTIONAL_IMPORT_ERRORS
              and endpoint requests return controlled 503 errors instead of terminating the service.
            </p>
          </MiniCard>
        </div>
      </Section>

      <Section title="6. Print Export Architecture" eyebrow="PDF safe">
        <p className="text-[0.64rem] leading-snug text-gray-800">
          The printable blueprint is mounted once in PlatformShell.tsx and hidden during normal browsing.
          Print actions from Navbar and Footer call window.print(). The @media print stylesheet isolates
          #print-root, hides every other element, forces white backgrounds and black text, disables fixed
          decorative overlays, and uses print-card containers with break-inside avoidance. Sections avoid
          min-h-screen and hard page breaks so the document flows densely without blank black or white pages.
        </p>
      </Section>

      <footer className="print-card mt-3 flex justify-between border-t-2 border-black pt-2 font-mono text-[0.52rem] text-gray-700">
        <span>Copyright {currentYear} AnishReddy.Online - Technical System Architecture Blueprint</span>
        <span>END OF SYSTEM SPECIFICATION</span>
      </footer>
    </div>
  );
}
