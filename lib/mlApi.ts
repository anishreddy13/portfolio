const DEFAULT_ML_API_URL = "https://portfolio-pkdj.onrender.com";
const DEFAULT_SKIN_API_URL = "https://anishreddy13-skin-cancer-api.hf.space";
const DEFAULT_PLANT_API_URL = "https://anishreddy13-plant-disease-api.hf.space";

const mlApiUrl = process.env.NEXT_PUBLIC_ML_API_URL || DEFAULT_ML_API_URL;
const skinApiUrl = process.env.NEXT_PUBLIC_SKIN_API_URL || DEFAULT_SKIN_API_URL;
const plantApiUrl = process.env.NEXT_PUBLIC_PLANT_API_URL || DEFAULT_PLANT_API_URL;

// 30-second timeout for all ML API calls — Render and HuggingFace cold-starts
// can be slow; without a timeout requests hang until the platform kills them.
const ML_FETCH_TIMEOUT_MS = 30_000;

function buildUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data.detail || data.message || fallback;
  } catch {
    return fallback;
  }
}

async function postJson<T>(
  baseUrl: string,
  path: string,
  body: Record<string, unknown>,
  fallbackError = "Request failed"
): Promise<T> {
  const response = await fetch(buildUrl(baseUrl, path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(ML_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, fallbackError));
  }

  return response.json();
}

export function fetchMlJson<T>(path: string, body: Record<string, unknown>) {
  return postJson<T>(mlApiUrl, path, body);
}

export function fetchSkinJson<T>(path: string, body: Record<string, unknown>) {
  return postJson<T>(skinApiUrl, path, body, "Prediction failed");
}

export async function fetchPlantForm<T>(path: string, image: File) {
  const formData = new FormData();
  formData.append("image", image);

  const response = await fetch(buildUrl(plantApiUrl, path), {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(ML_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Plant prediction failed"));
  }

  return response.json() as Promise<T>;
}

export function fetchMlHealth() {
  return fetch(buildUrl(mlApiUrl, "/health"), { signal: AbortSignal.timeout(ML_FETCH_TIMEOUT_MS) });
}

export function fetchSkinHealth() {
  return fetch(buildUrl(skinApiUrl, "/"), { signal: AbortSignal.timeout(ML_FETCH_TIMEOUT_MS) });
}

export function fetchPlantHealth() {
  return fetch(buildUrl(plantApiUrl, "/health"), { signal: AbortSignal.timeout(ML_FETCH_TIMEOUT_MS) });
}

// ─── Authorship Lab Types & API ───────────────────────────────────────────────

export interface ModelPredictionDetail {
  model_name: string;
  predicted_label: "Human-written" | "AI-generated";
  predicted_class: 0 | 1;
  ai_probability: number;
  human_probability: number;
  confidence: number;
  score_type: string;
}

export interface ConsensusSummary {
  majority_vote_label: "Human-written" | "AI-generated";
  majority_vote_class: 0 | 1;
  ai_votes: number;
  human_votes: number;
  mean_ai_probability: number;
  agreement: "unanimous" | "disagreement";
}

export interface TokenAttribution {
  feature: string;
  tfidf: number;
  coefficient: number;
  contribution: number;
  direction: "AI" | "Human";
}

export interface AuthorshipPredictionResponse {
  model_version: string;
  text_length_chars: number;
  text_length_words: number;
  predictions: {
    naive_bayes: ModelPredictionDetail;
    logistic_regression: ModelPredictionDetail;
    calibrated_svm: ModelPredictionDetail;
    [key: string]: ModelPredictionDetail;
  };
  consensus: ConsensusSummary;
  length_warning: string | null;
  explanations: TokenAttribution[];
  limitations_disclaimer: string;
}

export interface ConfusionMatrixData {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
  raw_matrix: number[][];
  description: string;
}

export interface ModelComparisonMetrics {
  accuracy: number;
  precision_ai: number;
  recall_ai: number;
  f1_ai: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  f1_weighted: number;
  roc_auc: number;
  pr_auc: number;
  brier_score: number;
  confusion_matrix: ConfusionMatrixData;
  per_class: {
    human_0: { precision: number; recall: number; f1: number; support: number };
    ai_1: { precision: number; recall: number; f1: number; support: number };
  };
  test_sample_count: number;
}

export interface AuthorshipBenchmarkResponse {
  benchmark_metadata: {
    version: string;
    timestamp: string;
    dataset_provenance: {
      name: string;
      doi: string;
      license: string;
      raw_samples: number;
      clean_samples: number;
      positive_class: string;
      negative_class: string;
      training_word_count_min?: number;
      training_word_count_max?: number;
    };
    split_protocol: {
      random_seed: number;
      train: { samples: number; human_0: number; ai_1: number; percentage: number };
      validation: { samples: number; human_0: number; ai_1: number; percentage: number };
      test: { samples: number; human_0: number; ai_1: number; percentage: number };
    };
    feature_representation: {
      vectorizer_type: string;
      total_features: number;
      word_features_count: number;
      char_features_count: number;
      vectorizer_fit_duration_sec: number;
    };
    training_durations_sec: Record<string, number>;
    artifact_info: {
      bundle_path: string;
      bundle_size_bytes: number;
      bundle_size_mb: number;
      compression: string;
    };
  };
  model_comparison: {
    naive_bayes: ModelComparisonMetrics;
    logistic_regression: ModelComparisonMetrics;
    calibrated_svm: ModelComparisonMetrics;
    [key: string]: ModelComparisonMetrics;
  };
  validation_metrics: Record<string, ModelComparisonMetrics>;
  subgroup_analysis: {
    text_length_slices: Record<string, {
      sample_count: number;
      human_count: number;
      ai_count: number;
      models: Record<string, {
        accuracy: number;
        precision_ai: number;
        recall_ai: number;
        f1_ai: number;
        roc_auc: number;
        brier_score: number;
      }>;
    }>;
    source_domain_and_generator_slices: Record<string, {
      sample_count: number;
      human_count: number;
      ai_count: number;
      models: Record<string, {
        accuracy: number;
        mean_ai_probability: number;
        f1_ai?: number;
      }>;
    }>;
  };
  perturbation_robustness_tests: Record<string, {
    description: string;
    sample_count: number;
    models: Record<string, {
      accuracy: number;
      precision_ai: number;
      recall_ai: number;
      f1_ai: number;
      roc_auc: number;
      brier_score: number;
      accuracy_delta: number;
      f1_delta: number;
    }>;
  }>;
}

export function fetchAuthorshipPrediction(text: string) {
  return postJson<AuthorshipPredictionResponse>(
    mlApiUrl,
    "/predict/authorship",
    { text },
    "Authorship analysis failed"
  );
}

export async function fetchAuthorshipBenchmark(): Promise<AuthorshipBenchmarkResponse> {
  const response = await fetch(buildUrl(mlApiUrl, "/benchmark/authorship"), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(ML_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to load authorship benchmark data"));
  }

  return response.json();
}
