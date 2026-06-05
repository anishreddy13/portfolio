export interface SkillTrend {
  id: string;
  skill: string;
  demand_score: number;
  velocity: number;
  decay_score: number;
  saturation: number;
  salary_momentum: number;
  ai_risk: number;
  updated_at: string;
}

export interface StudentAnalysisInput {
  user_id: string;
  name: string;
  resume_text: string;
  github_url?: string;
  target_role?: string;
}

export interface SalaryPrediction {
  currency: string;
  min_salary: number;
  max_salary: number;
  median_salary: number;
  confidence: number;
  formatted: string;
}

export interface EmployabilityScore {
  overall_score: number;
  grade: string;
  skill_match_score: number;
  market_alignment: number;
  future_readiness: number;
  github_bonus: number;
  salary_prediction: SalaryPrediction | null;
  score_breakdown: {
    current_skills: number;
    trending_skills: number;
    market_demand: number;
    github_presence: number;
  };
  improvement_potential: number;
}

export interface CareerRisk {
  risk_score: number;
  risk_level: string;
  at_risk_skills: string[];
  risk_reasons: string[];
  mitigation_steps: string[];
}

export interface SkillGap {
  skill: string;
  demand_score: number;
  priority: string;
  reason: string;
}

export interface RoadmapMonth {
  month: number;
  focus: string;
  skills_to_learn: string[];
  resources: string[];
  milestone: string;
}

export interface CareerRoadmap {
  target_role: string;
  total_months: number;
  monthly_plan: RoadmapMonth[];
  key_projects: string[];
  estimated_salary_range: string;
  skill_priority_order: string[];
  market_context: string;
  generated_at: string;
}

export interface QuickWin {
  skill: string;
  why: string;
  time_to_learn: string;
  relates_to: string;
}

export interface MarketSnapshot {
  top_skills: SkillTrend[];
  declining_skills: SkillTrend[];
  github_languages: string[];
  total_jobs: number;
  last_scraped: string;
}

export interface StudentAnalysisResult {
  status: string;
  data: {
    user_id: string;
    parsed_resume: {
      skills: string[];
      experience_level: string;
      contact: Record<string, string>;
      education: Record<string, string>;
      projects: string[];
      word_count: number;
      parsed_at?: string;
    };
    employability: EmployabilityScore;
    career_risk: CareerRisk;
    skill_gaps: SkillGap[];
    matching_skills: SkillTrend[];
    roadmap: CareerRoadmap;
    quick_wins: QuickWin[];
    salary_prediction: SalaryPrediction;
    market_snapshot: MarketSnapshot;
    market_data_source?: "live" | "fallback";
    errors?: Record<string, string>;
  };
  message: string;
  timestamp: string;
}

export interface MentorResponse {
  response: string;
  model_used: string;
  tokens_used: number | null;
}

export interface ContextualMentorResponse {
  response: string;
  follow_up_questions: string[];
  relevant_skills: string[];
}

export interface GithubRepo {
  repo_name: string;
  language: string;
  stars: number;
  trend_score: number;
}

export interface ScraperLog {
  id: string;
  source: string;
  job_type?: string;
  status: string;
  jobs_fetched: number;
  items_processed?: number;
  error: string;
  message?: string;
  ran_at: string;
  finished_at?: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  skills: string[];
  employability_score: number;
  career_risk_score: number;
  created_at: string;
}

export interface ResumeAnalysis {
  extracted_skills: string[];
  employability_score: EmployabilityScore;
  skill_gaps: SkillGap[];
  matching_skills: SkillTrend[];
  salary_prediction: SalaryPrediction;
  ai_analysis: Record<string, unknown>;
  recommendations: string[];
}

export interface MentorResumeAnalysis {
  extracted_skills: string[];
  experience_level: string;
  strengths: string[];
  weaknesses: string[];
  recommended_roles: string[];
}

export interface CareerApiResponse<T> {
  status: string;
  data: T;
  message: string;
  timestamp: string;
}
