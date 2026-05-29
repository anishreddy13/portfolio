from __future__ import annotations

from datetime import datetime, timezone

from services.groq_mentor import generate_career_roadmap
from utils.logger import get_logger

logger = get_logger(__name__)

DEFAULT_RESOURCES = ["freeCodeCamp", "YouTube", "official docs", "Coursera free audit"]


def _demand_map(market_trends: list[dict]) -> dict[str, float]:
    return {str(item.get("skill", "")).lower(): float(item.get("demand_score") or 0) for item in market_trends}


def _learning_time(skill: str) -> str:
    if skill.lower() in {"git", "docker", "fastapi", "tailwind", "redis"}:
        return "1-2 weeks"
    if skill.lower() in {"pytorch", "kubernetes", "mlops", "langchain", "aws"}:
        return "4-6 weeks"
    return "2-4 weeks"


async def generate_personalized_roadmap(
    student_profile: dict,
    skill_gaps: list[dict],
    market_trends: list[dict],
    target_role: str,
    timeframe_months: int = 6,
) -> dict:
    try:
        top_skills = [str(item.get("skill")) for item in market_trends[:15] if item.get("skill")]
        gap_skills = [str(item.get("skill")) for item in skill_gaps if item.get("skill")]
        base = await generate_career_roadmap(student_profile, gap_skills, target_role)
        demand = _demand_map(market_trends)

        monthly_plan = base.get("monthly_plan") or []
        for month in monthly_plan:
            enriched_skills = []
            for skill in month.get("skills_to_learn", []):
                normalized = str(skill).lower()
                enriched_skills.append(
                    {
                        "skill": skill,
                        "demand_score": demand.get(normalized, 0.0),
                        "estimated_learning_time": _learning_time(normalized),
                        "free_resources": DEFAULT_RESOURCES,
                    }
                )
            month["skill_details"] = enriched_skills

        skill_priority_order = sorted(gap_skills, key=lambda skill: demand.get(skill.lower(), 0), reverse=True)
        return {
            "target_role": base.get("target_role", target_role),
            "total_months": int(base.get("total_months") or timeframe_months),
            "monthly_plan": monthly_plan,
            "key_projects": base.get("key_projects", []),
            "estimated_salary_range": base.get("estimated_salary_range", "Unavailable"),
            "skill_priority_order": skill_priority_order,
            "market_context": f"Top market skills right now: {', '.join(top_skills[:15])}",
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        logger.exception("Personalized roadmap generation failed: %s", exc)
        return {
            "target_role": target_role,
            "total_months": timeframe_months,
            "monthly_plan": [],
            "key_projects": [],
            "estimated_salary_range": "Unavailable",
            "skill_priority_order": [],
            "market_context": "",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "error": str(exc),
        }


def generate_quick_wins(student_skills: list[str], skill_gaps: list[dict]) -> list[dict]:
    try:
        student = {skill.lower().strip() for skill in student_skills}
        quick_wins: list[dict] = []
        related = {
            "fastapi": "python",
            "pytorch": "python",
            "typescript": "javascript",
            "next.js": "react",
            "docker": "linux",
            "kubernetes": "docker",
            "langchain": "python",
        }
        for gap in skill_gaps:
            skill = str(gap.get("skill", "")).lower()
            demand = float(gap.get("demand_score") or 0)
            relates_to = related.get(skill, "")
            if demand >= 35 and (not relates_to or relates_to in student):
                quick_wins.append(
                    {
                        "skill": skill,
                        "why": "High demand and close to your current skill graph.",
                        "time_to_learn": "under 2 weeks",
                        "relates_to": relates_to or next(iter(student), ""),
                    }
                )
            if len(quick_wins) >= 5:
                break
        return quick_wins
    except Exception as exc:
        logger.exception("Quick wins generation failed: %s", exc)
        return []
