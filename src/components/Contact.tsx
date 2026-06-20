"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  company: string;
}

interface FocusedState {
  name: boolean;
  email: boolean;
  subject: boolean;
  message: boolean;
}

const socials = [
  { label: "GitHub",   href: "https://github.com/anishreddy13",  icon: "GH" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/anishreddy5676", icon: "LI" },
  { label: "Twitter",  href: "https://x.com/anishreddy1373",  icon: "TW" },
  { label: "Dribbble", href: "https://dribbble.com", icon: "DR" },
];

function AnimatedInput({
  label, name, type = "text", value, onChange,
  focused, onFocus, onBlur,
  multiline = false, rows = 1, required = false,
}: {
  label: string;
  name: keyof FormState;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
}) {
  const isActive = focused || value.length > 0;

  const inputClass =
    "w-full bg-transparent font-body text-sm pt-6 pb-2 focus:outline-none resize-none transition-colors duration-300";

  return (
    <div className="relative">
      <div
        className="relative overflow-hidden rounded-sm transition-all duration-300"
        style={{
          background: "var(--surface-1)",
          border: `1px solid ${
            focused ? "rgba(255,45,45,0.45)" : "var(--border)"
          }`,
          boxShadow: focused ? "0 0 20px rgba(255,45,45,0.08)" : "none",
        }}
      >
        {/* Floating label */}
        <motion.label
          className="absolute left-4 font-mono text-[0.62rem] tracking-wider pointer-events-none"
          animate={{
            y:     isActive ? 8 : multiline ? 18 : 16,
            scale: isActive ? 0.85 : 1,
            color: focused ? "#FF2D2D" : "var(--text-tertiary)",
          }}
          style={{ originX: 0, originY: 0, top: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {label}
          {required && (
            <span style={{ color: "#FF2D2D", marginLeft: "2px" }}>*</span>
          )}
        </motion.label>

        <div className="px-4" style={{ color: "var(--text-primary)" }}>
          {multiline ? (
            <textarea
              name={name}
              value={value}
              onChange={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
              rows={rows}
              required={required}
              className={inputClass}
              style={{ color: "var(--text-primary)" }}
            />
          ) : (
            <input
              type={type}
              name={name}
              value={value}
              onChange={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
              required={required}
              className={inputClass}
              style={{ color: "var(--text-primary)" }}
            />
          )}
        </div>

        {/* Bottom animated line */}
        <div className="absolute bottom-0 left-0 h-px w-full overflow-hidden">
          <motion.div
            className="h-full"
            animate={{ scaleX: focused ? 1 : 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "linear-gradient(90deg, #FF2D2D, #FF6B35)",
              originX: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState<FormState>({
    name: "", email: "", subject: "", message: "", company: "",
  });
  const [focused, setFocused] = useState<FocusedState>({
    name: false, email: false, subject: false, message: false,
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (status === "error") {
      setStatus("idle");
      setStatusMessage("");
    }
  };

  const handleFocus = (f: keyof FocusedState) =>
    setFocused((p) => ({ ...p, [f]: true }));
  const handleBlur = (f: keyof FocusedState) =>
    setFocused((p) => ({ ...p, [f]: false }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setStatusMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Message could not be sent.");
      }

      setStatus("sent");
      setStatusMessage("Message sent. I will get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "", company: "" });
      setTimeout(() => {
        setStatus("idle");
        setStatusMessage("");
      }, 5000);
    } catch (error) {
      setStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden"
      style={{
        background:    "var(--surface-0)",
        paddingTop:    "clamp(5rem, 12vw, 9rem)",
        paddingBottom: "clamp(5rem, 12vw, 9rem)",
      }}
    >
      {/* Top divider */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,45,45,0.2), transparent)",
        }}
      />

      {/* Background glows */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(255,45,45,0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(200,255,0,0.04) 0%, transparent 65%)",
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12">

        {/* ── Header ── */}
        <div className="mb-14 md:mb-20">
          <ScrollReveal>
            <span className="section-tag block mb-5">03 / Contact</span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h2
              className="font-display leading-none tracking-tight"
              style={{ fontSize: "clamp(3rem, 9vw, 7rem)" }}
            >
              <span style={{ color: "var(--text-primary)" }}>LET'S </span>
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #FF2D2D 0%, #FF6B35 50%, #C8FF00 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                BUILD
              </span>
              <br />
              <span
                style={{
                  color: "transparent",
                  WebkitTextStroke: "1px rgba(255,255,255,0.12)",
                }}
              >
                SOMETHING
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p
              className="font-body text-base md:text-lg max-w-md mt-6 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Have a project in mind? Let's talk. I'm always open to discussing{" "}
              <span style={{ color: "var(--text-primary)" }}>
                new ideas and opportunities.
              </span>
            </p>
          </ScrollReveal>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">

          {/* Form — 3 cols */}
          <div className="lg:col-span-3">
            <ScrollReveal delay={0.15}>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatedInput
                    label="Your Name" name="name"
                    value={form.name} onChange={handleChange}
                    focused={focused.name}
                    onFocus={() => handleFocus("name")}
                    onBlur={() => handleBlur("name")}
                    required
                  />
                  <AnimatedInput
                    label="Email Address" name="email" type="email"
                    value={form.email} onChange={handleChange}
                    focused={focused.email}
                    onFocus={() => handleFocus("email")}
                    onBlur={() => handleBlur("email")}
                    required
                  />
                </div>

                <AnimatedInput
                  label="Subject" name="subject"
                  value={form.subject} onChange={handleChange}
                  focused={focused.subject}
                  onFocus={() => handleFocus("subject")}
                  onBlur={() => handleBlur("subject")}
                />

                <AnimatedInput
                  label="Tell me about your project..."
                  name="message" value={form.message}
                  onChange={handleChange}
                  focused={focused.message}
                  onFocus={() => handleFocus("message")}
                  onBlur={() => handleBlur("message")}
                  multiline rows={6} required
                />

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={status === "sending" || status === "sent"}
                  aria-busy={status === "sending"}
                  className="relative w-full py-4 rounded-sm font-mono
                             text-[0.72rem] tracking-[0.22em] uppercase overflow-hidden"
                  whileHover={{ scale: status === "idle" ? 1.01 : 1 }}
                  whileTap={{ scale: status === "idle" ? 0.98 : 1 }}
                >
                  <div
                    className="absolute inset-0 transition-all duration-400"
                    style={{
                      background:
                        status === "sent"
                          ? "#22c55e"
                          : status === "error"
                          ? "#CC1A1A"
                          : status === "sending"
                          ? "var(--border)"
                          : "#FF2D2D",
                    }}
                  />

                  {status === "idle" && (
                    <motion.div
                      className="absolute inset-0 skew-x-12"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                      initial={{ x: "-200%" }}
                      whileHover={{ x: "200%" }}
                      transition={{ duration: 0.55 }}
                    />
                  )}

                  {status === "idle" && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ boxShadow: "0 0 30px rgba(255,45,45,0.4)" }}
                    />
                  )}

                  <span
                    className="relative z-10"
                    style={{
                      color: status === "sending" ? "var(--text-secondary)" : "#fff",
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {status === "idle" && (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="flex items-center justify-center gap-2"
                        >
                          Send Message →
                        </motion.span>
                      )}
                      {status === "sending" && (
                        <motion.span
                          key="sending"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block w-4 h-4 border-2 rounded-full"
                            style={{
                              borderColor: "rgba(160,160,160,0.3)",
                              borderTopColor: "var(--text-secondary)",
                            }}
                          />
                          Sending...
                        </motion.span>
                      )}
                      {status === "sent" && (
                        <motion.span
                          key="sent"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-2"
                        >
                          Message Sent ✓
                        </motion.span>
                      )}
                      {status === "error" && (
                        <motion.span
                          key="error"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="flex items-center justify-center gap-2"
                        >
                          Error - Try Again
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </motion.button>

                <AnimatePresence>
                  {statusMessage && (
                    <motion.div
                      role={status === "error" ? "alert" : "status"}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-sm px-4 py-3"
                      style={{
                        background:
                          status === "error"
                            ? "rgba(255,45,45,0.08)"
                            : "rgba(34,197,94,0.08)",
                        border:
                          status === "error"
                            ? "1px solid rgba(255,45,45,0.25)"
                            : "1px solid rgba(34,197,94,0.22)",
                      }}
                    >
                      <p
                        className="font-mono text-[0.62rem] leading-relaxed"
                        style={{ color: status === "error" ? "#FF2D2D" : "#22c55e" }}
                      >
                        {statusMessage}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </ScrollReveal>
          </div>

          {/* Sidebar — 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            <ScrollReveal direction="left" delay={0.25}>
              <div className="space-y-6">
                {[
                  { lbl: "Email",         val: "anishreddy1373@gmail.com",       href: "mailto:hello@anish.dev" },
                  { lbl: "Location",      val: "Hyderabad · Remote OK", href: null },
                  { lbl: "Response Time", val: "Within 24 hours",       href: null },
                ].map((item) => (
                  <div key={item.lbl}>
                    <p
                      className="font-mono text-[0.58rem] tracking-[0.32em] uppercase mb-1.5"
                      style={{ color: "#FF2D2D" }}
                    >
                      {item.lbl}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="font-body text-sm transition-colors duration-200"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={(e) =>
                          ((e.target as HTMLElement).style.color = "var(--text-primary)")
                        }
                        onMouseLeave={(e) =>
                          ((e.target as HTMLElement).style.color = "var(--text-secondary)")
                        }
                      >
                        {item.val}
                      </a>
                    ) : (
                      <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
                        {item.val}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

            <ScrollReveal direction="left" delay={0.35}>
              <p
                className="font-mono text-[0.58rem] tracking-[0.32em] uppercase mb-4"
                style={{ color: "#FF2D2D" }}
              >
                Follow Me
              </p>
              <div className="grid grid-cols-2 gap-2">
                {socials.map((s) => (
                  <motion.a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-sm border transition-all duration-300"
                    style={{
                      background:  "var(--surface-1)",
                      borderColor: "var(--border)",
                    }}
                    whileHover={{
                      y: -2,
                      borderColor: "rgba(255,45,45,0.3)",
                      background:  "var(--surface-2)",
                    }}
                  >
                    <span
                      className="font-mono text-[0.62rem]"
                      style={{ color: "#FF2D2D" }}
                    >
                      {s.icon}
                    </span>
                    <span className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                      {s.label}
                    </span>
                  </motion.a>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-sm"
                style={{
                  background: "rgba(255,45,45,0.06)",
                  border:     "1px solid rgba(255,45,45,0.2)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                  style={{
                    background: "#FF2D2D",
                    boxShadow:  "0 0 8px rgba(255,45,45,0.6)",
                  }}
                />
                <span
                  className="font-mono text-[0.62rem] tracking-[0.15em] uppercase"
                  style={{ color: "#FF2D2D" }}
                >
                  Available for new projects
                </span>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
