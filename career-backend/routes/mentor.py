from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from db.supabase_client import get_skill_trends, supabase
from services.groq_mentor import analyze_resume_with_ai, get_career_advice
from services.skill_extractor import extract_skills_from_text
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/mentor", tags=["mentor"])


class ChatMessage(BaseModel):
    user_id: str
    message: str
    student_skills: list[str] = []
    employability_score: float = 0.0


class ResumeAnalysisRequest(BaseModel):
    resume_text: str


class ContextualChatRequest(BaseModel):
    user_id: str
    message: str


def api_response(status: str, data: Any, message: str) -> dict:
    return {
        "status": status,
        "data": data,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/chat")
async def chat(message: ChatMessage):
    try:
        profile = {
            "user_id": message.user_id,
            "skills": message.student_skills,
            "employability_score": message.employability_score,
        }
        try:
            response = supabase.table("student_profiles").select("*").eq("user_id", message.user_id).limit(1).execute()
            if response.data:
                profile.update(response.data[0])
        except Exception as exc:
            logger.exception("Failed to fetch profile for mentor chat: %s", exc)

        trends = await get_skill_trends(10)
        advice = await get_career_advice(profile, message.message, trends)
        return api_response(
            "success",
            {"response": advice, "model_used": "llama3-70b-8192", "tokens_used": None},
            "Mentor response generated",
        )
    except Exception as exc:
        logger.exception("Mentor chat failed: %s", exc)
        return api_response("error", None, str(exc))


@router.post("/analyze-resume")
async def analyze_resume(request: ResumeAnalysisRequest):
    try:
        trends = await get_skill_trends(50)
        analysis = await analyze_resume_with_ai(request.resume_text, trends)
        return api_response("success", analysis, "Resume analyzed")
    except Exception as exc:
        logger.exception("Resume AI analysis failed: %s", exc)
        return api_response("error", None, str(exc))


@router.post("/chat/contextual")
async def contextual_chat(request: ContextualChatRequest):
    try:
        profile = {"user_id": request.user_id, "skills": [], "employability_score": 0.0}
        roadmap = {}

        try:
            profile_response = supabase.table("student_profiles").select("*").eq("user_id", request.user_id).limit(1).execute()
            if profile_response.data:
                profile.update(profile_response.data[0])
        except Exception as exc:
            logger.warning("Contextual chat profile fetch failed: %s", exc)

        try:
            roadmap_response = (
                supabase.table("career_roadmaps")
                .select("*")
                .eq("user_id", request.user_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if roadmap_response.data:
                roadmap = roadmap_response.data[0]
        except Exception as exc:
            logger.warning("Contextual chat roadmap fetch failed: %s", exc)

        trends = await get_skill_trends(10)
        rich_profile = {
            **profile,
            "latest_roadmap": roadmap,
            "market_context": trends,
        }
        enriched_question = (
            f"{request.message}\n\n"
            "Use this student's saved profile, latest roadmap, and current market trends. "
            "Give personalized advice tied to their skill gaps and next 2-4 week actions."
        )
        response_text = await get_career_advice(rich_profile, enriched_question, trends)
        trend_skills = {str(item.get("skill", "")).lower() for item in trends}
        mentioned_skills = [skill for skill in extract_skills_from_text(response_text) if skill.lower() in trend_skills]
        follow_ups = [
            "Which project should I build first?",
            "What skills should I learn this month?",
            "How can I improve my employability score?",
        ]
        return api_response(
            "success",
            {
                "response": response_text,
                "follow_up_questions": follow_ups,
                "relevant_skills": mentioned_skills[:8],
            },
            "Contextual mentor response generated",
        )
    except Exception as exc:
        logger.exception("Contextual mentor chat failed: %s", exc)
        return api_response("error", None, str(exc))
