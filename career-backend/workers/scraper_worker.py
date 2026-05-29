from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

import httpx

from db.supabase_client import insert_job_posting, insert_scraper_log
from services.github_scraper import fetch_all_trending
from services.jsearch_scraper import scrape_all_jobs
from services.trend_engine import compute_and_store_trends
from utils.config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

QUEUE_KEY = "career:scrape:queue"


def _redis_url(path: str) -> str:
    return f"{settings.upstash_redis_rest_url.rstrip('/')}/{path}"


def _redis_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.upstash_redis_rest_token}",
        "Content-Type": "application/json",
    }


async def enqueue_scrape_job(job_type: str, params: dict):
    try:
        payload = {
            "job_type": job_type,
            "params": params,
            "enqueued_at": datetime.now(timezone.utc).isoformat(),
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                _redis_url(f"lpush/{QUEUE_KEY}"),
                headers=_redis_headers(),
                content=json.dumps(payload),
            )
            response.raise_for_status()
        logger.info("Queued scraper job: %s", job_type)
        return payload
    except Exception as exc:
        logger.exception("Failed to enqueue scraper job %s: %s", job_type, exc)
        return {"error": str(exc), "job_type": job_type}


async def dequeue_scrape_job() -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(_redis_url(f"rpop/{QUEUE_KEY}"), headers=_redis_headers())
            response.raise_for_status()
            result = response.json().get("result")

        if not result:
            return None
        if isinstance(result, list):
            result = result[0] if result else None
        if not result:
            return None
        return json.loads(result) if isinstance(result, str) else result
    except Exception as exc:
        logger.exception("Failed to dequeue scraper job: %s", exc)
        return None


async def process_scrape_queue():
    processed = 0
    while True:
        job = await dequeue_scrape_job()
        if not job:
            break

        job_type = job.get("job_type")
        started_at = datetime.now(timezone.utc).isoformat()
        try:
            items_processed = 0
            if job_type == "scrape_jobs":
                jobs = await scrape_all_jobs()
                for item in jobs:
                    await insert_job_posting(item)
                trends = await compute_and_store_trends(jobs)
                items_processed = len(jobs)
                message = f"Stored {len(jobs)} jobs and computed {len(trends)} skill trends"
            elif job_type == "scrape_github":
                repos = await fetch_all_trending()
                items_processed = len(repos)
                message = f"Stored {len(repos)} GitHub repositories"
            else:
                message = f"Unknown job type: {job_type}"

            await insert_scraper_log(
                {
                    "job_type": job_type,
                    "status": "success",
                    "message": message,
                    "items_processed": items_processed,
                    "started_at": started_at,
                    "finished_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            logger.info(message)
            processed += 1
        except Exception as exc:
            logger.exception("Scraper job failed: %s", exc)
            await insert_scraper_log(
                {
                    "job_type": job_type,
                    "status": "error",
                    "message": str(exc),
                    "items_processed": 0,
                    "started_at": started_at,
                    "finished_at": datetime.now(timezone.utc).isoformat(),
                }
            )
    logger.info("Scrape queue processing complete. Jobs processed: %s", processed)
    return {"processed": processed}


async def get_queue_length() -> int:
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(_redis_url(f"llen/{QUEUE_KEY}"), headers=_redis_headers())
            response.raise_for_status()
            result: Any = response.json().get("result", 0)
        return int(result or 0)
    except Exception as exc:
        logger.exception("Failed to fetch queue length: %s", exc)
        return 0
