from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Query

from db.supabase_client import get_job_postings, get_skill_trends, supabase
from services.trend_engine import compute_and_store_trends
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/trends", tags=["trends"])


def api_response(status: str, data: Any, message: str) -> dict:
    return {
        "status": status,
        "data": data,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/skills")
async def skills(limit: int = Query(50, ge=1, le=200), category: str | None = None):
    try:
        query = supabase.table("skill_trends").select("*").order("demand_score", desc=True).limit(limit)
        if category:
            query = query.eq("category", category)
        response = query.execute()
        rows = response.data or []
        return api_response(
            "success",
            {"skills": rows, "total": len(rows), "updated_at": datetime.now(timezone.utc).isoformat()},
            "Skill trends fetched",
        )
    except Exception as exc:
        logger.exception("Failed to fetch skill trends: %s", exc)
        return api_response("error", {"skills": [], "total": 0}, str(exc))


@router.get("/skills/{skill_name}")
async def skill_detail(skill_name: str):
    try:
        response = supabase.table("skill_trends").select("*").eq("skill", skill_name.lower()).limit(1).execute()
        trend = response.data[0] if response.data else None
        if not trend:
            return api_response("error", None, f"Skill trend not found: {skill_name}")
        return api_response("success", trend, "Skill trend fetched")
    except Exception as exc:
        logger.exception("Failed to fetch skill trend %s: %s", skill_name, exc)
        return api_response("error", None, str(exc))


@router.get("/top")
async def top_skills(limit: int = Query(10, ge=1, le=100)):
    try:
        rows = await get_skill_trends(200)
        rising = [
            item
            for item in rows
            if float(item.get("velocity") or 0) > 0.5 and float(item.get("decay_score") or 0) < 0.3
        ][:limit]
        return api_response("success", {"rising_skills": rising}, "Top rising skills fetched")
    except Exception as exc:
        logger.exception("Failed to fetch top skills: %s", exc)
        return api_response("error", {"rising_skills": []}, str(exc))


@router.get("/declining")
async def declining_skills():
    try:
        rows = await get_skill_trends(200)
        declining = [item for item in rows if float(item.get("decay_score") or 0) > 0.6]
        return api_response("success", {"declining_skills": declining}, "Declining skills fetched")
    except Exception as exc:
        logger.exception("Failed to fetch declining skills: %s", exc)
        return api_response("error", {"declining_skills": []}, str(exc))


@router.get("/github")
async def github_trends():
    try:
        response = supabase.table("github_trending").select("*").order("trend_score", desc=True).limit(100).execute()
        repos = response.data or []
        languages = sorted({repo.get("language") for repo in repos if repo.get("language")})
        return api_response("success", {"repos": repos, "languages": languages}, "GitHub trends fetched")
    except Exception as exc:
        logger.exception("Failed to fetch GitHub trends: %s", exc)
        return api_response("error", {"repos": [], "languages": []}, str(exc))


async def _recompute_from_existing_jobs():
    try:
        jobs = await get_job_postings(1000)
        await compute_and_store_trends(jobs)
    except Exception as exc:
        logger.exception("Background trend recomputation failed: %s", exc)


@router.post("/recompute")
async def recompute(background_tasks: BackgroundTasks):
    try:
        background_tasks.add_task(_recompute_from_existing_jobs)
        return api_response("success", None, "Trend recomputation started")
    except Exception as exc:
        logger.exception("Failed to start trend recomputation: %s", exc)
        return api_response("error", None, str(exc))
