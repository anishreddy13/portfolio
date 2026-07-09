"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { certificates, Certificate } from "@/data/certificates";
import ScrollReveal from "./ScrollReveal";
import { useTranslations } from "next-intl";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {target}{suffix}
    </motion.span>
  );
}

function CertificateCard({
  cert,
  index,
  onClick,
}: {
  cert: Certificate;
  index: number;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, delay: (index % 6) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02 }}
      className="rounded-sm overflow-hidden cursor-pointer flex flex-col group relative"
      style={{
        background: "var(--surface-1)",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "border-color 0.3s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = cert.color + "59";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
      onClick={onClick}
    >
      <div className="relative h-[160px] sm:h-[200px] w-full overflow-hidden bg-black shrink-0">
        {!imgError ? (
          <Image
            src={cert.image}
            alt={cert.title}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-4"
            style={{
              background: `linear-gradient(135deg, ${cert.color}22 0%, var(--surface-2) 100%)`,
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
              style={{ background: `${cert.color}15` }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={cert.color} strokeWidth="1.5">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="font-display text-xl leading-tight text-center truncate w-full" style={{ color: cert.color }}>
              {cert.title}
            </p>
          </div>
        )}
        
        <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none" style={{
          background: "linear-gradient(to top, rgba(var(--color-overlay-base), 0.8) 0%, transparent 100%)"
        }} />

        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          {cert.category.map(cat => (
            <div key={cat} className="font-mono text-[0.6rem] uppercase tracking-widest px-2 py-1 rounded-sm border backdrop-blur-sm" style={{
              background: `${cert.color}15`,
              color: cert.color,
              borderColor: `${cert.color}40`,
            }}>
              {cat}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="font-mono text-[var(--text-primary)] text-xs sm:text-sm leading-tight mb-2 line-clamp-2" style={{ minHeight: "2.5rem" }}>
          {cert.title}
        </h3>
        <p className="font-body text-[var(--text-secondary)] text-xs mb-1 truncate">{cert.issuer}</p>
        <p className="font-mono text-[0.6rem] text-[var(--text-tertiary)] mb-4 uppercase tracking-widest">{cert.date}</p>
        
        <div className="flex flex-wrap gap-1.5 mb-4">
          {cert.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="font-mono text-[0.6rem] rounded-sm px-2 py-0.5" style={{ background: "var(--surface-2)", color: "var(--text-tertiary)" }}>
              {skill}
            </span>
          ))}
          {cert.skills.length > 3 && (
            <span className="font-mono text-[0.6rem] rounded-sm px-2 py-0.5" style={{ background: "var(--surface-2)", color: "var(--text-tertiary)" }}>
              +{cert.skills.length - 3}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          {cert.credentialId !== "N/A" ? (
            <span className="font-mono text-[0.55rem] text-[var(--text-tertiary)] uppercase tracking-wider truncate mr-2">
              ID: {cert.credentialId}
            </span>
          ) : (
            <span className="font-mono text-[0.55rem] text-[var(--text-tertiary)] uppercase tracking-wider truncate mr-2">
              VERIFIED
            </span>
          )}
          <span className="font-mono text-[0.6rem] tracking-widest uppercase transition-colors" style={{ color: cert.color }}>
            Verify ↗
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Certificates() {
  const t = useTranslations("Certificates");
  const categories = [t('filter_all'), t('filter_ai'), t('filter_ml'), t('filter_data'), t('filter_cloud')];
  const [filter, setFilter] = useState(categories[0]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const filtered = filter === categories[0] ? certificates : certificates.filter((c) => c.category.includes(filter));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCert(null);
      if (e.key === "ArrowLeft" && selectedCert) {
        const idx = filtered.findIndex((c) => c.id === selectedCert.id);
        if (idx > 0) setSelectedCert(filtered[idx - 1]);
      }
      if (e.key === "ArrowRight" && selectedCert) {
        const idx = filtered.findIndex((c) => c.id === selectedCert.id);
        if (idx < filtered.length - 1) setSelectedCert(filtered[idx + 1]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCert, filtered]);

  return (
    <section
      id="certificates"
      className="relative overflow-hidden py-16 md:py-24"
      style={{
        background: "var(--surface-0)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16">
          <div>
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#C8FF00", boxShadow: "0 0 8px #C8FF00" }} />
                <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase" style={{ color: "var(--text-tertiary)" }}>
                  {t('tag')}
                </span>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2
                className="font-display leading-none tracking-tight break-words"
                style={{ fontSize: "clamp(2.25rem, 8vw, 6.5rem)", color: "var(--text-primary)" }}
              >
                {t('heading1')}<br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #FF2D2D 0%, #FF6B35 50%, #C8FF00 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {t('heading_highlight')}
                </span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <p className="font-body text-base mt-6 max-w-xl" style={{ color: "var(--text-secondary)" }}>
                {t('description')}
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal direction="left" delay={0.2}>
            <div className="flex overflow-x-auto pb-4 -mb-4 scrollbar-hide gap-2 sm:flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className="relative font-mono text-[0.6rem] tracking-widest uppercase rounded-sm px-3 py-1.5 transition-colors duration-200 min-h-[40px] flex items-center justify-center whitespace-nowrap"
                  style={{
                    background: filter === cat ? "#C8FF00" : "var(--surface-2)",
                    color: filter === cat ? "#0A0A0A" : "var(--text-tertiary)",
                    border: "1px solid",
                    borderColor: filter === cat ? "#C8FF00" : "var(--border)",
                  }}
                >
                  {cat}
                  {filter === cat && (
                    <motion.div
                      layoutId="cert-filter-indicator"
                      className="absolute inset-0 rounded-sm -z-10"
                      style={{ background: "#C8FF00", boxShadow: "0 0 16px rgba(200,255,0,0.4)" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </ScrollReveal>
        </div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((cert, index) => (
              <CertificateCard key={cert.id} cert={cert} index={index} onClick={() => setSelectedCert(cert)} />
            ))}
          </AnimatePresence>
        </motion.div>

        <ScrollReveal delay={0.3}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 pt-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { value: 7, suffix: "", label: "Certificates Earned", color: "#C8FF00" },
              { value: 4, suffix: "+", label: "Platforms", color: "#FF6B35" },
              { value: 2025, suffix: "", label: "Active Learning", color: "#A855F7", static: "2023-2025" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-4xl sm:text-5xl leading-none mb-2" style={{ color: stat.color }}>
                  {stat.static ? stat.static : <AnimatedCounter target={stat.value} suffix={stat.suffix} />}
                </div>
                <div className="font-mono text-[0.6rem] tracking-widest uppercase" style={{ color: "var(--text-tertiary)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

      </div>

      <AnimatePresence>
        {selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-8"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
            onClick={() => setSelectedCert(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-full sm:max-w-[700px] rounded-none sm:rounded-sm overflow-hidden flex flex-col"
              style={{
                background: "var(--surface-1)",
                border: `1px solid ${selectedCert.color}59`,
                maxHeight: "100dvh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center rounded-sm bg-black/50 hover:bg-black/80 transition-colors"
                onClick={() => setSelectedCert(null)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--text-primary)" strokeWidth="1.5">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>

              <div className="w-full h-[200px] sm:h-[350px] relative shrink-0 bg-black">
                <Image
                  src={selectedCert.image}
                  alt={selectedCert.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div
                  className="absolute inset-0 flex-col items-center justify-center hidden"
                  style={{
                    background: `linear-gradient(135deg, ${selectedCert.color}22 0%, var(--surface-2) 100%)`,
                  }}
                >
                   <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: `${selectedCert.color}15` }}>
                     <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={selectedCert.color} strokeWidth="1.5">
                       <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                     </svg>
                   </div>
                   <p className="font-display text-3xl leading-tight text-center px-6" style={{ color: selectedCert.color }}>{selectedCert.title}</p>
                </div>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                   {selectedCert.category.map(cat => (
                     <span key={cat} className="font-mono text-[0.6rem] uppercase tracking-widest px-2 py-1 rounded-sm border" style={{ background: `${selectedCert.color}15`, color: selectedCert.color, borderColor: `${selectedCert.color}40` }}>
                       {cat}
                     </span>
                   ))}
                   <span className="font-mono text-[0.6rem] text-[var(--text-tertiary)] uppercase tracking-widest">{selectedCert.date}</span>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl text-[var(--text-primary)] leading-none mb-3">{selectedCert.title}</h2>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-sm flex items-center justify-center font-display text-xs" style={{ background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {selectedCert.issuer.charAt(0)}
                  </div>
                  <p className="font-body text-[var(--text-secondary)]">{selectedCert.issuer}</p>
                </div>
                
                <p className="font-body text-sm text-[#D0D0D0] mb-6 leading-relaxed">
                  {selectedCert.description}
                </p>

                <div className="mb-8">
                  <h4 className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-tertiary)] mb-3">{t('skills')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCert.skills.map((skill) => (
                      <span key={skill} className="font-mono text-[0.65rem] rounded-sm px-2.5 py-1" style={{ border: `1px solid ${selectedCert.color}40`, color: selectedCert.color, background: `${selectedCert.color}10` }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="font-mono text-[0.6rem] text-[var(--text-tertiary)] uppercase tracking-widest">
                    {selectedCert.credentialId !== "N/A" ? `${t('credential_id')}: ${selectedCert.credentialId}` : t('verified')}
                  </div>
                  <a
                    href={selectedCert.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 font-mono text-[0.7rem] tracking-widest uppercase px-6 py-3 rounded-sm transition-transform hover:scale-[1.02]"
                    style={{ background: selectedCert.color, color: "#0A0A0A" }}
                  >
                    {t('verify_full')}
                  </a>
                </div>
              </div>

              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 sm:-mx-16 pointer-events-none">
                <button
                  className="w-12 h-12 rounded-sm flex items-center justify-center bg-black/80 hover:bg-black border transition-colors pointer-events-auto backdrop-blur-sm disabled:opacity-30"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const idx = filtered.findIndex((c) => c.id === selectedCert.id);
                    if (idx > 0) setSelectedCert(filtered[idx - 1]);
                  }}
                  disabled={filtered.findIndex((c) => c.id === selectedCert.id) === 0}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button
                  className="w-12 h-12 rounded-sm flex items-center justify-center bg-black/80 hover:bg-black border transition-colors pointer-events-auto backdrop-blur-sm disabled:opacity-30"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const idx = filtered.findIndex((c) => c.id === selectedCert.id);
                    if (idx < filtered.length - 1) setSelectedCert(filtered[idx + 1]);
                  }}
                  disabled={filtered.findIndex((c) => c.id === selectedCert.id) === filtered.length - 1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
