"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type PdfJsModule = {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument(source: { data: ArrayBuffer }): {
    promise: Promise<{
      numPages: number;
      getPage(pageNumber: number): Promise<{
        getTextContent(): Promise<{
          items: Array<{ str?: string }>;
        }>;
      }>;
    }>;
  };
};

declare global {
  interface Window {
    pdfjsLib?: PdfJsModule;
  }
}

let pdfJsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (typeof window === "undefined") {
    throw new Error("PDF parsing is only available in the browser.");
  }

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    return window.pdfjsLib;
  }

  pdfJsPromise ??= new Promise<PdfJsModule>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pdfjs="career"]');
    if (existing) {
      existing.addEventListener("load", () => {
        if (!window.pdfjsLib) reject(new Error("PDF.js failed to initialize."));
        else resolve(window.pdfjsLib);
      });
      existing.addEventListener("error", () => reject(new Error("Could not load PDF.js.")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.dataset.pdfjs = "career";
    script.onload = () => {
      if (!window.pdfjsLib) {
        reject(new Error("PDF.js failed to initialize."));
        return;
      }
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error("Could not load PDF.js."));
    document.head.appendChild(script);
  });

  const pdfjsLib = await pdfJsPromise;
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  return pdfjsLib;
}

type InputMode = "pdf" | "text";

type PdfResumeUploaderProps = {
  onTextExtracted: (text: string) => void;
  value: string;
  onChange: (text: string) => void;
};

export default function PdfResumeUploader({ onTextExtracted, value, onChange }: PdfResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<InputMode>("pdf");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [preview, setPreview] = useState("");

  const extractPdfText = useCallback(async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF resume.");
      return;
    }

    setLoading(true);
    setError(null);
    setFileName(file.name);
    setPreview("");
    setPageCount(0);

    try {
      const pdfjsLib = await loadPdfJs();
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const pages: string[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (pageText) pages.push(pageText);
      }

      const text = pages.join("\n\n").trim();
      if (!text) {
        setError("No selectable text found in this PDF. Try paste mode for scanned resumes.");
        return;
      }

      setPageCount(pdf.numPages);
      setPreview(text.slice(0, 500));
      onChange(text);
      onTextExtracted(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read PDF resume.");
    } finally {
      setLoading(false);
    }
  }, [onChange, onTextExtracted]);

  const handleFile = (file?: File | null) => {
    if (file) void extractPdfText(file);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-sm p-1" style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { id: "pdf" as InputMode, label: "Upload PDF" },
          { id: "text" as InputMode, label: "Paste Text" },
        ].map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className="relative rounded-sm py-2.5 font-mono text-[0.58rem] uppercase tracking-[0.2em]"
              style={{ color: active ? "#0A0A0A" : "var(--text-tertiary)" }}
            >
              {active && <motion.span layoutId="resume-input-mode" className="absolute inset-0 rounded-sm" style={{ background: "#C8FF00" }} />}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      {mode === "pdf" ? (
        <motion.div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFile(event.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className="relative rounded-sm overflow-hidden cursor-pointer"
          style={{
            minHeight: "260px",
            background: "var(--surface-1)",
            border: `1px dashed ${dragging ? "rgba(200,255,0,0.7)" : "var(--border)"}`,
            transition: "border-color 0.3s ease",
          }}
          whileHover={{ borderColor: "rgba(200,255,0,0.35)" }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <div className="flex flex-col items-center justify-center min-h-[260px] p-6 text-center">
            {loading ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-9 h-9 border-2 rounded-full mb-4"
                  style={{ borderColor: "rgba(200,255,0,0.2)", borderTopColor: "#C8FF00" }}
                />
                <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase" style={{ color: "#C8FF00" }}>
                  Extracting PDF text...
                </p>
              </>
            ) : preview ? (
              <div className="w-full text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em]" style={{ color: "#C8FF00" }}>
                      {fileName}
                    </p>
                    <p className="font-body text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                      {pageCount} page{pageCount === 1 ? "" : "s"} extracted
                    </p>
                  </div>
                  <span className="rounded-sm px-2.5 py-1 font-mono text-[0.52rem] uppercase tracking-widest" style={{ color: "#C8FF00", background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.2)" }}>
                    Click to replace
                  </span>
                </div>
                <p className="rounded-sm p-3 font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)", background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  {preview}{value.length > 500 ? "..." : ""}
                </p>
              </div>
            ) : (
              <>
                <motion.div
                  animate={{ y: dragging ? -8 : [0, -4, 0] }}
                  transition={{ duration: dragging ? 0.2 : 2.2, repeat: dragging ? 0 : Infinity }}
                  className="text-4xl mb-3 opacity-40"
                >
                  📄
                </motion.div>
                <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase mb-1" style={{ color: dragging ? "#C8FF00" : "var(--text-tertiary)" }}>
                  {dragging ? "Drop PDF resume here" : "Upload PDF Resume"}
                </p>
                <p className="font-body text-xs" style={{ color: "#404040" }}>
                  Drag and drop or click. Text is extracted locally in your browser.
                </p>
              </>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="rounded-sm overflow-hidden" style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex justify-between px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Resume Text</span>
            <span className="font-mono text-[0.55rem]" style={{ color: value.length > 4500 ? "#FF2D2D" : "var(--text-tertiary)" }}>{value.length}/5000</span>
          </div>
          <textarea
            value={value}
            onChange={(event) => {
              const text = event.target.value.slice(0, 5000);
              onChange(text);
              onTextExtracted(text);
            }}
            rows={12}
            placeholder={"Paste your resume text here...\nInclude skills, experience, projects, education."}
            className="w-full bg-transparent px-3 py-3 font-body text-sm resize-none focus:outline-none leading-relaxed"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-sm px-4 py-3"
            style={{ background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.25)" }}
          >
            <p className="font-mono text-[0.62rem]" style={{ color: "#FF2D2D" }}>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
