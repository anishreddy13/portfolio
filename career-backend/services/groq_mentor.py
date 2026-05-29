from __future__ import annotations

import json
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
        try:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
        except Exception as exc:
            logger.warning("Failed to parse JSON from Groq response: %s", exc)
    return fallback


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
    fallback = {
        "target_role": target_role,
        "total_months": 6,
        "monthly_plan": [],
        "key_projects": [],
        "estimated_salary_range": "Unavailable",
    }

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
        return _extract_json_object(content, fallback)
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
