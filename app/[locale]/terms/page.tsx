"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const sections = [
  {
    title: "Acceptance of Terms",
    content: [
      "By accessing and using this website (anish.dev), you accept and agree to be bound by these Terms of Service.",
      "If you do not agree to these terms, please do not use this site.",
    ],
  },
  {
    title: "About This Site",
    content: [
      "This is a personal portfolio website showcasing the work and skills of Anish Reddy, a full-stack developer.",
      "The site contains no paid services, no user accounts, and no commercial transactions of any kind.",
    ],
  },
  {
    title: "Intellectual Property",
    content: [
      "All content on this site — including text, design, code, graphics, and project showcases — is the property of Anish Reddy unless otherwise stated.",
      "You may not reproduce, distribute, or use any content from this site without explicit written permission.",
      "Third-party project names, logos, and trademarks referenced on this site belong to their respective owners.",
    ],
  },
  {
    title: "Contact Form",
    content: [
      "The contact form is provided for legitimate business and professional inquiries only.",
      "You agree not to use the contact form to send spam, unsolicited commercial messages, or harmful content.",
      "We reserve the right to ignore or block messages that violate these terms.",
    ],
  },
  {
    title: "Disclaimer of Warranties",
    content: [
      "This website is provided 'as is' without any warranties of any kind, express or implied.",
      "We do not guarantee that the site will be available at all times or free from errors.",
      "Information on this site is provided for general purposes and may not always be up to date.",
    ],
  },
  {
    title: "Limitation of Liability",
    content: [
      "Anish Reddy shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of this site.",
      "This includes but is not limited to loss of data, loss of profits, or any other intangible losses.",
    ],
  },
  {
    title: "External Links",
    content: [
      "This site may contain links to external websites (GitHub, LinkedIn, etc.). These are provided for convenience only.",
      "We have no control over the content of external sites and accept no responsibility for them.",
    ],
  },
  {
    title: "Changes to Terms",
    content: [
      "We reserve the right to update these Terms of Service at any time without prior notice.",
      "Continued use of the site after changes constitutes acceptance of the new terms.",
    ],
  },
  {
    title: "Contact",
    content: [
      "For any questions about these Terms of Service, please contact anishreddy1373@gmail.com.",
    ],
  },
];

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>

      {/* Top accent */}
      <div className="h-px w-full"
        style={{ background: "linear-gradient(90deg, transparent, #FF2D2D, #FF6B35, transparent)" }} />

      {/* Header */}
      <div className="sticky top-0 z-50 px-4 sm:px-8 py-4 flex items-center justify-between"
        style={{ background: "rgba(var(--color-overlay-base), 0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,45,45,0.12)" }}>
        <button onClick={() => router.push("/")}
          className="font-display text-lg tracking-[0.15em]"
          style={{ color: "var(--text-primary)" }}>
          ANISH<span style={{ color: "#FF2D2D" }}>.</span>DEV
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
            style={{ color: "#FF2D2D" }}>Legal</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-[0.1em] mb-4"
            style={{ color: "var(--text-primary)" }}>
            Terms of Service
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
          style={{ color: "var(--text-tertiary)" }}>
          These Terms of Service govern your use of the Anish.Dev portfolio website.
          Please read them carefully before using the site.
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