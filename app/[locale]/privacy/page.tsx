"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      "AI & ML Interactive Demo Inputs: When you use interactive features (such as Plant Disease Detection or Skin Cancer Diagnosis), image files you upload are sent directly to our hosted inference microservices to generate predictions and Grad-CAM heatmaps. These images are processed in-memory and are not stored permanently.",
      "Financial Analysis Inputs: When running market analysis or portfolio rebalancing, ticker symbols and query parameters are sent to our multi-agent LLM reasoning pipeline.",
      "Contact Submissions: When submitting the contact form, we collect your name, email address, subject line, and message body.",
      "System Telemetry & Analytics: We record non-personally identifiable visit telemetry (browser type, device type, approximate city/country derived via IP API) to monitor website performance and API latency.",
    ],
  },
  {
    title: "2. How We Process & Use Data",
    content: [
      "Model Inference: Uploaded images and text inputs are processed strictly to execute machine learning models (EfficientNet-B0, Custom CNNs, PyTorch transformers) and return live inference payloads.",
      "Communication: Contact form submissions are used solely to respond to your professional or technical inquiries.",
      "Telemetry & System Monitoring: Performance logs are used to ensure 24/7 API uptime, evaluate pipeline latency, and maintain model readiness.",
      "No Monetization: We never sell, rent, or trade your data. There are no advertising trackers or commercial monetization services on this site.",
    ],
  },
  {
    title: "3. Integrated Third-Party Infrastructure",
    content: [
      "Hugging Face Spaces: Hosts our isolated deep learning Docker and Gradio inference endpoints (Plant Disease API, Skin Cancer API, Neural Chart Vision, AI Financial Analyst).",
      "Groq API: Provides fast LLM inference (Llama-3) for our multi-agent financial research agents.",
      "Render.com: Hosts our production FastAPI backend serving real-time ML classifiers.",
      "Supabase: Provides secure PostgreSQL storage for contact submissions and pipeline health metrics.",
      "Upstash Redis: Manages real-time event queues for background prediction workers.",
      "Resend: Delivers contact form submissions to anishreddy1373@gmail.com.",
    ],
  },
  {
    title: "4. Data Retention & Privacy",
    content: [
      "Uploaded inference images are held ephemerally in server RAM during the request lifecycle and discarded immediately upon response generation.",
      "Contact messages and anonymous telemetry logs are retained in Supabase.",
      "You may request access to or complete deletion of your submitted contact details at any time by emailing anishreddy1373@gmail.com.",
    ],
  },
  {
    title: "5. Cookies & Local Storage",
    content: [
      "This site does not use tracking or advertising cookies.",
      "Browser localStorage is used solely for non-tracking session state (e.g. preventing duplicate visit counters).",
    ],
  },
  {
    title: "6. Contact & Data Requests",
    content: [
      "For privacy inquiries, data deletion requests, or technical questions regarding model data processing, please contact Anish Reddy at anishreddy1373@gmail.com.",
    ],
  },
];

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>

      {/* Top accent */}
      <div className="h-px w-full"
        style={{ background: "linear-gradient(90deg, transparent, #FF2D2D, #FF6B35, transparent)" }} />

      {/* Header */}
      <div className="sticky top-0 z-50 px-4 sm:px-8 py-4 flex items-center justify-between"
        style={{ background: "rgba(10, 10, 10, 0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,45,45,0.12)" }}>
        <button onClick={() => router.push("/")}
          className="font-display text-lg tracking-[0.15em]"
          style={{ color: "var(--text-primary)" }}>
          ANISHREDDY<span style={{ color: "#FF2D2D" }}>.</span>ONLINE
        </button>
        <button onClick={() => router.back()}
          className="font-mono text-[0.6rem] tracking-widest uppercase"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--text-primary)")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-tertiary)")}>
          ← Back
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16">

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="font-mono text-[0.58rem] tracking-[0.32em] uppercase mb-4"
            style={{ color: "#FF2D2D" }}>Legal & Systems Privacy</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-[0.1em] mb-4"
            style={{ color: "var(--text-primary)" }}>
            Privacy Policy
          </h1>
          <p className="font-mono text-[0.6rem] tracking-widest" style={{ color: "var(--text-tertiary)" }}>
            Last updated: July 2026 · Anish Reddy (AI Researcher)
          </p>
          <div className="mt-6 h-px w-16"
            style={{ background: "linear-gradient(90deg, #FF2D2D, transparent)" }} />
        </motion.div>

        {/* Intro */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="font-body text-sm leading-relaxed mb-12"
          style={{ color: "var(--text-secondary)" }}>
          This Privacy Policy explains how AnishReddy.Online processes data across our live portfolio, AI model inference microservices, deep learning vision endpoints, and multi-agent reasoning systems. This is a personal research portfolio with no commercial transactions or paid services.
        </motion.p>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, i) => (
            <motion.div key={section.title}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-sm p-6"
              style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-mono text-[0.6rem] tracking-[0.28em] uppercase mb-4"
                style={{ color: "#FF2D2D" }}>{section.title}</h2>
              <ul className="space-y-3">
                {section.content.map((item, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                      style={{ background: "#FF2D2D" }} />
                    <p className="font-body text-sm leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}>{item}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="font-mono text-[0.55rem] tracking-widest uppercase mt-12 text-center"
          style={{ color: "var(--text-tertiary)" }}>
          © {new Date().getFullYear()} AnishReddy.Online — AI Researcher & Engineer
        </motion.p>
      </div>
    </div>
  );
}