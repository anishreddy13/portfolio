import asyncio
from datetime import datetime, timezone

import httpx

from services.skill_extractor import extract_skills_from_jobs
from utils.config import settings
from utils.logger import get_logger


logger = get_logger(__name__)

BASE_URL = "https://jsearch.p.rapidapi.com/search"
DEFAULT_QUERIES = [
    "machine learning engineer",
    "frontend developer React",
    "DevOps engineer Kubernetes",
    "data scientist Python",
    "full stack developer",
    "MLOps engineer",
    "AI engineer LLM",
    "backend developer FastAPI",
    "cloud engineer AWS",
    "software engineer",
]


def _headers() -> dict:
    return {
        "X-RapidAPI-Key": settings.rapidapi_key,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    }


def _format_location(job: dict) -> str:
    city = job.get("job_city") or ""
    country = job.get("job_country") or ""
    return ", ".join(part for part in [city, country] if part) or "Remote/Unknown"


def _extract_job(job: dict) -> dict:
    return {
        "title": job.get("job_title"),
        "company": job.get("employer_name"),
        "location": _format_location(job),
        "raw_text": job.get("job_description") or "",
        "posted_at": job.get("job_posted_at_datetime_utc"),
        "source": "jsearch",
        "salary_min": job.get("job_min_salary"),
        "salary_max": job.get("job_max_salary"),
        "skills": [],
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


async def scrape_jobs(
    query: str,
    location: str = "India",
    num_pages: int = 3,
) -> list[dict]:
    jobs: list[dict] = []
    async with httpx.AsyncClient(timeout=30) as client:
        for page in range(1, max(num_pages, 1) + 1):
            params = {
                "query": f"{query} in {location}",
                "page": page,
                "num_pages": 1,
                "date_posted": "month",
            }
            for attempt in range(2):
                try:
                    response = await client.get(BASE_URL, headers=_headers(), params=params)
                    if response.status_code == 429:
                        logger.warning("JSearch rate limit hit for %s page %s", query, page)
                        if attempt == 0:
                            await asyncio.sleep(1.5)
                            continue
                    response.raise_for_status()
                    payload = response.json()
                    jobs.extend(_extract_job(job) for job in payload.get("data", []))
                    break
                except Exception as exc:
                    logger.exception("JSearch scrape failed for %s page %s: %s", query, page, exc)
                    break
            await asyncio.sleep(0.5)
    return jobs


async def scrape_all_jobs() -> list[dict]:
    combined: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for query in DEFAULT_QUERIES:
        fetched = await scrape_jobs(query=query)
        for job in fetched:
            key = ((job.get("company") or "").lower(), (job.get("title") or "").lower())
            if key not in seen:
                seen.add(key)
                combined.append(job)
    combined = extract_skills_from_jobs(combined)
    logger.info("Total JSearch jobs fetched after dedupe: %s", len(combined))
    return combined
