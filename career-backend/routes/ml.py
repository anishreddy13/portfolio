from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel, Field

from db.supabase_client import get_skill_trends
from mlflow_tracking import compare_model_versions, log_prediction
from models import resume_matcher, salary_predictor, skill_trend_model
from services.groq_mentor import analyze_resume_with_ai
from services.skill_extractor import extract_skills_from_text
from training.train_salary import run_training_pipeline as run_salary_training
from training.train_trend import run_training_pipeline as run_trend_training
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/ml", tags=["ml"])


class TrendPredictionRequest(BaseModel):
    skill_name: str
    skill_data: dict = Field(default_factory=dict)


class SalaryPredictionRequest(BaseModel):
    skills: list[str]
    experience_level: str = "mid"
    location: str = "india"


class ResumeAnalysisRequest(BaseModel):
    resume_text: str
    target_role: str = "software engineer"


def api_response(status: str, data: Any, message: str) -> dict:
    return {
        "status": status,
        "data": data,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health")
async def health():
    try:
        trend_status = "loaded" if skill_trend_model.load_model(str(skill_trend_model.MODEL_PATH)) else "not_trained"
        salary_status = "loaded" if salary_predictor.load_model(str(salary_predictor.MODEL_PATH)) else "not_trained"
        return api_response(
            "success",
            {
                "skill_trend_model": trend_status,
                "salary_model": salary_status,
                "resume_matcher": "ready",
            },
            "ML engine health fetched",
        )
    except Exception as exc:
        logger.exception("ML health check failed: %s", exc)
        return api_response("error", None, str(exc))


@router.post("/predict/trend")
async def predict_trend(request: TrendPredictionRequest):
    started = time.perf_counter()
    try:
        prediction = skill_trend_model.predict_trend(request.skill_name, request.skill_data)
        latency_ms = (time.perf_counter() - started) * 1000
        log_prediction(
            "skill_trend_model",
            {"skill_name": request.skill_name, **request.skill_data},
            prediction,
            latency_ms,
        )
        return api_response("success", prediction, "Skill trend predicted")
    except Exception as exc:
        logger.exception("Trend prediction endpoint failed: %s", exc)
        return api_response("error", None, str(exc))


@router.post("/predict/salary")
async def predict_salary(request: SalaryPredictionRequest):
    started = time.perf_counter()
    try:
        prediction = salary_predictor.predict_salary(
            request.skills,
            request.experience_level,
            request.location,
        )
        latency_ms = (time.perf_counter() - started) * 1000
        log_prediction("salary_model", request.model_dump(), prediction, latency_ms)
        return api_response("success", prediction, "Salary predicted")
    except Exception as exc:
        logger.exception("Salary prediction endpoint failed: %s", exc)
        return api_response("error", None, str(exc))


@router.post("/analyze/resume")
async def analyze_resume(request: ResumeAnalysisRequest):
    errors: dict[str, str] = {}
    extracted_skills: list[str] = []
    market_trends: list[dict] = []
    employability_score: dict = {}
    skill_gaps: list[dict] = []
    matching_skills: list[dict] = []
    salary_prediction: dict = {}
    ai_analysis: dict = {}
    recommendations: list[str] = []

    try:
        extracted_skills = extract_skills_from_text(request.resume_text)
    except Exception as exc:
        logger.exception("Resume skill extraction failed: %s", exc)
        errors["skill_extraction"] = str(exc)

    try:
        market_trends = await get_skill_trends(50)
    except Exception as exc:
        logger.exception("Market trend fetch failed: %s", exc)
        errors["market_trends"] = str(exc)

    try:
        employability_score = resume_matcher.compute_employability_score(extracted_skills, market_trends)
    except Exception as exc:
        logger.exception("Employability scoring failed: %s", exc)
        errors["employability_score"] = str(exc)

    try:
        skill_gaps = resume_matcher.find_skill_gaps(extracted_skills, market_trends)
        matching_skills = resume_matcher.find_matching_skills(extracted_skills, market_trends)
        recommendations = resume_matcher.recommend_skills(extracted_skills, market_trends, request.target_role)
    except Exception as exc:
        logger.exception("Skill gap analysis failed: %s", exc)
        errors["skill_gap_analysis"] = str(exc)

    try:
        salary_prediction = salary_predictor.predict_salary(extracted_skills, "mid", "india")
    except Exception as exc:
        logger.exception("Salary analysis failed: %s", exc)
        errors["salary_prediction"] = str(exc)

    try:
        ai_analysis = await analyze_resume_with_ai(request.resume_text, market_trends)
    except Exception as exc:
        logger.exception("Groq resume analysis failed: %s", exc)
        errors["ai_analysis"] = str(exc)

    data = {
        "extracted_skills": extracted_skills,
        "employability_score": employability_score,
        "skill_gaps": skill_gaps,
        "matching_skills": matching_skills,
        "salary_prediction": salary_prediction,
        "ai_analysis": ai_analysis,
        "recommendations": recommendations,
        "errors": errors,
    }
    status = "success" if not errors else "error"
    message = "Resume analysis completed" if not errors else "Resume analysis completed with partial results"
    return api_response(status, data, message)


@router.post("/train/trend")
async def train_trend(background_tasks: BackgroundTasks):
    try:
        started_at = datetime.now(timezone.utc).isoformat()
        background_tasks.add_task(run_trend_training)
        return api_response("success", {"started_at": started_at}, "Trend model retraining started")
    except Exception as exc:
        logger.exception("Failed to start trend training: %s", exc)
        return api_response("error", None, str(exc))


@router.post("/train/salary")
async def train_salary(background_tasks: BackgroundTasks):
    try:
        started_at = datetime.now(timezone.utc).isoformat()
        background_tasks.add_task(run_salary_training)
        return api_response("success", {"started_at": started_at}, "Salary model retraining started")
    except Exception as exc:
        logger.exception("Failed to start salary training: %s", exc)
        return api_response("error", None, str(exc))


@router.get("/metrics")
async def metrics():
    try:
        models = [
            {"model_name": "skill_trend_model", "runs": compare_model_versions("skill_trend_model")},
            {"model_name": "salary_model", "runs": compare_model_versions("salary_model")},
        ]
        return api_response("success", {"models": models}, "ML metrics fetched")
    except Exception as exc:
        logger.exception("Failed to fetch ML metrics: %s", exc)
        return api_response("error", {"models": []}, str(exc))
