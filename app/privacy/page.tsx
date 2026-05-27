"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const sections = [
  {
    title: "Information We Collect",
    content: [
      "When you visit this site, we automatically collect certain information including your IP address, browser type, operating system, device type, country, and city (derived from your IP via ipapi.co).",
      "When you submit the contact form, we collect your name, email address, subject, and message.",
      "We use session identifiers (stored in localStorage) to avoid counting the same visit multiple times.",
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      "Visit data (browser, device, location) is used solely for analytics — to understand how people discover and use this portfolio.",
      "Contact form submissions are used only to respond to your message. Your details are never shared with third parties.",
      "We do not use your data for advertising, profiling, or any commercial purpose.",
    ],
  },
  {
    title: "Third-Party Services",
    content: [
      "ipapi.co — used to determine your approximate location from your IP address. Their privacy policy applies.",
      "Supabase — used to store visit analytics and contact form submissions securely.",
      "Resend — used to deliver contact form messages to the site owner's email.",
    ],
  },
  {
    title: "Data Retention",
    content: [
      "Analytics data (visits, browser, location) is retained indefinitely for portfolio insights but contains no personally identifiable information beyond IP address.",
      "Contact form submissions are retained to maintain a record of communications.",
      "You may request deletion of your data at any time by emailing anishreddy1373@gmail.com.",
    ],
  },
  {
    title: "Cookies & Storage",
    content: [
      "This site does not use tracking cookies.",
      "A session ID is stored in your browser's localStorage purely to avoid duplicate visit counts. It contains no personal information.",
    ],
  },
  {
    title: "Your Rights",
    content: [
      "You have the right to request access to, correction of, or deletion of any personal data we hold about you.",
      "To exercise these rights, contact us at anishreddy1373@gmail.com.",
    ],
  },
  {
    title: "Contact",
    content: [
      "If you have any questions about this Privacy Policy, please reach out at anishreddy1373@gmail.com.",
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
        style={{ background: "rgba(10,10,10,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,45,45,0.12)" }}>
        <button onClick={() => router.push("/")}
          className="font-display text-lg tracking-[0.15em]"
          style={{ color: "#F0F0F0" }}>
          ANISH<span style={{ color: "#FF2D2D" }}>.</span>DEV
        </button>
        <button onClick={() => router.back()}
          className="font-mono text-[0.6rem] tracking-widest uppercase"
          style={{ color: "#606060" }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F0F0F0")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#606060")}>
          ← Back
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16">

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="font-mono text-[0.58rem] tracking-[0.32em] uppercase mb-4"
            style={{ color: "#FF2D2D" }}>Legal</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-[0.1em] mb-4"
            style={{ color: "#F0F0F0" }}>
            Privacy Policy
          </h1>
          <p className="font-mono text-[0.6rem] tracking-widest" style={{ color: "#404040" }}>
            Last updated: May 2026
          </p>
          <div className="mt-6 h-px w-16"
            style={{ background: "linear-gradient(90deg, #FF2D2D, transparent)" }} />
        </motion.div>

        {/* Intro */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="font-body text-sm leading-relaxed mb-12"
          style={{ color: "#606060" }}>
          This Privacy Policy explains how Anish.Dev collects, uses, and protects information
          when you visit this portfolio website. This is a personal portfolio site with no
          paid services or user accounts.
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
                    <span className="w-1 h-1 rounded-full mt-2 shrink-0"
                      style={{ background: "#FF2D2D" }} />
                    <p className="font-body text-sm leading-relaxed"
                      style={{ color: "#808080" }}>{item}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="font-mono text-[0.55rem] tracking-widest uppercase mt-12 text-center"
          style={{ color: "#303030" }}>
          © {new Date().getFullYear()} Anish.Dev — All rights reserved
        </motion.p>
      </div>
    </div>
  );
}