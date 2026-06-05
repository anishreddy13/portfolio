import type {
  CareerApiResponse,
  ContextualMentorResponse,
  GithubRepo,
  MarketSnapshot,
  MentorResponse,
  MentorResumeAnalysis,
  ResumeAnalysis,
  SalaryPrediction,
  ScraperLog,
  SkillTrend,
  StudentAnalysisInput,
  StudentAnalysisResult,
  StudentProfile,
} from "@/types/career";

const CAREER_API_URL =
  process.env.NEXT_PUBLIC_CAREER_API_URL ||
  "https://anishreddy13-career-intelligence-api.hf.space";

function buildUrl(path: string) {
  return `${CAREER_API_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { detail?: string; message?: string };
    return data.detail || data.message || fallback;
  } catch {
    return fallback;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(buildUrl(path), {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });

    if (response.status === 429) {
      throw new Error("Too many requests");
    }

    if (!response.ok) {
      throw new Error(await readApiError(response, "Career API request failed"));
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Career API is warming up, please try again in 30 seconds");
    }
    if (error instanceof TypeError) {
      throw new Error("Career API is warming up, please try again in 30 seconds");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function careerPost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  return requestJson<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function careerGet<T>(path: string): Promise<T> {
  return requestJson<T>(path, { method: "GET" });
}

function unwrap<T>(response: CareerApiResponse<T>): T {
  return response.data;
}

export async function triggerScrapeAll(): Promise<{
  status: string;
  message: string;
}> {
  const response = await careerPost<CareerApiResponse<unknown>>("/scrape/all", {});
  return { status: response.status, message: response.message };
}

export async function recomputeTrends(): Promise<{
  status: string;
  message: string;
}> {
  const response = await careerPost<CareerApiResponse<unknown>>("/trends/recompute", {});
  return { status: response.status, message: response.message };
}

export async function getScrapeStatus(): Promise<{
  queue_length: number;
  last_run: string;
  status: string;
}> {
  return unwrap(
    await careerGet<
      CareerApiResponse<{ queue_length: number; last_run: string; status: string }>
    >("/scrape/status")
  );
}

export async function getScrapeLogs(): Promise<{
  logs: ScraperLog[];
}> {
  return unwrap(await careerGet<CareerApiResponse<{ logs: ScraperLog[] }>>("/scrape/logs"));
}

export async function getSkillTrends(limit = 50): Promise<{
  skills: SkillTrend[];
  total: number;
  updated_at: string;
}> {
  return unwrap(
    await careerGet<CareerApiResponse<{ skills: SkillTrend[]; total: number; updated_at: string }>>(
      `/trends/skills?limit=${limit}`
    )
  );
}

export async function getTopSkills(): Promise<{
  rising_skills: SkillTrend[];
}> {
  return unwrap(
    await careerGet<CareerApiResponse<{ rising_skills: SkillTrend[] }>>("/trends/top")
  );
}

export async function getDecliningSkills(): Promise<{
  declining_skills: SkillTrend[];
}> {
  return unwrap(
    await careerGet<CareerApiResponse<{ declining_skills: SkillTrend[] }>>("/trends/declining")
  );
}

export async function getGithubTrending(): Promise<{
  repos: GithubRepo[];
  languages: string[];
}> {
  return unwrap(
    await careerGet<CareerApiResponse<{ repos: GithubRepo[]; languages: string[] }>>(
      "/trends/github"
    )
  );
}

export async function analyzeStudentFull(
  payload: StudentAnalysisInput
): Promise<StudentAnalysisResult> {
  return careerPost<StudentAnalysisResult>("/student/analyze/full", { ...payload });
}

export async function getStudentProfile(userId: string): Promise<StudentProfile> {
  const response = await careerGet<
    CareerApiResponse<{ profile: StudentProfile; latest_roadmap?: unknown }>
  >(`/student/${encodeURIComponent(userId)}`);
  return response.data.profile;
}

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  return unwrap(await careerGet<CareerApiResponse<MarketSnapshot>>("/student/market/snapshot"));
}

export async function predictSalary(payload: {
  skills: string[];
  experience_level: string;
  location: string;
}): Promise<SalaryPrediction> {
  return unwrap(
    await careerPost<CareerApiResponse<SalaryPrediction>>("/ml/predict/salary", payload)
  );
}

export async function analyzeResume(payload: {
  resume_text: string;
  target_role: string;
}): Promise<ResumeAnalysis> {
  return unwrap(await careerPost<CareerApiResponse<ResumeAnalysis>>("/ml/analyze/resume", payload));
}

export async function chatWithMentor(payload: {
  user_id: string;
  message: string;
  student_skills?: string[];
  employability_score?: number;
}): Promise<MentorResponse> {
  return unwrap(await careerPost<CareerApiResponse<MentorResponse>>("/mentor/chat", payload));
}

export async function contextualChat(payload: {
  user_id: string;
  message: string;
}): Promise<ContextualMentorResponse> {
  return unwrap(
    await careerPost<CareerApiResponse<ContextualMentorResponse>>(
      "/mentor/chat/contextual",
      payload
    )
  );
}

export async function analyzeResumeWithMentor(
  resume_text: string
): Promise<MentorResumeAnalysis> {
  return unwrap(
    await careerPost<CareerApiResponse<MentorResumeAnalysis>>("/mentor/analyze-resume", {
      resume_text,
    })
  );
}

export async function getCareerApiHealth(): Promise<{
  status: string;
}> {
  return careerGet<{ status: string }>("/health");
}

export async function getMlHealth(): Promise<{
  skill_trend_model: string;
  salary_model: string;
  resume_matcher: string;
}> {
  return unwrap(
    await careerGet<
      CareerApiResponse<{
        skill_trend_model: string;
        salary_model: string;
        resume_matcher: string;
      }>
    >("/ml/health")
  );
}
