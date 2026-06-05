from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks
from github import Github
from pydantic import BaseModel

from db.supabase_client import get_skill_trends, insert_career_roadmap, supabase, upsert_student_profile
from models import resume_matcher, salary_predictor
from services.drift_detector import compute_market_snapshot, run_drift_check
from services.employability import compute_career_risk, compute_full_employability
from services.groq_mentor import generate_career_roadmap
from services.resume_parser import parse_resume
from services.roadmap_generator import generate_personalized_roadmap, generate_quick_wins
from services.skill_extractor import extract_skills_from_text
from services.trend_engine import compute_ai_risk
from utils.config import settings
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/student", tags=["student"])

FALLBACK_MARKET_SKILLS = [
    "python",
    "javascript",
    "typescript",
    "react",
    "docker",
    "kubernetes",
    "aws",
    "fastapi",
    "pytorch",
    "mlops",
    "langchain",
    "postgresql",
]


class StudentProfile(BaseModel):
    user_id: str
    name: str
    resume_text: str
    github_url: str = ""
    skills: list[str] = []
    target_role: str = "software engineer"


class AnalysisResult(BaseModel):
    employability_score: float
    career_risk_score: float
    skill_gaps: list[str]
    top_matching_skills: list[str]
    recommended_skills: list[str]
    market_alignment: float
    summary: str


class RoadmapRequest(BaseModel):
    user_id: str
    target_role: str
    skill_gaps: list[str] = []


class FullStudentAnalysisRequest(BaseModel):
    user_id: str
    name: str
    resume_text: str
    github_url: str = ""
    target_role: str = "software engineer"


def api_response(status: str, data: Any, message: str) -> dict:
    return {
        "status": status,
        "data": data,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _normalize_skills(skills: list[str]) -> list[str]:
    return sorted({skill.lower().strip() for skill in skills if skill and skill.strip()})


def _fallback_market_trends() -> list[dict]:
    return [
        {
            "skill": skill,
            "demand_score": max(35, 92 - index * 4),
            "velocity": max(35, 92 - index * 4),
            "decay_score": 0.08 if skill in {"kubernetes", "mlops", "langchain"} else 0.3,
            "saturation": 0.5,
            "salary_momentum": 0.9 if skill in {"kubernetes", "mlops", "pytorch", "aws"} else 0.5,
            "ai_risk": 0.1 if skill in {"mlops", "pytorch"} else 0.5,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        for index, skill in enumerate(FALLBACK_MARKET_SKILLS)
    ]


def _github_username(github_url: str) -> str:
    cleaned = github_url.strip().rstrip("/")
    if not cleaned:
        return ""
    if "github.com/" in cleaned:
        return cleaned.split("github.com/", 1)[1].split("/", 1)[0]
    return cleaned


async def _fetch_github_data(github_url: str) -> dict | None:
    try:
        username = _github_username(github_url)
        if not username:
            return None
        client = Github(settings.github_token)
        user = client.get_user(username)
        repos = list(user.get_repos()[:30])
        repo_data = [
            {
                "name": repo.full_name,
                "language": repo.language or "",
                "stars": repo.stargazers_count,
                "url": repo.html_url,
            }
            for repo in repos
        ]
        return {
            "username": username,
            "public_repos": user.public_repos,
            "total_stars": sum(repo["stars"] for repo in repo_data),
            "languages": sorted({repo["language"] for repo in repo_data if repo["language"]}),
            "repos": repo_data,
        }
    except Exception as exc:
        logger.warning("Optional GitHub profile fetch failed: %s", exc)
        return None


async def _student_market_snapshot() -> dict:
    try:
        trends = await get_skill_trends(100)
        top_skills = sorted(trends, key=lambda item: float(item.get("demand_score") or 0), reverse=True)[:20]
        declining = [item for item in trends if float(item.get("decay_score") or 0) > 0.6][:5]

        github_languages: list[str] = []
        try:
            repos = supabase.table("github_trending").select("*").order("trend_score", desc=True).limit(100).execute().data or []
            github_languages = sorted({repo.get("language") for repo in repos if repo.get("language")})
        except Exception as exc:
            logger.warning("Failed to fetch GitHub trending languages: %s", exc)

        total_jobs = 0
        last_scraped = ""
        try:
            job_rows = supabase.table("job_postings").select("id", count="exact").limit(1).execute()
            total_jobs = int(getattr(job_rows, "count", 0) or 0)
            log_rows = supabase.table("scraper_logs").select("*").order("finished_at", desc=True).limit(1).execute().data or []
            if log_rows:
                last_scraped = log_rows[0].get("finished_at") or log_rows[0].get("created_at") or ""
        except Exception as exc:
            logger.warning("Failed to fetch scrape stats: %s", exc)

        return {
            "top_skills": top_skills,
            "declining_skills": declining,
            "github_languages": github_languages,
            "total_jobs": total_jobs,
            "last_scraped": last_scraped,
        }
    except Exception as exc:
        logger.exception("Failed to build student market snapshot: %s", exc)
        return {"top_skills": [], "declining_skills": [], "github_languages": [], "total_jobs": 0, "last_scraped": "", "error": str(exc)}


@router.post("/analyze")
async def analyze_student(profile: StudentProfile):
    try:
        extracted = extract_skills_from_text(profile.resume_text)
        student_skills = _normalize_skills([*profile.skills, *extracted])

        trends = await get_skill_trends(50)
        trend_names = _normalize_skills([trend.get("skill", "") for trend in trends])
        trend_by_skill = {str(trend.get("skill", "")).lower(): trend for trend in trends}

        matching = [skill for skill in student_skills if skill in trend_names]
        total_trending = max(len(trend_names), 1)
        employability_score = round((len(matching) / total_trending) * 100, 2)

        risks = [
            float(trend_by_skill.get(skill, {}).get("ai_risk", compute_ai_risk(skill)))
            for skill in student_skills
        ]
        career_risk_score = round((sum(risks) / len(risks)) * 100, 2) if risks else 0.0

        skill_gaps = [skill for skill in trend_names if skill not in student_skills][:10]
        recommended_skills = skill_gaps[:5]
        summary = (
            f"{profile.name} matches {len(matching)} of the top {len(trend_names)} tracked market skills "
            f"for {profile.target_role}."
        )

        result = AnalysisResult(
            employability_score=employability_score,
            career_risk_score=career_risk_score,
            skill_gaps=skill_gaps,
            top_matching_skills=matching[:10],
            recommended_skills=recommended_skills,
            market_alignment=employability_score,
            summary=summary,
        )

        stored_profile = {
            "user_id": profile.user_id,
            "name": profile.name,
            "resume_text": profile.resume_text,
            "github_url": profile.github_url,
            "skills": student_skills,
            "target_role": profile.target_role,
            "employability_score": employability_score,
            "career_risk_score": career_risk_score,
            "skill_gaps": skill_gaps,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await upsert_student_profile(stored_profile)

        return api_response("success", result.model_dump(), "Student profile analyzed")
    except Exception as exc:
        logger.exception("Student analysis failed: %s", exc)
        return api_response("error", None, str(exc))


@router.post("/roadmap")
async def roadmap(request: RoadmapRequest):
    try:
        profile = {}
        try:
            response = supabase.table("student_profiles").select("*").eq("user_id", request.user_id).limit(1).execute()
            profile = response.data[0] if response.data else {"user_id": request.user_id}
        except Exception as exc:
            logger.exception("Failed to fetch student profile for roadmap: %s", exc)
            profile = {"user_id": request.user_id}

        roadmap_data = await generate_career_roadmap(profile, request.skill_gaps, request.target_role)
        stored = await insert_career_roadmap(
            {
                "user_id": request.user_id,
                "target_role": request.target_role,
                "skill_gaps": request.skill_gaps,
                "roadmap": roadmap_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        return api_response("success", {"roadmap": roadmap_data, "stored": stored}, "Career roadmap generated")
    except Exception as exc:
        logger.exception("Roadmap generation failed: %s", exc)
        return api_response("error", None, str(exc))


@router.post("/analyze/full")
async def analyze_student_full(request: FullStudentAnalysisRequest, background_tasks: BackgroundTasks):
    errors: dict[str, str] = {}
    parsed_resume: dict = {}
    market_trends: list[dict] = []
    github_data: dict | None = None
    employability: dict = {}
    career_risk: dict = {}
    skill_gaps: list[dict] = []
    matching_skills: list[dict] = []
    roadmap_data: dict = {}
    quick_wins: list[dict] = []
    salary_prediction: dict = {}
    market_snapshot: dict = {}

    try:
        parsed_resume = parse_resume(request.resume_text)
    except Exception as exc:
        logger.exception("Full analysis resume parse failed: %s", exc)
        errors["resume_parser"] = str(exc)
        parsed_resume = {"skills": [], "experience_level": "mid", "contact": {}, "education": {}, "projects": [], "word_count": 0}

    try:
        market_trends = await get_skill_trends(50)
    except Exception as exc:
        logger.exception("Full analysis market trend fetch failed: %s", exc)
        errors["market_trends"] = str(exc)
        market_trends = []
    market_data_source = "live"
    if not market_trends:
        market_trends = _fallback_market_trends()
        market_data_source = "fallback"

    try:
        if request.github_url:
            github_data = await _fetch_github_data(request.github_url)
    except Exception as exc:
        logger.warning("Full analysis optional GitHub step failed: %s", exc)
        errors["github"] = str(exc)
        github_data = None

    try:
        employability = compute_full_employability(parsed_resume, market_trends, github_data)
    except Exception as exc:
        logger.exception("Full employability step failed: %s", exc)
        errors["employability"] = str(exc)
        employability = {}

    try:
        career_risk = compute_career_risk(parsed_resume.get("skills", []), market_trends)
    except Exception as exc:
        logger.exception("Career risk step failed: %s", exc)
        errors["career_risk"] = str(exc)
        career_risk = {}

    try:
        skill_gaps = resume_matcher.find_skill_gaps(parsed_resume.get("skills", []), market_trends)
        matching_skills = resume_matcher.find_matching_skills(parsed_resume.get("skills", []), market_trends)
    except Exception as exc:
        logger.exception("Skill gap step failed: %s", exc)
        errors["skill_gap_analysis"] = str(exc)

    try:
        student_profile = {
            "user_id": request.user_id,
            "name": request.name,
            "skills": parsed_resume.get("skills", []),
            "experience_level": parsed_resume.get("experience_level", "mid"),
            "target_role": request.target_role,
            "github_url": request.github_url,
            "employability_score": employability.get("overall_score", 0),
        }
        roadmap_data = await generate_personalized_roadmap(student_profile, skill_gaps, market_trends, request.target_role)
    except Exception as exc:
        logger.exception("Roadmap step failed: %s", exc)
        errors["roadmap"] = str(exc)
        roadmap_data = {}

    try:
        quick_wins = generate_quick_wins(parsed_resume.get("skills", []), skill_gaps)
    except Exception as exc:
        logger.exception("Quick wins step failed: %s", exc)
        errors["quick_wins"] = str(exc)

    try:
        salary_prediction = salary_predictor.predict_salary(
            parsed_resume.get("skills", []),
            parsed_resume.get("experience_level", "mid"),
            "india",
        )
    except Exception as exc:
        logger.exception("Salary prediction step failed: %s", exc)
        errors["salary_prediction"] = str(exc)
        salary_prediction = {}

    try:
        await upsert_student_profile(
            {
                "user_id": request.user_id,
                "name": request.name,
                "resume_text": request.resume_text,
                "github_url": request.github_url,
                "skills": parsed_resume.get("skills", []),
                "target_role": request.target_role,
                "employability_score": employability.get("overall_score", 0),
                "career_risk_score": career_risk.get("risk_score", 0),
                "skill_gaps": [item.get("skill") for item in skill_gaps],
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        await insert_career_roadmap(
            {
                "user_id": request.user_id,
                "target_role": request.target_role,
                "skill_gaps": [item.get("skill") for item in skill_gaps],
                "roadmap": roadmap_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
    except Exception as exc:
        logger.warning("Saving full analysis results failed: %s", exc)
        errors["persistence"] = str(exc)

    try:
        market_snapshot = await _student_market_snapshot()
        if market_data_source == "fallback" and not market_snapshot.get("top_skills"):
            market_snapshot["top_skills"] = market_trends
    except Exception as exc:
        logger.exception("Market snapshot step failed: %s", exc)
        errors["market_snapshot"] = str(exc)
        market_snapshot = {"top_skills": market_trends if market_data_source == "fallback" else []}

    try:
        background_tasks.add_task(run_drift_check)
    except Exception as exc:
        logger.warning("Failed to schedule drift check: %s", exc)

    data = {
        "user_id": request.user_id,
        "parsed_resume": parsed_resume,
        "employability": employability,
        "career_risk": career_risk,
        "skill_gaps": skill_gaps,
        "matching_skills": matching_skills,
        "roadmap": roadmap_data,
        "quick_wins": quick_wins,
        "salary_prediction": salary_prediction,
        "market_snapshot": market_snapshot,
        "market_data_source": market_data_source,
        "errors": errors,
    }
    message = "Full student analysis completed" if not errors else "Full student analysis completed with partial results"
    return api_response("success", data, message)


@router.get("/market/snapshot")
async def get_market_snapshot():
    try:
        snapshot = await _student_market_snapshot()
        return api_response("success", snapshot, "Market snapshot fetched")
    except Exception as exc:
        logger.exception("Market snapshot endpoint failed: %s", exc)
        return api_response("error", None, str(exc))


@router.post("/drift/check")
async def drift_check():
    try:
        result = await run_drift_check()
        return api_response("success", result, "Drift check completed")
    except Exception as exc:
        logger.exception("Manual drift check failed: %s", exc)
        return api_response("error", None, str(exc))


@router.get("/{user_id}")
async def get_student(user_id: str):
    try:
        profile_response = supabase.table("student_profiles").select("*").eq("user_id", user_id).limit(1).execute()
        roadmap_response = (
            supabase.table("career_roadmaps")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return api_response(
            "success",
            {
                "profile": profile_response.data[0] if profile_response.data else None,
                "latest_roadmap": roadmap_response.data[0] if roadmap_response.data else None,
            },
            "Student profile fetched",
        )
    except Exception as exc:
        logger.exception("Failed to fetch student %s: %s", user_id, exc)
        return api_response("error", None, str(exc))
