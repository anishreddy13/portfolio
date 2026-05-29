from __future__ import annotations

from datetime import datetime, timezone

from db.supabase_client import insert_skill_trend
from services.skill_extractor import SKILLS_TAXONOMY, compute_skill_frequency
from utils.logger import get_logger

logger = get_logger(__name__)


def compute_skill_velocity(skill: str, current_count: int, total_jobs: int) -> float:
    try:
        if total_jobs <= 0:
            return 0.0
        demand_score = (current_count / total_jobs) * 100
        return round(max(0.0, min(demand_score, 100.0)), 2)
    except Exception as exc:
        logger.exception("Failed to compute velocity for %s: %s", skill, exc)
        return 0.0


def compute_ai_risk(skill: str) -> float:
    try:
        normalized = skill.lower().strip()
        high_risk = {
            "manual testing",
            "basic html",
            "basic css",
            "data entry",
            "excel",
            "wordpress",
            "jquery",
        }
        low_risk = {
            "mlops",
            "llmops",
            "ai engineering",
            "pytorch",
            "system design",
            "architecture",
        }

        if normalized in high_risk:
            return 0.9
        if normalized in low_risk:
            return 0.1
        return 0.5
    except Exception as exc:
        logger.exception("Failed to compute AI risk for %s: %s", skill, exc)
        return 0.5


def compute_decay_score(skill: str) -> float:
    try:
        normalized = skill.lower().strip()
        decaying = {"jquery", "angularjs", "backbone", "grunt", "svn", "perl", "cobol", "flash"}
        growing = {"langchain", "llmops", "mlops", "rust", "kubernetes", "vector database"}

        if normalized in decaying:
            return 0.8
        if normalized in growing:
            return 0.08
        return 0.3
    except Exception as exc:
        logger.exception("Failed to compute decay score for %s: %s", skill, exc)
        return 0.3


def compute_salary_momentum(skill: str) -> float:
    try:
        normalized = skill.lower().strip()
        high_salary = {"kubernetes", "mlops", "rust", "llm", "pytorch", "aws", "system design"}
        if normalized in high_salary:
            return 0.9
        return 0.5
    except Exception as exc:
        logger.exception("Failed to compute salary momentum for %s: %s", skill, exc)
        return 0.5


def _skill_category(skill: str) -> str:
    normalized = skill.lower().strip()
    for category, skills in SKILLS_TAXONOMY.items():
        if normalized in {item.lower() for item in skills}:
            return category
    return "other"


async def compute_and_store_trends(jobs: list[dict]) -> list[dict]:
    try:
        total_jobs = len(jobs)
        if total_jobs == 0:
            logger.info("No jobs supplied for trend computation")
            return []

        frequencies = compute_skill_frequency(jobs)
        trends: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for skill, count in frequencies.items():
            demand_score = round((count / total_jobs) * 100, 2)
            trend = {
                "skill": skill,
                "category": _skill_category(skill),
                "demand_score": demand_score,
                "velocity": compute_skill_velocity(skill, count, total_jobs),
                "decay_score": compute_decay_score(skill),
                "ai_risk": compute_ai_risk(skill),
                "salary_momentum": compute_salary_momentum(skill),
                "saturation": 0.5,
                "job_count": count,
                "updated_at": now,
            }
            await insert_skill_trend(trend)
            trends.append(trend)

        logger.info("Computed and stored %s skill trends", len(trends))
        return sorted(trends, key=lambda item: item.get("demand_score", 0), reverse=True)
    except Exception as exc:
        logger.exception("Failed to compute and store trends: %s", exc)
        return []
