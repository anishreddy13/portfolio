export interface Prediction {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  link: string;
  sentiment: string;
  confidence: number;
  scores: Record<string, number>;
  processed_at: string;
}

export interface ModelVersion {
  id: string;
  version: string;
  accuracy: number;
  f1_score: number;
  stage: string;
  retrain_reason: string;
  deployed_at: string;
}

export interface DriftReport {
  id: string;
  drift_detected: boolean;
  accuracy: number;
  drift_score: number;
  action_taken: string;
  sample_size: number;
  created_at: string;
}

export interface UserActivity {
  id: string;
  session_id: string;
  page: string;
  event_type: string;
  browser: string;
  os: string;
  device: string;
  country: string;
  city: string;
  created_at: string;
}

export interface PipelineRun {
  id: string;
  run_number: number;
  status: string;
  trigger: string;
  old_accuracy: number;
  new_accuracy: number;
  deployed: boolean;
  reason: string;
  created_at: string;
}

export interface Toast {
  id: string;
  type: "drift" | "pipeline" | "prediction";
  title: string;
  message: string;
  color: string;
}

export type ServiceState = "online" | "offline" | "checking" | "stale";

export interface ServiceHealth {
  renderApi: ServiceState;
  skinApi: ServiceState;
  worker: ServiceState;
  supabase: ServiceState;
  lastPredictionAt?: string;
  lastActivityAt?: string;
  checkedAt?: string;
}
