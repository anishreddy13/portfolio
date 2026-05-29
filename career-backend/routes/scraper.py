from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel, Field

from db.supabase_client import supabase
from utils.logger import get_logger
from workers.scraper_worker import enqueue_scrape_job, get_queue_length, process_scrape_queue

logger = get_logger(__name__)
router = APIRouter(prefix="/scrape", tags=["scraper"])


class ScrapeJobsRequest(BaseModel):
    location: str = "India"
    queries: list[str] = Field(default_factory=list)


def api_response(status: str, data: Any, message: str) -> dict:
    return {
        "status": status,
        "data": data,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/jobs")
async def scrape_jobs(request: ScrapeJobsRequest, background_tasks: BackgroundTasks):
    try:
        queued = await enqueue_scrape_job("scrape_jobs", request.model_dump())
        background_tasks.add_task(process_scrape_queue)
        return api_response(
            "success",
            {"jobs_queued": 1, "queued_job": queued},
            "Job scraping queued and background processing started",
        )
    except Exception as exc:
        logger.exception("Failed to queue job scrape: %s", exc)
        return api_response("error", None, str(exc))


@router.post("/github")
async def scrape_github(background_tasks: BackgroundTasks):
    try:
        queued = await enqueue_scrape_job("scrape_github", {})
        background_tasks.add_task(process_scrape_queue)
        return api_response("success", {"queued_job": queued}, "GitHub scraping queued")
    except Exception as exc:
        logger.exception("Failed to queue GitHub scrape: %s", exc)
        return api_response("error", None, str(exc))


@router.post("/all")
async def scrape_all(request: ScrapeJobsRequest, background_tasks: BackgroundTasks):
    try:
        jobs_queued = await enqueue_scrape_job("scrape_jobs", request.model_dump())
        github_queued = await enqueue_scrape_job("scrape_github", {})
        background_tasks.add_task(process_scrape_queue)
        return api_response(
            "success",
            {"queued_jobs": [jobs_queued, github_queued]},
            "Job and GitHub scraping queued",
        )
    except Exception as exc:
        logger.exception("Failed to queue all scrapers: %s", exc)
        return api_response("error", None, str(exc))


@router.get("/status")
async def scrape_status():
    try:
        queue_length = await get_queue_length()
        last_run = None
        try:
            response = (
                supabase.table("scraper_logs")
                .select("*")
                .order("finished_at", desc=True)
                .limit(1)
                .execute()
            )
            if response.data:
                last_run = response.data[0]
        except Exception as exc:
            logger.exception("Failed to fetch last scraper log: %s", exc)

        return api_response(
            "success",
            {"queue_length": queue_length, "last_run": last_run, "status": "online"},
            "Scraper status fetched",
        )
    except Exception as exc:
        logger.exception("Failed to fetch scraper status: %s", exc)
        return api_response("error", None, str(exc))


@router.get("/logs")
async def scrape_logs():
    try:
        response = (
            supabase.table("scraper_logs")
            .select("*")
            .order("finished_at", desc=True)
            .limit(20)
            .execute()
        )
        return api_response("success", {"logs": response.data or []}, "Scraper logs fetched")
    except Exception as exc:
        logger.exception("Failed to fetch scraper logs: %s", exc)
        return api_response("error", {"logs": []}, str(exc))
