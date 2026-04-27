"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FocusedState {
  name: boolean;
  email: boolean;
  subject: boolean;
  message: boolean;
}

const socials = [
  { label: "GitHub", href: "https://github.com", icon: "GH" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "LI" },
  { label: "Twitter", href: "https://twitter.com", icon: "TW" },
  { label: "Dribbble", href: "https://dribbble.com", icon: "DR" },
];

function AnimatedInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  focused,
  onFocus,
  onBlur,
  multiline = false,
  rows = 1,
  required = false,
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
  const hasValue = value.length > 0;
  const isActive = focused || hasValue;

  const inputClass =
    "w-full bg-transparent font-body text-white/80 text-sm pt-5 pb-2 focus:outline-none resize-none transition-colors duration-300";

  return (
    <div className="relative group">
      <div
        className={`relative glass rounded-xl border transition-all duration-500 overflow-hidden ${
          focused
            ? "border-[#00f5ff]/40 shadow-[0_0_20px_rgba(0,245,255,0.08)]"
            : "border-white/[0.06] hover:border-white/10"
        }`}
      >
        {/* Animated label */}
        <motion.label
          className="absolute left-4 font-mono text-xs tracking-wider pointer-events-none"
          animate={{
            y: isActive ? 10 : multiline ? 20 : 18,
            scale: isActive ? 0.85 : 1,
            x: isActive ? 0 : 0,
            color: focused ? "#00f5ff" : "rgba(255,255,255,0.3)",
          }}
          style={{ originX: 0, originY: 0, top: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {label}
          {required && <span className="text-[#00f5ff]/60 ml-0.5">*</span>}
        </motion.label>

        <div className="px-4">
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
            />
          )}
        </div>

        {/* Bottom line animation */}
        <div className="absolute bottom-0 left-0 h-px w-full bg-transparent overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#00f5ff] to-purple-500"
            animate={{ scaleX: focused ? 1 : 0 }}
            style={{ originX: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [focused, setFocused] = useState<FocusedState>({
    name: false,
    email: false,
    subject: false,
    message: false,
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFocus = (field: keyof FocusedState) => {
    setFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof FocusedState) => {
    setFocused((prev) => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    // Simulate async send
    await new Promise((r) => setTimeout(r, 1800));
    setStatus("sent");
    setForm({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setStatus("idle"), 4000);
  };

  return (
    <section id="contact" className="relative py-40 px-6">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-[#8b5cf6]/5 to-transparent rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <ScrollReveal>
            <span className="font-mono text-xs tracking-[0.3em] text-[#00f5ff]/60 uppercase mb-4 block">
              03 / Contact
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="font-display text-[clamp(3rem,8vw,7rem)] leading-none tracking-tight mb-6">
              <span className="text-white">LET'S </span>
              <span className="gradient-text">BUILD</span>
              <br />
              <span className="text-white/20 [-webkit-text-stroke:1px_rgba(255,255,255,0.15)]">
                SOMETHING
              </span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="font-body text-white/40 text-lg max-w-md mx-auto">
              Have a project in mind? Let's talk. I'm always open to discussing new ideas and
              opportunities.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Form */}
          <div className="lg:col-span-3">
            <ScrollReveal delay={0.2}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AnimatedInput
                    label="Your Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    focused={focused.name}
                    onFocus={() => handleFocus("name")}
                    onBlur={() => handleBlur("name")}
                    required
                  />
                  <AnimatedInput
                    label="Email Address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    focused={focused.email}
                    onFocus={() => handleFocus("email")}
                    onBlur={() => handleBlur("email")}
                    required
                  />
                </div>
                <AnimatedInput
                  label="Subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  focused={focused.subject}
                  onFocus={() => handleFocus("subject")}
                  onBlur={() => handleBlur("subject")}
                />
                <AnimatedInput
                  label="Tell me about your project..."
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  focused={focused.message}
                  onFocus={() => handleFocus("message")}
                  onBlur={() => handleBlur("message")}
                  multiline
                  rows={6}
                  required
                />

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={status === "sending" || status === "sent"}
                  className="relative w-full py-4 rounded-xl font-mono text-sm tracking-widest uppercase overflow-hidden group"
                  whileHover={{ scale: status === "idle" ? 1.02 : 1 }}
                  whileTap={{ scale: status === "idle" ? 0.98 : 1 }}
                >
                  {/* Background */}
                  <div
                    className={`absolute inset-0 transition-all duration-500 ${
                      status === "sent"
                        ? "bg-green-500"
                        : status === "sending"
                        ? "bg-white/10"
                        : "bg-[#00f5ff]"
                    }`}
                  />

                  {/* Hover shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-white/30 skew-x-12"
                    initial={{ x: "-200%" }}
                    whileHover={{ x: "200%" }}
                    transition={{ duration: 0.6 }}
                  />

                  <span
                    className={`relative z-10 ${
                      status === "sent" ? "text-white" : "text-[#03040a]"
                    }`}
                  >
                    {status === "idle" && "Send Message →"}
                    {status === "sending" && (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="inline-block w-4 h-4 border-2 border-[#03040a]/30 border-t-[#03040a] rounded-full"
                        />
                        Sending...
                      </span>
                    )}
                    {status === "sent" && "Message Sent ✓"}
                    {status === "error" && "Error — Try Again"}
                  </span>
                </motion.button>
              </form>
            </ScrollReveal>
          </div>

          {/* Sidebar info */}
          <div className="lg:col-span-2 space-y-8">
            <ScrollReveal direction="left" delay={0.3}>
              <div className="space-y-6">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.3em] text-white/20 uppercase mb-2">
                    Email
                  </p>
                  <a
                    href="mailto:hello@alexdev.io"
                    className="font-body text-white/60 hover:text-[#00f5ff] transition-colors duration-300 text-sm"
                  >
                    hello@alexdev.io
                  </a>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.3em] text-white/20 uppercase mb-2">
                    Location
                  </p>
                  <p className="font-body text-white/60 text-sm">San Francisco, CA · Remote OK</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.3em] text-white/20 uppercase mb-2">
                    Response time
                  </p>
                  <p className="font-body text-white/60 text-sm">Within 24 hours</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={0.4}>
              <div className="h-px bg-white/[0.05]" />
              <div className="pt-6">
                <p className="font-mono text-[10px] tracking-[0.3em] text-white/20 uppercase mb-4">
                  Follow Me
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {socials.map((social) => (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass border border-white/[0.04] rounded-xl px-4 py-3 flex items-center gap-3 hover:border-white/10 transition-all duration-300 group"
                      whileHover={{ y: -2 }}
                    >
                      <span className="font-mono text-xs text-white/30 group-hover:text-[#00f5ff] transition-colors duration-300">
                        {social.icon}
                      </span>
                      <span className="font-body text-xs text-white/40 group-hover:text-white/70 transition-colors duration-300">
                        {social.label}
                      </span>
                    </motion.a>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
