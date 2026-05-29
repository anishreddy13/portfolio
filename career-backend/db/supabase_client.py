from typing import Any

from supabase import Client, create_client

from utils.config import settings
from utils.logger import get_logger


logger = get_logger(__name__)


def get_supabase() -> Client:
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )


supabase = get_supabase()


def _first_row(response: Any) -> dict:
    data = getattr(response, "data", None) or []
    return data[0] if data else {}


async def insert_job_posting(job: dict) -> dict:
    try:
        response = supabase.table("job_postings").insert(job).execute()
        row = _first_row(response)
        logger.info("Inserted job posting: %s", row.get("title", "unknown"))
        return row
    except Exception as exc:
        logger.exception("Failed to insert job posting: %s", exc)
        return {"error": str(exc)}


async def insert_skill_trend(trend: dict) -> dict:
    try:
        response = (
            supabase.table("skill_trends")
            .upsert(trend, on_conflict="skill")
            .execute()
        )
        row = _first_row(response)
        logger.info("Upserted skill trend: %s", row.get("skill", "unknown"))
        return row
    except Exception as exc:
        logger.exception("Failed to upsert skill trend: %s", exc)
        return {"error": str(exc)}


async def insert_scraper_log(log: dict) -> dict:
    try:
        response = supabase.table("scraper_logs").insert(log).execute()
        row = _first_row(response)
        logger.info("Inserted scraper log: %s", row.get("job_type", "unknown"))
        return row
    except Exception as exc:
        logger.exception("Failed to insert scraper log: %s", exc)
        return {"error": str(exc)}


async def get_skill_trends(limit: int = 50) -> list:
    try:
        response = (
            supabase.table("skill_trends")
            .select("*")
            .order("demand_score", desc=True)
            .limit(limit)
            .execute()
        )
        return getattr(response, "data", None) or []
    except Exception as exc:
        logger.exception("Failed to fetch skill trends: %s", exc)
        return []


async def get_job_postings(limit: int = 100) -> list:
    try:
        response = (
            supabase.table("job_postings")
            .select("*")
            .order("fetched_at", desc=True)
            .limit(limit)
            .execute()
        )
        return getattr(response, "data", None) or []
    except Exception as exc:
        logger.exception("Failed to fetch job postings: %s", exc)
        return []


async def upsert_student_profile(profile: dict) -> dict:
    try:
        response = (
            supabase.table("student_profiles")
            .upsert(profile, on_conflict="user_id")
            .execute()
        )
        row = _first_row(response)
        logger.info("Upserted student profile: %s", row.get("user_id", "unknown"))
        return row
    except Exception as exc:
        logger.exception("Failed to upsert student profile: %s", exc)
        return {"error": str(exc)}


async def insert_career_roadmap(roadmap: dict) -> dict:
    try:
        response = supabase.table("career_roadmaps").insert(roadmap).execute()
        row = _first_row(response)
        logger.info("Inserted career roadmap for: %s", row.get("user_id", "unknown"))
        return row
    except Exception as exc:
        logger.exception("Failed to insert career roadmap: %s", exc)
        return {"error": str(exc)}
