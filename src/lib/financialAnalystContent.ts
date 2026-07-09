/* ═══════════════════════════════════════════════
   AI Financial Analyst — Content Data
   Stats, tech badges, workflow steps, and agent
   metadata for the portfolio featured section.
   ═══════════════════════════════════════════════ */

export const financialTechBadges = [
  "LangGraph",
  "Groq (Llama-3)",
  "yfinance",
  "DuckDuckGo Search",
  "Gradio",
  "Hugging Face Spaces",
];

export const financialProductStats = [
  { label: "AI Agents", value: "3", color: "#C8FF00" },
  { label: "Data Sources", value: "2", color: "#FF6B35" },
  { label: "Inference", value: "~8s", color: "#A855F7" },
];

export interface AgentDetail {
  name: string;
  icon: string;
  role: string;
  tools: string[];
  color: string;
  description: string;
}

export const agentDetails: AgentDetail[] = [
  {
    name: "Researcher",
    icon: "🔍",
    role: "News & Sentiment",
    tools: ["DuckDuckGo Search", "Llama-3"],
    color: "#C8FF00",
    description:
      "Scrapes the web for recent financial news and synthesizes sentiment analysis using LLM reasoning.",
  },
  {
    name: "Quant Analyst",
    icon: "📊",
    role: "Financial Metrics",
    tools: ["yfinance", "Llama-3"],
    color: "#FF6B35",
    description:
      "Pulls hard financial data — P/E ratio, market cap, margins, 52-week range — and benchmarks against industry standards.",
  },
  {
    name: "Editor",
    icon: "✍️",
    role: "Investment Brief",
    tools: ["Llama-3"],
    color: "#A855F7",
    description:
      "Synthesizes research and quant data into a polished, Bloomberg-style investment brief with actionable recommendations.",
  },
];

export interface WorkflowStep {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
}

export const workflowSteps: WorkflowStep[] = [
  {
    id: "input",
    label: "User Input",
    sublabel: "Stock Ticker",
    icon: "📥",
    color: "#F0F0F0",
  },
  {
    id: "researcher",
    label: "Researcher",
    sublabel: "DDG → LLM",
    icon: "🔍",
    color: "#C8FF00",
  },
  {
    id: "quant",
    label: "Quant",
    sublabel: "yfinance → LLM",
    icon: "📊",
    color: "#FF6B35",
  },
  {
    id: "editor",
    label: "Editor",
    sublabel: "Synthesis → Brief",
    icon: "✍️",
    color: "#A855F7",
  },
  {
    id: "output",
    label: "Investment Brief",
    sublabel: "Markdown Report",
    icon: "📄",
    color: "#C8FF00",
  },
];

export interface ArchitectureCard {
  eyebrow: string;
  title: string;
  summary: string;
  accent: string;
}

export const architectureCards: ArchitectureCard[] = [
  {
    eyebrow: "Orchestration",
    title: "LangGraph State Machine",
    summary:
      "A compiled StateGraph manages a shared TypedDict that flows through each agent node — deterministic routing, no hallucinated loops.",
    accent: "#C8FF00",
  },
  {
    eyebrow: "LLM Engine",
    title: "Groq × Llama-3 (70B)",
    summary:
      "Blazing-fast inference via Groq's LPU hardware. Low temperature (0.3) for factual accuracy across all three agent prompts.",
    accent: "#FF6B35",
  },
  {
    eyebrow: "Deployment",
    title: "Hugging Face Spaces",
    summary:
      "Gradio SDK on CPU-basic hardware. Zero-config deployment with secrets management for the Groq API key.",
    accent: "#A855F7",
  },
];

export const HF_SPACE_URL =
  "https://anishreddy13-ai-financial-analyst.hf.space";

export const HF_SPACE_PAGE_URL =
  "https://huggingface.co/spaces/Anishreddy13/ai-financial-analyst";
