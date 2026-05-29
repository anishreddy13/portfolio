from __future__ import annotations

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from models.skill_trend_model import predict_trend
from utils.logger import get_logger

logger = get_logger(__name__)


def _skill_text(skills: list[str]) -> str:
    return " ".join(skill.lower().strip().replace(" ", "_") for skill in skills if skill)


def _trend_skill(trend: dict) -> str:
    return str(trend.get("skill") or trend.get("skill_name") or "").lower().strip()


def compute_skill_match_score(student_skills: list[str], market_skills: list[dict]) -> float:
    try:
        top_market = [_trend_skill(item) for item in market_skills[:50] if _trend_skill(item)]
        if not student_skills or not top_market:
            return 0.0
        vectorizer = TfidfVectorizer()
        matrix = vectorizer.fit_transform([_skill_text(student_skills), _skill_text(top_market)])
        score = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
        return round(float(score) * 100, 2)
    except Exception as exc:
        logger.exception("Failed to compute skill match score: %s", exc)
        return 0.0


def find_skill_gaps(
    student_skills: list[str],
    market_trends: list[dict],
    top_n: int = 10,
) -> list[dict]:
    try:
        student = {skill.lower().strip() for skill in student_skills}
        gaps: list[dict] = []
        for trend in sorted(market_trends, key=lambda item: float(item.get("demand_score") or 0), reverse=True):
            skill = _trend_skill(trend)
            if not skill or skill in student:
                continue
            demand = float(trend.get("demand_score") or 0)
            priority = "critical" if demand >= 70 else "high" if demand >= 40 else "medium"
            gaps.append(
                {
                    "skill": skill,
                    "demand_score": round(demand, 2),
                    "priority": priority,
                    "reason": f"{skill} appears in high-demand market trends and is missing from the profile.",
                }
            )
            if len(gaps) >= top_n:
                break
        return gaps
    except Exception as exc:
        logger.exception("Failed to find skill gaps: %s", exc)
        return []


def find_matching_skills(student_skills: list[str], market_trends: list[dict]) -> list[dict]:
    try:
        student = {skill.lower().strip() for skill in student_skills}
        matches: list[dict] = []
        for trend in market_trends:
            skill = _trend_skill(trend)
            if skill in student:
                predicted = predict_trend(skill, trend)
                matches.append(
                    {
                        "skill": skill,
                        "demand_score": float(trend.get("demand_score") or 0),
                        "trend": predicted.get("trend_label", "stable"),
                    }
                )
        return sorted(matches, key=lambda item: item["demand_score"], reverse=True)
    except Exception as exc:
        logger.exception("Failed to find matching skills: %s", exc)
        return []


def compute_employability_score(
    student_skills: list[str],
    market_trends: list[dict],
    github_bonus: float = 0.0,
) -> dict:
    try:
        skill_match_score = compute_skill_match_score(student_skills, market_trends)
        matching = find_matching_skills(student_skills, market_trends)
        top_trends = market_trends[:30] or market_trends
        market_alignment = round((len(matching) / max(len(top_trends), 1)) * 100, 2)

        future_scores = []
        for item in matching:
            if item["trend"] == "rising":
                future_scores.append(100)
            elif item["trend"] == "stable":
                future_scores.append(65)
            else:
                future_scores.append(25)
        future_readiness = round(float(np.mean(future_scores)) if future_scores else 0.0, 2)

        overall = (skill_match_score * 0.35) + (market_alignment * 0.3) + (future_readiness * 0.25) + min(github_bonus, 10)
        return {
            "overall_score": round(max(0, min(overall, 100)), 2),
            "skill_match_score": skill_match_score,
            "market_alignment": market_alignment,
            "future_readiness": future_readiness,
            "breakdown": {
                "matching_skills": len(matching),
                "student_skills": len(student_skills),
                "market_skills_considered": len(top_trends),
                "github_bonus": github_bonus,
            },
        }
    except Exception as exc:
        logger.exception("Failed to compute employability score: %s", exc)
        return {
            "overall_score": 0.0,
            "skill_match_score": 0.0,
            "market_alignment": 0.0,
            "future_readiness": 0.0,
            "breakdown": {"error": str(exc)},
        }


def recommend_skills(
    student_skills: list[str],
    market_trends: list[dict],
    target_role: str,
    top_n: int = 5,
) -> list[str]:
    try:
        role = target_role.lower()
        role_keywords = {
            "ai": {"pytorch", "tensorflow", "mlops", "langchain", "llm", "rag", "vector database"},
            "ml": {"pytorch", "tensorflow", "scikit-learn", "mlops", "xgboost"},
            "frontend": {"react", "next.js", "typescript", "tailwind"},
            "backend": {"fastapi", "django", "node.js", "postgresql", "redis"},
            "devops": {"docker", "kubernetes", "aws", "terraform", "prometheus"},
        }
        gaps = find_skill_gaps(student_skills, market_trends, top_n=25)
        weighted = []
        for gap in gaps:
            skill = gap["skill"]
            bonus = 0
            for key, preferred in role_keywords.items():
                if key in role and skill in preferred:
                    bonus = 100
            weighted.append((skill, float(gap["demand_score"]) + bonus))
        return [skill for skill, _ in sorted(weighted, key=lambda item: item[1], reverse=True)[:top_n]]
    except Exception as exc:
        logger.exception("Failed to recommend skills: %s", exc)
        return []
