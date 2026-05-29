from __future__ import annotations

import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.supabase_client import supabase
from routes import mentor, scraper, student, trends
from routes.ml import router as ml_router
from models.salary_predictor import get_or_train_model as get_or_train_salary_model
from models.skill_trend_model import get_or_train_model as get_or_train_skill_trend_model
from services.drift_detector import run_drift_check
from utils.logger import get_logger
from workers.scraper_worker import get_queue_length

logger = get_logger(__name__)

app = FastAPI(
    title="Career Intelligence API",
    description="AI-powered career intelligence platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scraper.router)
app.include_router(trends.router)
app.include_router(student.router)
app.include_router(mentor.router)
app.include_router(ml_router)


@app.get("/")
async def root():
    return {
        "service": "Career Intelligence API",
        "version": "1.0.0",
        "status": "online",
        "endpoints": ["/scrape", "/trends", "/student", "/mentor", "/ml"],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event():
    logger.info("Career Intelligence API starting...")

    try:
        supabase.table("skill_trends").select("skill").limit(1).execute()
        logger.info("Supabase connection status: ok")
    except Exception as exc:
        logger.exception("Supabase connection status: error: %s", exc)

    try:
        queue_length = await get_queue_length()
        logger.info("Redis connection status: ok, queue_length=%s", queue_length)
    except Exception as exc:
        logger.exception("Redis connection status: error: %s", exc)

    logger.info("ML models loading...")
    try:
        get_or_train_skill_trend_model()
        logger.info("Skill trend model status: loaded")
    except Exception as exc:
        logger.exception("Skill trend model status: error: %s", exc)

    try:
        get_or_train_salary_model()
        logger.info("Salary model status: loaded")
    except Exception as exc:
        logger.exception("Salary model status: error: %s", exc)

    try:
        asyncio.create_task(run_drift_check())
        logger.info("Drift detection initialized")
    except Exception as exc:
        logger.exception("Drift detection initialization failed: %s", exc)
