from __future__ import annotations

from models.resume_matcher import compute_employability_score
from models.salary_predictor import predict_salary
from models.skill_trend_model import predict_trend
from utils.logger import get_logger

logger = get_logger(__name__)


def _grade(score: float) -> str:
    if score >= 92:
        return "A+"
    if score >= 82:
        return "A"
    if score >= 72:
        return "B+"
    if score >= 62:
        return "B"
    if score >= 45:
        return "C"
    return "D"


def _github_bonus(github_data: dict | None) -> float:
    try:
        if not github_data:
            return 0.0
        bonus = 0.0
        repos = github_data.get("repos") or []
        total_stars = float(github_data.get("total_stars") or 0)
        languages = {str(item).lower() for item in github_data.get("languages", [])}
        trending_languages = {"python", "typescript", "javascript", "rust", "go", "java"}
        if repos:
            bonus += 5
        if total_stars > 10:
            bonus += 5
        if languages & trending_languages:
            bonus += 5
        return bonus
    except Exception as exc:
        logger.exception("Failed to compute GitHub bonus: %s", exc)
        return 0.0


def compute_full_employability(
    parsed_resume: dict,
    market_trends: list[dict],
    github_data: dict | None = None,
) -> dict:
    try:
        skills = parsed_resume.get("skills", [])
        base = compute_employability_score(skills, market_trends, _github_bonus(github_data))
        trend_predictions = [predict_trend(skill, {"skill": skill}) for skill in skills]
        rising_count = sum(1 for item in trend_predictions if item.get("trend_label") == "rising")
        trending_skills = round((rising_count / max(len(skills), 1)) * 100, 2)
        github_bonus = _github_bonus(github_data)
        salary = predict_salary(skills, parsed_resume.get("experience_level", "mid"), "india")

        current_skills = float(base.get("skill_match_score", 0))
        market_demand = float(base.get("market_alignment", 0))
        future_readiness = max(float(base.get("future_readiness", 0)), trending_skills)
        overall = (current_skills * 0.3) + (trending_skills * 0.25) + (market_demand * 0.3) + github_bonus
        overall = max(0, min(overall, 100))
        if overall < 5 and skills:
            overall = 30
        overall = round(overall, 2)

        return {
            "overall_score": overall,
            "grade": _grade(overall),
            "skill_match_score": current_skills,
            "market_alignment": market_demand,
            "future_readiness": future_readiness,
            "github_bonus": github_bonus,
            "salary_prediction": salary,
            "score_breakdown": {
                "current_skills": current_skills,
                "trending_skills": trending_skills,
                "market_demand": market_demand,
                "github_presence": github_bonus,
            },
            "improvement_potential": round(max(0, 100 - overall), 2),
        }
    except Exception as exc:
        logger.exception("Full employability computation failed: %s", exc)
        return {
            "overall_score": 0.0,
            "grade": "D",
            "skill_match_score": 0.0,
            "market_alignment": 0.0,
            "future_readiness": 0.0,
            "github_bonus": 0.0,
            "salary_prediction": {},
            "score_breakdown": {"current_skills": 0.0, "trending_skills": 0.0, "market_demand": 0.0, "github_presence": 0.0},
            "improvement_potential": 100.0,
            "error": str(exc),
        }


def compute_career_risk(student_skills: list[str], market_trends: list[dict]) -> dict:
    try:
        trend_by_skill = {str(item.get("skill", "")).lower(): item for item in market_trends}
        at_risk_skills: list[str] = []
        risk_values: list[float] = []
        reasons: list[str] = []

        for skill in student_skills:
            normalized = skill.lower().strip()
            trend = trend_by_skill.get(normalized, {})
            ai_risk = float(trend.get("ai_risk") or 0.45)
            decay = float(trend.get("decay_score") or 0.3)
            saturation = float(trend.get("saturation") or 0.5)
            risk = (ai_risk * 45) + (decay * 35) + (saturation * 20)
            risk_values.append(risk)
            if decay > 0.6 or ai_risk > 0.7:
                at_risk_skills.append(normalized)
                reasons.append(f"{normalized} shows elevated AI risk or market decay.")

        risk_score = round(sum(risk_values) / max(len(risk_values), 1), 2)
        if risk_score >= 80:
            level = "Critical"
        elif risk_score >= 60:
            level = "High"
        elif risk_score >= 35:
            level = "Medium"
        else:
            level = "Low"

        mitigation = [
            "Add one rising AI or cloud skill to your stack.",
            "Build a proof-of-work project around a high-demand market skill.",
            "Refresh older skills with modern equivalents and deployment experience.",
        ]
        return {
            "risk_score": risk_score,
            "risk_level": level,
            "at_risk_skills": at_risk_skills,
            "risk_reasons": reasons,
            "mitigation_steps": mitigation,
        }
    except Exception as exc:
        logger.exception("Career risk computation failed: %s", exc)
        return {
            "risk_score": 0.0,
            "risk_level": "Medium",
            "at_risk_skills": [],
            "risk_reasons": [str(exc)],
            "mitigation_steps": [],
        }
