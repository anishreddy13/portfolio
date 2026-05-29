from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote

import httpx

from db.supabase_client import get_skill_trends, insert_scraper_log, supabase
from utils.config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

SNAPSHOT_KEY = "career:market:snapshot"


def _redis_url(path: str) -> str:
    return f"{settings.upstash_redis_rest_url.rstrip('/')}/{path}"


def _redis_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.upstash_redis_rest_token}", "Content-Type": "application/json"}


async def compute_market_snapshot() -> dict:
    try:
        trends = await get_skill_trends(100)
        top_skills = sorted(trends, key=lambda item: float(item.get("demand_score") or 0), reverse=True)[:10]
        avg_demand = sum(float(item.get("demand_score") or 0) for item in trends) / max(len(trends), 1)
        rising_count = sum(1 for item in trends if float(item.get("velocity") or 0) > 0.5 and float(item.get("decay_score") or 0) < 0.3)
        declining_count = sum(1 for item in trends if float(item.get("decay_score") or 0) > 0.6)
        return {
            "top_10_skills": [item.get("skill") for item in top_skills],
            "average_demand_score": round(avg_demand, 2),
            "rising_count": rising_count,
            "declining_count": declining_count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        logger.exception("Failed to compute market snapshot: %s", exc)
        return {
            "top_10_skills": [],
            "average_demand_score": 0.0,
            "rising_count": 0,
            "declining_count": 0,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error": str(exc),
        }


def detect_drift(current_snapshot: dict, previous_snapshot: dict) -> dict:
    try:
        changes: list[str] = []
        score = 0.0
        current_top = set(current_snapshot.get("top_10_skills", []))
        previous_top = set(previous_snapshot.get("top_10_skills", []))
        appeared = current_top - previous_top
        dropped = previous_top - current_top
        if appeared:
            score += min(len(appeared) * 0.08, 0.35)
            changes.append(f"New top skills appeared: {', '.join(sorted(appeared))}")
        if dropped:
            score += min(len(dropped) * 0.08, 0.35)
            changes.append(f"Skills dropped out of top 10: {', '.join(sorted(dropped))}")

        prev_avg = float(previous_snapshot.get("average_demand_score") or 0)
        curr_avg = float(current_snapshot.get("average_demand_score") or 0)
        if prev_avg > 0 and abs(curr_avg - prev_avg) / prev_avg > 0.15:
            score += 0.25
            changes.append("Average demand score changed by more than 15%.")

        prev_ratio = float(previous_snapshot.get("rising_count") or 0) / max(float(previous_snapshot.get("declining_count") or 1), 1)
        curr_ratio = float(current_snapshot.get("rising_count") or 0) / max(float(current_snapshot.get("declining_count") or 1), 1)
        if prev_ratio > 0 and abs(curr_ratio - prev_ratio) / prev_ratio > 0.2:
            score += 0.2
            changes.append("Rising/declining skill ratio changed by more than 20%.")

        score = round(min(score, 1.0), 3)
        recommendation = "retrain" if score >= 0.5 else "monitor" if score >= 0.2 else "stable"
        return {
            "drift_detected": score >= 0.5,
            "drift_score": score,
            "changes": changes,
            "recommendation": recommendation,
        }
    except Exception as exc:
        logger.exception("Drift detection failed: %s", exc)
        return {"drift_detected": False, "drift_score": 0.0, "changes": [str(exc)], "recommendation": "monitor"}


async def _redis_get_snapshot() -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(_redis_url(f"get/{SNAPSHOT_KEY}"), headers=_redis_headers())
            response.raise_for_status()
            result: Any = response.json().get("result")
        if not result:
            return None
        return json.loads(result) if isinstance(result, str) else result
    except Exception as exc:
        logger.warning("Previous market snapshot unavailable: %s", exc)
        return None


async def _redis_set_snapshot(snapshot: dict):
    try:
        encoded = quote(json.dumps(snapshot), safe="")
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(_redis_url(f"set/{SNAPSHOT_KEY}/{encoded}"), headers=_redis_headers())
            response.raise_for_status()
    except Exception as exc:
        logger.warning("Failed to store market snapshot in Redis: %s", exc)


async def run_drift_check() -> dict:
    try:
        previous = await _redis_get_snapshot()
        current = await compute_market_snapshot()
        if previous:
            result = detect_drift(current, previous)
        else:
            result = {"drift_detected": False, "drift_score": 0.0, "changes": ["No previous snapshot found."], "recommendation": "monitor"}
        await _redis_set_snapshot(current)
        if result.get("drift_detected"):
            await insert_scraper_log(
                {
                    "job_type": "market_drift_check",
                    "status": "success",
                    "message": json.dumps(result),
                    "items_processed": len(current.get("top_10_skills", [])),
                    "finished_at": datetime.now(timezone.utc).isoformat(),
                }
            )
        return {"snapshot": current, **result}
    except Exception as exc:
        logger.exception("Drift check failed: %s", exc)
        return {"drift_detected": False, "drift_score": 0.0, "changes": [str(exc)], "recommendation": "monitor"}
