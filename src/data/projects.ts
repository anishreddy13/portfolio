export type ProjectStatus = "live" | "beta" | "local" | "monitoring";

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  description: string;
  technologies: string[];
  priority: number;
  route: string;
  section: string;
  featured: boolean;
  status: ProjectStatus;
  metrics: ProjectMetric[];
  accentColor: string;
  complexityTags: string[];
}

const portfolioProjects: PortfolioProject[] = [
  {
    id: "01",
    title: "Plant Disease Detection",
    category: "Computer Vision",
    description:
      "Production-style leaf disease classifier served through a lightweight Hugging Face Spaces FastAPI deployment with multipart uploads, EfficientNet-B0 inference, top-5 confidence analysis, Grad-CAM explanations, webcam capture, and local analytics.",
    technologies: ["PyTorch", "FastAPI", "EfficientNet", "HF Spaces", "Next.js"],
    priority: 1,
    route: "/ml?tab=plant",
    section: "ML Lab",
    featured: true,
    status: "live",
    metrics: [
      { label: "Accuracy", value: "97.84%" },
      { label: "Classes", value: "15" },
      { label: "Dataset", value: "20K+" },
    ],
    accentColor: "#C8FF00",
    complexityTags: ["COMPUTER VISION", "CNN", "GRAD-CAM", "HF SPACES", "UPLOAD API"],
  },
  {
    id: "02",
    title: "ML Monitoring Dashboard",
    category: "MLOps",
    description:
      "Operational dashboard for model predictions, service health, drift reports, pipeline runs, visitor telemetry, and live analytics. Built as the observability layer for the portfolio's deployed AI systems.",
    technologies: ["Next.js", "Recharts", "FastAPI", "Supabase", "Redis"],
    priority: 2,
    route: "/dashboard?tab=monitoring",
    section: "Dashboard",
    featured: true,
    status: "monitoring",
    metrics: [
      { label: "Tabs", value: "5" },
      { label: "Signals", value: "Live" },
      { label: "Drift", value: "Tracked" },
    ],
    accentColor: "#FF2D2D",
    complexityTags: ["MLOPS", "DRIFT", "REAL-TIME", "CI/CD", "OBSERVABILITY"],
  },
  {
    id: "03",
    title: "AI Interview Analyzer",
    category: "Speech AI",
    description:
      "Browser-native interview practice module with live speech capture, transcript scoring, answer feedback, and interactive coaching UI integrated directly into the ML Lab experience.",
    technologies: ["Web Speech API", "React", "TypeScript", "Framer Motion"],
    priority: 3,
    route: "/ml?tab=interview",
    section: "ML Lab",
    featured: true,
    status: "live",
    metrics: [
      { label: "Mode", value: "Live" },
      { label: "Input", value: "Voice" },
      { label: "Feedback", value: "Instant" },
    ],
    accentColor: "#FF6B35",
    complexityTags: ["SPEECH", "REAL-TIME", "BROWSER AI", "COACHING"],
  },
  {
    id: "04",
    title: "Skin Disease Detection",
    category: "Computer Vision",
    description:
      "Medical-image demo for skin lesion classification with image upload, CNN inference, risk-oriented result panels, top-5 predictions, and clinical-style confidence breakdowns.",
    technologies: ["PyTorch", "FastAPI", "CNN", "Next.js"],
    priority: 4,
    route: "/ml?tab=skin",
    section: "ML Lab",
    featured: false,
    status: "live",
    metrics: [
      { label: "Classes", value: "7" },
      { label: "Input", value: "Image" },
      { label: "Output", value: "Top-5" },
    ],
    accentColor: "#A855F7",
    complexityTags: ["COMPUTER VISION", "CNN", "IMAGE UPLOAD", "RISK UI"],
  },
  {
    id: "05",
    title: "Emotion Detection",
    category: "NLP",
    description:
      "Text understanding module that predicts primary emotion, gender, and age signals with ranked scores, confidence bars, examples, and history inside the shared ML Lab interface.",
    technologies: ["scikit-learn", "FastAPI", "NLP", "Next.js"],
    priority: 5,
    route: "/ml?tab=emotion",
    section: "ML Lab",
    featured: false,
    status: "live",
    metrics: [
      { label: "Emotions", value: "28" },
      { label: "Mode", value: "Text" },
      { label: "Scores", value: "Ranked" },
    ],
    accentColor: "#FF2D2D",
    complexityTags: ["NLP", "MULTI-TASK", "CLASSIFICATION", "FASTAPI"],
  },
  {
    id: "06",
    title: "Spam Detection",
    category: "NLP",
    description:
      "SMS-style spam classifier with ham/spam probability scoring, keyword surfacing, confidence visualizations, sample prompts, and production API integration patterns.",
    technologies: ["scikit-learn", "FastAPI", "NLP", "Next.js"],
    priority: 6,
    route: "/ml?tab=spam",
    section: "ML Lab",
    featured: false,
    status: "live",
    metrics: [
      { label: "Labels", value: "2" },
      { label: "Signals", value: "Keywords" },
      { label: "API", value: "Live" },
    ],
    accentColor: "#FF6B35",
    complexityTags: ["NLP", "SECURITY", "CLASSIFICATION", "API"],
  },
  {
    id: "07",
    title: "Sentiment Analysis",
    category: "NLP",
    description:
      "Deployed sentiment model for positive, negative, and neutral text classification with confidence scores, class distribution bars, examples, and prediction history.",
    technologies: ["scikit-learn", "FastAPI", "NLP", "Next.js"],
    priority: 7,
    route: "/ml?tab=sentiment",
    section: "ML Lab",
    featured: false,
    status: "live",
    metrics: [
      { label: "Classes", value: "3" },
      { label: "Input", value: "Text" },
      { label: "Status", value: "Live" },
    ],
    accentColor: "#C8FF00",
    complexityTags: ["NLP", "TEXT ML", "FASTAPI", "DASHBOARD"],
  },
];

export const projects = [...portfolioProjects].sort((a, b) => {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.priority !== b.priority) return a.priority - b.priority;
  return b.complexityTags.length - a.complexityTags.length;
});

export const projectCategories = [
  "All",
  ...Array.from(new Set(projects.map((project) => project.category))),
];
