from __future__ import annotations

import json
import re
from typing import Any

from groq import AsyncGroq

from utils.config import settings
from utils.logger import get_logger

logger = get_logger(__name__)


def _client() -> AsyncGroq:
    return AsyncGroq(api_key=settings.groq_api_key)


def _extract_json_object(text: str, fallback: dict[str, Any]) -> dict[str, Any]:
    try:
        return json.loads(text)
    except Exception:
        pass

    try:
        block = re.search(r"```json\s*([\s\S]*?)```", text, flags=re.IGNORECASE)
        if block:
            return json.loads(block.group(1).strip())
    except Exception as exc:
        logger.warning("Failed to parse fenced JSON from Groq response: %s", exc)

    try:
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            return json.loads(match.group(0))
    except Exception as exc:
        logger.warning("Failed to parse JSON object from Groq response: %s", exc)

    return fallback


def _fallback_roadmap(skill_gaps: list[str], target_role: str) -> dict[str, Any]:
    skills = [str(skill) for skill in skill_gaps if str(skill).strip()] or [
        "python",
        "docker",
        "fastapi",
        "cloud deployment",
        "system design",
    ]
    focuses = ["Foundation", "Core Stack", "Applied Project", "Deployment", "Market Proof", "Interview Readiness"]
    monthly_plan = []
    for index in range(6):
        start = index % len(skills)
        month_skills = [skills[start], skills[(start + 1) % len(skills)]]
        monthly_plan.append(
            {
                "month": index + 1,
                "focus": focuses[index],
                "skills_to_learn": month_skills,
                "resources": ["freeCodeCamp", "official docs"],
                "milestone": "Complete basics" if index == 0 else f"Ship a {focuses[index].lower()} portfolio artifact",
            }
        )
    return {
        "target_role": target_role,
        "total_months": 6,
        "monthly_plan": monthly_plan,
        "key_projects": ["Build portfolio project", "Contribute to open source"],
        "estimated_salary_range": "Market competitive",
        "skill_priority_order": skills[:5],
        "market_context": "Focus on high-demand skills",
    }


def _normalize_roadmap(data: dict[str, Any], skill_gaps: list[str], target_role: str) -> dict[str, Any]:
    fallback = _fallback_roadmap(skill_gaps, target_role)
    normalized = {**fallback, **(data or {})}
    if not isinstance(normalized.get("monthly_plan"), list) or not normalized["monthly_plan"]:
        normalized["monthly_plan"] = fallback["monthly_plan"]
    if not isinstance(normalized.get("key_projects"), list) or not normalized["key_projects"]:
        normalized["key_projects"] = fallback["key_projects"]
    if not isinstance(normalized.get("skill_priority_order"), list) or not normalized["skill_priority_order"]:
        normalized["skill_priority_order"] = fallback["skill_priority_order"]
    normalized["target_role"] = normalized.get("target_role") or target_role
    normalized["total_months"] = int(normalized.get("total_months") or 6)
    normalized["estimated_salary_range"] = normalized.get("estimated_salary_range") or "Market competitive"
    normalized["market_context"] = normalized.get("market_context") or "Focus on high-demand skills"
    return normalized


async def get_career_advice(
    student_profile: dict,
    question: str,
    skill_trends: list[dict],
) -> str:
    try:
        top_skills = [trend.get("skill") for trend in skill_trends[:10] if trend.get("skill")]
        system_prompt = (
            "You are an expert AI career mentor with deep knowledge of the tech job market. "
            "You have access to real-time skill trend data. Give specific, actionable advice. "
            "Be direct and concise. Focus on practical next steps."
        )
        user_prompt = (
            f"Student skills: {student_profile.get('skills', [])}\n"
            f"Employability score: {student_profile.get('employability_score', 0)}\n"
            f"Top 10 trending market skills: {top_skills}\n"
            f"Question: {question}"
        )

        response = await _client().chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1024,
            temperature=0.7,
        )
        return response.choices[0].message.content or ""
    except Exception as exc:
        logger.exception("Groq career advice failed: %s", exc)
        return "I could not generate career advice right now. Please try again shortly."


async def generate_career_roadmap(
    student_profile: dict,
    skill_gaps: list[str],
    target_role: str,
) -> dict:
    fallback = _fallback_roadmap(skill_gaps, target_role)

    try:
        prompt = f"""
Generate a structured 6-month career roadmap as strict JSON only.

Student profile:
{json.dumps(student_profile, default=str)}

Target role: {target_role}
Skill gaps: {skill_gaps}

Return this schema:
{{
  "target_role": "string",
  "total_months": 6,
  "monthly_plan": [
    {{
      "month": 1,
      "focus": "string",
      "skills_to_learn": ["string"],
      "resources": ["string"],
      "milestone": "string"
    }}
  ],
  "key_projects": ["string"],
  "estimated_salary_range": "string"
}}
"""
        response = await _client().chat.completions.create(
            model="llama3-70b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.7,
        )
        content = response.choices[0].message.content or "{}"
        return _normalize_roadmap(_extract_json_object(content, fallback), skill_gaps, target_role)
    except Exception as exc:
        logger.exception("Groq roadmap generation failed: %s", exc)
        return fallback


async def analyze_resume_with_ai(
    resume_text: str,
    job_market_trends: list[dict],
) -> dict:
    fallback = {
        "extracted_skills": [],
        "experience_level": "unknown",
        "strengths": [],
        "weaknesses": [],
        "recommended_roles": [],
    }

    try:
        prompt = f"""
Analyze this resume using the current market trend context.
Return strict JSON only with this schema:
{{
  "extracted_skills": ["string"],
  "experience_level": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommended_roles": ["string"]
}}

Market trends:
{json.dumps(job_market_trends[:20], default=str)}

Resume:
{resume_text}
"""
        response = await _client().chat.completions.create(
            model="llama3-70b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.4,
        )
        content = response.choices[0].message.content or "{}"
        return _extract_json_object(content, fallback)
    except Exception as exc:
        logger.exception("Groq resume analysis failed: %s", exc)
        return fallback
